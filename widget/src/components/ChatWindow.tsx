import { useState, useRef, useEffect, useCallback } from 'react'
import { LightningBoltIcon, FileTextIcon, StopIcon, TrashIcon } from '@radix-ui/react-icons'
import Markdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { useAgent, useAgentMessageListener, type Message } from '../context/AgentContext'
import { useGekto } from '../context/GektoContext'
import { useStore } from '../store/store'

const MASTER_ID = 'master'
const CHAT_SIZE_KEY = 'gekto-chat-size'

const PLANNING_PHRASES = [
  'Creating plan...',
  'Researching...',
  'Analyzing codebase...',
  'Measuring complexity...',
  'Gektoing...',
  'Splitting into tasks...',
  'Thinking hard...',
  'Cooking up a plan...',
]

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

  const { createPlan, currentPlan, openPlanPanel, cancelPlan, markTaskInProgress } = useGekto()

  // Get agent/task names from global store
  const agents = useStore((s) => s.agents)
  const tasks = useStore((s) => s.tasks)
  const agent = agents[lizardId]
  const task = agent?.taskId ? tasks[agent.taskId] : undefined
  const agentName = task?.name

  const isMaster = lizardId === MASTER_ID
  const hasActivePlan = isMaster && currentPlan && currentPlan.status !== 'completed' && currentPlan.status !== 'failed'
  const isGektoLoading = isMaster && gektoState === 'loading'

  // Rotating planning phrases for master
  const [planningPhraseIndex, setPlanningPhraseIndex] = useState(0)
  const isMasterWorking = isMaster && (sessions.get(lizardId)?.state ?? getLizardState(lizardId)) === 'working'

  useEffect(() => {
    if (!isMasterWorking) {
      setPlanningPhraseIndex(0)
      return
    }
    const interval = setInterval(() => {
      setPlanningPhraseIndex(i => (i + 1) % PLANNING_PHRASES.length)
    }, 3000)
    return () => clearInterval(interval)
  }, [isMasterWorking])

  // Subscribe to sessions to trigger re-render on state changes
  const agentState = sessions.get(lizardId)?.state ?? getLizardState(lizardId)
  const currentTool = getCurrentTool(lizardId)
  const permissionRequest = getPermissionRequest(lizardId)
  const queuePosition = getQueuePosition(lizardId)
  const workingDir = getWorkingDir()

  // Handle incoming messages from agent (name extraction is done in AgentContext)
  const handleAgentMessage = useCallback((message: Message & { isStreaming?: boolean }) => {
    if (message.isStreaming) {
      // Streaming message: replace existing streaming entry or append
      setMessages(prev => {
        const idx = prev.findIndex(m => m.id === message.id)
        if (idx >= 0) {
          const updated = [...prev]
          updated[idx] = message
          return updated
        }
        return [...prev, message]
      })
    } else {
      // Final message: remove any streaming placeholder, then append
      setMessages(prev => [...prev.filter(m => m.id !== 'gekto_streaming'), message])
    }
  }, [])

  // Register as message listener
  useAgentMessageListener(lizardId, handleAgentMessage)

  // Load chat history on mount - from task.chatHistory if available, else REST API
  useEffect(() => {
    const greeting = lizardId === MASTER_ID
      ? "Hey! I'm Gekto, your task orchestrator. I can spawn agents to build features, fix bugs, and work on your codebase in parallel. Just tell me what you need — or say \"remove all agents\" to clean up."
      : 'Hi! How can I help you today?'

    // For agents with tasks, use task.chatHistory from store
    if (task?.chatHistory && task.chatHistory.length > 0) {
      setMessages(task.chatHistory)
      setHistoryLoaded(true)
      return
    }

    // Fall back to REST API (for master or agents without tasks)
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
        setMessages([{
          id: '1',
          text: greeting,
          sender: 'bot',
          timestamp: new Date(),
        }])
        setHistoryLoaded(true)
      })
  }, [lizardId, task])

  // Save chat history when messages change (only for master/agents without tasks)
  // Agents with tasks use store persistence via AgentContext
  useEffect(() => {
    if (!historyLoaded || messages.length === 0) return
    // Skip REST API save if using store (agent has task)
    if (agent?.taskId) return

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
  }, [messages, lizardId, historyLoaded, agent?.taskId])

  // Auto-scroll to bottom on new messages or state changes (instant on initial load, smooth after)
  const hasScrolledInitially = useRef(false)
  useEffect(() => {
    if (!historyLoaded) return
    const behavior = hasScrolledInitially.current ? 'smooth' : 'instant'
    messagesEndRef.current?.scrollIntoView({ behavior })
    hasScrolledInitially.current = true
  }, [messages, historyLoaded, agentState])

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
      // Get all existing task names to avoid duplicates
      const existingNames = Object.values(tasks)
        .map(t => t.name)
        .filter((name): name is string => !!name)
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
    // Stop propagation for all keys to prevent tldraw from capturing them
    e.stopPropagation()

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
      case 'working': return isMaster ? PLANNING_PHRASES[planningPhraseIndex] : 'Thinking...'
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
        borderRadius: '8px',
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
          <div className="flex items-baseline gap-2">
            <span className="text-white font-medium text-sm">{title}</span>
            <span className="text-xs text-white/30">
              {isGektoLoading ? 'preparing gekto' : agentState === 'working' ? 'working' : agentState === 'queued' ? 'queued' : agentState === 'error' ? 'error' : 'ready'}
            </span>
          </div>
        </div>
        <div className="flex items-center gap-1">
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
        {(() => {
          // Group consecutive tool messages by tool name
          const grouped: { type: 'message', message: typeof messages[0] }[] | { type: 'tool-group', tool: string, count: number, ids: string[], messages: typeof messages }[] = []
          const result: Array<{ type: 'message', message: typeof messages[0] } | { type: 'tool-group', tool: string, count: number, ids: string[], messages: typeof messages }> = []
          for (const msg of messages) {
            if (msg.toolUse) {
              const last = result[result.length - 1]
              if (last && last.type === 'tool-group' && last.tool === msg.toolUse.tool) {
                last.count++
                last.ids.push(msg.id)
                last.messages.push(msg)
              } else {
                result.push({ type: 'tool-group', tool: msg.toolUse.tool, count: 1, ids: [msg.id], messages: [msg] })
              }
            } else {
              result.push({ type: 'message', message: msg })
            }
          }
          return result.map((item, idx) => {
            if (item.type === 'tool-group') {
              const toolLabel = item.count > 1 ? `${item.tool} ×${item.count}` : item.tool
              const groupId = item.ids[0]
              const isLast = idx === result.length - 1
              const isRunning = isLast && agentState === 'working' && !!currentTool && currentTool.tool === item.tool
              return (
                <div key={groupId} className="flex justify-start">
                  <div
                    className="max-w-[90%] text-sm cursor-pointer transition-all"
                    onClick={() => toggleToolExpanded(groupId)}
                  >
                    <div className="flex items-center gap-2 py-1">
                      <span
                        style={{
                          color: '#4ade80',
                          fontSize: '8px',
                          animation: isRunning ? 'blink-triangle 1.2s ease-in-out infinite' : 'none',
                        }}
                      >
                        ◆
                      </span>
                      <span className={`${isRunning ? 'tool-call-text' : ''} font-mono text-xs`} style={!isRunning ? { color: 'rgba(255, 255, 255, 0.5)' } : undefined}>{toolLabel}</span>
                      <span className="text-white/30 text-xs ml-auto">
                        {expandedTools.has(groupId) ? '▼' : '▶'}
                      </span>
                    </div>
                    {expandedTools.has(groupId) && (
                      <div
                        className="px-3 py-2 font-mono text-xs text-white/70 overflow-auto rounded-lg ml-4 space-y-1"
                        style={{
                          maxHeight: 200,
                          background: 'rgba(0, 0, 0, 0.2)',
                        }}
                      >
                        {item.messages.map(m => (
                          <pre key={m.id} className="whitespace-pre-wrap break-all">
                            {m.toolUse?.fullInput ? formatToolInput(m.toolUse.fullInput) : m.toolUse?.input || m.toolUse?.tool}
                          </pre>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )
            }
            const message = item.message
            return (
          <div
            key={message.id}
            className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            {/* System message */}
            {message.sender === 'system' ? (
              <div className="flex items-center gap-2 py-1">
                <span style={{ color: '#4ade80', fontSize: '8px' }}>◆</span>
                <span className="font-mono text-xs" style={{ color: 'rgba(134, 239, 172, 0.6)' }}>{message.text}</span>
              </div>
            ) : (
              /* Regular message */
              <div
                className="max-w-[90%] px-3 py-2 rounded-xl text-sm whitespace-pre-wrap"
                style={{
                  background: message.isTerminal
                    ? 'rgba(34, 197, 94, 0.15)'
                    : message.sender === 'user'
                      ? 'rgba(255, 255, 255, 0.08)'
                      : 'transparent',
                  color: message.sender === 'user' ? 'rgba(255, 255, 255, 0.7)' : 'rgba(255, 255, 255, 0.8)',
                  border: message.isTerminal
                    ? '1px solid rgba(34, 197, 94, 0.3)'
                    : message.sender === 'user'
                      ? '1px solid rgba(255, 255, 255, 0.1)'
                      : 'none',
                  padding: message.sender === 'bot' && !message.isTerminal ? '0' : undefined,
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
                      p: ({ children }) => <p className="mb-1 last:mb-0 leading-tight">{children}</p>,
                      code: ({ className, children }) => {
                        const isInline = !className
                        return isInline ? (
                          <code className="bg-white/10 px-1 py-0.5 rounded text-sm">{children}</code>
                        ) : (
                          <code className="block bg-black/30 p-2 rounded text-xs overflow-x-auto my-1">{children}</code>
                        )
                      },
                      pre: ({ children }) => <pre className="overflow-x-auto">{children}</pre>,
                      ul: ({ children }) => <ul className="list-disc list-inside mb-1">{children}</ul>,
                      ol: ({ children }) => <ol className="list-decimal list-inside mb-1">{children}</ol>,
                      li: ({ children }) => <li className="leading-tight">{children}</li>,
                      a: ({ href, children }) => (
                        <a href={href} target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:underline">
                          {children}
                        </a>
                      ),
                      strong: ({ children }) => <strong className="font-semibold">{children}</strong>,
                      em: ({ children }) => <em className="italic">{children}</em>,
                      h1: ({ children }) => <h1 className="text-sm font-semibold mb-0.5">{children}</h1>,
                      h2: ({ children }) => <h2 className="text-sm font-semibold mb-0.5">{children}</h2>,
                      h3: ({ children }) => <h3 className="text-sm font-semibold mb-0.5">{children}</h3>,
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
          )})
        })()}

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

        {agentState === 'working' && !permissionRequest && !currentTool && (
          <div className="flex justify-start">
            <div className="flex items-center gap-2 py-1">
              <span style={{ color: '#4ade80', fontSize: '8px', animation: 'blink-triangle 1.2s ease-in-out infinite' }}>◆</span>
              <span className="tool-call-text font-mono text-xs">
                {isMaster ? PLANNING_PHRASES[planningPhraseIndex] : (
                  <span className="inline-flex gap-1">
                    <span className="animate-bounce">.</span>
                    <span className="animate-bounce" style={{ animationDelay: '0.1s' }}>.</span>
                    <span className="animate-bounce" style={{ animationDelay: '0.2s' }}>.</span>
                  </span>
                )}
              </span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div
        className="chat-input"
        style={{
          borderTop: '1px solid rgba(255, 255, 255, 0.1)',
        }}
      >
        <div
          className="rounded-b-[8px]"
          style={{
            background: 'rgba(255, 255, 255, 0.08)',
            border: '1px solid rgba(255, 255, 255, 0.12)',
          }}
        >
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
            onPaste={(e) => e.stopPropagation()}
            onCopy={(e) => e.stopPropagation()}
            onCut={(e) => e.stopPropagation()}
            placeholder={
              agentState === 'error'
                ? 'Connection error'
                : agentState === 'queued'
                  ? 'Add to queue...'
                  : 'Type a message...'
            }
            disabled={agentState === 'error'}
            rows={1}
            className="w-full px-3.5 pt-3 pb-1 text-sm text-white placeholder-white/40 outline-none disabled:opacity-50 resize-none"
            style={{
              background: 'transparent',
              border: 'none',
              minHeight: '36px',
              maxHeight: '120px',
              overflow: 'auto',
            }}
          />
          <div className="flex items-center justify-between px-2 pb-2">
            <div className="flex items-center gap-1">
              <button
                onClick={openPlanPanel}
                disabled={!hasActivePlan}
                className="flex items-center gap-1 px-2 py-1 text-xs rounded transition-all hover:bg-white/20 hover:border-white/30 disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:bg-transparent"
                style={{
                  background: 'rgba(255, 255, 255, 0.1)',
                  color: 'rgba(255, 255, 255, 0.7)',
                  border: '1px solid rgba(255, 255, 255, 0.15)',
                }}
                title={hasActivePlan ? 'View active plan' : 'No active plan'}
              >
                <FileTextIcon width={12} height={12} />
                <span>Plan</span>
              </button>
              {hasActivePlan && (
                <button
                  onClick={cancelPlan}
                  className="flex items-center justify-center w-5 h-5 text-xs rounded transition-all hover:text-white/70"
                  style={{
                    background: 'transparent',
                    color: 'rgba(255, 255, 255, 0.3)',
                    border: 'none',
                  }}
                  title="Cancel plan"
                >
                  ✕
                </button>
              )}
            </div>
            <div className="flex items-center gap-0.5">
              {agentState === 'working' ? (
                <button
                  onClick={() => killAgent(lizardId)}
                  className="flex items-center gap-1 px-2 py-1 text-xs rounded transition-all hover:bg-red-500/30"
                  style={{
                    background: 'rgba(239, 68, 68, 0.15)',
                    color: 'rgba(239, 68, 68, 0.8)',
                    border: '1px solid rgba(239, 68, 68, 0.3)',
                  }}
                >
                  <svg width="8" height="8" viewBox="0 0 8 8" fill="currentColor"><rect width="8" height="8" rx="1" /></svg>
                  <span>Stop</span>
                </button>
              ) : (
                <button
                  onClick={handleSend}
                  disabled={agentState === 'error'}
                  className="p-1.5 rounded-full text-white/50 hover:text-white transition-colors disabled:opacity-50 focus:outline-none"
                  style={{
                    background: 'rgba(255, 255, 255, 0.1)',
                    border: '1px solid rgba(255, 255, 255, 0.15)',
                  }}
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M12 19V5M5 12l7-7 7 7" />
                  </svg>
                </button>
              )}
            </div>
          </div>
        </div>
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
