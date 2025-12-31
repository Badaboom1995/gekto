import { useState, useRef, useEffect } from 'react'

interface Message {
  id: string
  text: string
  sender: 'user' | 'bot'
  timestamp: Date
  isTerminal?: boolean
}

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

interface ChatWindowProps {
  title?: string
  initialSize?: { width: number; height: number }
  minSize?: { width: number; height: number }
  color?: string
  onClose?: () => void
}

export function ChatWindow({
  title = 'Gekto Chat',
  initialSize = { width: 400, height: 500 },
  minSize = { width: 300, height: 350 },
  color = 'rgba(255, 255, 255, 0.5)',
  onClose,
}: ChatWindowProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      text: 'Hi! How can I help you today?',
      sender: 'bot',
      timestamp: new Date(),
    }
  ])
  const [inputValue, setInputValue] = useState('')
  const [size, setSize] = useState(initialSize)
  const [isResizing, setIsResizing] = useState(false)
  const [agentState, setAgentState] = useState<AgentState>('ready')
  const [currentTool, setCurrentTool] = useState<ToolStatus | null>(null)
  const [permissionRequest, setPermissionRequest] = useState<PermissionRequest | null>(null)
  const [workingDir, setWorkingDir] = useState<string>('')
  const [terminalMode, setTerminalMode] = useState(false)
  const [terminalOutput, setTerminalOutput] = useState('')

  const containerRef = useRef<HTMLDivElement>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const resizeStart = useRef({ x: 0, y: 0, width: 0, height: 0 })
  const wsRef = useRef<WebSocket | null>(null)
  const terminalWsRef = useRef<WebSocket | null>(null)

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
        console.log('[Chat] Received:', msg.type)
        console.log('[Chat] Received:', msg)

        switch (msg.type) {
          case 'state':
            // Only update to 'working' or 'ready', ignore initial 'ready' that server sends
            if (msg.state === 'working') {
              setAgentState('working')
            } else if (msg.state === 'ready') {
              setAgentState('ready')
              setCurrentTool(null)
            }
            break

          case 'tool':
            setCurrentTool({
              tool: msg.tool,
              status: msg.status,
              input: msg.input,
            })
            break

          case 'permission':
            setPermissionRequest({
              tool: msg.tool,
              input: msg.input,
              description: msg.description,
            })
            break

          case 'info':
            if (msg.workingDir) {
              setWorkingDir(msg.workingDir)
            }
            break

          case 'response':
            setMessages(prev => [...prev, {
              id: Date.now().toString(),
              text: msg.text,
              sender: 'bot',
              timestamp: new Date(),
            }])
            setAgentState('ready')
            setCurrentTool(null)
            setPermissionRequest(null)
            break

          case 'error':
            setMessages(prev => [...prev, {
              id: Date.now().toString(),
              text: `Error: ${msg.message}`,
              sender: 'bot',
              timestamp: new Date(),
            }])
            setAgentState('ready')
            setCurrentTool(null)
            setPermissionRequest(null)
            break
        }
      } catch (err) {
        console.error('[Chat] Failed to parse message:', err)
      }
    }

    ws.onclose = () => {
      console.log('[Chat] Disconnected')
      setAgentState('error')
    }

    ws.onerror = (error) => {
      console.error('[Chat] WebSocket error:', error)
      setAgentState('error')
    }

    return () => {
      ws.close()
    }
  }, [])

  // Connect to terminal WebSocket
  useEffect(() => {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:'
    const ws = new WebSocket(`${protocol}//${window.location.host}/__gekto/terminal`)
    terminalWsRef.current = ws

    ws.onopen = () => {
      console.log('[Chat] Terminal connected')
      ws.send(JSON.stringify({ type: 'resize', cols: 80, rows: 24 }))
    }

    ws.onmessage = (event) => {
      try {
        const msg = JSON.parse(event.data)
        if (msg.type === 'output') {
          setTerminalOutput(prev => prev + msg.data)
        }
      } catch {
        // Raw output
        setTerminalOutput(prev => prev + event.data)
      }
    }

    ws.onclose = () => {
      console.log('[Chat] Terminal disconnected')
    }

    return () => {
      ws.close()
    }
  }, [])

  // Process terminal output into messages
  useEffect(() => {
    if (terminalOutput) {
      // Strip ANSI codes and clean up
      const clean = terminalOutput
        .replace(/\x1b\[[0-9;]*m/g, '')
        .replace(/\x1b\[[0-9;]*[A-Za-z]/g, '')
        .replace(/\x1b\][^\x07]*\x07/g, '')
        .replace(/\r/g, '')
        .trim()

      if (clean) {
        setMessages(prev => {
          // Check if last message is a terminal response we should append to
          const last = prev[prev.length - 1]
          if (last?.isTerminal && last.sender === 'bot') {
            return [
              ...prev.slice(0, -1),
              { ...last, text: clean }
            ]
          }
          return [...prev, {
            id: Date.now().toString(),
            text: clean,
            sender: 'bot',
            timestamp: new Date(),
            isTerminal: true,
          }]
        })
        setTerminalOutput('')
        setAgentState('ready')
      }
    }
  }, [terminalOutput])

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

    setMessages(prev => [...prev, {
      id: Date.now().toString(),
      text: terminalMode ? `$ ${userMessage}` : userMessage,
      sender: 'user',
      timestamp: new Date(),
      isTerminal: terminalMode,
    }])

    setAgentState('working')

    if (terminalMode) {
      // Send to terminal
      if (terminalWsRef.current?.readyState === WebSocket.OPEN) {
        terminalWsRef.current.send(JSON.stringify({
          type: 'input',
          data: userMessage + '\r'
        }))
      }
    } else {
      // Send to agent
      if (wsRef.current?.readyState === WebSocket.OPEN) {
        wsRef.current.send(JSON.stringify({
          type: 'chat',
          content: userMessage,
        }))
      }
    }

    setInputValue('')
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  const handlePermissionResponse = (approved: boolean) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({
        type: 'permission_response',
        approved,
      }))
    }
    setPermissionRequest(null)
  }

  const getStatusText = () => {
    if (currentTool) {
      const toolName = currentTool.tool
      const input = currentTool.input ? `: ${currentTool.input}` : ''
      return `${toolName}${input}`
    }
    switch (agentState) {
      case 'working': return 'Thinking...'
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
        background: `linear-gradient(135deg, rgba(0, 0, 0, 0.85), rgba(10, 10, 15, 0.9))`,
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
                    ? `${color}66`
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
        {/* Terminal mode toggle */}
        <div className="flex items-center gap-2 mb-2">
          <button
            onClick={() => setTerminalMode(!terminalMode)}
            className={`flex items-center gap-1 px-2 py-1 rounded text-xs transition-colors ${
              terminalMode
                ? 'bg-green-600/30 text-green-400 border border-green-500/50'
                : 'bg-white/10 text-white/60 hover:text-white/80 border border-transparent'
            }`}
            title={terminalMode ? 'Switch to Chat mode' : 'Switch to Terminal mode'}
          >
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <polyline points="4 17 10 11 4 5" />
              <line x1="12" y1="19" x2="20" y2="19" />
            </svg>
            <span>{terminalMode ? 'Terminal' : 'Chat'}</span>
          </button>
        </div>

        <div className="flex gap-2">
          <input
            type="text"
            value={inputValue}
            onChange={e => setInputValue(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={
              agentState !== 'ready'
                ? 'Waiting...'
                : terminalMode
                  ? 'Enter command...'
                  : 'Type a message...'
            }
            disabled={agentState !== 'ready'}
            className={`flex-1 px-3 py-2 rounded-lg text-sm text-white placeholder-white/40 outline-none disabled:opacity-50 ${
              terminalMode ? 'font-mono' : ''
            }`}
            style={{
              background: terminalMode ? 'rgba(34, 197, 94, 0.1)' : 'rgba(255, 255, 255, 0.1)',
              border: terminalMode ? '1px solid rgba(34, 197, 94, 0.3)' : '1px solid rgba(255, 255, 255, 0.1)',
            }}
          />
          <button
            onClick={handleSend}
            disabled={agentState !== 'ready'}
            className="px-4 py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
            style={{
              background: terminalMode ? 'rgba(34, 197, 94, 0.5)' : `${color}88`,
              color: 'white',
            }}
          >
            {terminalMode ? 'Run' : 'Send'}
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
