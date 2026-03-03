import { useState, useRef, useEffect, useCallback, type DragEvent } from 'react'
import { FileTextIcon, TrashIcon, ImageIcon, CounterClockwiseClockIcon, Cross2Icon, PlusIcon } from '@radix-ui/react-icons'
import Markdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { useAgent, useAgentMessageListener, type Message } from '../context/AgentContext'
import { useGekto } from '../context/GektoContext'
import { useStore } from '../store/store'
import { useServerState, getServerState, type GektoSession } from '../hooks/useServerState'

const MASTER_ID = 'master'
const CHAT_SIZE_KEY = 'gekto-chat-size'

const AGENT_PHRASES = [
  'Hacking...',
  'Swarming...',
  'Gektoing...',
  'Crawling...',
  'Shedding...',
  'Scaling...',
  'Slithering...',
  'Chomping...',
  'Molting...',
  'Debugging...',
  'Spawning...',
]

const THINKING_PHRASES = [
  'Thinking...',
  'Gektoing...',
  'Swirling...',
  'Analyzing...',
  'Lizarding...',
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
  onHeaderMouseDown?: (e: React.MouseEvent) => void
}

export function ChatWindow({
  lizardId,
  title = 'Gekto Chat',
  minSize = { width: 300, height: 350 },
  color = 'rgba(255, 255, 255, 0.5)',
  onClose,
  onResize,
  inputRef,
  onHeaderMouseDown,
}: ChatWindowProps) {
  const [messages, setMessages] = useState<Message[]>([])
  const [historyLoaded, setHistoryLoaded] = useState(false)
  const [inputValue, setInputValue] = useState('')
  const [size, setSize] = useState(() => getChatSize())
  const [isResizing, setIsResizing] = useState(false)
  const [resizeDirection, setResizeDirection] = useState<ResizeDirection | null>(null)
  const [expandedTools, setExpandedTools] = useState<Set<string>>(new Set())
  const [stagedImages, setStagedImages] = useState<string[]>([])
  const [isDraggingOver, setIsDraggingOver] = useState(false)
  const [showSessionHistory, setShowSessionHistory] = useState(false)
  const [isRestoredSession, setIsRestoredSession] = useState(false)

  const containerRef = useRef<HTMLDivElement>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const historyDropdownRef = useRef<HTMLDivElement>(null)
  const resizeStart = useRef({ x: 0, y: 0, width: 0, height: 0 })

  const {
    sendMessage,
    respondToPermission,
    sessions,
    getLizardState,
    getCurrentTool,
    getPermissionRequest,
    gektoState,
    killAgent,
    resetAgent,
  } = useAgent()

  const { createPlan, currentPlan, openPlanPanel, cancelPlan, markTaskInProgress } = useGekto()
  const { state: serverState, send: sendToServer } = useServerState()
  const gektoSessions = serverState.gektoSessions || []

  // Get agent/task names from global store
  const agents = useStore((s) => s.agents)
  const tasks = useStore((s) => s.tasks)
  const agent = agents[lizardId]
  const task = agent?.taskId ? tasks[agent.taskId] : undefined
  const agentName = task?.name

  // Close history dropdown on click outside
  useEffect(() => {
    if (!showSessionHistory) return
    const handler = (e: MouseEvent) => {
      if (historyDropdownRef.current && !historyDropdownRef.current.contains(e.target as Node)) {
        setShowSessionHistory(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [showSessionHistory])

  const isMaster = lizardId === MASTER_ID
  const hasActivePlan = isMaster && currentPlan && currentPlan.status !== 'completed' && currentPlan.status !== 'failed' && currentPlan.status !== 'planning'
  const isGektoLoading = isMaster && gektoState === 'loading'

  // Rotating thinking phrases for master
  const [masterPhraseIndex, setMasterPhraseIndex] = useState(0)
  const isMasterWorking = isMaster && (sessions.get(lizardId)?.state ?? getLizardState(lizardId)) === 'working'

  useEffect(() => {
    if (!isMasterWorking) {
      setMasterPhraseIndex(0)
      return
    }
    const interval = setInterval(() => {
      setMasterPhraseIndex(() => {
        return 1 + Math.floor(Math.random() * (THINKING_PHRASES.length - 1))
      })
    }, 3000)
    return () => clearInterval(interval)
  }, [isMasterWorking])

  // Rotating phrases for regular agents
  const [agentPhraseIndex, setAgentPhraseIndex] = useState(0)
  const isAgentWorking = !isMaster && (sessions.get(lizardId)?.state ?? getLizardState(lizardId)) === 'working'

  useEffect(() => {
    if (!isAgentWorking) {
      setAgentPhraseIndex(0)
      return
    }
    const interval = setInterval(() => {
      setAgentPhraseIndex(() => Math.floor(Math.random() * AGENT_PHRASES.length))
    }, 2000)
    return () => clearInterval(interval)
  }, [isAgentWorking])


  // Subscribe to sessions to trigger re-render on state changes
  const agentState = sessions.get(lizardId)?.state ?? getLizardState(lizardId)
  const currentTool = getCurrentTool(lizardId)
  const permissionRequest = getPermissionRequest(lizardId)



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
    } else if (message.toolUse) {
      // Tool message: just append, keep streaming text visible
      setMessages(prev => [...prev, message])
    } else {
      // Final response: remove streaming placeholders, then append
      setMessages(prev => [...prev.filter(m => !m.id.startsWith('streaming_') && m.id !== 'gekto_streaming'), message])
    }
  }, [])

  // Register as message listener
  useAgentMessageListener(lizardId, handleAgentMessage)

  // Load chat history on mount - from server state chats
  useEffect(() => {
    if (historyLoaded) return

    const greeting = lizardId === MASTER_ID
      ? `**Hey, I'm Gekto** — your project manager.\n\nI research the codebase, break your request into parallel tasks, and spawn agents to execute them.`
      : 'Hi! How can I help you today?'

    // Chat history is now stored in server state under chats[chatKey]
    const chatKey = agent?.taskId || lizardId
    const state = getServerState()
    const saved = state.chats[chatKey]

    if (saved && saved.length > 0) {
      setMessages(saved.map(m => ({
        ...m,
        timestamp: typeof m.timestamp === 'string' ? new Date(m.timestamp) : m.timestamp,
        toolUse: m.toolUse ? {
          ...m.toolUse,
          startTime: typeof m.toolUse.startTime === 'string' ? new Date(m.toolUse.startTime) : m.toolUse.startTime,
          endTime: m.toolUse.endTime
            ? (typeof m.toolUse.endTime === 'string' ? new Date(m.toolUse.endTime) : m.toolUse.endTime)
            : undefined,
        } : undefined,
      })) as Message[])
      setHistoryLoaded(true)
    } else {
      setMessages([{
        id: '1',
        text: greeting,
        sender: 'bot',
        timestamp: new Date(),
      }])
      setHistoryLoaded(true)
    }
  }, [lizardId, agent, historyLoaded])

  // Save chat history when messages change (for master/agents without tasks)
  // Chat messages for agents with tasks are saved via AgentContext
  useEffect(() => {
    if (!historyLoaded || messages.length === 0) return
    // Skip if agent has a task (saved by AgentContext)
    if (agent?.taskId) return

    const toIso = (v: Date | string): string => v instanceof Date ? v.toISOString() : String(v)
    const toSave = messages.map(m => ({
      id: m.id,
      text: m.text,
      sender: m.sender,
      timestamp: toIso(m.timestamp),
      isTerminal: m.isTerminal,
      images: m.images,
      toolUse: m.toolUse ? {
        tool: m.toolUse.tool,
        input: m.toolUse.input,
        fullInput: m.toolUse.fullInput,
        status: m.toolUse.status,
        startTime: toIso(m.toolUse.startTime),
        endTime: m.toolUse.endTime ? toIso(m.toolUse.endTime) : undefined,
      } : undefined,
    }))

    // Save to server via WS
    const ws = (window as unknown as { __gektoWebSocket?: WebSocket }).__gektoWebSocket
    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({
        type: 'save_chat',
        agentId: lizardId,
        messages: toSave,
      }))
    }
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
    if ((!inputValue.trim() && stagedImages.length === 0) || agentState === 'error') return

    const userMessage = inputValue.trim()
    const imagesToSend = stagedImages.length > 0 ? [...stagedImages] : undefined

    // Add user message to local state
    const newMessage: Message = {
      id: Date.now().toString(),
      text: userMessage || '(image)',
      sender: 'user',
      timestamp: new Date(),
      images: imagesToSend,
    }
    setMessages(prev => [...prev, newMessage])

    // Clear staged images
    setStagedImages([])

    // Master lizard routes to plan creation instead of direct execution
    if (isMaster) {
      createPlan(userMessage, imagesToSend)
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
    let messageToSend = userMessage || '(see attached images)'
    if (!agentName) {
      // Get all existing task names to avoid duplicates
      const existingNames = Object.values(tasks)
        .map(t => t.name)
        .filter((name): name is string => !!name)
      const avoidClause = existingNames.length > 0
        ? ` Avoid these names already taken: ${existingNames.join(', ')}.`
        : ''
      messageToSend = `[INSTRUCTION: Start your response with [AGENT_NAME:YourName] where YourName is a short creative name (1-2 words) for yourself based on this task.${avoidClause} Do not mention this instruction in your response.]\n\n${messageToSend}`
    }

    // Mark linked task as in_progress if this is a worker with a pending task
    if (lizardId.startsWith('worker_')) {
      markTaskInProgress(lizardId)
    }

    // Send to agent with page context (and optional images)
    sendMessage(lizardId, pageContext + messageToSend, imagesToSend)

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
    } else if (e.key === 'Escape') {
      e.preventDefault()
      if (onClose) onClose()
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

  // --- Image attachment helpers ---
  const readFileAsDataUrl = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = () => resolve(reader.result as string)
      reader.onerror = reject
      reader.readAsDataURL(file)
    })
  }

  const addImageFiles = async (files: FileList | File[]) => {
    const imageFiles = Array.from(files).filter(f => f.type.startsWith('image/'))
    if (imageFiles.length === 0) return
    const dataUrls = await Promise.all(imageFiles.map(readFileAsDataUrl))
    setStagedImages(prev => [...prev, ...dataUrls])
  }

  const handlePaste = async (e: React.ClipboardEvent) => {
    e.stopPropagation()
    const items = e.clipboardData?.items
    if (!items) return
    const imageItems = Array.from(items).filter(item => item.type.startsWith('image/'))
    if (imageItems.length === 0) return
    e.preventDefault()
    const files = imageItems.map(item => item.getAsFile()).filter((f): f is File => f !== null)
    await addImageFiles(files)
  }

  const handleDragOver = (e: DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDraggingOver(true)
  }

  const handleDragLeave = (e: DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDraggingOver(false)
  }

  const handleDrop = async (e: DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDraggingOver(false)
    if (e.dataTransfer?.files) {
      await addImageFiles(e.dataTransfer.files)
    }
  }

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      await addImageFiles(e.target.files)
    }
    e.target.value = ''
  }

  const removeStagedImage = (index: number) => {
    setStagedImages(prev => prev.filter((_, i) => i !== index))
  }

  const handlePermissionResponse = (approved: boolean) => {
    respondToPermission(lizardId, approved)
  }

  const handleClearChat = async () => {
    // Archive current session before clearing (only for master with user messages beyond greeting)
    // Skip archiving if this is a restored session (already archived)
    if (isMaster && !isRestoredSession) {
      const hasUserContent = messages.some(m => m.sender === 'user')
      if (hasUserContent) {
        const toIso = (v: Date | string): string => v instanceof Date ? v.toISOString() : String(v)
        const archiveMessages = messages.map(m => ({
          id: m.id,
          text: m.text,
          sender: m.sender,
          timestamp: toIso(m.timestamp),
          isTerminal: m.isTerminal,
          images: m.images,
          toolUse: m.toolUse ? {
            tool: m.toolUse.tool,
            input: m.toolUse.input,
            fullInput: m.toolUse.fullInput,
            status: m.toolUse.status,
            startTime: toIso(m.toolUse.startTime),
            endTime: m.toolUse.endTime ? toIso(m.toolUse.endTime) : undefined,
          } : undefined,
        }))

        const ws = (window as unknown as { __gektoWebSocket?: WebSocket }).__gektoWebSocket
        if (ws && ws.readyState === WebSocket.OPEN) {
          ws.send(JSON.stringify({
            type: 'archive_gekto_session',
            messages: archiveMessages,
            plan: currentPlan,
          }))
        }
      }
    }

    // Reset to default greeting
    const greeting = lizardId === MASTER_ID
      ? `**Hey, I'm Gekto** — your project manager.\n\nI research the codebase, break your request into parallel tasks, and spawn agents to execute them.`
      : 'Hi! How can I help you today?'

    const defaultMessages = [{
      id: '1',
      text: greeting,
      sender: 'bot' as const,
      timestamp: new Date(),
    }]

    setMessages(defaultMessages)

    // Reset the server-side session (clears Claude conversation history)
    resetAgent(lizardId)
    setIsRestoredSession(false)

    // Save cleared state to server via WS
    const ws = (window as unknown as { __gektoWebSocket?: WebSocket }).__gektoWebSocket
    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({
        type: 'save_chat',
        agentId: lizardId,
        messages: defaultMessages.map(m => ({
          ...m,
          timestamp: m.timestamp instanceof Date ? m.timestamp.toISOString() : String(m.timestamp),
        })),
      }))
    }
  }

  const handleRestoreSession = (sessionId: string) => {
    // Find session locally and set messages directly (avoids race with server diff)
    const session = gektoSessions.find(s => s.id === sessionId)
    if (session) {
      setMessages(session.messages.map(m => ({
        ...m,
        timestamp: typeof m.timestamp === 'string' ? new Date(m.timestamp) : m.timestamp,
        toolUse: m.toolUse ? {
          ...m.toolUse,
          startTime: typeof m.toolUse.startTime === 'string' ? new Date(m.toolUse.startTime) : m.toolUse.startTime,
          endTime: m.toolUse.endTime
            ? (typeof m.toolUse.endTime === 'string' ? new Date(m.toolUse.endTime) : m.toolUse.endTime)
            : undefined,
        } : undefined,
      })) as Message[])
    }
    // Tell server to restore plan + switch Claude session ID
    sendToServer({ type: 'restore_gekto_session', sessionId })
    setIsRestoredSession(true)
    setShowSessionHistory(false)
  }

  const handleDeleteSession = (e: React.MouseEvent, sessionId: string) => {
    e.stopPropagation()
    sendToServer({ type: 'delete_gekto_session', sessionId })
  }

  const formatTimeAgo = (isoDate: string): string => {
    const now = Date.now()
    const then = new Date(isoDate).getTime()
    const diffMs = now - then
    const diffMin = Math.floor(diffMs / 60000)
    if (diffMin < 1) return 'just now'
    if (diffMin < 60) return `${diffMin}m ago`
    const diffHr = Math.floor(diffMin / 60)
    if (diffHr < 24) return `${diffHr}h ago`
    const diffDay = Math.floor(diffHr / 24)
    if (diffDay < 30) return `${diffDay}d ago`
    return new Date(isoDate).toLocaleDateString()
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
        border: '1px solid rgba(255, 255, 255, 0.08)',
        borderRadius: 8,
      }}
    >
      {/* Header */}
      <div
        className="flex items-center justify-between px-4 py-3"
        style={{
          borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
          cursor: onHeaderMouseDown ? 'grab' : undefined,
        }}
        onMouseDown={onHeaderMouseDown}
      >
        <div className="flex flex-col">
          <div className="flex items-baseline gap-2">
            <span className="text-white font-medium text-sm">{title}</span>
            <span className="text-xs text-white/30">
              {agentState === 'working' ? 'thinking' : agentState === 'queued' ? 'queued' : agentState === 'error' ? 'error' : (isGektoLoading && agentState !== 'ready') ? 'preparing' : ''}
            </span>
          </div>
        </div>
        <div className="flex items-center gap-1" onMouseDown={(e) => e.stopPropagation()}>
          {isMaster && (
            <div className="relative" ref={historyDropdownRef}>
              <button
                onClick={() => setShowSessionHistory(prev => !prev)}
                className="text-white/40 hover:text-white/70 transition-colors w-6 h-6 flex items-center justify-center hover:bg-white/10 rounded"
                title="Session history"
              >
                <CounterClockwiseClockIcon width={14} height={14} />
              </button>
              {showSessionHistory && (
                <div
                  className="absolute right-0 top-8 z-50 overflow-hidden"
                  style={{
                    width: 280,
                    maxHeight: 320,
                    background: 'rgb(35, 35, 45)',
                    border: '1px solid rgba(255, 255, 255, 0.12)',
                    borderRadius: 8,
                    boxShadow: '0 8px 32px rgba(0, 0, 0, 0.5)',
                  }}
                >
                  <div className="px-3 py-2 text-xs text-white/50 font-medium" style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.08)' }}>
                    Session History
                  </div>
                  <div style={{ maxHeight: 280, overflowY: 'auto' }}>
                    <div
                      className="flex items-center gap-2 px-3 py-2 cursor-pointer hover:bg-white/5 transition-colors"
                      onClick={() => { setShowSessionHistory(false); handleClearChat() }}
                      style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.08)' }}
                    >
                      <PlusIcon width={12} height={12} className="text-white/50" />
                      <span className="text-xs text-white/70">New chat</span>
                    </div>
                    {gektoSessions.length === 0 ? (
                      <div className="px-3 py-4 text-xs text-white/30 text-center">
                        No past sessions
                      </div>
                    ) : (
                      gektoSessions.map((session: GektoSession) => (
                        <div
                          key={session.id}
                          className="flex items-center gap-2 px-3 py-2 cursor-pointer hover:bg-white/5 transition-colors group"
                          onClick={() => handleRestoreSession(session.id)}
                        >
                          <div className="flex-1 min-w-0">
                            <div className="text-xs text-white/70 truncate">{session.title}</div>
                            <div className="text-[10px] text-white/30">{formatTimeAgo(session.createdAt)}</div>
                          </div>
                          <button
                            onClick={(e) => handleDeleteSession(e, session.id)}
                            className="flex-shrink-0 text-white/20 hover:text-red-400 transition-colors opacity-0 group-hover:opacity-100 w-5 h-5 flex items-center justify-center"
                            title="Delete session"
                          >
                            <Cross2Icon width={10} height={10} />
                          </button>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
          <button
            onClick={handleClearChat}
            className="text-white/40 hover:text-white/70 transition-colors w-6 h-6 flex items-center justify-center hover:bg-white/10 rounded"
            title="Clear chat"
          >
            <TrashIcon width={14} height={14} />
          </button>
          {onClose && (
            <button
              onClick={onClose}
              className="text-white/60 hover:text-white transition-colors w-6 h-6 flex items-center justify-center hover:bg-white/10 rounded"
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
                          background: 'linear-gradient(135deg, #4ade80, #22c55e)',
                          WebkitBackgroundClip: 'text',
                          WebkitTextFillColor: 'transparent',
                          fontSize: '14px',
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
                <span style={{ color: '#4ade80', fontSize: '14px' }}>◆</span>
                <span className="font-mono text-xs" style={{ color: 'rgba(134, 239, 172, 0.6)' }}>{message.text}</span>
              </div>
            ) : (
              /* Regular message */
              <div
                className={`max-w-[90%] px-3 py-2 text-sm whitespace-pre-wrap ${message.sender === 'user' ? 'rounded-lg rounded-br-none rounded-bl-2xl' : 'rounded-xl'}`}
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
                      ? '1px solid rgba(134, 239, 172, 0.08)'
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
                {message.images && message.images.length > 0 && (
                  <div className="flex gap-1.5 flex-wrap mb-1">
                    {message.images.map((img, i) => (
                      <img
                        key={i}
                        src={img}
                        alt={`Attachment ${i + 1}`}
                        className="w-16 h-16 object-cover rounded cursor-pointer hover:opacity-80 transition-opacity"
                        style={{ border: '1px solid rgba(255, 255, 255, 0.15)' }}
                        onClick={() => window.open(img, '_blank')}
                      />
                    ))}
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
                        <a href={href} target="_blank" rel="noopener noreferrer" className="text-green-400 hover:underline">
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

        {/* Quick actions after greeting */}
        {isMaster && messages.length === 1 && messages[0].id === '1' && (
          <div className="flex flex-wrap gap-2 pt-1">
            {[
              'Research the repo',
              'Tell me what you can do',
              'Build a todo app',
            ].map((action) => (
              <button
                key={action}
                className="text-xs px-3 py-1.5 rounded text-white/60 hover:text-white/90 transition-colors cursor-pointer"
                style={{
                  background: 'rgba(255, 255, 255, 0.06)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                }}
                onClick={() => {
                  setInputValue(action)
                  setTimeout(() => textareaRef.current?.focus(), 0)
                }}
              >
                {action}
              </button>
            ))}
          </div>
        )}

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
                  className="px-3 py-1 text-xs font-medium bg-green-600 hover:bg-green-500 transition-colors rounded"
                >
                  Allow
                </button>
                <button
                  onClick={() => handlePermissionResponse(false)}
                  className="px-3 py-1 text-xs font-medium bg-red-600 hover:bg-red-500 transition-colors rounded"
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
              <span style={{ color: '#4ade80', fontSize: '14px', animation: 'blink-triangle 1.2s ease-in-out infinite' }}>◆</span>
              <span className="tool-call-text font-mono text-xs">
                {isMaster ? THINKING_PHRASES[masterPhraseIndex] : AGENT_PHRASES[agentPhraseIndex]}
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
          borderTop: '1px solid rgba(255, 255, 255, 0.08)',
          background: isDraggingOver ? 'rgba(74, 222, 128, 0.1)' : 'rgba(255, 255, 255, 0.05)',
          transition: 'background 0.15s',
        }}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
          {/* Staged image thumbnails */}
          {stagedImages.length > 0 && (
            <div className="flex gap-1.5 px-3 pt-2 flex-wrap">
              {stagedImages.map((img, i) => (
                <div key={i} className="relative group">
                  <img
                    src={img}
                    alt={`Attachment ${i + 1}`}
                    className="w-12 h-12 object-cover rounded"
                    style={{ border: '1px solid rgba(255, 255, 255, 0.15)' }}
                  />
                  <button
                    onClick={() => removeStagedImage(i)}
                    className="absolute -top-1.5 -right-1.5 w-4 h-4 flex items-center justify-center text-[10px] rounded-full bg-black/80 text-white/70 hover:text-white opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
          )}
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
            onPaste={handlePaste}
            onCopy={(e) => e.stopPropagation()}
            onCut={(e) => e.stopPropagation()}
            placeholder={
              agentState === 'error'
                ? 'Connection error'
                : agentState === 'queued'
                  ? 'Add to queue...'
                  : isDraggingOver
                    ? 'Drop image here...'
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
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            multiple
            className="hidden"
            onChange={handleFileSelect}
          />
          <div className="flex items-center justify-between px-2 pb-2">
            <div className="flex items-center gap-1">
              {isMaster && (
                <>
                  <button
                    onClick={openPlanPanel}
                    disabled={!hasActivePlan}
                    className="flex items-center gap-1 px-2 py-1 text-xs transition-all hover:bg-white/20 hover:border-white/30 disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:bg-transparent rounded"
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
                      className="flex items-center justify-center w-5 h-5 text-xs transition-all hover:text-white/70"
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
                </>
              )}
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => fileInputRef.current?.click()}
                className="flex items-center justify-center w-6 h-6 text-white/30 hover:text-white/60 transition-colors rounded cursor-pointer"
                title="Attach image"
              >
                <ImageIcon width={16} height={16} />
              </button>
              {agentState === 'working' ? (
                <button
                  onClick={() => killAgent(lizardId)}
                  className="flex items-center gap-1 px-2 py-1 text-xs transition-all hover:bg-red-500/30 rounded cursor-pointer"
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
                  className="px-1.5 py-1 text-white/50 hover:text-white transition-colors disabled:opacity-50 focus:outline-none rounded"
                  style={{
                    background: 'rgba(255, 255, 255, 0.1)',
                    border: '1px solid rgba(255, 255, 255, 0.15)',
                  }}
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M12 19V5M5 12l7-7 7 7" />
                  </svg>
                </button>
              )}
            </div>
          </div>
      </div>

      {/* Resize handles */}
      {/* Corners */}
      <div
        className="absolute bottom-0 right-0 w-4 h-4 cursor-se-resize"
        style={{
          background: `linear-gradient(135deg, transparent 50%, ${color}44 50%)`,
          borderRadius: 0,
        }}
        onMouseDown={handleResizeStart('se')}
      />
      <div
        className="absolute top-0 right-0 w-3 h-3 cursor-ne-resize"
        style={{ borderRadius: 0 }}
        onMouseDown={handleResizeStart('ne')}
      />
      <div
        className="absolute top-0 left-0 w-3 h-3 cursor-nw-resize"
        style={{ borderRadius: 0 }}
        onMouseDown={handleResizeStart('nw')}
      />
      <div
        className="absolute bottom-0 left-0 w-3 h-3 cursor-sw-resize"
        style={{ borderRadius: 0 }}
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