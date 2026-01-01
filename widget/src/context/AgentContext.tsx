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

type AgentState = 'ready' | 'working' | 'error'

interface Message {
  id: string
  text: string
  sender: 'user' | 'bot'
  timestamp: Date
  isTerminal?: boolean
}

interface AgentSession {
  lizardId: string
  state: AgentState
  currentTool: ToolStatus | null
  permissionRequest: PermissionRequest | null
  workingDir: string
}

interface AgentContextValue {
  // Current session (if any lizard has active work)
  activeSession: AgentSession | null

  // Actions
  sendMessage: (lizardId: string, message: string) => void
  respondToPermission: (approved: boolean) => void

  // Get state for a specific lizard
  getLizardState: (lizardId: string) => AgentState
  getCurrentTool: (lizardId: string) => ToolStatus | null
  getPermissionRequest: (lizardId: string) => PermissionRequest | null
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

export function AgentProvider({ children }: AgentProviderProps) {
  const [activeSession, setActiveSession] = useState<AgentSession | null>(null)
  const wsRef = useRef<WebSocket | null>(null)
  const activeLizardIdRef = useRef<string | null>(null)

  // Message listeners - ChatWindow can register to receive messages
  const messageListenersRef = useRef<Map<string, (message: Message) => void>>(new Map())

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
        const lizardId = activeLizardIdRef.current

        console.log('[Agent] Received:', msg.type, msg)

        switch (msg.type) {
          case 'state':
            if (msg.state === 'working') {
              setActiveSession(prev => prev ? { ...prev, state: 'working' } : null)
            } else if (msg.state === 'ready') {
              setActiveSession(prev => prev ? { ...prev, state: 'ready', currentTool: null } : null)
            }
            break

          case 'tool':
            setActiveSession(prev => prev ? {
              ...prev,
              currentTool: {
                tool: msg.tool,
                status: msg.status,
                input: msg.input,
              }
            } : null)
            break

          case 'permission':
            setActiveSession(prev => prev ? {
              ...prev,
              permissionRequest: {
                tool: msg.tool,
                input: msg.input,
                description: msg.description,
              }
            } : null)
            break

          case 'info':
            if (msg.workingDir) {
              setActiveSession(prev => prev ? { ...prev, workingDir: msg.workingDir } : null)
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

            setActiveSession(prev => prev ? {
              ...prev,
              state: 'ready',
              currentTool: null,
              permissionRequest: null,
            } : null)
            break
          }
        }
      } catch (err) {
        console.error('[Agent] Failed to parse message:', err)
      }
    }

    ws.onclose = () => {
      console.log('[Agent] Disconnected')
      setActiveSession(prev => prev ? { ...prev, state: 'error' } : null)
    }

    ws.onerror = (error) => {
      console.error('[Agent] WebSocket error:', error)
      setActiveSession(prev => prev ? { ...prev, state: 'error' } : null)
    }

    return () => {
      ws.close()
    }
  }, [])

  const sendMessage = useCallback((lizardId: string, message: string) => {
    if (wsRef.current?.readyState !== WebSocket.OPEN) return

    activeLizardIdRef.current = lizardId

    // Create or update session
    setActiveSession(prev => ({
      lizardId,
      state: 'working',
      currentTool: null,
      permissionRequest: null,
      workingDir: prev?.workingDir || '',
    }))

    wsRef.current.send(JSON.stringify({
      type: 'chat',
      content: message,
    }))
  }, [])

  const respondToPermission = useCallback((approved: boolean) => {
    if (wsRef.current?.readyState !== WebSocket.OPEN) return

    wsRef.current.send(JSON.stringify({
      type: 'permission_response',
      approved,
    }))

    setActiveSession(prev => prev ? { ...prev, permissionRequest: null } : null)
  }, [])

  const getLizardState = useCallback((lizardId: string): AgentState => {
    if (activeSession?.lizardId === lizardId) {
      return activeSession.state
    }
    return 'ready'
  }, [activeSession])

  const getCurrentTool = useCallback((lizardId: string): ToolStatus | null => {
    if (activeSession?.lizardId === lizardId) {
      return activeSession.currentTool
    }
    return null
  }, [activeSession])

  const getPermissionRequest = useCallback((lizardId: string): PermissionRequest | null => {
    if (activeSession?.lizardId === lizardId) {
      return activeSession.permissionRequest
    }
    return null
  }, [activeSession])

  const getWorkingDir = useCallback((): string => {
    return activeSession?.workingDir || ''
  }, [activeSession])

  // Expose method to register/unregister message listeners
  useEffect(() => {
    (window as unknown as { __agentMessageListeners: Map<string, (message: Message) => void> }).__agentMessageListeners = messageListenersRef.current
  }, [])

  const value: AgentContextValue = {
    activeSession,
    sendMessage,
    respondToPermission,
    getLizardState,
    getCurrentTool,
    getPermissionRequest,
    getWorkingDir,
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
