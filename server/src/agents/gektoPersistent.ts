import { spawn, ChildProcessWithoutNullStreams } from 'child_process'
import { randomUUID } from 'crypto'

// Simplified Gekto - single Opus process for direct mode
// Plan mode is the default, direct mode is enabled via UI toggle

export type GektoMode = 'direct' | 'plan'
export type GektoState = 'loading' | 'ready' | 'error'

export interface GektoCallbacks {
  onStateChange?: (state: GektoState) => void
  onToolStart?: (tool: string, input?: Record<string, unknown>) => void
  onToolEnd?: (tool: string) => void
  onText?: (text: string) => void
  onResult?: (text: string) => void
  onError?: (error: string) => void
}

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

// Session ID for persistent history - generated once and shared across all Gekto calls
// This allows both direct mode (persistent process) and plan mode (one-shot calls) to share history
let gektoSessionId: string = randomUUID()

let workingDir = process.cwd()
let stateChangeCallback: ((state: GektoState) => void) | null = null

// === Initialization ===

export function initGekto(cwd: string, onStateChange?: (state: GektoState) => void): void {
  workingDir = cwd
  stateChangeCallback = onStateChange || null

  // Start Opus process
  spawnOpus()
}

export function getGektoState(): GektoState {
  if (opusLoading) return 'loading'
  if (opusReady) return 'ready'
  return 'loading'
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
    '--model', 'claude-opus-4-5-20251101',
    '--system-prompt', OPUS_SYSTEM_PROMPT,
    '--dangerously-skip-permissions',
    '--disallowed-tools', 'Bash', 'Task',
    '--session-id', gektoSessionId,
  ]

  console.log('[Gekto:Opus] Spawning with session ID:', gektoSessionId)

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
        console.log('[Gekto:Opus] Event:', event.type, event.subtype || '')
        handleOpusEvent(event)
      } catch {
        // Ignore non-JSON lines
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
    opusLoading = true
    updateState()

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
    opusLoading = true
    updateState()
  })

  // Warm up: send a quick message to trigger ready state
  setTimeout(() => {
    if (opusProcess && !opusReady) {
      console.log('[Gekto:Opus] Sending warm-up message...')
      const warmup = { type: 'user', message: { role: 'user', content: 'hi' } }
      opusProcess.stdin.write(JSON.stringify(warmup) + '\n')
    }
  }, 500)
}

function handleOpusEvent(event: Record<string, unknown>): void {
  // Result event means process is working
  if (event.type === 'result') {
    if (!opusReady) {
      console.log('[Gekto:Opus] Ready! (first response received)')
      opusReady = true
      opusLoading = false
      updateState()
    }
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
  workMs?: number
}

// Mode is now passed as parameter - default is 'plan', UI can toggle to 'direct'
export async function sendToGekto(
  prompt: string,
  mode: GektoMode = 'plan',
  callbacks?: GektoCallbacks
): Promise<GektoResponse> {
  const startTime = Date.now()

  console.log(`[Gekto] Processing in "${mode}" mode`)

  // Plan mode - return immediately, caller will use gektoTools.ts for planning
  if (mode === 'plan') {
    return {
      mode: 'plan',
      message: 'Creating plan...',
    }
  }

  // Direct mode - use Opus
  const result = await sendToOpus(prompt, callbacks || {})
  const workMs = Date.now() - startTime

  callbacks?.onResult?.(result)

  return {
    mode: 'direct',
    message: result,
    workMs,
  }
}

// === State Management ===

function updateState(): void {
  const state = getGektoState()
  console.log('[Gekto] updateState called, state:', state, 'callback:', !!stateChangeCallback)
  stateChangeCallback?.(state)
}

export function isGektoReady(): boolean {
  return opusReady
}

// Set/update state change callback (for reconnections)
export function setStateCallback(callback: (state: GektoState) => void): void {
  stateChangeCallback = callback
}

// Get current session ID (shared between direct and plan modes)
export function getGektoSessionId(): string {
  return gektoSessionId
}

// Reset session to start fresh (clears history)
export function resetGektoSession(): void {
  console.log('[Gekto:Opus] Resetting session, generating new ID')
  gektoSessionId = randomUUID()
  // Kill current process to force restart with new session
  if (opusProcess) {
    opusProcess.kill('SIGTERM')
  }
}

// === Abort current task (like pressing ESC in CLI) ===

export function abortGekto(): boolean {
  let aborted = false

  // Send SIGINT to interrupt current Opus task (like Ctrl+C / ESC)
  if (opusProcess && opusPendingResolve) {
    console.log('[Gekto:Opus] Aborting current task (SIGINT)...')
    opusProcess.kill('SIGINT')
    // Resolve the pending promise so caller doesn't hang
    opusPendingResolve('Task was stopped.')
    opusPendingResolve = null
    opusCallbacks = null
    opusCurrentTool = null
    aborted = true
  }

  return aborted
}
