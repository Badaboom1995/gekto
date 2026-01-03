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
  status: 'pending' | 'in_progress' | 'completed' | 'failed'
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

const GEKTO_SYSTEM_PROMPT = `You are Gekto, a friendly task orchestration assistant with access to tools.

${TOOLS_DESCRIPTION}

Analyze the user message and respond with the appropriate tool.

RESPONSE FORMAT - Always respond with JSON:
{
  "tool": "chat" | "build" | "remove",
  "params": { ... tool-specific parameters ... }
}

For "chat" tool:
{ "tool": "chat", "params": { "message": "Your friendly response here" } }

For "build" tool:
{ "tool": "build", "params": { "tasks": [
  { "id": "task_1", "description": "Brief desc", "prompt": "Detailed prompt for worker", "files": ["path/file.ts"], "dependencies": [] }
] } }

For "remove" tool:
{ "tool": "remove", "params": { "target": "all" | "workers" | "completed" | ["specific_id_1", "specific_id_2"] } }

Examples:
- "hey" -> { "tool": "chat", "params": { "message": "Hey! How can I help?" } }
- "add dark mode" -> { "tool": "build", "params": { "tasks": [...] } }
- "remove all agents" -> { "tool": "remove", "params": { "target": "all" } }
- "kill all agents" -> { "tool": "remove", "params": { "target": "all" } }
- "remove all workers" -> { "tool": "remove", "params": { "target": "workers" } }
- "clean up finished agents" -> { "tool": "remove", "params": { "target": "completed" } }
- "kill agent worker_123" -> { "tool": "remove", "params": { "target": ["worker_123"] } }

Respond ONLY with valid JSON, nothing else.`

// === Main Processing Function ===

export async function processWithTools(
  prompt: string,
  planId: string,
  workingDir: string,
  activeAgents: { lizardId: string; isProcessing: boolean; queueLength: number }[] = []
): Promise<GektoToolResult> {
  console.log('[GektoTools] Processing:', prompt.substring(0, 100))

  // Add context about active agents for remove decisions
  const contextPrompt = activeAgents.length > 0
    ? `${prompt}\n\n[Context: Active agents: ${activeAgents.map(a => a.lizardId).join(', ')}]`
    : prompt

  const result = await runClaudeOnce(contextPrompt, GEKTO_SYSTEM_PROMPT, workingDir)
  console.log('[GektoTools] Raw response:', result.substring(0, 300))

  // Parse the JSON response
  try {
    const jsonMatch = result.match(/\{[\s\S]*\}/)
    if (!jsonMatch) {
      console.error('[GektoTools] No JSON found in response')
      return { type: 'chat', message: 'Sorry, I had trouble understanding that. Could you try again?' }
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
        return {
          type: 'build',
          plan: createPlanFromTasks(params.tasks || [], planId, prompt),
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
    console.error('[GektoTools] Failed to parse response:', err)
    return { type: 'chat', message: 'Sorry, something went wrong. Could you try again?' }
  }
}

// === Helper Functions ===

function createPlanFromTasks(
  tasks: Partial<Task>[],
  planId: string,
  originalPrompt: string
): ExecutionPlan {
  const parsedTasks: Task[] = tasks.map((t, i) => ({
    id: t.id || `task_${i + 1}`,
    description: t.description || 'Task',
    prompt: t.prompt || originalPrompt,
    files: t.files || [],
    status: 'pending' as const,
    dependencies: t.dependencies || [],
  }))

  // Fallback to single task if empty
  if (parsedTasks.length === 0) {
    parsedTasks.push({
      id: 'task_1',
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

    console.log('[GektoTools] Running claude (haiku)')

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
      console.error('[GektoTools] stderr:', data.toString())
    })

    proc.on('close', (code) => {
      console.log('[GektoTools] Complete, code:', code)

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
        reject(new Error('No result from Gekto'))
      }
    })

    proc.on('error', (err) => {
      console.error('[GektoTools] Spawn error:', err)
      reject(err)
    })
  })
}
