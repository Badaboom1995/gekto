import { spawn } from 'child_process'
import { CLAUDE_PATH } from '../claudePath.js'
import { sendPlanningPrompt, type GektoCallbacks } from './gektoPersistent.js'

// === Tool Types ===

export interface GektoToolResult {
  type: 'chat' | 'build' | 'remove'
  // Chat response
  message?: string
  // Build result
  plan?: ExecutionPlan
  // Remove result
  removedAgents?: string[]
}

export interface Task {
  id: string
  description: string
  prompt: string
  files: string[]
  status: 'pending' | 'in_progress' | 'pending_testing' | 'completed' | 'failed'
  dependencies: string[]
}

export interface ExecutionPlan {
  id: string
  status: 'planning' | 'ready' | 'generating_prompts' | 'prompts_ready' | 'executing' | 'completed' | 'failed'
  originalPrompt: string
  reasoning?: string  // Gekto's explanation of task breakdown strategy
  buildPrompt?: string  // Prompt to wire all components together (executed via Build button)
  tasks: Task[]
  createdAt: string
}

// Step 1: Research codebase, then split into tasks.
const GEKTO_SYSTEM_PROMPT = `You are a task planner. First research the codebase using Read/Glob/Grep tools to understand the project structure, dependencies, and frameworks. Then split the user's request into parallel tasks.

STEP 1: Use tools to research. Read package.json, check folder structure, find key files. This is essential — do NOT skip.
STEP 2: Based on what you found, output JSON with the task split. All tasks run in parallel with no dependencies.

If it's a greeting or question: {"tool":"chat","params":{"message":"your reply"}}
If it's about removing agents: {"tool":"remove","params":{"target":"all"}}
If it's a coding task: {"tool":"build","params":{"reasoning":"short explanation","buildPrompt":"how to wire parts together","tasks":[{"description":"short title","files":["path"],"dependencies":[]}]}}

Task rules:
- 3-7 tasks, ALL run in parallel (dependencies:[] for all)
- No "research" or "scaffold" tasks — you already did that
- Each task has ONLY 3 fields: description, files, dependencies
- Description under 6 words
- Tasks must not overlap on files
- Include "buildPrompt" explaining how to wire everything together after tasks complete
- Output raw JSON after research. No markdown.`

// Step 2: Generate a detailed prompt for a single task (runs in parallel for each task)
const PROMPT_GEN_SYSTEM = `You are a senior engineer writing a detailed task prompt for a coding agent.
Given a task description and project context, write a clear, actionable prompt (100-300 words) that tells the agent:
- Specific files to create/modify
- Implementation approach
- Edge cases to handle
- What "done" looks like
- MUST include: "Do NOT import from files created by other tasks"

Output ONLY the prompt text, nothing else. No JSON, no markdown wrapping.`

// === Callbacks for streaming events ===

export interface PlanCallbacks {
  onToolStart?: (tool: string, input?: Record<string, unknown>) => void
  onToolEnd?: (tool: string) => void
  onText?: (text: string) => void
}

// Existing plan context for modifications
interface ExistingPlanContext {
  tasks: { id: string; description: string; prompt: string; files: string[]; dependencies: string[] }[]
  reasoning?: string
}

// === Main Processing Function ===

export async function processWithTools(
  prompt: string,
  planId: string,
  _workingDir: string,
  activeAgents: { lizardId: string; isProcessing: boolean; queueLength: number }[] = [],
  callbacks?: PlanCallbacks,
  existingPlan?: ExistingPlanContext,
): Promise<GektoToolResult> {
  // Build context prompt with active agents and existing plan
  let contextPrompt = prompt

  // Add agent context
  if (activeAgents.length > 0) {
    contextPrompt += `\n\n[Context: Active agents: ${activeAgents.map(a => a.lizardId).join(', ')}]`
  }

  // Add existing plan context for modifications
  if (existingPlan && existingPlan.tasks.length > 0) {
    const taskList = existingPlan.tasks.map((t, i) =>
      `  ${i + 1}. ${t.description} (files: ${t.files.join(', ') || 'none'})`
    ).join('\n')

    contextPrompt += `\n\n[EXISTING PLAN - User wants to modify this plan:
Reasoning: ${existingPlan.reasoning || 'Not provided'}
Tasks:
${taskList}

The user's message above is a modification request. You can:
- Add new tasks to the existing ones
- Remove specific tasks
- Modify task descriptions or prompts
- Respond with chat if you need clarification

If modifying, output ALL tasks (existing + changes) in your build response.]`
  }

  // Use the warm persistent process — embed planning instructions in the user message
  const planningPrompt = `${GEKTO_SYSTEM_PROMPT}\n\nUser request: ${contextPrompt}`

  const planCallbacks: GektoCallbacks = {
    onToolStart: callbacks?.onToolStart ? (tool, input) => callbacks.onToolStart!(tool, input) : undefined,
    onToolEnd: callbacks?.onToolEnd ? (tool) => callbacks.onToolEnd!(tool) : undefined,
    onText: callbacks?.onText ? (text) => callbacks.onText!(text) : undefined,
  }

  const result = await sendPlanningPrompt(planningPrompt, planCallbacks)

  // Parse the JSON response
  const parsed = extractAndParseJSON(result)
  if (!parsed) {
    // No valid JSON found — treat as chat
    return { type: 'chat', message: result.trim() || "I'm here to help! What would you like me to work on?" }
  }

  const tool = parsed.tool as 'chat' | 'build' | 'remove'
  const params = parsed.params || {}

  switch (tool) {
    case 'chat':
      return {
        type: 'chat',
        message: params.message || 'Hello!',
      }

    case 'build':
      return {
        type: 'build',
        plan: createPlanFromTasks(params.tasks || [], planId, prompt, params.reasoning, params.buildPrompt),
      }

    case 'remove':
      return {
        type: 'remove',
        removedAgents: resolveRemoveTarget(params.target, activeAgents),
      }

    default:
      return { type: 'chat', message: "I'm not sure how to help with that." }
  }
}

// === JSON Extraction & Repair ===

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function extractAndParseJSON(raw: string): Record<string, any> | null {
  // Strip markdown code blocks
  let str = raw.trim()
  str = str.replace(/```json\s*/g, '').replace(/```\s*/g, '')

  // Try parsing the whole thing first (might already be pure JSON)
  try {
    return JSON.parse(str)
  } catch {
    // Continue to extraction
  }

  // Find JSON object — match { with "tool" nearby (handles whitespace/newlines)
  const jsonStart = str.search(/\{\s*"tool"/)
  if (jsonStart === -1) {
    // Fallback: find last top-level {
    const fallbackIdx = str.lastIndexOf('\n{')
    if (fallbackIdx === -1) {
      // Last resort: find any {
      const anyBrace = str.indexOf('{')
      if (anyBrace === -1) return null
      str = str.slice(anyBrace)
    } else {
      str = str.slice(fallbackIdx)
    }
  } else {
    str = str.slice(jsonStart)
  }

  // Try parsing extracted JSON
  try {
    return JSON.parse(str)
  } catch {
    // Continue to repair
  }

  // Repair pass: fix common LLM JSON issues
  let repaired = str

  // Fix truncated key names (e.g. ,dencies" → ,"dependencies")
  repaired = repaired.replace(/,\s*([a-z]+)":/g, (_match, partial: string) => {
    const knownKeys = ['dependencies', 'description', 'files', 'status', 'prompt', 'reasoning', 'buildPrompt', 'tasks', 'message', 'target', 'tool', 'params', 'id']
    const fullKey = knownKeys.find(k => k.endsWith(partial))
    return fullKey ? `,"${fullKey}":` : `,"${partial}":`
  })

  // Fix missing quotes on keys
  repaired = repaired.replace(/([{,])\s*([a-zA-Z_]\w*)\s*:/g, '$1"$2":')

  // Fix trailing commas before } or ]
  repaired = repaired.replace(/,\s*([}\]])/g, '$1')

  // Try to balance unclosed brackets/braces
  let braces = 0, brackets = 0
  for (const ch of repaired) {
    if (ch === '{') braces++
    else if (ch === '}') braces--
    else if (ch === '[') brackets++
    else if (ch === ']') brackets--
  }
  while (brackets > 0) { repaired += ']'; brackets-- }
  while (braces > 0) { repaired += '}'; braces-- }

  try {
    return JSON.parse(repaired)
  } catch (err) {
    console.error('[Gekto] JSON repair failed:', err)
    console.error('[Gekto] Raw JSON (first 500 chars):', str.slice(0, 500))
    return null
  }
}

// === Helper Functions ===

function createPlanFromTasks(
  tasks: Partial<Task>[],
  planId: string,
  originalPrompt: string,
  reasoning?: string,
  buildPrompt?: string
): ExecutionPlan {
  // Extract taskId from planId (planId format: "plan_test_123456")
  // taskId should be "test_123456" for task IDs like "test_123456_1"
  const taskId = planId.replace(/^plan_/, '')

  // Use same format as hardcoded Test button: test_X_1, test_X_2, etc.
  const parsedTasks: Task[] = tasks.map((t, i) => ({
    id: `${taskId}_${i + 1}`,
    description: t.description || 'Task',
    prompt: '',  // Prompts are generated in a separate parallel step
    files: (t.files || []).filter(f => f && String(f).trim()),
    status: 'pending' as const,
    dependencies: t.dependencies || [],
  }))

  // Fallback to single task if empty
  if (parsedTasks.length === 0) {
    parsedTasks.push({
      id: `${taskId}_1`,
      description: 'Execute task',
      prompt: originalPrompt,
      files: [],
      status: 'pending',
      dependencies: [],
    })
  }

  return {
    id: planId,
    status: 'ready',
    originalPrompt,
    reasoning,
    buildPrompt,
    tasks: parsedTasks,
    createdAt: new Date().toISOString(),
  }
}

function resolveRemoveTarget(
  target: string | string[],
  activeAgents: { lizardId: string; isWorker?: boolean }[]
): string[] {
  if (Array.isArray(target)) {
    // Specific agent IDs
    return target
  }

  switch (target) {
    case 'all':
      // All agents (including regular lizards, but not master)
      return activeAgents.filter(a => a.lizardId !== 'master').map(a => a.lizardId)
    case 'workers':
      // Only worker agents (by flag or by ID prefix)
      return activeAgents.filter(a =>
        a.isWorker || a.lizardId.startsWith('worker_')
      ).map(a => a.lizardId)
    case 'completed':
      // This would need status info - for now return workers
      return activeAgents.filter(a =>
        a.isWorker || a.lizardId.startsWith('worker_')
      ).map(a => a.lizardId)
    default:
      return []
  }
}

// === Parallel Prompt Generation ===

export interface PromptGenCallbacks {
  onTaskPromptGenerated?: (taskId: string, prompt: string) => void
  onAllPromptsReady?: () => void
  onError?: (taskId: string, error: string) => void
}

export async function generateTaskPrompts(
  plan: ExecutionPlan,
  workingDir: string,
  callbacks?: PromptGenCallbacks,
): Promise<ExecutionPlan> {
  const tasks = plan.tasks

  // Build shared context about the plan
  const planContext = [
    `Project goal: ${plan.originalPrompt}`,
    `Plan reasoning: ${plan.reasoning || 'N/A'}`,
    '',
    'All tasks in the plan:',
    ...tasks.map((t, i) => `  ${i + 1}. ${t.description} (files: ${t.files.join(', ') || 'read-only'})`),
    '',
    plan.buildPrompt ? `Build step (runs after all tasks): ${plan.buildPrompt}` : '',
  ].filter(Boolean).join('\n')

  // Generate prompts in parallel
  const promptPromises = tasks.map(async (task) => {
    const userPrompt = [
      planContext,
      '',
      `--- YOUR TASK ---`,
      `Description: ${task.description}`,
      `Files to create/modify: ${task.files.join(', ') || 'none (read-only research task)'}`,
      `Dependencies: ${task.dependencies.join(', ') || 'none'}`,
    ].join('\n')

    try {
      const prompt = await runClaudeOnce(userPrompt, PROMPT_GEN_SYSTEM, workingDir)
      callbacks?.onTaskPromptGenerated?.(task.id, prompt.trim())
      return { taskId: task.id, prompt: prompt.trim() }
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to generate prompt'
      callbacks?.onError?.(task.id, errorMsg)
      // Fallback: use description as prompt
      return { taskId: task.id, prompt: task.description }
    }
  })

  const results = await Promise.all(promptPromises)

  // Build updated plan with prompts filled in
  const promptMap = new Map(results.map(r => [r.taskId, r.prompt]))
  const updatedPlan: ExecutionPlan = {
    ...plan,
    status: 'prompts_ready',
    tasks: plan.tasks.map(t => ({
      ...t,
      prompt: promptMap.get(t.id) || t.prompt,
    })),
  }

  callbacks?.onAllPromptsReady?.()
  return updatedPlan
}

// === Claude Helper ===

function runClaudeOnce(
  prompt: string,
  systemPrompt: string,
  workingDir: string,
  callbacks?: PlanCallbacks,
): Promise<string> {
  return new Promise((resolve, reject) => {
    const args = [
      '-p', prompt,
      '--output-format', 'stream-json',
      '--verbose',
      '--model', 'claude-sonnet-4-6',
      '--system-prompt', systemPrompt,
      '--dangerously-skip-permissions',
      '--disallowed-tools', 'Task', 'Edit', 'Write', 'Bash',
    ]

    // Note: do NOT use --resume with the shared session ID.
    // The persistent Opus process owns that session. Using --resume here
    // would conflict with it and cause exit code 1.

    const startTime = Date.now()
    console.log(`[Gekto] Spawning: "${CLAUDE_PATH}" (model: claude-sonnet-4-6)`)
    console.log(`[Gekto] CWD: ${workingDir}`)

    const proc = spawn(CLAUDE_PATH, args, {
      cwd: workingDir,
      env: process.env,
      stdio: ['pipe', 'pipe', 'pipe'],
    })

    proc.on('error', (err) => {
      console.error(`[Gekto] Spawn error:`, err)
    })

    proc.stdin?.end()

    let buffer = ''
    let resultText = ''
    let currentTool: string | null = null

    proc.stdout.on('data', (data) => {
      buffer += data.toString()

      const lines = buffer.split('\n')
      buffer = lines.pop() || ''

      for (const line of lines) {
        if (!line.trim()) continue
        try {
          const event = JSON.parse(line)

          // Log every event type for debugging
          if (event.type === 'content_block_delta') {
            const delta = event.delta as { type?: string; text?: string; thinking?: string } | undefined
            if (delta?.type === 'thinking_delta') {
              // Don't spam full thinking text, just note it's thinking
              if (!currentTool) console.log(`[Gekto] thinking...`)
            } else if (delta?.type === 'text_delta' && delta.text) {
              console.log(`[Gekto] text: ${delta.text.slice(0, 100)}`)
            }
          } else {
            console.log(`[Gekto] event: ${event.type}${event.subtype ? '/' + event.subtype : ''}`)
          }

          // Stream tool events
          if (event.type === 'assistant' && event.message?.content) {
            for (const block of event.message.content) {
              if (block.type === 'tool_use' && block.name) {
                currentTool = block.name
                const inputSummary = block.input?.file_path || block.input?.pattern || block.input?.command?.slice(0, 80) || ''
                console.log(`[Gekto] TOOL START: ${block.name} ${inputSummary}`)
                callbacks?.onToolStart?.(block.name, block.input)
              }
            }
          }

          // Tool completed
          if (event.type === 'user' && event.message?.content) {
            for (const block of event.message.content) {
              if (block.type === 'tool_result' && currentTool) {
                console.log(`[Gekto] TOOL END: ${currentTool}`)
                callbacks?.onToolEnd?.(currentTool)
                currentTool = null
              }
            }
          }

          // Text streaming (text_delta = response text, thinking_delta = extended thinking)
          if (event.type === 'content_block_delta') {
            const delta = event.delta as { type?: string; text?: string; thinking?: string } | undefined
            if (delta?.type === 'text_delta' && delta.text) {
              callbacks?.onText?.(delta.text)
            } else if (delta?.type === 'thinking_delta' && delta.thinking) {
              callbacks?.onText?.(delta.thinking)
            }
          }

          if (event.type === 'result' && event.result) {
            console.log(`[Gekto] RESULT received (${(event.result as string).length} chars)`)
            resultText = event.result
          }
        } catch {
          // Ignore parse errors
        }
      }
    })

    let stderrOutput = ''
    proc.stderr.on('data', (data) => {
      const chunk = data.toString()
      stderrOutput += chunk
      console.error(`[Gekto stderr] ${chunk.trim()}`)
    })

    proc.on('close', (code) => {
      const elapsed = ((Date.now() - startTime) / 1000).toFixed(1)
      console.log(`[Gekto] Process closed (code=${code}, ${elapsed}s)`)

      if (buffer.trim()) {
        try {
          const event = JSON.parse(buffer)
          if (event.type === 'result' && event.result) {
            resultText = event.result
          }
        } catch {
          // Ignore
        }
      }

      if (resultText) {
        resolve(resultText)
      } else {
        const errorMsg = stderrOutput || `Process exited with code ${code}`
        reject(new Error(`No result from Gekto: ${errorMsg}`))
      }
    })

    proc.on('error', reject)
  })
}
