import path from 'path'
import { WebSocket } from 'ws'
import { HeadlessAgent, type StreamCallbacks, type AgentResponse } from './HeadlessAgent'

interface QueuedMessage {
  message: string
  ws: WebSocket
  callbacks: StreamCallbacks
  resolve: (response: AgentResponse) => void
  reject: (error: Error) => void
}

interface LizardSession {
  agent: HeadlessAgent
  isProcessing: boolean
  queue: QueuedMessage[]
  currentWs: WebSocket | null  // Track current WebSocket for delivering responses
}

// Per-lizard sessions
const sessions = new Map<string, LizardSession>()
console.log('SESSIONS!!!', sessions)
// Summarize tool input for display
function summarizeInput(input: Record<string, unknown>): string {
  if (input.file_path) return String(input.file_path)
  if (input.pattern) return String(input.pattern)
  if (input.command) return String(input.command).substring(0, 50)
  if (input.path) return String(input.path)
  return ''
}

const DEFAULT_SYSTEM_PROMPT = `You are a helpful coding assistant. Be concise and direct in your responses.`

function getOrCreateSession(lizardId: string, ws?: WebSocket): LizardSession {
  let session = sessions.get(lizardId)
  if (!session) {
    session = {
      agent: new HeadlessAgent({
        systemPrompt: DEFAULT_SYSTEM_PROMPT,
        workingDir: getWorkingDir(),
      }),
      isProcessing: false,
      queue: [],
      currentWs: ws ?? null,
    }
    sessions.set(lizardId, session)
  } else if (ws) {
    // Update WebSocket reference for existing session
    session.currentWs = ws
  }
  return session
}

export function isProcessing(lizardId: string): boolean {
  const session = sessions.get(lizardId)
  return session?.isProcessing ?? false
}

export function getQueueLength(lizardId: string): number {
  const session = sessions.get(lizardId)
  return session?.queue.length ?? 0
}

// Helper to safely send to current WebSocket
function safeSend(session: LizardSession, data: object) {
  const ws = session.currentWs
  if (ws && ws.readyState === ws.OPEN) {
    ws.send(JSON.stringify(data))
  } else {
    console.log('[AgentPool] WebSocket not available, message dropped:', data)
  }
}

export async function sendMessage(
  lizardId: string,
  message: string,
  ws: WebSocket
): Promise<AgentResponse> {
  const session = getOrCreateSession(lizardId, ws)

  // Create streaming callbacks that use session's current WebSocket
  const callbacks: StreamCallbacks = {
    onToolStart: (tool: string, input?: Record<string, unknown>) => {
      safeSend(session, {
        type: 'tool',
        lizardId,
        status: 'running',
        tool,
        input: input ? summarizeInput(input) : undefined,
      })
    },
    onToolEnd: (tool: string) => {
      safeSend(session, {
        type: 'tool',
        lizardId,
        status: 'completed',
        tool,
      })
    },
  }

  // If already processing, queue the message
  if (session.isProcessing) {
    return new Promise((resolve, reject) => {
      session.queue.push({ message, ws, callbacks, resolve, reject })
      const position = session.queue.length
      ws.send(JSON.stringify({
        type: 'queued',
        lizardId,
        position,
      }))
    })
  }

  // Process immediately
  return processMessage(lizardId, session, message, ws, callbacks)
}

async function processMessage(
  lizardId: string,
  session: LizardSession,
  message: string,
  _ws: WebSocket,  // Kept for queue compatibility, but we use session.currentWs
  callbacks: StreamCallbacks
): Promise<AgentResponse> {
  session.isProcessing = true
  safeSend(session, { type: 'state', lizardId, state: 'working' })

  try {
    const response = await session.agent.send(message, callbacks)

    safeSend(session, {
      type: 'response',
      lizardId,
      text: response.result,
      sessionId: response.session_id,
      cost: response.total_cost_usd,
      duration: response.duration_ms,
    })

    return response
  } catch (err) {
    safeSend(session, {
      type: 'error',
      lizardId,
      message: String(err),
    })
    throw err
  } finally {
    session.isProcessing = false
    safeSend(session, { type: 'state', lizardId, state: 'ready' })

    // Process next queued message if any
    if (session.queue.length > 0) {
      const next = session.queue.shift()!
      processMessage(lizardId, session, next.message, next.ws, next.callbacks)
        .then(next.resolve)
        .catch(next.reject)
    }
  }
}

export function resetSession(lizardId: string): void {
  const session = sessions.get(lizardId)
  if (session) {
    session.agent.resetSession()
    session.queue = []
  }
}

export function deleteSession(lizardId: string): void {
  sessions.delete(lizardId)
}

export function getWorkingDir(): string {
  // In development, use test-app as the working directory
  if (process.env.NODE_ENV !== 'production') {
    return path.resolve(process.cwd(), '../test-app')
  }
  return process.cwd()
}

// Update WebSocket for all sessions (called when new client connects)
export function attachWebSocket(ws: WebSocket): void {
  for (const session of sessions.values()) {
    session.currentWs = ws
  }
  console.log(`[AgentPool] Attached WebSocket to ${sessions.size} existing session(s)`)
}

export interface ActiveSession {
  lizardId: string
  isProcessing: boolean
  isRunning: boolean
  queueLength: number
  // Full state for sync
  state: 'ready' | 'working' | 'queued'
  queuePosition: number
}

export function getActiveSessions(): ActiveSession[] {
  const result: ActiveSession[] = []
  for (const [lizardId, session] of sessions) {
    // Determine state
    let state: 'ready' | 'working' | 'queued' = 'ready'
    let queuePosition = 0

    if (session.isProcessing) {
      state = 'working'
    } else if (session.queue.length > 0) {
      state = 'queued'
      queuePosition = session.queue.length
    }

    result.push({
      lizardId,
      isProcessing: session.isProcessing,
      isRunning: session.agent.isRunning(),
      queueLength: session.queue.length,
      state,
      queuePosition,
    })
  }
  return result
}

export function killSession(lizardId: string): boolean {
  const session = sessions.get(lizardId)
  if (session) {
    console.log(`[AgentPool] Killing session for lizard: ${lizardId}`)
    const killed = session.agent.kill()
    session.isProcessing = false
    session.queue = []
    return killed
  }
  return false
}

export function killAllSessions(): number {
  let count = 0
  for (const [lizardId, session] of sessions) {
    console.log(`[AgentPool] Killing session for lizard: ${lizardId}`)
    if (session.agent.kill()) {
      count++
    }
    session.isProcessing = false
    session.queue = []
  }
  return count
}
