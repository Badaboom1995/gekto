import { useState, useRef, useEffect } from 'react'
import { Terminal } from '@xterm/xterm'
import '@xterm/xterm/css/xterm.css'

interface Message {
  id: string
  text: string
  sender: 'user' | 'bot'
  timestamp: Date
}

type AgentState = 'loading' | 'ready' | 'working' | 'error'

interface ChatWindowProps {
  title?: string
  initialSize?: { width: number; height: number }
  minSize?: { width: number; height: number }
  color?: string
  onClose?: () => void
  showTerminal?: boolean // Debug mode to show terminal
}

// System prompt to inject
const SYSTEM_PROMPT = `You are a helpful coding assistant. Be concise and direct.`

export function ChatWindow({
  title = 'Gekto Chat',
  initialSize = { width: 1200, height: 600 },
  minSize = { width: 800, height: 400 },
  color = 'rgba(255, 255, 255, 0.5)',
  onClose,
  showTerminal = true, // DEBUG: show terminal by default
}: ChatWindowProps) {
  const [messages, setMessages] = useState<Message[]>([])
  const [inputValue, setInputValue] = useState('')
  const [size, setSize] = useState(initialSize)
  const [isResizing, setIsResizing] = useState(false)
  const [agentState, setAgentState] = useState<AgentState>('loading')

  const containerRef = useRef<HTMLDivElement>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const terminalRef = useRef<HTMLDivElement>(null)
  const resizeStart = useRef({ x: 0, y: 0, width: 0, height: 0 })

  const termRef = useRef<Terminal | null>(null)
  const wsRef = useRef<WebSocket | null>(null)
  const outputBufferRef = useRef<string>('')
  const isFirstPromptRef = useRef(true)
  const pendingMessageRef = useRef<string | null>(null)
  const agentStateRef = useRef<AgentState>('loading')

  // Strip ANSI escape codes
  const stripAnsi = (text: string): string => {
    return text
      .replace(/\x1b\[[0-9;]*m/g, '')
      .replace(/\x1b\[[0-9;]*[A-Za-z]/g, '')
      .replace(/\x1b\][^\x07]*\x07/g, '') // OSC sequences
      .replace(/[\x00-\x09\x0b-\x0c\x0e-\x1f]/g, '') // Control chars except \n \r
  }

  // Extract Claude's actual response from terminal output
  const extractResponse = (buffer: string): string => {
    // Remove the echoed input
    let response = buffer

    // Remove prompt characters and leading/trailing whitespace
    response = response
      .replace(/^[\s\S]*?(?:>|❯)\s*/m, '') // Remove everything up to and including first prompt
      .replace(/(?:>|❯)\s*$/m, '') // Remove trailing prompt
      .replace(/\r/g, '')
      .trim()

    // Remove any lines that look like our input echo
    const lines = response.split('\n')
    const filteredLines = lines.filter(line => {
      const trimmed = line.trim()
      // Skip empty lines at start
      if (!trimmed) return true
      // Skip lines that look like input echo (starts with what we sent)
      if (pendingMessageRef.current && trimmed.startsWith(pendingMessageRef.current.substring(0, 20))) {
        return false
      }
      return true
    })

    return filteredLines.join('\n').trim()
  }

  // Initialize hidden terminal with Claude Code
  useEffect(() => {
    if (!terminalRef.current || termRef.current) return

    // Guard against React strict mode double-mount
    let isMounted = true

    const term = new Terminal({
      cols: 120,
      rows: 40,
    })

    term.open(terminalRef.current)
    termRef.current = term

    // Handle terminal output - detect prompts and responses
    const handleTerminalOutput = (data: string) => {
      if (!isMounted) return

      const clean = stripAnsi(data)
      const currentState = agentStateRef.current

      // DEBUG: Log all output
      console.log('[Chat] Raw:', JSON.stringify(data).substring(0, 100))
      console.log('[Chat] Clean:', clean.substring(0, 100))
      console.log('[Chat] State:', currentState)

      // Accumulate output
      outputBufferRef.current += clean

      // Detect Claude Code ready prompt (> or ❯)
      if ((clean.includes('>') || clean.includes('❯')) && currentState === 'loading') {
        console.log('[Chat] Claude Code ready!')
        agentStateRef.current = 'ready'
        setAgentState('ready')
        isFirstPromptRef.current = true
        setMessages([{
          id: '1',
          text: 'Hi! How can I help you today?',
          sender: 'bot',
          timestamp: new Date(),
        }])
        outputBufferRef.current = ''
      }

      // Detect when Claude finishes responding (prompt returns)
      if ((clean.includes('>') || clean.includes('❯')) && currentState === 'working') {
        console.log('[Chat] Claude finished responding')
        console.log('[Chat] Full buffer:', outputBufferRef.current)

        const response = extractResponse(outputBufferRef.current)
        console.log('[Chat] Extracted response:', response)

        if (response) {
          setMessages(prev => [...prev, {
            id: Date.now().toString(),
            text: response,
            sender: 'bot',
            timestamp: new Date(),
          }])
        }

        outputBufferRef.current = ''
        agentStateRef.current = 'ready'
        setAgentState('ready')
      }
    }

    // Connect to terminal WebSocket
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:'
    const ws = new WebSocket(`${protocol}//${window.location.host}/__gekto/terminal`)
    wsRef.current = ws

    ws.onopen = () => {
      console.log('[Chat] Terminal connected')
      ws.send(JSON.stringify({ type: 'resize', cols: 120, rows: 40 }))
      console.log('[Chat] Sent resize, waiting before starting Claude Code...')
    }

    ws.onmessage = (event) => {
      try {
        const msg = JSON.parse(event.data)
        if (msg.type === 'output') {
          term.write(msg.data)
          handleTerminalOutput(msg.data)
        }
      } catch {
        term.write(event.data)
        handleTerminalOutput(event.data)
      }
    }

    ws.onclose = (event) => {
      console.log('[Chat] Terminal disconnected, code:', event.code, 'reason:', event.reason)
      if (isMounted) {
        agentStateRef.current = 'error'
        setAgentState('error')
      }
    }

    ws.onerror = (error) => {
      console.error('[Chat] WebSocket error:', error)
    }

    // Start Claude Code after connection
    setTimeout(() => {
      if (!isMounted) {
        console.log('[Chat] Component unmounted, skipping Claude start')
        return
      }
      console.log('[Chat] Attempting to start Claude Code, ws state:', ws.readyState)
      if (ws.readyState === WebSocket.OPEN) {
        console.log('[Chat] Sending claude command...')
        ws.send(JSON.stringify({ type: 'input', data: 'claude\r' }))
      } else {
        console.log('[Chat] WebSocket not open, cannot start Claude')
      }
    }, 500)

    return () => {
      isMounted = false
      ws.close()
      term.dispose()
      termRef.current = null
    }
  }, [])

  // Helper to update both state and ref
  const updateAgentState = (newState: AgentState) => {
    agentStateRef.current = newState
    setAgentState(newState)
  }

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

    const userMessage = inputValue.trim()

    const newMessage: Message = {
      id: Date.now().toString(),
      text: userMessage,
      sender: 'user',
      timestamp: new Date(),
    }

    setMessages(prev => [...prev, newMessage])
    updateAgentState('working')
    outputBufferRef.current = ''
    pendingMessageRef.current = userMessage

    // Send to Claude Code via terminal
    // For first message, include system prompt
    let messageToSend = userMessage
    if (isFirstPromptRef.current) {
      messageToSend = `${SYSTEM_PROMPT}\n\nUser request: ${userMessage}`
      isFirstPromptRef.current = false
    }

    if (wsRef.current?.readyState === WebSocket.OPEN) {
      // Send message character by character, then Enter
      // Claude Code needs the input followed by carriage return
      wsRef.current.send(JSON.stringify({
        type: 'input',
        data: messageToSend
      }))
      // Send Enter key separately to submit
      setTimeout(() => {
        wsRef.current?.send(JSON.stringify({
          type: 'input',
          data: '\r'
        }))
      }, 100)
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
      case 'error': return 'Connection error'
      default: return ''
    }
  }

  return (
    <div
      ref={containerRef}
      className="flex relative"
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
      {/* Debug terminal for Claude Code - left side */}
      {showTerminal && (
        <div
          ref={terminalRef}
          style={{
            width: 600,
            height: '100%',
            background: '#000',
            borderRight: '1px solid rgba(255,255,255,0.2)',
            borderRadius: '16px 0 0 16px',
            overflow: 'hidden',
          }}
        />
      )}
      {/* Hidden terminal when not debugging */}
      {!showTerminal && (
        <div
          ref={terminalRef}
          style={{
            position: 'absolute',
            left: -9999,
            top: -9999,
            width: 1,
            height: 1,
            opacity: 0,
            pointerEvents: 'none',
          }}
        />
      )}

      {/* Chat section - right side */}
      <div className="flex flex-col flex-1" style={{ minWidth: 0 }}>
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
