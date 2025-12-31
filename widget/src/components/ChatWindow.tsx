import { useState, useRef, useEffect } from 'react'

interface Message {
  id: string
  text: string
  sender: 'user' | 'bot'
  timestamp: Date
}

type AgentState = 'loading' | 'ready' | 'working' | 'waiting_input' | 'completed' | 'error'

interface ChatWindowProps {
  title?: string
  initialSize?: { width: number; height: number }
  minSize?: { width: number; height: number }
  color?: string
  onClose?: () => void
}

export function ChatWindow({
  title = 'Gekto Chat',
  initialSize = { width: 350, height: 450 },
  minSize = { width: 280, height: 300 },
  color = 'rgba(255, 255, 255, 0.5)',
  onClose,
}: ChatWindowProps) {
  const [messages, setMessages] = useState<Message[]>([])
  const [inputValue, setInputValue] = useState('')
  const [size, setSize] = useState(initialSize)
  const [isResizing, setIsResizing] = useState(false)
  const [agentState, setAgentState] = useState<AgentState>('loading')

  const containerRef = useRef<HTMLDivElement>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const resizeStart = useRef({ x: 0, y: 0, width: 0, height: 0 })
  const wsRef = useRef<WebSocket | null>(null)

  // Connect to agent WebSocket
  useEffect(() => {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:'
    const ws = new WebSocket(`${protocol}//${window.location.host}/__gekto/agent`)
    wsRef.current = ws

    ws.onopen = () => {
      console.log('[Chat] Connected to agent')
    }

    ws.onmessage = (event) => {
      try {
        const msg = JSON.parse(event.data)

        switch (msg.type) {
          case 'state':
            setAgentState(msg.state)
            if (msg.state === 'ready' && messages.length === 0) {
              setMessages([{
                id: '1',
                text: 'Claude Code is ready! How can I help you?',
                sender: 'bot',
                timestamp: new Date(),
              }])
            }
            break

          case 'response':
            // Clean response from server
            if (msg.text) {
              setMessages(prev => [...prev, {
                id: Date.now().toString(),
                text: msg.text,
                sender: 'bot',
                timestamp: new Date(),
              }])
            }
            break
        }
      } catch (err) {
        console.error('[Chat] Failed to parse message:', err)
      }
    }

    ws.onclose = () => {
      console.log('[Chat] Disconnected from agent')
      setAgentState('error')
    }

    ws.onerror = () => {
      console.error('[Chat] WebSocket error')
      setAgentState('error')
    }

    return () => {
      ws.close()
    }
  }, [])

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

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
    if (!inputValue.trim() || agentState !== 'ready') return

    const newMessage: Message = {
      id: Date.now().toString(),
      text: inputValue.trim(),
      sender: 'user',
      timestamp: new Date(),
    }

    setMessages(prev => [...prev, newMessage])

    // Send to agent
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({
        type: 'chat',
        content: inputValue.trim(),
      }))
    }

    setInputValue('')
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  const getStatusText = () => {
    switch (agentState) {
      case 'loading': return 'Starting Claude Code...'
      case 'working': return 'Thinking...'
      case 'waiting_input': return 'Waiting for permission...'
      case 'error': return 'Connection error'
      default: return ''
    }
  }

  return (
    <div
      ref={containerRef}
      className="flex flex-col"
      style={{
        width: size.width,
        height: size.height,
        background: `linear-gradient(135deg, ${color}15, ${color}25)`,
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
        <div className="flex items-center gap-2">
          <span className="text-white font-medium text-sm">{title}</span>
          {agentState === 'loading' && (
            <div className="w-2 h-2 rounded-full bg-yellow-400 animate-pulse" />
          )}
          {agentState === 'ready' && (
            <div className="w-2 h-2 rounded-full bg-green-400" />
          )}
          {agentState === 'working' && (
            <div className="w-2 h-2 rounded-full bg-blue-400 animate-pulse" />
          )}
          {agentState === 'error' && (
            <div className="w-2 h-2 rounded-full bg-red-400" />
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
        {agentState === 'loading' && (
          <div className="flex items-center justify-center h-full">
            <div className="text-white/60 text-sm flex flex-col items-center gap-3">
              <div className="w-8 h-8 border-2 border-white/20 border-t-white/60 rounded-full animate-spin" />
              <span>Starting Claude Code...</span>
            </div>
          </div>
        )}

        {agentState !== 'loading' && messages.map(message => (
          <div
            key={message.id}
            className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className="max-w-[80%] px-3 py-2 rounded-xl text-sm whitespace-pre-wrap"
              style={{
                background: message.sender === 'user'
                  ? `${color}66`
                  : 'rgba(255, 255, 255, 0.1)',
                color: 'white',
              }}
            >
              {message.text}
            </div>
          </div>
        ))}

        {agentState === 'working' && (
          <div className="flex justify-start">
            <div
              className="px-3 py-2 rounded-xl text-sm"
              style={{ background: 'rgba(255, 255, 255, 0.1)', color: 'white' }}
            >
              <span className="inline-flex gap-1">
                <span className="animate-bounce">.</span>
                <span className="animate-bounce" style={{ animationDelay: '0.1s' }}>.</span>
                <span className="animate-bounce" style={{ animationDelay: '0.2s' }}>.</span>
              </span>
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
            type="text"
            value={inputValue}
            onChange={e => setInputValue(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={agentState === 'ready' ? 'Type a message...' : 'Waiting...'}
            disabled={agentState !== 'ready'}
            className="flex-1 px-3 py-2 rounded-lg text-sm text-white placeholder-white/40 outline-none disabled:opacity-50"
            style={{
              background: 'rgba(255, 255, 255, 0.1)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
            }}
          />
          <button
            onClick={handleSend}
            disabled={agentState !== 'ready'}
            className="px-4 py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
            style={{
              background: `${color}88`,
              color: 'white',
            }}
          >
            Send
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
