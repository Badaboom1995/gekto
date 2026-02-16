import { spawn } from 'child_process'
import { CLAUDE_PATH } from '../claudePath.js'

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
  status: 'planning' | 'ready' | 'executing' | 'completed' | 'failed'
  originalPrompt: string
  reasoning?: string  // Gekto's explanation of task breakdown strategy
  tasks: Task[]
  createdAt: string
}

// === Tool Definitions ===

const TOOLS_DESCRIPTION = `
Available tools:
1. chat - For greetings, questions, clarifications, or explaining your plan
2. build - For coding tasks: features, bug fixes, refactoring, file changes
3. remove - For removing/cleaning up worker agents
`

const GEKTO_SYSTEM_PROMPT = `You are Gekto, a senior engineering manager who breaks down complex coding tasks into parallel workstreams. You MUST respond with ONLY valid JSON - no other text.

${TOOLS_DESCRIPTION}

CRITICAL RULES FOR BUILD TASKS:
1. Create 3-7 tasks that can be executed in PARALLEL by separate AI agents
2. Each task gets its own git worktree/branch - tasks should NOT overlap on same files
3. Tasks should be INDEPENDENT - minimize dependencies, maximize parallelism
4. Each task description: short (5-10 words), clear purpose
5. Each task prompt: detailed instructions (100-300 words) with:
   - Specific files to create/modify
   - Implementation approach
   - Edge cases to handle
   - What "done" looks like
6. Include a "reasoning" field explaining your task breakdown strategy

PARALLELIZATION STRATEGY:
- Split by feature area (UI vs API vs database)
- Split by file/component (each agent owns different files)
- Only add dependencies when output of one task is INPUT to another
- Dependencies use task IDs: ["task_1", "task_2"]

JSON FORMAT (respond with ONLY this, no markdown):
{"tool":"chat"|"build"|"remove","params":{...}}

Tool params:
- chat: {"message":"your response"}
- build: {"reasoning":"1-2 sentences explaining WHY you split tasks this way","tasks":[{"id":"task_1","description":"Brief title","prompt":"Detailed implementation instructions","files":["path/to/file.ts"],"dependencies":[]}]}
- remove: {"target":"all"|"workers"|"completed"|["id1","id2"]}

BUILD EXAMPLE for "add user authentication":
{"tool":"build","params":{"reasoning":"Splitting into parallel tracks: database schema, API endpoints, and UI components. No dependencies since each track works on separate files.","tasks":[
  {"id":"task_1","description":"Create auth database schema","prompt":"Create the user authentication database schema...","files":["prisma/schema.prisma","src/db/migrations/"],"dependencies":[]},
  {"id":"task_2","description":"Build auth API endpoints","prompt":"Implement login/logout/register API endpoints...","files":["src/api/auth.ts","src/api/middleware/"],"dependencies":[]},
  {"id":"task_3","description":"Create login/signup UI","prompt":"Build React components for authentication forms...","files":["src/components/auth/"],"dependencies":[]},
  {"id":"task_4","description":"Add session management","prompt":"Implement JWT token handling and session storage...","files":["src/lib/session.ts"],"dependencies":["task_2"]},
  {"id":"task_5","description":"Write auth tests","prompt":"Create unit and integration tests for auth flow...","files":["tests/auth/"],"dependencies":["task_2","task_3"]}
]}}

CHAT EXAMPLE:
"hey" -> {"tool":"chat","params":{"message":"Hey! I'm Gekto, your task orchestrator. Tell me what you'd like to build and I'll break it into parallel tasks for my worker agents."}}

CRITICAL: Output ONLY the JSON object. No markdown code blocks. No explanation before or after. Just the raw JSON.`

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
  workingDir: string,
  activeAgents: { lizardId: string; isProcessing: boolean; queueLength: number }[] = [],
  callbacks?: PlanCallbacks,
  existingPlan?: ExistingPlanContext
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

  const result = await runClaudeOnce(contextPrompt, GEKTO_SYSTEM_PROMPT, workingDir, callbacks)

  // Parse the JSON response
  try {
    // Try to find JSON - handle markdown code blocks too
    let jsonStr = result.trim()

    // Strip markdown code blocks if present
    if (jsonStr.startsWith('```json')) {
      jsonStr = jsonStr.replace(/^```json\s*/, '').replace(/\s*```$/, '')
    } else if (jsonStr.startsWith('```')) {
      jsonStr = jsonStr.replace(/^```\s*/, '').replace(/\s*```$/, '')
    }

    // Find JSON object
    const jsonMatch = jsonStr.match(/\{[\s\S]*\}/)
    if (!jsonMatch) {
      return { type: 'chat', message: result.trim() || "I'm here to help! What would you like me to work on?" }
    }

    const parsed = JSON.parse(jsonMatch[0])

    const tool = parsed.tool as 'chat' | 'build' | 'remove'
    const params = parsed.params || {}

    switch (tool) {
      case 'chat':
        return {
          type: 'chat',
          message: params.message || 'Hello!',
        }

      case 'build':
        const plan = createPlanFromTasks(params.tasks || [], planId, prompt, params.reasoning)
        return {
          type: 'build',
          plan,
        }

      case 'remove':
        return {
          type: 'remove',
          removedAgents: resolveRemoveTarget(params.target, activeAgents),
        }

      default:
        return { type: 'chat', message: "I'm not sure how to help with that." }
    }
  } catch {
    // Use the raw response as a chat message instead of showing an error
    return { type: 'chat', message: result.trim() || "I'm here to help! What would you like me to work on?" }
  }
}

// === Helper Functions ===

function createPlanFromTasks(
  tasks: Partial<Task>[],
  planId: string,
  originalPrompt: string,
  reasoning?: string
): ExecutionPlan {
  // Extract taskId from planId (planId format: "plan_test_123456")
  // taskId should be "test_123456" for task IDs like "test_123456_1"
  const taskId = planId.replace(/^plan_/, '')

  // Use same format as hardcoded Test button: test_X_1, test_X_2, etc.
  const parsedTasks: Task[] = tasks.map((t, i) => ({
    id: `${taskId}_${i + 1}`,
    description: t.description || 'Task',
    prompt: t.prompt || originalPrompt,
    files: (t.files || []).filter(f => f && String(f).trim()),  // Filter empty files
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

// === Claude Helper ===

function runClaudeOnce(
  prompt: string,
  systemPrompt: string,
  workingDir: string,
  callbacks?: PlanCallbacks
): Promise<string> {
  return new Promise((resolve, reject) => {
    const args = [
      '-p', prompt,
      '--output-format', 'stream-json',
      '--verbose',
      '--model', 'claude-opus-4-5-20251101',
      '--system-prompt', systemPrompt,
      '--dangerously-skip-permissions',
    ]

    console.log(`[Gekto] Spawning: "${CLAUDE_PATH}" with ${args.length} args`)
    console.log(`[Gekto] First 3 args:`, args.slice(0, 3))
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

          // Stream tool events
          if (event.type === 'assistant' && event.message?.content) {
            for (const block of event.message.content) {
              if (block.type === 'tool_use' && block.name) {
                currentTool = block.name
                callbacks?.onToolStart?.(block.name, block.input)
              }
            }
          }

          // Tool completed
          if (event.type === 'user' && event.message?.content) {
            for (const block of event.message.content) {
              if (block.type === 'tool_result' && currentTool) {
                callbacks?.onToolEnd?.(currentTool)
                currentTool = null
              }
            }
          }

          // Text streaming
          if (event.type === 'content_block_delta') {
            const delta = event.delta as { type?: string; text?: string } | undefined
            if (delta?.type === 'text_delta' && delta.text) {
              callbacks?.onText?.(delta.text)
            }
          }

          if (event.type === 'result' && event.result) {
            resultText = event.result
          }
        } catch {
          // Ignore parse errors
        }
      }
    })

    let stderrOutput = ''
    proc.stderr.on('data', (data) => {
      stderrOutput += data.toString()
    })

    proc.on('close', (code) => {
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
