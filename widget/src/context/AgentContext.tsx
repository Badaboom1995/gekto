import { createContext, useContext, useState, useEffect, useRef, useCallback, type ReactNode } from 'react'

interface ToolStatus {
  tool: string
  status: 'running' | 'completed'
  input?: string
  fullInput?: Record<string, unknown>
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

interface ToolMessage {
  tool: string
  input?: string
  fullInput?: Record<string, unknown>
  status: 'running' | 'completed'
  startTime: Date
  endTime?: Date
}

interface Message {
  id: string
  text: string
  sender: 'user' | 'bot' | 'system'
  timestamp: Date
  isTerminal?: boolean
  // Tool use data (if this is a tool message)
  toolUse?: ToolMessage
  // System message type for special UI
  systemType?: 'mode' | 'status' | 'info'
  systemData?: Record<string, unknown>
}

interface LizardSession {
  state: AgentState
  currentTool: ToolStatus | null
  permissionRequest: PermissionRequest | null
  queuePosition: number
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

// Helper to save a message to chat history
async function saveMessageToHistory(lizardId: string, message: Message) {
  try {
    // Load existing messages
    const res = await fetch(`/__gekto/api/chats/${lizardId}`)
    const existing: Array<{
      id: string
      text: string
      sender: string
      timestamp: string
      isTerminal?: boolean
      toolUse?: {
        tool: string
        input?: string
        fullInput?: Record<string, unknown>
        status: 'running' | 'completed'
        startTime: string
        endTime?: string
      }
    }> = await res.json() || []

    // Add new message
    existing.push({
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
    })

    // Save back
    await fetch(`/__gekto/api/chats/${lizardId}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(existing),
    })
  } catch (err) {
    console.error('[Agent] Failed to save message to history:', err)
  }
}

const DEFAULT_SESSION: LizardSession = {
  state: 'ready',
  currentTool: null,
  permissionRequest: null,
  queuePosition: 0,
}

export function AgentProvider({ children }: AgentProviderProps) {
  // Per-lizard sessions
  const [sessions, setSessions] = useState<Map<string, LizardSession>>(() => new Map())
  const [workingDir, setWorkingDir] = useState('')
  const [activeAgents, setActiveAgents] = useState<ActiveAgent[]>([])
  const [gektoState, setGektoState] = useState<GektoState>('loading')
  const wsRef = useRef<WebSocket | null>(null)

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

        console.log('[Agent] Received:', msg.type, lizardId, msg)

        switch (msg.type) {
          case 'state':
            if (lizardId) {
              if (msg.state === 'working') {
                updateSession(lizardId, { state: 'working', queuePosition: 0 })
              } else if (msg.state === 'ready') {
                updateSession(lizardId, { state: 'ready', currentTool: null, queuePosition: 0 })
              }
            }
            break

          case 'gekto_state':
            console.log('[Agent] Gekto state:', msg.state)
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
                // Notify listener if chat is open
                const listener = messageListenersRef.current.get(lizardId)
                if (listener) {
                  listener(toolMessage)
                } else {
                  // Save directly if chat is closed
                  saveMessageToHistory(lizardId, toolMessage)
                }
              }
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
              console.log('[Agent] Received agents_list:', msg.agents)
              setSessions(prev => {
                const next = new Map(prev)
                for (const agent of msg.agents) {
                  console.log('[Agent] Syncing session:', agent.lizardId, 'state:', agent.state)
                  const current = next.get(agent.lizardId) ?? { ...DEFAULT_SESSION }
                  next.set(agent.lizardId, {
                    ...current,
                    state: agent.state || 'ready',
                    queuePosition: agent.queuePosition || 0,
                  })
                }
                console.log('[Agent] Sessions after sync:', Array.from(next.entries()))
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
            console.log('\n========== AGENT POOL (from server) ==========')
            console.log('Sessions:', msg.sessions)
            console.table(msg.sessions)
            console.log('===============================================\n')
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
              gektoHandler(msg)
            }
            break
          }

          case 'response':
          case 'error': {
            let text = msg.type === 'error' ? `Error: ${msg.message}` : msg.text

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
            }

            const newMessage: Message = {
              id: Date.now().toString(),
              text,
              sender: 'bot',
              timestamp: new Date(),
            }

            // Notify listener if chat is open
            if (lizardId) {
              const listener = messageListenersRef.current.get(lizardId)
              if (listener) {
                listener(newMessage)
              } else {
                // Chat is closed - save directly to history
                saveMessageToHistory(lizardId, newMessage)
              }

              // If this is a worker lizard, notify GektoContext about completion
              if (lizardId.startsWith('worker_')) {
                const gektoHandler = (window as unknown as { __gektoTaskComplete?: (lizardId: string, result: string, isError: boolean) => void }).__gektoTaskComplete
                if (gektoHandler) {
                  gektoHandler(lizardId, text, msg.type === 'error')
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
      console.log('[Agent] Disconnected')
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
