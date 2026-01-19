import { spawn, ChildProcessWithoutNullStreams } from 'child_process'

// Persistent Gekto - two processes:
// 1. Haiku classifier (fast) - determines mode
// 2. Opus worker (direct mode) - handles tasks with tools

export type GektoMode = 'direct' | 'plan'
export type GektoState = 'loading' | 'ready' | 'error'

interface ClassifyResult {
  mode: GektoMode
  durationMs: number
}

export interface GektoCallbacks {
  onStateChange?: (state: GektoState) => void
  onClassified?: (mode: GektoMode) => void
  onToolStart?: (tool: string, input?: Record<string, unknown>) => void
  onToolEnd?: (tool: string) => void
  onText?: (text: string) => void
  onResult?: (text: string) => void
  onError?: (error: string) => void
}

// === Haiku Classifier (persistent, fast) ===

const CLASSIFIER_PROMPT = `You classify user messages. Return ONLY one word: "direct" or "plan".

- direct: Simple tasks, greetings, questions, single-file changes, quick fixes
- plan: Complex tasks, multi-file features, OR any request to spawn/create agents/lizards/workers

IMPORTANT: Any request mentioning "spawn", "create agents", "make lizards", "workers", "parallel agents" -> ALWAYS plan

Examples:
"hey" -> direct
"what time is it" -> direct
"add a button to header" -> direct
"fix the typo in readme" -> direct
"refactor the auth system" -> plan
"build a shopping cart with checkout" -> plan
"split this into 3 agents" -> plan
"spawn 5 agents" -> plan
"create workers for this" -> plan
"make lizards to handle this" -> plan
"use parallel agents" -> plan

Respond with ONLY "direct" or "plan", nothing else.`

let classifierProcess: ChildProcessWithoutNullStreams | null = null
let classifierReady = false
let classifierLoading = false
let classifierPendingResolve: ((result: string) => void) | null = null
let classifierBuffer = ''

// === Opus Worker (persistent, for direct mode) ===

const OPUS_SYSTEM_PROMPT = `You are Gekto, a friendly and capable coding assistant. You help users with their coding tasks directly.

Be concise and helpful. When you need to make changes, use the available tools. Explain what you're doing briefly.

For greetings and questions, just respond naturally without using tools.

IMPORTANT: You can ONLY use Read, Write, Edit, Glob, and Grep tools. You CANNOT use Bash or Task tools - they are disabled.`

let opusProcess: ChildProcessWithoutNullStreams | null = null
let opusReady = false
let opusLoading = false
let opusPendingResolve: ((result: string) => void) | null = null
let opusBuffer = ''
let opusCallbacks: GektoCallbacks | null = null
let opusCurrentTool: string | null = null

let workingDir = process.cwd()
let stateChangeCallback: ((state: GektoState) => void) | null = null

// === Initialization ===

export function initGekto(cwd: string, onStateChange?: (state: GektoState) => void): void {
  workingDir = cwd
  stateChangeCallback = onStateChange || null

  // Start both processes
  spawnClassifier()
  spawnOpus()
}

export function getGektoState(): GektoState {
  // Both need to be ready for Gekto to be ready
  if (classifierLoading || opusLoading) return 'loading'
  if (classifierReady && opusReady) return 'ready'
  return 'loading'
}

// === Classifier Process ===

function spawnClassifier(): void {
  if (classifierProcess) return

  classifierLoading = true
  classifierReady = false
  updateState()

  const args = [
    '--input-format', 'stream-json',
    '--output-format', 'stream-json',
    '--verbose',
    '--model', 'claude-haiku-4-5-20251001',
    '--system-prompt', CLASSIFIER_PROMPT,
    '--dangerously-skip-permissions',
  ]

  console.log('[Gekto:Classifier] Spawning...')

  classifierProcess = spawn('claude', args, {
    cwd: workingDir,
    env: process.env,
    stdio: ['pipe', 'pipe', 'pipe'],
  })

  classifierProcess.stdout.on('data', (data) => {
    classifierBuffer += data.toString()
    const lines = classifierBuffer.split('\n')
    classifierBuffer = lines.pop() || ''

    for (const line of lines) {
      if (!line.trim()) continue
      try {
        const event = JSON.parse(line)
        handleClassifierEvent(event)
      } catch {
        // Ignore
      }
    }
  })

  classifierProcess.stderr.on('data', (data) => {
    console.error('[Gekto:Classifier] stderr:', data.toString())
  })

  classifierProcess.on('close', (code) => {
    console.log('[Gekto:Classifier] Exited:', code)
    classifierProcess = null
    classifierReady = false
    classifierLoading = false

    if (classifierPendingResolve) {
      classifierPendingResolve('direct')
      classifierPendingResolve = null
    }

    // Auto-restart
    setTimeout(spawnClassifier, 1000)
  })

  classifierProcess.on('error', (err) => {
    console.error('[Gekto:Classifier] Error:', err)
    classifierProcess = null
    classifierReady = false
    classifierLoading = false
    updateState()
  })
}

function handleClassifierEvent(event: { type: string; subtype?: string; result?: string }): void {
  if (event.type === 'system' && event.subtype === 'init') {
    console.log('[Gekto:Classifier] Ready!')
    classifierReady = true
    classifierLoading = false
    updateState()
    return
  }

  if (event.type === 'result' && event.result) {
    if (classifierPendingResolve) {
      classifierPendingResolve(event.result)
      classifierPendingResolve = null
    }
  }
}

async function classify(prompt: string): Promise<ClassifyResult> {
  const startTime = Date.now()

  if (!classifierProcess || !classifierReady) {
    spawnClassifier()
    await new Promise(resolve => setTimeout(resolve, 1000))
  }

  if (!classifierProcess) {
    return { mode: 'direct', durationMs: Date.now() - startTime }
  }

  return new Promise((resolve) => {
    classifierPendingResolve = (result: string) => {
      const mode = result.toLowerCase().includes('plan') ? 'plan' : 'direct'
      resolve({ mode, durationMs: Date.now() - startTime })
    }

    const inputMessage = {
      type: 'user',
      message: { role: 'user', content: prompt },
    }
    classifierProcess!.stdin.write(JSON.stringify(inputMessage) + '\n')

    // Timeout
    setTimeout(() => {
      if (classifierPendingResolve) {
        classifierPendingResolve('direct')
        classifierPendingResolve = null
      }
    }, 10000)
  })
}

// === Opus Process ===

function spawnOpus(): void {
  if (opusProcess) return

  opusLoading = true
  opusReady = false
  updateState()

  const args = [
    '--input-format', 'stream-json',
    '--output-format', 'stream-json',
    '--verbose',
    '--model', 'claude-sonnet-4-20250514',
    '--system-prompt', OPUS_SYSTEM_PROMPT,
    '--dangerously-skip-permissions',
    '--disallowed-tools', 'Bash', 'Task',
  ]

  console.log('[Gekto:Opus] Spawning...')

  opusProcess = spawn('claude', args, {
    cwd: workingDir,
    env: process.env,
    stdio: ['pipe', 'pipe', 'pipe'],
  })

  opusProcess.stdout.on('data', (data) => {
    opusBuffer += data.toString()
    const lines = opusBuffer.split('\n')
    opusBuffer = lines.pop() || ''

    for (const line of lines) {
      if (!line.trim()) continue
      try {
        const event = JSON.parse(line)
        handleOpusEvent(event)
      } catch {
        // Ignore
      }
    }
  })

  opusProcess.stderr.on('data', (data) => {
    console.error('[Gekto:Opus] stderr:', data.toString())
  })

  opusProcess.on('close', (code) => {
    console.log('[Gekto:Opus] Exited:', code)
    opusProcess = null
    opusReady = false
    opusLoading = false

    if (opusPendingResolve) {
      opusPendingResolve('Process restarting, please try again.')
      opusPendingResolve = null
    }

    // Auto-restart
    setTimeout(spawnOpus, 1000)
  })

  opusProcess.on('error', (err) => {
    console.error('[Gekto:Opus] Error:', err)
    opusProcess = null
    opusReady = false
    opusLoading = false
    updateState()
  })
}

function handleOpusEvent(event: Record<string, unknown>): void {
  // Init event
  if (event.type === 'system' && event.subtype === 'init') {
    console.log('[Gekto:Opus] Ready!')
    opusReady = true
    opusLoading = false
    updateState()
    return
  }

  // Tool use detection from assistant message
  if (event.type === 'assistant' && event.message) {
    const message = event.message as { content?: Array<{ type: string; name?: string; input?: Record<string, unknown> }> }
    if (message.content) {
      for (const block of message.content) {
        if (block.type === 'tool_use' && block.name) {
          opusCurrentTool = block.name
          opusCallbacks?.onToolStart?.(block.name, block.input)
        }
      }
    }
  }

  // Tool result (tool completed)
  if (event.type === 'user' && event.message) {
    const message = event.message as { content?: Array<{ type: string }> }
    if (message.content) {
      for (const block of message.content) {
        if (block.type === 'tool_result' && opusCurrentTool) {
          opusCallbacks?.onToolEnd?.(opusCurrentTool)
          opusCurrentTool = null
        }
      }
    }
  }

  // Text streaming
  if (event.type === 'content_block_delta') {
    const delta = event.delta as { type?: string; text?: string } | undefined
    if (delta?.type === 'text_delta' && delta.text) {
      opusCallbacks?.onText?.(delta.text)
    }
  }

  // Final result
  if (event.type === 'result' && event.result) {
    if (opusPendingResolve) {
      opusPendingResolve(event.result as string)
      opusPendingResolve = null
    }
  }
}

async function sendToOpus(prompt: string, callbacks: GektoCallbacks): Promise<string> {
  if (!opusProcess || !opusReady) {
    spawnOpus()
    await new Promise(resolve => setTimeout(resolve, 1000))
  }

  if (!opusProcess) {
    return 'Gekto is starting up, please try again.'
  }

  opusCallbacks = callbacks
  opusCurrentTool = null

  return new Promise((resolve) => {
    opusPendingResolve = (result: string) => {
      opusCallbacks = null
      resolve(result)
    }

    const inputMessage = {
      type: 'user',
      message: { role: 'user', content: prompt },
    }
    opusProcess!.stdin.write(JSON.stringify(inputMessage) + '\n')

    // Timeout after 5 min for complex tasks
    setTimeout(() => {
      if (opusPendingResolve) {
        opusPendingResolve('Task timed out. Please try breaking it into smaller steps.')
        opusPendingResolve = null
      }
    }, 300000)
  })
}

// === Main API ===

export interface GektoResponse {
  mode: GektoMode
  message: string
  classifyMs: number
  workMs?: number
}

export async function sendToGekto(
  prompt: string,
  callbacks?: GektoCallbacks
): Promise<GektoResponse> {
  const startTime = Date.now()

  // Step 1: Classify with Haiku (fast)
  const { mode, durationMs: classifyMs } = await classify(prompt)
  console.log(`[Gekto] Classified as "${mode}" in ${classifyMs}ms`)
  callbacks?.onClassified?.(mode)

  // Step 2: Handle based on mode
  if (mode === 'plan') {
    // Return immediately - caller will use gektoTools.ts for planning
    return {
      mode: 'plan',
      message: 'Creating plan...',
      classifyMs,
    }
  }

  // Direct mode - use Opus
  const result = await sendToOpus(prompt, callbacks || {})
  const workMs = Date.now() - startTime - classifyMs

  callbacks?.onResult?.(result)

  return {
    mode: 'direct',
    message: result,
    classifyMs,
    workMs,
  }
}

// === State Management ===

function updateState(): void {
  const state = getGektoState()
  stateChangeCallback?.(state)
}

export function isGektoReady(): boolean {
  return classifierReady && opusReady
}
