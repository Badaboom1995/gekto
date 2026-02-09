import { createContext, useContext, useState, useEffect, useRef, useCallback, type ReactNode } from 'react'
import { useStore, type Message, type ToolMessage } from '../store/store'

// Helper to save message - to store if agent has task, otherwise to REST API
async function saveMessage(agentId: string, message: Message) {
  const state = useStore.getState()
  const agent = state.agents[agentId]

  if (agent?.taskId) {
    // Agent has task - save to store (persists via Zustand middleware)
    state.addMessageToTask(agent.taskId, message)
  } else {
    // No task - save to REST API
    // First fetch existing messages, then append
    try {
      const res = await fetch(`/__gekto/api/chats/${agentId}`)
      const existing = res.ok ? await res.json() : []
      const updated = [
        ...existing,
        {
          id: message.id,
          text: message.text,
          sender: message.sender,
          timestamp: message.timestamp.toISOString(),
          isTerminal: message.isTerminal,
          toolUse: message.toolUse ? {
            tool: message.toolUse.tool,
            input: message.toolUse.input,
            fullInput: message.toolUse.fullInput,
            status: message.toolUse.status,
            startTime: message.toolUse.startTime.toISOString(),
            endTime: message.toolUse.endTime?.toISOString(),
          } : undefined,
        },
      ]
      await fetch(`/__gekto/api/chats/${agentId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updated),
      })
    } catch (err) {
      console.error('[Agent] Failed to save message to REST API:', err)
    }
  }
}

// Helper to sync agent status to store
function syncAgentStatus(agentId: string, status: 'idle' | 'working' | 'done' | 'pending' | 'error') {
  const state = useStore.getState()
  if (state.agents[agentId]) {
    state.updateAgent(agentId, { status })
  }
}

interface ToolStatus {
  tool: string
  status: 'running' | 'completed'
  input?: string
  fullInput?: Record<string, unknown>
}

// File change from agent Write/Edit operations
export interface FileChange {
  tool: 'Write' | 'Edit'
  filePath: string
  before: string | null
  after: string
}

interface PermissionRequest {
  tool: string
  input?: string
  description?: string
}

type AgentState = 'ready' | 'working' | 'queued' | 'error'
type GektoState = 'loading' | 'ready' | 'error'

interface ActiveAgent {
  lizardId: string
  isProcessing: boolean
  isRunning: boolean
  queueLength: number
}

interface LizardSession {
  state: AgentState
  currentTool: ToolStatus | null
  permissionRequest: PermissionRequest | null
  queuePosition: number
  lastResponse?: string  // Store last response for task completion
  lastStatus?: 'done' | 'pending'  // Status extracted from [STATUS:DONE/PENDING] marker
  streamingText?: string  // Accumulates text chunks as agent explains what it's doing
  fileChanges: FileChange[]  // File changes from Write/Edit operations
}

interface AgentContextValue {
  // Actions
  sendMessage: (lizardId: string, message: string) => void
  respondToPermission: (lizardId: string, approved: boolean) => void

  // Session state - exposed for reactivity
  sessions: Map<string, LizardSession>

  // Get state for a specific lizard
  getLizardState: (lizardId: string) => AgentState
  getCurrentTool: (lizardId: string) => ToolStatus | null
  getPermissionRequest: (lizardId: string) => PermissionRequest | null
  getQueuePosition: (lizardId: string) => number
  getWorkingDir: () => string
  getFileChanges: (lizardId: string) => FileChange[]

  // WebSocket access for GektoContext
  getWebSocket: () => WebSocket | null

  // SOS functionality
  activeAgents: ActiveAgent[]
  refreshAgentList: () => void
  killAgent: (lizardId: string) => void
  killAllAgents: () => void

  // Gekto state (loading/ready)
  gektoState: GektoState

  // Name extraction callback (set by SwarmContext)
  setNameExtractor: (extractor: (lizardId: string, name: string) => void) => void
}

const AgentContext = createContext<AgentContextValue | null>(null)

export function useAgent() {
  const context = useContext(AgentContext)
  if (!context) {
    throw new Error('useAgent must be used within an AgentProvider')
  }
  return context
}

interface AgentProviderProps {
  children: ReactNode
}

const DEFAULT_SESSION: LizardSession = {
  state: 'ready',
  currentTool: null,
  permissionRequest: null,
  queuePosition: 0,
  fileChanges: [],
}

export function AgentProvider({ children }: AgentProviderProps) {
  // Per-lizard sessions (transient state only: currentTool, permissionRequest, queuePosition)
  const [sessions, setSessions] = useState<Map<string, LizardSession>>(() => new Map())
  const [workingDir, setWorkingDir] = useState('')
  const [activeAgents, setActiveAgents] = useState<ActiveAgent[]>([])
  const [gektoState, setGektoState] = useState<GektoState>('loading')
  const wsRef = useRef<WebSocket | null>(null)
  const sessionsRef = useRef<Map<string, LizardSession>>(sessions)

  // Keep sessionsRef in sync with sessions state
  useEffect(() => {
    sessionsRef.current = sessions
  }, [sessions])

  // Message listeners - ChatWindow can register to receive messages
  const messageListenersRef = useRef<Map<string, (message: Message) => void>>(new Map())

  // Name extractor callback - set by SwarmContext to handle name extraction
  const nameExtractorRef = useRef<((lizardId: string, name: string) => void) | null>(null)

  // Helper to update a specific lizard's session
  const updateSession = useCallback((lizardId: string, updates: Partial<LizardSession>) => {
    setSessions(prev => {
      const next = new Map(prev)
      const current = next.get(lizardId) ?? { ...DEFAULT_SESSION }
      next.set(lizardId, { ...current, ...updates })
      return next
    })
  }, [])

  // Connect to agent WebSocket once
  useEffect(() => {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:'
    const ws = new WebSocket(`${protocol}//${window.location.host}/__gekto/agent`)
    wsRef.current = ws

    ws.onopen = () => {
      // Expose WebSocket globally for GektoContext
      (window as unknown as { __gektoWebSocket?: WebSocket }).__gektoWebSocket = ws
      // Fetch active agents list on connect
      ws.send(JSON.stringify({ type: 'list_agents' }))
    }

    ws.onmessage = (event) => {
      try {
        const msg = JSON.parse(event.data)
        const lizardId = msg.lizardId


        switch (msg.type) {
          case 'state':
            if (lizardId) {
              if (msg.state === 'working') {
                // Clear streaming text when starting new work
                updateSession(lizardId, { state: 'working', queuePosition: 0, streamingText: '' })
                // Sync to store
                syncAgentStatus(lizardId, 'working')
              } else if (msg.state === 'ready') {
                updateSession(lizardId, { state: 'ready', currentTool: null, queuePosition: 0 })
                // Sync to store - use lastStatus if available, otherwise default to 'pending'
                const session = sessionsRef.current.get(lizardId)
                const finalStatus = session?.lastStatus || 'pending'
                syncAgentStatus(lizardId, finalStatus)

                // If this is a worker lizard transitioning to ready, notify GektoContext
                // that the task is complete (agent finished all processing)
                if (lizardId.startsWith('worker_')) {
                  const session = sessionsRef.current.get(lizardId)
                  const lastResponse = session?.lastResponse || ''
                  const gektoHandler = (window as unknown as { __gektoTaskComplete?: (lizardId: string, result: string, isError: boolean) => void }).__gektoTaskComplete
                  if (gektoHandler && lastResponse) {
                    gektoHandler(lizardId, lastResponse, false)
                  } else {
                    console.warn('[Agent] Cannot notify: gektoHandler=', !!gektoHandler, 'lastResponse=', !!lastResponse)
                  }
                }
              } else if (msg.state === 'error') {
                updateSession(lizardId, { state: 'error' })
                syncAgentStatus(lizardId, 'error')
              }
            }
            break

          case 'gekto_state':
            setGektoState(msg.state as GektoState)
            break

          case 'queued':
            if (lizardId) {
              updateSession(lizardId, { state: 'queued', queuePosition: msg.position })
            }
            break

          case 'tool':
            if (lizardId) {
              const toolStatus: ToolStatus = {
                tool: msg.tool,
                status: msg.status,
                input: msg.input,
                fullInput: msg.fullInput,
              }
              updateSession(lizardId, { currentTool: toolStatus })

              // Save tool use to chat history
              if (msg.status === 'running') {
                const toolMessage: Message = {
                  id: `tool_${Date.now()}`,
                  text: msg.tool,
                  sender: 'bot',
                  timestamp: new Date(),
                  toolUse: {
                    tool: msg.tool,
                    input: msg.input,
                    fullInput: msg.fullInput,
                    status: 'running',
                    startTime: new Date(),
                  },
                }
                // Save to store (persists to task.chatHistory)
                saveMessage(lizardId, toolMessage)
                // Also notify listener if chat is open (for immediate UI update)
                const listener = messageListenersRef.current.get(lizardId)
                if (listener) {
                  listener(toolMessage)
                }
              }
            }
            break

          case 'text':
            // Streaming text - show latest message (not accumulated)
            if (lizardId) {
              // Strip system markers like [AGENT_NAME:...] and [STATUS:...]
              let cleanText = msg.text
                .replace(/\[AGENT_NAME:[^\]]+\]\s*/g, '')
                .replace(/\[STATUS:(DONE|PENDING)\]/gi, '')
                .trim()

              if (cleanText) {
                const currentSession = sessionsRef.current.get(lizardId)
                updateSession(lizardId, { streamingText: cleanText })
                sessionsRef.current.set(lizardId, {
                  ...(currentSession ?? DEFAULT_SESSION),
                  streamingText: cleanText
                })
              }
            }
            break

          case 'file_change':
            // File changed by Write/Edit tool
            // Keep only one entry per file: original "before" + latest "after"
            if (lizardId && msg.change) {
              const change = msg.change as FileChange
              setSessions(prev => {
                const next = new Map(prev)
                const current = next.get(lizardId) ?? { ...DEFAULT_SESSION }

                // Check if we already have a change for this file
                const existingIndex = current.fileChanges.findIndex(
                  fc => fc.filePath === change.filePath
                )

                let updatedChanges: FileChange[]
                if (existingIndex >= 0) {
                  // Update existing entry: keep original "before", use new "after"
                  updatedChanges = [...current.fileChanges]
                  updatedChanges[existingIndex] = {
                    ...updatedChanges[existingIndex],
                    after: change.after,
                    tool: change.tool, // Update tool to latest operation
                  }
                } else {
                  // New file - add to list
                  updatedChanges = [...current.fileChanges, change]
                }

                next.set(lizardId, {
                  ...current,
                  fileChanges: updatedChanges,
                })
                return next
              })
            }
            break

          case 'permission':
            if (lizardId) {
              updateSession(lizardId, {
                permissionRequest: {
                  tool: msg.tool,
                  input: msg.input,
                  description: msg.description,
                }
              })
            }
            break

          case 'info':
            if (msg.workingDir) {
              setWorkingDir(msg.workingDir)
            }
            break

          case 'agents_list':
            setActiveAgents(msg.agents || [])
            // Sync session states from server
            if (msg.agents && msg.agents.length > 0) {
              setSessions(prev => {
                const next = new Map(prev)
                for (const agent of msg.agents) {
                  const current = next.get(agent.lizardId) ?? { ...DEFAULT_SESSION }
                  next.set(agent.lizardId, {
                    ...current,
                    state: agent.state || 'ready',
                    queuePosition: agent.queuePosition || 0,
                  })
                }
                return next
              })
            }
            break

          case 'kill_result':
          case 'kill_all_result':
            // Refresh the list after killing
            ws.send(JSON.stringify({ type: 'list_agents' }))
            break

          case 'debug_pool_result':
            break

          // Plan-related messages - forward to GektoContext
          case 'plan_created':
          case 'plan_updated':
          case 'plan_failed':
          case 'gekto_chat':
          case 'gekto_classified':
          case 'gekto_text':
          case 'gekto_remove':
          case 'task_started':
          case 'task_completed':
          case 'task_failed': {
            const gektoHandler = (window as unknown as { __gektoMessageHandler?: (msg: unknown) => void }).__gektoMessageHandler
            if (gektoHandler) {
              //  const taskId = `test_${Date.now()}`
              //  const planId = `plan_${taskId}`
              //  msg.planId = planId

              //  const plan = {
              //   id: planId,
              //   status: 'ready',
              //   originalPrompt: 'Test: spawn 3 agents with lightweight tasks',
              //   tasks: [
              //     {
              //       id: `${taskId}_1`,
              //       description: 'Agent 1: Say hello',
              //       prompt: 'Say "Hello from Agent 1!" and nothing else.',
              //       files: [],
              //       status: 'pending',
              //       dependencies: [],
              //     },
              //     {
              //       id: `${taskId}_2`,
              //       description: 'Agent 2: Count to 3',
              //       prompt: 'Count from 1 to 3, one number per line.',
              //       files: [],
              //       status: 'pending',
              //       dependencies: [],
              //     },
              //     {
              //       id: `${taskId}_3`,
              //       description: 'Agent 3: Say goodbye',
              //       prompt: 'Say "Goodbye from Agent 3!" and nothing else.',
              //       files: [],
              //       status: 'pending',
              //       dependencies: [],
              //     },
              //   ],
              //   createdAt: new Date().toISOString(),
              // }
              // msg.plan = plan

              
              gektoHandler(msg)
            }
            break
          }

          case 'response':
          case 'error': {
            let text = msg.type === 'error' ? `Error: ${msg.message}` : msg.text
            let extractedStatus: 'done' | 'pending' | undefined

            // Extract agent name if present
            if (lizardId && msg.type === 'response') {
              const nameMatch = text.match(/^\[AGENT_NAME:([^\]]+)\]\s*/)
              if (nameMatch) {
                const extractedName = nameMatch[1].trim()
                text = text.replace(nameMatch[0], '')
                // Call name extractor if registered
                if (nameExtractorRef.current) {
                  nameExtractorRef.current(lizardId, extractedName)
                }
              }

              // Extract status marker [STATUS:DONE] or [STATUS:PENDING]
              const statusMatch = text.match(/\[STATUS:(DONE|PENDING)\]/i)
              if (statusMatch) {
                extractedStatus = statusMatch[1].toLowerCase() as 'done' | 'pending'
                text = text.replace(statusMatch[0], '').trim()
              }
            }

            const newMessage: Message = {
              id: Date.now().toString(),
              text,
              sender: 'bot',
              timestamp: new Date(),
            }

            // Save to store and notify listener
            if (lizardId) {
              // Save to store (persists to task.chatHistory)
              saveMessage(lizardId, newMessage)
              // Also notify listener if chat is open (for immediate UI update)
              const listener = messageListenersRef.current.get(lizardId)
              if (listener) {
                listener(newMessage)
              }

              // Store last response and status (used when state becomes 'ready')
              // Default to 'pending' - agent is waiting for user input
              // Only 'done' if agent explicitly marks [STATUS:DONE]
              const statusToStore = extractedStatus || 'pending'
              // Also store as streamingText so it shows in the task abstract
              updateSession(lizardId, { lastResponse: text, lastStatus: statusToStore, streamingText: text })
              // Also update ref immediately so it's available when 'state: ready' arrives
              // (the useEffect that syncs sessionsRef runs after render, which is too late)
              const currentSession = sessionsRef.current.get(lizardId) ?? { ...DEFAULT_SESSION }
              sessionsRef.current.set(lizardId, { ...currentSession, lastResponse: text, lastStatus: statusToStore, streamingText: text })

              // For worker lizards: if it's an error, mark task as failed immediately
              if (lizardId.startsWith('worker_') && msg.type === 'error') {
                const gektoHandler = (window as unknown as { __gektoTaskComplete?: (lizardId: string, result: string, isError: boolean) => void }).__gektoTaskComplete
                if (gektoHandler) {
                  gektoHandler(lizardId, text, true)
                }
              }
            }

            // Refresh agents list after response
            ws.send(JSON.stringify({ type: 'list_agents' }))
            break
          }
        }
      } catch (err) {
        console.error('[Agent] Failed to parse message:', err)
      }
    }

    ws.onclose = () => {
    }

    ws.onerror = (error) => {
      console.error('[Agent] WebSocket error:', error)
    }

    return () => {
      ws.close()
    }
  }, [updateSession])

  const sendMessage = useCallback((lizardId: string, message: string) => {
    if (wsRef.current?.readyState !== WebSocket.OPEN) return

    // Optimistically set to working (server will confirm or queue)
    updateSession(lizardId, { state: 'working' })

    wsRef.current.send(JSON.stringify({
      type: 'chat',
      lizardId,
      content: message,
    }))
  }, [updateSession])

  const respondToPermission = useCallback((lizardId: string, approved: boolean) => {
    if (wsRef.current?.readyState !== WebSocket.OPEN) return

    wsRef.current.send(JSON.stringify({
      type: 'permission_response',
      lizardId,
      approved,
    }))

    updateSession(lizardId, { permissionRequest: null })
  }, [updateSession])

  const getLizardState = useCallback((lizardId: string): AgentState => {
    // Check local session state first
    const sessionState = sessions.get(lizardId)?.state
    if (sessionState && sessionState !== 'ready') {
      return sessionState
    }
    // Fall back to server-reported state (for orphan agents or reconnects)
    const serverAgent = activeAgents.find(a => a.lizardId === lizardId)
    if (serverAgent?.isRunning || serverAgent?.isProcessing) {
      return 'working'
    }
    return sessionState ?? 'ready'
  }, [sessions, activeAgents])

  const getCurrentTool = useCallback((lizardId: string): ToolStatus | null => {
    return sessions.get(lizardId)?.currentTool ?? null
  }, [sessions])

  const getPermissionRequest = useCallback((lizardId: string): PermissionRequest | null => {
    return sessions.get(lizardId)?.permissionRequest ?? null
  }, [sessions])

  const getQueuePosition = useCallback((lizardId: string): number => {
    return sessions.get(lizardId)?.queuePosition ?? 0
  }, [sessions])

  const getFileChanges = useCallback((lizardId: string): FileChange[] => {
    return sessions.get(lizardId)?.fileChanges ?? []
  }, [sessions])

  const getWorkingDirFn = useCallback((): string => {
    return workingDir
  }, [workingDir])

  const refreshAgentList = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type: 'list_agents' }))
    }
  }, [])

  const killAgent = useCallback((lizardId: string) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type: 'kill', lizardId }))
    }
  }, [])

  const killAllAgents = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type: 'kill_all' }))
    }
  }, [])

  const setNameExtractor = useCallback((extractor: (lizardId: string, name: string) => void) => {
    nameExtractorRef.current = extractor
  }, [])

  const getWebSocketFn = useCallback((): WebSocket | null => {
    return wsRef.current
  }, [])

  // Expose method to register/unregister message listeners
  useEffect(() => {
    (window as unknown as { __agentMessageListeners: Map<string, (message: Message) => void> }).__agentMessageListeners = messageListenersRef.current
  }, [])

  const value: AgentContextValue = {
    sendMessage,
    respondToPermission,
    sessions,
    getLizardState,
    getCurrentTool,
    getPermissionRequest,
    getQueuePosition,
    getFileChanges,
    getWorkingDir: getWorkingDirFn,
    getWebSocket: getWebSocketFn,
    activeAgents,
    refreshAgentList,
    killAgent,
    killAllAgents,
    gektoState,
    setNameExtractor,
  }

  return (
    <AgentContext.Provider value={value}>
      {children}
    </AgentContext.Provider>
  )
}

// Hook for ChatWindow to register as message listener
export function useAgentMessageListener(lizardId: string, onMessage: (message: Message) => void) {
  useEffect(() => {
    const listeners = (window as unknown as { __agentMessageListeners?: Map<string, (message: Message) => void> }).__agentMessageListeners
    if (listeners) {
      listeners.set(lizardId, onMessage)
      return () => {
        listeners.delete(lizardId)
      }
    }
  }, [lizardId, onMessage])
}

export type { Message, ToolMessage, ToolStatus, PermissionRequest, AgentState, GektoState }
