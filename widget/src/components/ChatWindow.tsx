import { useState, useRef, useEffect, useCallback } from 'react'
import { LightningBoltIcon, FileTextIcon, StopIcon, TrashIcon } from '@radix-ui/react-icons'
import Markdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { useAgent, useAgentMessageListener, type Message } from '../context/AgentContext'
import { useSwarm } from '../context/SwarmContext'
import { useGekto } from '../context/GektoContext'

const MASTER_ID = 'master'
const CHAT_SIZE_KEY = 'gekto-chat-size'

// Default chat size
const DEFAULT_CHAT_SIZE = { width: 400, height: 500 }

// Load saved size from localStorage
export function getChatSize(): { width: number; height: number } {
  try {
    const saved = localStorage.getItem(CHAT_SIZE_KEY)
    if (saved) {
      return JSON.parse(saved)
    }
  } catch {
    // ignore
  }
  return DEFAULT_CHAT_SIZE
}

// Save size to localStorage
function saveSizeToStorage(size: { width: number; height: number }) {
  try {
    localStorage.setItem(CHAT_SIZE_KEY, JSON.stringify(size))
  } catch {
    // ignore
  }
}

type ResizeDirection = 'n' | 's' | 'e' | 'w' | 'ne' | 'nw' | 'se' | 'sw'

interface ChatWindowProps {
  lizardId: string
  title?: string
  minSize?: { width: number; height: number }
  color?: string
  onClose?: () => void
  onResize?: (size: { width: number; height: number }) => void
  inputRef?: React.RefObject<HTMLTextAreaElement | HTMLInputElement | null>
}

export function ChatWindow({
  lizardId,
  title = 'Gekto Chat',
  minSize = { width: 300, height: 350 },
  color = 'rgba(255, 255, 255, 0.5)',
  onClose,
  onResize,
  inputRef,
}: ChatWindowProps) {
  const [messages, setMessages] = useState<Message[]>([])
  const [historyLoaded, setHistoryLoaded] = useState(false)
  const [inputValue, setInputValue] = useState('')
  const [size, setSize] = useState(() => getChatSize())
  const [isResizing, setIsResizing] = useState(false)
  const [resizeDirection, setResizeDirection] = useState<ResizeDirection | null>(null)
  const [expandedTools, setExpandedTools] = useState<Set<string>>(new Set())

  const containerRef = useRef<HTMLDivElement>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const resizeStart = useRef({ x: 0, y: 0, width: 0, height: 0 })

  const {
    sendMessage,
    respondToPermission,
    sessions,
    getLizardState,
    getCurrentTool,
    getPermissionRequest,
    getQueuePosition,
    getWorkingDir,
    gektoState,
    killAgent,
  } = useAgent()

  const { getLizardName, getAllLizardNames } = useSwarm()
  const { createPlan, currentPlan, openPlanPanel, directMode, setDirectMode, markTaskInProgress } = useGekto()

  const isMaster = lizardId === MASTER_ID
  const hasActivePlan = isMaster && currentPlan && currentPlan.status !== 'completed' && currentPlan.status !== 'failed'
  const isGektoLoading = isMaster && gektoState === 'loading'

  // Subscribe to sessions to trigger re-render on state changes
  const agentState = sessions.get(lizardId)?.state ?? getLizardState(lizardId)
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
      .then((saved: Array<{
        id: string
        text: string
        sender: 'user' | 'bot'
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
      }>) => {
        if (saved && saved.length > 0) {
          setMessages(saved.map(m => ({
            ...m,
            timestamp: new Date(m.timestamp),
            toolUse: m.toolUse ? {
              ...m.toolUse,
              startTime: new Date(m.toolUse.startTime),
              endTime: m.toolUse.endTime ? new Date(m.toolUse.endTime) : undefined,
            } : undefined,
          })))
        } else {
          // Default greeting if no history
          const greeting = lizardId === MASTER_ID
            ? "Hey! I'm Gekto, your task orchestrator. I can spawn agents to build features, fix bugs, and work on your codebase in parallel. Just tell me what you need — or say \"remove all agents\" to clean up."
            : 'Hi! How can I help you today?'
          setMessages([{
            id: '1',
            text: greeting,
            sender: 'bot',
            timestamp: new Date(),
          }])
        }
        setHistoryLoaded(true)
      })
      .catch(() => {
        const greeting = lizardId === MASTER_ID
          ? "Hey! I'm Gekto, your task orchestrator. I can spawn agents to build features, fix bugs, and work on your codebase in parallel. Just tell me what you need — or say \"remove all agents\" to clean up."
          : 'Hi! How can I help you today?'
        setMessages([{
          id: '1',
          text: greeting,
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
      toolUse: m.toolUse ? {
        tool: m.toolUse.tool,
        input: m.toolUse.input,
        fullInput: m.toolUse.fullInput,
        status: m.toolUse.status,
        startTime: m.toolUse.startTime.toISOString(),
        endTime: m.toolUse.endTime?.toISOString(),
      } : undefined,
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
  const handleResizeStart = (direction: ResizeDirection) => (e: React.MouseEvent) => {
    e.stopPropagation()
    e.preventDefault()
    resizeStart.current = {
      x: e.clientX,
      y: e.clientY,
      width: size.width,
      height: size.height,
    }
    setResizeDirection(direction)
    setIsResizing(true)
  }

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (isResizing && resizeDirection) {
        const deltaX = e.clientX - resizeStart.current.x
        const deltaY = e.clientY - resizeStart.current.y

        let newWidth = resizeStart.current.width
        let newHeight = resizeStart.current.height

        // Handle horizontal resize
        if (resizeDirection.includes('e')) {
          newWidth = resizeStart.current.width + deltaX
        } else if (resizeDirection.includes('w')) {
          newWidth = resizeStart.current.width - deltaX
        }

        // Handle vertical resize
        if (resizeDirection.includes('s')) {
          newHeight = resizeStart.current.height + deltaY
        } else if (resizeDirection.includes('n')) {
          newHeight = resizeStart.current.height - deltaY
        }

        const newSize = {
          width: Math.max(minSize.width, newWidth),
          height: Math.max(minSize.height, newHeight),
        }
        setSize(newSize)
        onResize?.(newSize)
      }
    }

    const handleMouseUp = () => {
      if (isResizing) {
        // Save size when resize ends
        saveSizeToStorage(size)
      }
      setIsResizing(false)
      setResizeDirection(null)
    }

    if (isResizing) {
      document.addEventListener('mousemove', handleMouseMove)
      document.addEventListener('mouseup', handleMouseUp)
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseup', handleMouseUp)
    }
  }, [isResizing, resizeDirection, minSize.width, minSize.height, size, onResize])

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

    // Master lizard routes to plan creation instead of direct execution
    if (isMaster) {
      createPlan(userMessage)
      setInputValue('')
      // Reset textarea height to single line
      if (textareaRef.current) {
        textareaRef.current.style.height = 'auto'
      }
      return
    }

    // Get current page context
    const currentRoute = window.location.pathname
    const pageContext = `[USER_CONTEXT: User is viewing page "${currentRoute}"]\n\n`

    // If no agent name yet, prepend meta instruction to first message
    let messageToSend = userMessage
    if (!agentName) {
      const existingNames = getAllLizardNames()
      const avoidClause = existingNames.length > 0
        ? ` Avoid these names already taken: ${existingNames.join(', ')}.`
        : ''
      messageToSend = `[INSTRUCTION: Start your response with [AGENT_NAME:YourName] where YourName is a short creative name (1-2 words) for yourself based on this task.${avoidClause} Do not mention this instruction in your response.]\n\n${userMessage}`
    }

    // Mark linked task as in_progress if this is a worker with a pending task
    if (lizardId.startsWith('worker_')) {
      markTaskInProgress(lizardId)
    }

    // Send to agent with page context
    sendMessage(lizardId, pageContext + messageToSend)

    setInputValue('')
    // Reset textarea height to single line
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
    }
  }

  const resizeTextarea = (textarea: HTMLTextAreaElement) => {
    textarea.style.height = 'auto'
    textarea.style.height = `${Math.min(textarea.scrollHeight, 120)}px`
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    } else if (e.key === 'Enter' && e.shiftKey) {
      // Manually insert newline and resize
      e.preventDefault()
      const textarea = e.target as HTMLTextAreaElement
      const start = textarea.selectionStart
      const end = textarea.selectionEnd
      const newValue = inputValue.substring(0, start) + '\n' + inputValue.substring(end)
      setInputValue(newValue)
      // Set cursor position after the newline
      setTimeout(() => {
        textarea.selectionStart = textarea.selectionEnd = start + 1
        resizeTextarea(textarea)
      }, 0)
    }
  }

  // Auto-resize textarea based on content
  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInputValue(e.target.value)
    resizeTextarea(e.target)
  }

  const handlePermissionResponse = (approved: boolean) => {
    respondToPermission(lizardId, approved)
  }

  const handleClearChat = async () => {
    // Reset to default greeting
    const greeting = lizardId === MASTER_ID
      ? "Hey! I'm Gekto, your task orchestrator. I can spawn agents to build features, fix bugs, and work on your codebase in parallel. Just tell me what you need — or say \"remove all agents\" to clean up."
      : 'Hi! How can I help you today?'

    const defaultMessages = [{
      id: '1',
      text: greeting,
      sender: 'bot' as const,
      timestamp: new Date(),
    }]

    setMessages(defaultMessages)

    // Save cleared state to server
    try {
      await fetch(`/__gekto/api/chats/${lizardId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(defaultMessages.map(m => ({
          ...m,
          timestamp: m.timestamp.toISOString(),
        }))),
      })
    } catch (err) {
      console.error('[Chat] Failed to clear history:', err)
    }
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

  const toggleToolExpanded = (messageId: string) => {
    setExpandedTools(prev => {
      const next = new Set(prev)
      if (next.has(messageId)) {
        next.delete(messageId)
      } else {
        next.add(messageId)
      }
      return next
    })
  }

  const formatToolInput = (fullInput: Record<string, unknown>): string => {
    try {
      return JSON.stringify(fullInput, null, 2)
    } catch {
      return String(fullInput)
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
            {isGektoLoading ? (
              <div className="w-2 h-2 rounded-full bg-yellow-400 animate-pulse" />
            ) : agentState === 'working' ? (
              <div className="w-2 h-2 rounded-full bg-blue-400 animate-pulse" />
            ) : agentState === 'queued' ? (
              <div className="w-2 h-2 rounded-full bg-purple-400 animate-pulse" />
            ) : agentState === 'error' ? (
              <div className="w-2 h-2 rounded-full bg-red-400" />
            ) : (
              <div className="w-2 h-2 rounded-full bg-green-400" />
            )}
          </div>
        </div>
        <div className="flex items-center gap-1">
          {/* Direct Mode Toggle - only for master */}
          {isMaster && (
            <button
              onClick={() => setDirectMode(!directMode)}
              className="flex items-center gap-1 px-2 py-1 text-xs rounded transition-all"
              style={{
                background: directMode ? 'rgba(59, 130, 246, 0.3)' : 'rgba(255, 255, 255, 0.1)',
                color: directMode ? 'rgb(147, 197, 253)' : 'rgba(255, 255, 255, 0.5)',
                border: directMode ? '1px solid rgba(59, 130, 246, 0.4)' : '1px solid rgba(255, 255, 255, 0.1)',
              }}
              title={directMode ? 'Direct mode: Gekto works directly without creating plans' : 'Plan mode: Gekto creates plans with worker agents'}
            >
              <LightningBoltIcon width={12} height={12} />
              <span>{directMode ? 'Direct' : 'Plan'}</span>
            </button>
          )}
          {hasActivePlan && (
            <button
              onClick={openPlanPanel}
              className="flex items-center gap-1 px-2 py-1 text-xs rounded transition-all hover:bg-white/20 hover:border-white/30"
              style={{
                background: 'rgba(255, 255, 255, 0.1)',
                color: 'rgba(255, 255, 255, 0.7)',
                border: '1px solid rgba(255, 255, 255, 0.15)',
              }}
              title="View active plan"
            >
              <FileTextIcon width={12} height={12} />
              <span>Plan</span>
            </button>
          )}
          <button
            onClick={handleClearChat}
            className="text-white/40 hover:text-white/70 transition-colors w-6 h-6 flex items-center justify-center rounded hover:bg-white/10"
            title="Clear chat"
          >
            <TrashIcon width={14} height={14} />
          </button>
          {onClose && (
            <button
              onClick={onClose}
              className="text-white/60 hover:text-white transition-colors w-6 h-6 flex items-center justify-center rounded hover:bg-white/10"
            >
              ✕
            </button>
          )}
        </div>
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
            {/* System message - right aligned pill */}
            {message.sender === 'system' ? (
              <div
                className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs"
                style={{
                  background: message.systemData?.mode === 'plan'
                    ? 'rgba(168, 85, 247, 0.15)'
                    : 'rgba(59, 130, 246, 0.15)',
                  border: message.systemData?.mode === 'plan'
                    ? '1px solid rgba(168, 85, 247, 0.3)'
                    : '1px solid rgba(59, 130, 246, 0.3)',
                  color: message.systemData?.mode === 'plan'
                    ? 'rgb(192, 132, 252)'
                    : 'rgb(147, 197, 253)',
                }}
              >
                {message.systemData?.mode === 'plan' ? (
                  <FileTextIcon width={12} height={12} />
                ) : (
                  <LightningBoltIcon width={12} height={12} />
                )}
                <span>{message.text}</span>
              </div>
            ) : message.toolUse ? (
              /* Tool use message */
              <div
                className="max-w-[90%] rounded-lg text-sm cursor-pointer transition-all"
                style={{
                  background: 'rgba(234, 179, 8, 0.1)',
                  border: '1px solid rgba(234, 179, 8, 0.2)',
                }}
                onClick={() => message.toolUse?.fullInput && toggleToolExpanded(message.id)}
              >
                <div className="flex items-center gap-2 px-3 py-2">
                  <span className="text-yellow-400">🔧</span>
                  <span className="font-mono text-xs text-yellow-400">{message.toolUse.tool}</span>
                  {message.toolUse.input && (
                    <span className="text-white/50 text-xs truncate max-w-[200px]">
                      {message.toolUse.input}
                    </span>
                  )}
                  {message.toolUse.fullInput && (
                    <span className="text-white/30 text-xs ml-auto">
                      {expandedTools.has(message.id) ? '▼' : '▶'}
                    </span>
                  )}
                </div>
                {/* Expanded details */}
                {expandedTools.has(message.id) && message.toolUse.fullInput && (
                  <div
                    className="px-3 py-2 font-mono text-xs text-white/70 overflow-auto"
                    style={{
                      borderTop: '1px solid rgba(234, 179, 8, 0.15)',
                      maxHeight: 200,
                      background: 'rgba(0, 0, 0, 0.2)',
                    }}
                  >
                    <pre className="whitespace-pre-wrap break-all">
                      {formatToolInput(message.toolUse.fullInput)}
                    </pre>
                  </div>
                )}
              </div>
            ) : (
              /* Regular message */
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
                {message.sender === 'bot' && !message.isTerminal ? (
                  <Markdown
                    remarkPlugins={[remarkGfm]}
                    components={{
                      p: ({ children }) => <p className="mb-2 last:mb-0">{children}</p>,
                      code: ({ className, children }) => {
                        const isInline = !className
                        return isInline ? (
                          <code className="bg-white/10 px-1 py-0.5 rounded text-sm">{children}</code>
                        ) : (
                          <code className="block bg-black/30 p-2 rounded text-xs overflow-x-auto my-2">{children}</code>
                        )
                      },
                      pre: ({ children }) => <pre className="overflow-x-auto">{children}</pre>,
                      ul: ({ children }) => <ul className="list-disc list-inside mb-2">{children}</ul>,
                      ol: ({ children }) => <ol className="list-decimal list-inside mb-2">{children}</ol>,
                      li: ({ children }) => <li className="mb-1">{children}</li>,
                      a: ({ href, children }) => (
                        <a href={href} target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:underline">
                          {children}
                        </a>
                      ),
                      strong: ({ children }) => <strong className="font-semibold">{children}</strong>,
                      em: ({ children }) => <em className="italic">{children}</em>,
                      h1: ({ children }) => <h1 className="text-lg font-bold mb-2">{children}</h1>,
                      h2: ({ children }) => <h2 className="text-base font-bold mb-2">{children}</h2>,
                      h3: ({ children }) => <h3 className="text-sm font-bold mb-1">{children}</h3>,
                    }}
                  >
                    {message.text}
                  </Markdown>
                ) : (
                  <span className={message.isTerminal ? 'font-mono text-xs' : ''}>
                    {message.text}
                  </span>
                )}
              </div>
            )}
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
          <textarea
            ref={(el) => {
              textareaRef.current = el
              if (inputRef) {
                (inputRef as React.MutableRefObject<HTMLTextAreaElement | null>).current = el
              }
            }}
            value={inputValue}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            placeholder={
              agentState === 'error'
                ? 'Connection error'
                : agentState === 'queued'
                  ? 'Add to queue...'
                  : 'Type a message...'
            }
            disabled={agentState === 'error'}
            rows={1}
            className="flex-1 px-3 py-2 rounded-lg text-sm text-white placeholder-white/40 outline-none disabled:opacity-50 resize-none"
            style={{
              background: 'rgba(255, 255, 255, 0.1)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              minHeight: '36px',
              maxHeight: '120px',
              overflow: 'auto',
            }}
          />
          {agentState === 'working' ? (
            <button
              onClick={() => killAgent(lizardId)}
              className="px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
              style={{
                background: 'rgba(239, 68, 68, 0.7)',
                color: 'white',
              }}
            >
              <StopIcon width={14} height={14} />
              Stop
            </button>
          ) : (
            <button
              onClick={handleSend}
              disabled={agentState === 'error'}
              className="px-4 py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-50 focus:outline-none"
              style={{
                background: 'transparent',
                color: 'white',
                border: 'none',
                outline: 'none',
              }}
            >
              {agentState === 'queued' ? 'Queue' : 'Send'}
            </button>
          )}
        </div>
        {workingDir && (
          <div className="mt-2 text-white/30 text-xs font-mono truncate" title={workingDir}>
            {workingDir}
          </div>
        )}
      </div>

      {/* Resize handles */}
      {/* Corners */}
      <div
        className="absolute bottom-0 right-0 w-4 h-4 cursor-se-resize"
        style={{
          background: `linear-gradient(135deg, transparent 50%, ${color}44 50%)`,
          borderRadius: '0 0 16px 0',
        }}
        onMouseDown={handleResizeStart('se')}
      />
      <div
        className="absolute top-0 right-0 w-3 h-3 cursor-ne-resize"
        style={{ borderRadius: '0 16px 0 0' }}
        onMouseDown={handleResizeStart('ne')}
      />
      <div
        className="absolute top-0 left-0 w-3 h-3 cursor-nw-resize"
        style={{ borderRadius: '16px 0 0 0' }}
        onMouseDown={handleResizeStart('nw')}
      />
      <div
        className="absolute bottom-0 left-0 w-3 h-3 cursor-sw-resize"
        style={{ borderRadius: '0 0 0 16px' }}
        onMouseDown={handleResizeStart('sw')}
      />
      {/* Edges */}
      <div
        className="absolute top-3 bottom-3 right-0 w-1 cursor-e-resize hover:bg-white/10"
        onMouseDown={handleResizeStart('e')}
      />
      <div
        className="absolute top-3 bottom-3 left-0 w-1 cursor-w-resize hover:bg-white/10"
        onMouseDown={handleResizeStart('w')}
      />
      <div
        className="absolute left-3 right-3 top-0 h-1 cursor-n-resize hover:bg-white/10"
        onMouseDown={handleResizeStart('n')}
      />
      <div
        className="absolute left-3 right-3 bottom-0 h-1 cursor-s-resize hover:bg-white/10"
        onMouseDown={handleResizeStart('s')}
      />
    </div>
  )
}
