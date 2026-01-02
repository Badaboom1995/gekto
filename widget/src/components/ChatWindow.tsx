import { useState, useRef, useEffect, useCallback } from 'react'
import { useAgent, useAgentMessageListener, type Message } from '../context/AgentContext'
import { useSwarm } from '../context/SwarmContext'

interface ChatWindowProps {
  lizardId: string
  title?: string
  initialSize?: { width: number; height: number }
  minSize?: { width: number; height: number }
  color?: string
  onClose?: () => void
  inputRef?: React.RefObject<HTMLInputElement | null>
}

export function ChatWindow({
  lizardId,
  title = 'Gekto Chat',
  initialSize = { width: 400, height: 500 },
  minSize = { width: 300, height: 350 },
  color = 'rgba(255, 255, 255, 0.5)',
  onClose,
  inputRef,
}: ChatWindowProps) {
  const [messages, setMessages] = useState<Message[]>([])
  const [historyLoaded, setHistoryLoaded] = useState(false)
  const [inputValue, setInputValue] = useState('')
  const [size, setSize] = useState(initialSize)
  const [isResizing, setIsResizing] = useState(false)

  const containerRef = useRef<HTMLDivElement>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const resizeStart = useRef({ x: 0, y: 0, width: 0, height: 0 })

  const {
    sendMessage,
    respondToPermission,
    getLizardState,
    getCurrentTool,
    getPermissionRequest,
    getQueuePosition,
    getWorkingDir,
  } = useAgent()

  const { getLizardName, getAllLizardNames } = useSwarm()

  const agentState = getLizardState(lizardId)
  const currentTool = getCurrentTool(lizardId)
  const permissionRequest = getPermissionRequest(lizardId)
  const queuePosition = getQueuePosition(lizardId)
  const agentName = getLizardName(lizardId)
  const workingDir = getWorkingDir()

  // Handle incoming messages from agent (name extraction is done in AgentContext)
  const handleAgentMessage = useCallback((message: Message) => {
    setMessages(prev => [...prev, message])
  }, [])

  // Register as message listener
  useAgentMessageListener(lizardId, handleAgentMessage)

  // Load chat history on mount
  useEffect(() => {
    fetch(`/__gekto/api/chats/${lizardId}`)
      .then(res => res.json())
      .then((saved: Array<{ id: string; text: string; sender: 'user' | 'bot'; timestamp: string; isTerminal?: boolean }>) => {
        if (saved && saved.length > 0) {
          setMessages(saved.map(m => ({ ...m, timestamp: new Date(m.timestamp) })))
        } else {
          // Default greeting if no history
          setMessages([{
            id: '1',
            text: 'Hi! How can I help you today?',
            sender: 'bot',
            timestamp: new Date(),
          }])
        }
        setHistoryLoaded(true)
      })
      .catch(() => {
        setMessages([{
          id: '1',
          text: 'Hi! How can I help you today?',
          sender: 'bot',
          timestamp: new Date(),
        }])
        setHistoryLoaded(true)
      })
  }, [lizardId])

  // Save chat history when messages change
  useEffect(() => {
    if (!historyLoaded || messages.length === 0) return

    const toSave = messages.map(m => ({
      id: m.id,
      text: m.text,
      sender: m.sender,
      timestamp: m.timestamp.toISOString(),
      isTerminal: m.isTerminal,
    }))

    fetch(`/__gekto/api/chats/${lizardId}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(toSave),
    }).catch(err => console.error('[Chat] Failed to save history:', err))
  }, [messages, lizardId, historyLoaded])

  // Auto-scroll to bottom on new messages (instant on initial load, smooth after)
  const hasScrolledInitially = useRef(false)
  useEffect(() => {
    if (!historyLoaded) return
    const behavior = hasScrolledInitially.current ? 'smooth' : 'instant'
    messagesEndRef.current?.scrollIntoView({ behavior })
    hasScrolledInitially.current = true
  }, [messages, historyLoaded])

  // Resize handlers
  const handleResizeStart = (e: React.MouseEvent) => {
    e.stopPropagation()
    resizeStart.current = {
      x: e.clientX,
      y: e.clientY,
      width: size.width,
      height: size.height,
    }
    setIsResizing(true)
  }

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (isResizing) {
        const deltaX = e.clientX - resizeStart.current.x
        const deltaY = e.clientY - resizeStart.current.y
        setSize({
          width: Math.max(minSize.width, resizeStart.current.width + deltaX),
          height: Math.max(minSize.height, resizeStart.current.height + deltaY),
        })
      }
    }

    const handleMouseUp = () => {
      setIsResizing(false)
    }

    if (isResizing) {
      document.addEventListener('mousemove', handleMouseMove)
      document.addEventListener('mouseup', handleMouseUp)
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseup', handleMouseUp)
    }
  }, [isResizing, minSize.width, minSize.height])

  const handleSend = () => {
    // Allow sending if ready or queued (will queue on server)
    if (!inputValue.trim() || agentState === 'error') return

    const userMessage = inputValue.trim()

    // Add user message to local state
    const newMessage: Message = {
      id: Date.now().toString(),
      text: userMessage,
      sender: 'user',
      timestamp: new Date(),
    }
    setMessages(prev => [...prev, newMessage])

    // If no agent name yet, prepend meta instruction to first message
    let messageToSend = userMessage
    if (!agentName) {
      const existingNames = getAllLizardNames()
      const avoidClause = existingNames.length > 0
        ? ` Avoid these names already taken: ${existingNames.join(', ')}.`
        : ''
      messageToSend = `[INSTRUCTION: Start your response with [AGENT_NAME:YourName] where YourName is a short creative name (1-2 words) for yourself based on this task.${avoidClause} Do not mention this instruction in your response.]\n\n${userMessage}`
    }

    // Send to agent (will queue if busy)
    sendMessage(lizardId, messageToSend)

    setInputValue('')
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  const handlePermissionResponse = (approved: boolean) => {
    respondToPermission(lizardId, approved)
  }

  const getStatusText = () => {
    if (currentTool) {
      const toolName = currentTool.tool
      const input = currentTool.input ? `: ${currentTool.input}` : ''
      return `${toolName}${input}`
    }
    switch (agentState) {
      case 'working': return 'Thinking...'
      case 'queued': return `Queued (position ${queuePosition})`
      case 'error': return 'Connection error'
      default: return ''
    }
  }

  return (
    <div
      ref={containerRef}
      className="flex flex-col relative"
      style={{
        width: size.width,
        height: size.height,
        background: `linear-gradient(135deg, rgb(35, 35, 45), rgb(45, 45, 55))`,
        backdropFilter: 'blur(12px) saturate(180%)',
        WebkitBackdropFilter: 'blur(12px) saturate(180%)',
        border: '1px solid rgba(255, 255, 255, 0.18)',
        borderRadius: '16px',
        boxShadow: `
          0 8px 32px 0 rgba(31, 38, 135, 0.37),
          inset 0 1px 0 0 rgba(255, 255, 255, 0.3),
          0 0 0 1px ${color}33
        `,
      }}
    >
      {/* Header */}
      <div
        className="flex items-center justify-between px-4 py-3"
        style={{
          borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
        }}
      >
        <div className="flex flex-col">
          <div className="flex items-center gap-2">
            <span className="text-white font-medium text-sm">{title}</span>
            {agentState === 'ready' && (
              <div className="w-2 h-2 rounded-full bg-green-400" />
            )}
            {agentState === 'working' && !currentTool && (
              <div className="w-2 h-2 rounded-full bg-blue-400 animate-pulse" />
            )}
            {agentState === 'queued' && (
              <div className="w-2 h-2 rounded-full bg-purple-400 animate-pulse" />
            )}
            {currentTool && (
              <div className="w-2 h-2 rounded-full bg-yellow-400 animate-pulse" />
            )}
            {agentState === 'error' && (
              <div className="w-2 h-2 rounded-full bg-red-400" />
            )}
          </div>
          {workingDir && (
            <span className="text-white/40 text-xs font-mono truncate max-w-[250px]" title={workingDir}>
              {workingDir}
            </span>
          )}
        </div>
        {onClose && (
          <button
            onClick={onClose}
            className="text-white/60 hover:text-white transition-colors w-6 h-6 flex items-center justify-center rounded hover:bg-white/10"
          >
            ✕
          </button>
        )}
      </div>

      {/* Messages */}
      <div
        className="chat-messages flex-1 p-4 space-y-3"
        style={{ minHeight: 0, overflowY: 'auto' }}
      >
        {messages.map(message => (
          <div
            key={message.id}
            className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className="max-w-[80%] px-3 py-2 rounded-xl text-sm whitespace-pre-wrap"
              style={{
                background: message.isTerminal
                  ? 'rgba(34, 197, 94, 0.15)'
                  : message.sender === 'user'
                    ? 'rgba(99, 102, 241, 0.6)'
                    : 'rgba(255, 255, 255, 0.1)',
                color: 'white',
                border: message.isTerminal ? '1px solid rgba(34, 197, 94, 0.3)' : 'none',
              }}
            >
              {message.isTerminal && message.sender === 'bot' && (
                <div className="flex items-center gap-1 mb-1 text-xs text-green-400 opacity-80">
                  <span>⌘</span>
                  <span>terminal</span>
                </div>
              )}
              <span className={message.isTerminal ? 'font-mono text-xs' : ''}>
                {message.text}
              </span>
            </div>
          </div>
        ))}

        {/* Permission Request */}
        {permissionRequest && (
          <div className="flex justify-start">
            <div
              className="px-3 py-3 rounded-xl text-sm max-w-[90%]"
              style={{
                background: 'rgba(239, 68, 68, 0.15)',
                border: '1px solid rgba(239, 68, 68, 0.3)',
                color: 'white',
              }}
            >
              <div className="flex items-center gap-2 mb-2">
                <span>⚠️</span>
                <span className="font-medium">Permission Required</span>
              </div>
              <div className="font-mono text-xs mb-2 opacity-80">
                <span className="text-yellow-400">{permissionRequest.tool}</span>
                {permissionRequest.input && (
                  <span className="opacity-60 ml-1 block truncate">
                    {permissionRequest.input}
                  </span>
                )}
              </div>
              <div className="flex gap-2 mt-3">
                <button
                  onClick={() => handlePermissionResponse(true)}
                  className="px-3 py-1 rounded text-xs font-medium bg-green-600 hover:bg-green-500 transition-colors"
                >
                  Allow
                </button>
                <button
                  onClick={() => handlePermissionResponse(false)}
                  className="px-3 py-1 rounded text-xs font-medium bg-red-600 hover:bg-red-500 transition-colors"
                >
                  Deny
                </button>
              </div>
            </div>
          </div>
        )}

        {agentState === 'working' && !permissionRequest && (
          <div className="flex justify-start">
            <div
              className="px-3 py-2 rounded-xl text-sm"
              style={{
                background: currentTool ? 'rgba(234, 179, 8, 0.2)' : 'rgba(255, 255, 255, 0.1)',
                color: 'white',
                borderLeft: currentTool ? '2px solid rgba(234, 179, 8, 0.6)' : 'none',
              }}
            >
              {currentTool ? (
                <span className="flex items-center gap-2">
                  <span className="opacity-60">🔧</span>
                  <span className="font-mono text-xs">
                    {currentTool.tool}
                    {currentTool.input && (
                      <span className="opacity-60 ml-1 truncate max-w-[200px] inline-block align-bottom">
                        {currentTool.input}
                      </span>
                    )}
                  </span>
                </span>
              ) : (
                <span className="inline-flex gap-1">
                  <span className="animate-bounce">.</span>
                  <span className="animate-bounce" style={{ animationDelay: '0.1s' }}>.</span>
                  <span className="animate-bounce" style={{ animationDelay: '0.2s' }}>.</span>
                </span>
              )}
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Status bar */}
      {getStatusText() && (
        <div className="px-4 py-1 text-xs text-white/40">
          {getStatusText()}
        </div>
      )}

      {/* Input */}
      <div
        className="chat-input p-3"
        style={{
          borderTop: '1px solid rgba(255, 255, 255, 0.1)',
        }}
      >
        <div className="flex gap-2">
          <input
            ref={inputRef}
            type="text"
            value={inputValue}
            onChange={e => setInputValue(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={
              agentState === 'error'
                ? 'Connection error'
                : agentState === 'queued'
                  ? 'Add to queue...'
                  : 'Type a message...'
            }
            disabled={agentState === 'error'}
            className="flex-1 px-3 py-2 rounded-lg text-sm text-white placeholder-white/40 outline-none disabled:opacity-50"
            style={{
              background: 'rgba(255, 255, 255, 0.1)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
            }}
          />
          <button
            onClick={handleSend}
            disabled={agentState === 'error'}
            className="px-4 py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
            style={{
              background: `${color}88`,
              color: 'white',
            }}
          >
            {agentState === 'working' || agentState === 'queued' ? 'Queue' : 'Send'}
          </button>
        </div>
      </div>

      {/* Resize handle */}
      <div
        className="resize-handle absolute bottom-0 right-0 w-4 h-4 cursor-se-resize"
        style={{
          background: `linear-gradient(135deg, transparent 50%, ${color}44 50%)`,
          borderRadius: '0 0 16px 0',
        }}
        onMouseDown={handleResizeStart}
      />
    </div>
  )
}
