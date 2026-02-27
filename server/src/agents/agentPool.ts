import path from 'path'
import { writeFileSync, unlinkSync, existsSync, mkdirSync } from 'fs'
import { dirname } from 'path'
import { WebSocket } from 'ws'
import type { AgentProvider, StreamCallbacks, AgentResponse, FileChange } from './types.js'
import { HeadlessAgent } from './HeadlessAgent.js'
import { getState, mutate } from '../state.js'

interface QueuedMessage {
  message: string
  ws: WebSocket
  callbacks: StreamCallbacks
  resolve: (response: AgentResponse) => void
  reject: (error: Error) => void
}

interface LizardSession {
  agent: AgentProvider
  isProcessing: boolean
  queue: QueuedMessage[]
  currentWs: WebSocket | null  // Track current WebSocket for delivering responses
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

const DEFAULT_SYSTEM_PROMPT = `You are a helpful coding assistant. Be concise and direct in your responses.

IMPORTANT RESTRICTIONS - You MUST follow these rules:
1. DO NOT use Bash or shell commands - you cannot run terminal commands
2. DO NOT try to build, compile, or bundle the project
3. DO NOT try to start, restart, or run any servers or dev environments
4. DO NOT run tests, linters, or any CLI tools
5. DO NOT install packages or run npm/yarn/pnpm commands

Your job is ONLY to:
- Read and understand code using Read, Glob, Grep tools
- Write and edit code using Write and Edit tools
- Make the requested code changes

After making changes, simply report what you did. The user will handle building, testing, and running the code themselves.

STATUS MARKER - At the END of EVERY response, you MUST include exactly one of these markers:
- [STATUS:DONE] - Use when the task is complete and you have no questions for the user
- [STATUS:PENDING] - Use when you need user input, confirmation, clarification, or approval to proceed

Examples:
- After completing a code change: "I've updated the function. [STATUS:DONE]"
- When asking a question: "Which approach would you prefer? [STATUS:PENDING]"
- After answering a simple question: "The file is located at src/utils.ts [STATUS:DONE]"`

// Tools that agents are not allowed to use
const DISALLOWED_TOOLS = ['Bash', 'Task']

function getOrCreateSession(lizardId: string, ws?: WebSocket): LizardSession {
  let session = sessions.get(lizardId)
  if (!session) {
    session = {
      agent: new HeadlessAgent({
        systemPrompt: DEFAULT_SYSTEM_PROMPT,
        workingDir: getWorkingDir(),
        disallowedTools: DISALLOWED_TOOLS,
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

export function resumeSession(lizardId: string, sessionId?: string, ws?: WebSocket): LizardSession {
  let session = sessions.get(lizardId)
  if (!session) {
    const agent = new HeadlessAgent({
      systemPrompt: DEFAULT_SYSTEM_PROMPT,
      workingDir: getWorkingDir(),
      disallowedTools: DISALLOWED_TOOLS,
    })
    // Restore Claude Code session ID so --resume works
    if (sessionId) {
      agent.setSessionId(sessionId)
    }
    session = {
      agent,
      isProcessing: false,
      queue: [],
      currentWs: ws ?? null,
    }
    sessions.set(lizardId, session)
  } else if (ws) {
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
        fullInput: input,  // Send full input for expandable view
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
    onText: (text: string) => {
      safeSend(session, {
        type: 'text',
        lizardId,
        text,
      })
    },
    onFileChange: (change: FileChange) => {
      // Persist file change in server state
      const agent = getState().agents[lizardId]
      if (agent) {
        const existing = agent.fileChanges ?? []
        const existingIndex = existing.findIndex(fc => fc.filePath === change.filePath)
        let updated: FileChange[]
        if (existingIndex >= 0) {
          updated = [...existing]
          updated[existingIndex] = { ...updated[existingIndex], after: change.after, tool: change.tool }
        } else {
          updated = [...existing, change]
        }
        mutate(`agents.${lizardId}.fileChanges`, updated)
      }
      safeSend(session, {
        type: 'file_change',
        lizardId,
        change,
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
  // In dev mode (GEKTO_DEV=1), use test-app as the working directory
  if (process.env.GEKTO_DEV === '1') {
    return path.resolve(process.cwd(), '../test-app')
  }
  return process.cwd()
}

// Update WebSocket for all sessions (called when new client connects)
export function attachWebSocket(ws: WebSocket): void {
  for (const session of sessions.values()) {
    session.currentWs = ws
  }
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
    const killed = session.agent.kill()
    session.isProcessing = false
    session.queue = []
    // Remove from map so getActiveSessions() doesn't return dead agents
    sessions.delete(lizardId)
    return killed
  }
  return false
}

// Revert files to their pre-agent state using the before content from FileChange objects
export function revertFiles(
  filePaths: string[],
  fileChanges: FileChange[]
): { reverted: string[], failed: string[] } {
  const reverted: string[] = []
  const failed: string[] = []
  const workingDir = getWorkingDir()

  for (const filePath of filePaths) {
    const change = fileChanges.find(fc => fc.filePath === filePath)
    if (!change) {
      failed.push(filePath)
      continue
    }

    try {
      const fullPath = filePath.startsWith('/')
        ? filePath
        : path.resolve(workingDir, filePath)

      if (change.before === null) {
        // File was newly created by agent — delete it
        if (existsSync(fullPath)) {
          unlinkSync(fullPath)
        }
      } else {
        // File existed before — restore original content
        const dir = dirname(fullPath)
        if (!existsSync(dir)) {
          mkdirSync(dir, { recursive: true })
        }
        writeFileSync(fullPath, change.before, 'utf-8')
      }
      reverted.push(filePath)
    } catch (err) {
      console.error(`[AgentPool] Failed to revert ${filePath}:`, err)
      failed.push(filePath)
    }
  }

  return { reverted, failed }
}

export function killAllSessions(): number {
  let count = 0
  for (const [, session] of sessions) {
    if (session.agent.kill()) {
      count++
    }
    session.isProcessing = false
    session.queue = []
  }
  // Clear all sessions so getActiveSessions() returns empty
  sessions.clear()
  return count
}
