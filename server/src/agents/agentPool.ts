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
}

// Per-lizard sessions
const sessions = new Map<string, LizardSession>()

// Summarize tool input for display
function summarizeInput(input: Record<string, unknown>): string {
  if (input.file_path) return String(input.file_path)
  if (input.pattern) return String(input.pattern)
  if (input.command) return String(input.command).substring(0, 50)
  if (input.path) return String(input.path)
  return ''
}

const DEFAULT_SYSTEM_PROMPT = `You are a helpful coding assistant. Be concise and direct in your responses.`

function getOrCreateSession(lizardId: string): LizardSession {
  let session = sessions.get(lizardId)
  if (!session) {
    session = {
      agent: new HeadlessAgent({
        systemPrompt: DEFAULT_SYSTEM_PROMPT,
        workingDir: process.cwd(),
      }),
      isProcessing: false,
      queue: [],
    }
    sessions.set(lizardId, session)
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

export async function sendMessage(
  lizardId: string,
  message: string,
  ws: WebSocket
): Promise<AgentResponse> {
  const session = getOrCreateSession(lizardId)

  // Create streaming callbacks that tag messages with lizardId
  const callbacks: StreamCallbacks = {
    onToolStart: (tool: string, input?: Record<string, unknown>) => {
      ws.send(JSON.stringify({
        type: 'tool',
        lizardId,
        status: 'running',
        tool,
        input: input ? summarizeInput(input) : undefined,
      }))
    },
    onToolEnd: (tool: string) => {
      ws.send(JSON.stringify({
        type: 'tool',
        lizardId,
        status: 'completed',
        tool,
      }))
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
  ws: WebSocket,
  callbacks: StreamCallbacks
): Promise<AgentResponse> {
  session.isProcessing = true
  ws.send(JSON.stringify({ type: 'state', lizardId, state: 'working' }))

  try {
    const response = await session.agent.send(message, callbacks)

    ws.send(JSON.stringify({
      type: 'response',
      lizardId,
      text: response.result,
      sessionId: response.session_id,
      cost: response.total_cost_usd,
      duration: response.duration_ms,
    }))

    return response
  } catch (err) {
    ws.send(JSON.stringify({
      type: 'error',
      lizardId,
      message: String(err),
    }))
    throw err
  } finally {
    session.isProcessing = false
    ws.send(JSON.stringify({ type: 'state', lizardId, state: 'ready' }))

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
  return process.cwd()
}
