import { createContext, useContext, useState, useEffect, useRef, useCallback, type ReactNode } from 'react'

interface ToolStatus {
  tool: string
  status: 'running' | 'completed'
  input?: string
}

interface PermissionRequest {
  tool: string
  input?: string
  description?: string
}

type AgentState = 'ready' | 'working' | 'queued' | 'error'

interface Message {
  id: string
  text: string
  sender: 'user' | 'bot'
  timestamp: Date
  isTerminal?: boolean
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

  // Get state for a specific lizard
  getLizardState: (lizardId: string) => AgentState
  getCurrentTool: (lizardId: string) => ToolStatus | null
  getPermissionRequest: (lizardId: string) => PermissionRequest | null
  getQueuePosition: (lizardId: string) => number
  getWorkingDir: () => string
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
    const existing: Array<{ id: string; text: string; sender: string; timestamp: string; isTerminal?: boolean }> = await res.json() || []

    // Add new message
    existing.push({
      id: message.id,
      text: message.text,
      sender: message.sender,
      timestamp: message.timestamp.toISOString(),
      isTerminal: message.isTerminal,
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
  const wsRef = useRef<WebSocket | null>(null)

  // Message listeners - ChatWindow can register to receive messages
  const messageListenersRef = useRef<Map<string, (message: Message) => void>>(new Map())

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
      console.log('[Agent] Connected')
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

          case 'queued':
            if (lizardId) {
              updateSession(lizardId, { state: 'queued', queuePosition: msg.position })
            }
            break

          case 'tool':
            if (lizardId) {
              updateSession(lizardId, {
                currentTool: {
                  tool: msg.tool,
                  status: msg.status,
                  input: msg.input,
                }
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

          case 'response':
          case 'error': {
            const newMessage: Message = {
              id: Date.now().toString(),
              text: msg.type === 'error' ? `Error: ${msg.message}` : msg.text,
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
            }
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
    return sessions.get(lizardId)?.state ?? 'ready'
  }, [sessions])

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

  // Expose method to register/unregister message listeners
  useEffect(() => {
    (window as unknown as { __agentMessageListeners: Map<string, (message: Message) => void> }).__agentMessageListeners = messageListenersRef.current
  }, [])

  const value: AgentContextValue = {
    sendMessage,
    respondToPermission,
    getLizardState,
    getCurrentTool,
    getPermissionRequest,
    getQueuePosition,
    getWorkingDir: getWorkingDirFn,
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

export type { Message, ToolStatus, PermissionRequest, AgentState }
