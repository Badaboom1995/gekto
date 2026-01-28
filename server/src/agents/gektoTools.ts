import { spawn } from 'child_process'

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
  tasks: Task[]
  createdAt: string
}

// === Tool Definitions ===

const TOOLS_DESCRIPTION = `
Available tools:
1. chat - For greetings, questions, conversations (not coding tasks)
2. build - For coding tasks: features, bug fixes, refactoring, file changes
3. remove - For removing/cleaning up worker agents
`

const GEKTO_SYSTEM_PROMPT = `You are Gekto, a task orchestration assistant. You MUST respond with ONLY valid JSON - no other text.

${TOOLS_DESCRIPTION}

Analyze the user message and respond with the appropriate tool as JSON.

JSON FORMAT (respond with ONLY this, no markdown, no explanation):
{"tool":"chat"|"build"|"remove","params":{...}}

Tool params:
- chat: {"message":"your response"}
- build: {"tasks":[{"id":"task_1","description":"Brief desc","prompt":"Detailed prompt for worker agent","files":["path/file.ts"],"dependencies":[]}]}
- remove: {"target":"all"|"workers"|"completed"|["id1","id2"]}

Examples (respond EXACTLY like this):
"hey" -> {"tool":"chat","params":{"message":"Hey! How can I help?"}}
"add dark mode" -> {"tool":"build","params":{"tasks":[{"id":"task_1","description":"Add dark mode toggle","prompt":"Implement dark mode toggle in the settings","files":[],"dependencies":[]}]}}
"remove all agents" -> {"tool":"remove","params":{"target":"all"}}
"spawn 3 agents" -> {"tool":"build","params":{"tasks":[{"id":"task_1","description":"Agent 1","prompt":"Task 1","files":[],"dependencies":[]},{"id":"task_2","description":"Agent 2","prompt":"Task 2","files":[],"dependencies":[]},{"id":"task_3","description":"Agent 3","prompt":"Task 3","files":[],"dependencies":[]}]}}

CRITICAL: Output ONLY the JSON object. No markdown code blocks. No explanation. Just the raw JSON.`

// === Callbacks for streaming events ===

export interface PlanCallbacks {
  onToolStart?: (tool: string, input?: Record<string, unknown>) => void
  onToolEnd?: (tool: string) => void
  onText?: (text: string) => void
}

// === Main Processing Function ===

export async function processWithTools(
  prompt: string,
  planId: string,
  workingDir: string,
  activeAgents: { lizardId: string; isProcessing: boolean; queueLength: number }[] = [],
  callbacks?: PlanCallbacks
): Promise<GektoToolResult> {
  console.log('[GektoTools] Processing:', prompt.substring(0, 100))

  // Add context about active agents for remove decisions
  const contextPrompt = activeAgents.length > 0
    ? `${prompt}\n\n[Context: Active agents: ${activeAgents.map(a => a.lizardId).join(', ')}]`
    : prompt

  const result = await runClaudeOnce(contextPrompt, GEKTO_SYSTEM_PROMPT, workingDir, callbacks)
  console.log('[GektoTools] Raw response:', result.substring(0, 500))

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
      console.log('[GektoTools] No JSON found in response')
      return { type: 'chat', message: result.trim() || "I'm here to help! What would you like me to work on?" }
    }

    console.log('[GektoTools] Parsed JSON string:', jsonMatch[0].substring(0, 200))
    const parsed = JSON.parse(jsonMatch[0])
    console.log('[GektoTools] Parsed tool:', parsed.tool, 'params keys:', Object.keys(parsed.params || {}))

    const tool = parsed.tool as 'chat' | 'build' | 'remove'
    const params = parsed.params || {}

    switch (tool) {
      case 'chat':
        return {
          type: 'chat',
          message: params.message || 'Hello!',
        }

      case 'build':
        const plan = createPlanFromTasks(params.tasks || [], planId, prompt)
        console.log('[GektoTools] Created plan with', plan.tasks.length, 'tasks:', plan.tasks.map(t => t.id))
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
        console.error('[GektoTools] Unknown tool:', tool)
        return { type: 'chat', message: "I'm not sure how to help with that." }
    }
  } catch (err) {
    console.log('[GektoTools] JSON parse failed, using raw response as chat:', err)
    // Use the raw response as a chat message instead of showing an error
    return { type: 'chat', message: result.trim() || "I'm here to help! What would you like me to work on?" }
  }
}

// === Helper Functions ===

function createPlanFromTasks(
  tasks: Partial<Task>[],
  planId: string,
  originalPrompt: string
): ExecutionPlan {
  // Extract taskId from planId (planId format: "plan_test_123456")
  // taskId should be "test_123456" for task IDs like "test_123456_1"
  const taskId = planId.replace(/^plan_/, '')

  // Use same format as hardcoded Test button: test_X_1, test_X_2, etc.
  const parsedTasks: Task[] = tasks.map((t, i) => ({
    id: `${taskId}_${i + 1}`,
    description: t.description || 'Task',
    prompt: t.prompt || originalPrompt,
    files: t.files || [],
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

    console.log('[GektoTools] Running claude for plan creation')

    const proc = spawn('claude', args, {
      cwd: workingDir,
      env: process.env,
      stdio: ['pipe', 'pipe', 'pipe'],
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
      console.error('[GektoTools] stderr:', data.toString())
    })

    proc.on('close', (code) => {
      console.log('[GektoTools] Complete, code:', code, 'resultText length:', resultText.length)

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
        console.error('[GektoTools] No result, stderr:', stderrOutput)
        reject(new Error(`No result from Gekto: ${errorMsg}`))
      }
    })

    proc.on('error', (err) => {
      console.error('[GektoTools] Spawn error:', err)
      reject(err)
    })
  })
}
