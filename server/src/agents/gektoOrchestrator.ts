import { spawn } from 'child_process'

// === Types ===

interface Task {
  id: string
  description: string
  prompt: string
  files: string[]
  status: 'pending' | 'in_progress' | 'completed' | 'failed'
  dependencies: string[]
}

interface ExecutionPlan {
  id: string
  status: 'planning' | 'ready' | 'executing' | 'completed' | 'failed'
  originalPrompt: string
  tasks: Task[]
  createdAt: string
}

// === Gekto System Prompt ===

const GEKTO_SYSTEM_PROMPT = `You are Gekto, a friendly task orchestration assistant. You help users with coding tasks by delegating work to specialized agents.

IMPORTANT: Analyze each message and decide how to respond:

1. If the message is a GREETING, QUESTION, or CONVERSATION (not a coding task):
   - Respond naturally and friendly
   - Your response will be shown directly to the user

2. If the message is a CODING TASK (feature request, bug fix, refactoring, file changes):
   - Start your response with exactly: [PLAN_MODE]
   - Then provide a JSON execution plan:
   {
     "tasks": [
       {
         "id": "task_1",
         "description": "Brief description",
         "prompt": "Detailed prompt for the worker agent",
         "files": ["path/to/file.ts"],
         "dependencies": []
       }
     ]
   }

Examples:
- "hey" -> "Hey! How can I help you today?"
- "what's up?" -> "Not much! Ready to help with any coding tasks you have."
- "add dark mode" -> [PLAN_MODE]{"tasks":[...]}
- "fix the login bug" -> [PLAN_MODE]{"tasks":[...]}`

export type GektoResponse =
  | { type: 'chat'; message: string }
  | { type: 'plan'; plan: ExecutionPlan }

// Process a message to Gekto - returns either a chat response or an execution plan
export async function processGektoMessage(
  prompt: string,
  planId: string,
  workingDir: string
): Promise<GektoResponse> {
  console.log('[Orchestrator] Processing message:', prompt.substring(0, 100))

  const result = await runClaudeOnce(prompt, GEKTO_SYSTEM_PROMPT, workingDir)
  console.log('[Orchestrator] Gekto response:', result.substring(0, 200))

  // Check if response indicates plan mode
  if (result.includes('[PLAN_MODE]')) {
    // Extract the JSON plan after [PLAN_MODE]
    const planPart = result.split('[PLAN_MODE]')[1]?.trim() || ''
    return {
      type: 'plan',
      plan: parsePlanFromResponse(planPart, planId, prompt),
    }
  }

  // Regular chat response
  return {
    type: 'chat',
    message: result.trim(),
  }
}

// Parse plan JSON from response
function parsePlanFromResponse(
  result: string,
  planId: string,
  originalPrompt: string
): ExecutionPlan {
  let parsedTasks: Task[] = []

  try {
    const jsonMatch = result.match(/\{[\s\S]*\}/)
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0])
      if (parsed.tasks && Array.isArray(parsed.tasks)) {
        parsedTasks = parsed.tasks.map((t: Partial<Task>, i: number) => ({
          id: t.id || `task_${i + 1}`,
          description: t.description || 'Task',
          prompt: t.prompt || originalPrompt,
          files: t.files || [],
          status: 'pending' as const,
          dependencies: t.dependencies || [],
        }))
      }
    }
  } catch (err) {
    console.error('[Orchestrator] Failed to parse plan JSON:', err)
  }

  // Fallback to single task if parsing failed
  if (parsedTasks.length === 0) {
    parsedTasks = [{
      id: 'task_1',
      description: 'Execute task',
      prompt: originalPrompt,
      files: [],
      status: 'pending',
      dependencies: [],
    }]
  }

  return {
    id: planId,
    status: 'ready',
    originalPrompt,
    tasks: parsedTasks,
    createdAt: new Date().toISOString(),
  }
}

// Legacy function for backwards compatibility
export async function generatePlan(
  prompt: string,
  planId: string,
  workingDir: string
): Promise<ExecutionPlan> {
  const response = await processGektoMessage(prompt, planId, workingDir)
  if (response.type === 'plan') {
    return response.plan
  }
  // If it returned chat, wrap in a single task (shouldn't happen with proper prompts)
  return {
    id: planId,
    status: 'ready',
    originalPrompt: prompt,
    tasks: [{
      id: 'task_1',
      description: 'Execute task',
      prompt: prompt,
      files: [],
      status: 'pending',
      dependencies: [],
    }],
    createdAt: new Date().toISOString(),
  }
}


// === Helper: Run Claude once without session ===

function runClaudeOnce(
  prompt: string,
  systemPrompt: string,
  workingDir: string
): Promise<string> {
  return new Promise((resolve, reject) => {
    const args = [
      '-p', prompt,
      '--output-format', 'stream-json',
      '--verbose',
      '--model', 'claude-haiku-4-5-20251001',
      '--system-prompt', systemPrompt,
      '--dangerously-skip-permissions',
    ]

    console.log('[Orchestrator] Running claude (haiku) for orchestration')

    const proc = spawn('claude', args, {
      cwd: workingDir,
      env: process.env,
      stdio: ['pipe', 'pipe', 'pipe'],
    })

    proc.stdin?.end()

    let buffer = ''
    let resultText = ''

    proc.stdout.on('data', (data) => {
      buffer += data.toString()

      const lines = buffer.split('\n')
      buffer = lines.pop() || ''

      for (const line of lines) {
        if (!line.trim()) continue
        try {
          const event = JSON.parse(line)
          if (event.type === 'result' && event.result) {
            resultText = event.result
          }
        } catch {
          // Ignore parse errors
        }
      }
    })

    proc.stderr.on('data', (data) => {
      console.error('[Orchestrator] stderr:', data.toString())
    })

    proc.on('close', (code) => {
      console.log('[Orchestrator] Plan generation complete, code:', code)

      // Try to parse any remaining buffer
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
        reject(new Error('No result from plan generation'))
      }
    })

    proc.on('error', (err) => {
      console.error('[Orchestrator] Spawn error:', err)
      reject(err)
    })
  })
}

// === Delegation Helper ===

export function shouldDelegateToTask(
  prompt: string,
  tasks: Task[]
): Task | null {
  // Simple heuristic: check if prompt mentions any file from a task
  const lowerPrompt = prompt.toLowerCase()

  for (const task of tasks) {
    for (const file of task.files) {
      const fileName = file.split('/').pop()?.toLowerCase() || ''
      if (fileName && lowerPrompt.includes(fileName)) {
        return task
      }
    }
  }

  return null
}

export type { ExecutionPlan, Task }
