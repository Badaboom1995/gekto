import { useState, useCallback, useEffect, useRef, useMemo } from 'react'
import { createPortal } from 'react-dom'
import { Tldraw, Editor, createShapeId } from 'tldraw'
import { TaskShapeUtil, setOnOpenChat } from './TaskShape'
import { useAgentShapeSync } from './useAgentShapeSync'
import { useStore } from '../../store/store'
import { useAgent } from '../../context/AgentContext'
import { ChatWindow } from '../ChatWindow'

// Custom shape utils for tldraw
const customShapeUtils = [TaskShapeUtil]

interface WhiteboardCurtainProps {
  persistenceKey?: string
}

// Export editor ref for programmatic access
export let whiteboardEditor: Editor | null = null

// Export function to open whiteboard from outside
let openWhiteboardFn: (() => void) | null = null
export function openWhiteboard() {
  openWhiteboardFn?.()
}

export function WhiteboardCurtain({ persistenceKey = 'gekto-whiteboard-v2' }: WhiteboardCurtainProps) {
  const isOpen = useStore((s) => s.isWhiteboardOpen)
  const setWhiteboardOpen = useStore((s) => s.setWhiteboardOpen)

  const [portalContainer, setPortalContainer] = useState<HTMLElement | null>(null)
  const [editor, setEditor] = useState<Editor | null>(null)
  const editorRef = useRef<Editor | null>(null)

  // Track which agent's chat is open on whiteboard
  const [whiteboardChatAgentId, setWhiteboardChatAgentId] = useState<string | null>(null)
  const [chatPosition, setChatPosition] = useState({ x: 0, y: 0 })

  // Register the open function in effect
  useEffect(() => {
    openWhiteboardFn = () => setWhiteboardOpen(true)
    return () => { openWhiteboardFn = null }
  }, [setWhiteboardOpen])

  // Register callback for opening chat from TaskShape
  useEffect(() => {
    setOnOpenChat((agentId: string) => {
      // Get shape position from tldraw
      if (editor) {
        const shapes = editor.getCurrentPageShapes()
        const shape = shapes.find(s =>
          (s.type as string) === 'task' &&
          (s as any).props?.agentId === agentId
        )
        if (shape) {
          // Convert page coords to screen coords
          const screenPoint = editor.pageToScreen({ x: shape.x, y: shape.y })
          setChatPosition({
            x: screenPoint.x + 320, // Right of the task
            y: screenPoint.y
          })
        }
      }
      setWhiteboardChatAgentId(agentId)
    })
    return () => setOnOpenChat(null)
  }, [editor])

  // Get agents and tasks from store
  const agents = useStore((s) => s.agents)
  const tasks = useStore((s) => s.tasks)
  const deleteAgent = useStore((s) => s.deleteAgent)

  // Get sessions and workingDir from AgentContext
  const { sessions, getWorkingDir } = useAgent()
  const workingDir = getWorkingDir()

  // Build agentsWithTasks array for sync hook
  const agentsWithTasks = useMemo(() =>
    Object.values(agents).map(agent => {
      const session = sessions.get(agent.id)
      return {
        agent,
        task: tasks[agent.taskId],
        currentTool: session?.currentTool?.tool,
        streamingText: session?.streamingText,
        workingDir,
      }
    }),
    [agents, tasks, sessions, workingDir]
  )

  // Sync agents to TaskShapes (Zustand → tldraw)
  // Positions managed by tldraw via persistenceKey
  // When user deletes shape, agent is removed from store
  useAgentShapeSync(editor, agentsWithTasks, deleteAgent)

  // Setup portal container on mount (preload)
  useEffect(() => {
    const div = document.createElement('div')
    div.id = 'gekto-whiteboard-portal'
    div.style.position = 'relative'
    div.style.zIndex = '500' // Below lizards (1000+)
    document.body.appendChild(div)

    // Inject tldraw CSS
    const styleId = 'tldraw-portal-styles'
    if (!document.getElementById(styleId)) {
      const link = document.createElement('link')
      link.id = styleId
      link.rel = 'stylesheet'
      link.href = 'https://unpkg.com/tldraw@3/tldraw.css'
      document.head.appendChild(link)
    }

    setPortalContainer(div)

    return () => {
      div.remove()
    }
  }, [])

  const handleClose = useCallback(() => {
    setWhiteboardOpen(false)
  }, [setWhiteboardOpen])

  const handleAddTask = useCallback(() => {
    if (!editor) return

    // Get viewport center for placement
    const viewportBounds = editor.getViewportScreenBounds()
    const viewportCenter = editor.screenToPage({
      x: viewportBounds.x + viewportBounds.width / 2,
      y: viewportBounds.y + viewportBounds.height / 2,
    })

    // Card dimensions and grid layout
    const CARD_WIDTH = 300
    const CARD_HEIGHT = 200
    const GAP = 20
    const COLS = 4

    // Sample tasks showcasing all variations
    const sampleTasks = [
      // Row 1: Different statuses
      { title: 'Pending Task', abstract: 'Just started...', status: 'pending' },
      { title: 'Reading Files', abstract: 'Scanning codebase for context...', status: 'READ', message: 'Reading src/components/*.tsx' },
      { title: 'Writing Code', abstract: 'Implementing user authentication', status: 'WRITE', branch: 'feature/auth-flow' },
      { title: 'Running Tests', abstract: 'Executing test suite', status: 'BASH', message: 'npm run test' },

      // Row 2: More tool statuses + completion states
      { title: 'Search Task', abstract: 'Looking for API endpoints', status: 'GREP', message: 'Searching for "router.get"' },
      { title: 'Edit Config', abstract: 'Updating tsconfig settings', status: 'EDIT', branch: 'fix/typescript-config' },
      { title: 'Completed Task', abstract: 'Added new store component with Zustand', status: 'done', branch: 'feature/store', message: 'diff +142 -28' },
      { title: 'Failed Task', abstract: 'Attempted to fix build errors', status: 'error', message: 'Agent stopped: Out of tokens' },

      // Row 3: Action variations
      { title: 'Needs Approval', abstract: 'Ready to commit changes to main', status: 'pending', branch: 'main', message: 'action:Approve:Review and merge 3 files' },
      { title: 'Review Changes', abstract: 'Refactored authentication module', status: 'done', branch: 'refactor/auth', message: 'action:View Diff:15 files changed' },
      { title: 'With Branch', abstract: 'Working on new feature', status: 'READ', branch: 'feature/dashboard-widgets' },
      { title: 'No Branch', abstract: 'Quick investigation task', status: 'GREP' },
    ]

    // Calculate starting position (top-left of grid)
    const gridWidth = COLS * CARD_WIDTH + (COLS - 1) * GAP
    const startX = viewportCenter.x - gridWidth / 2
    const startY = viewportCenter.y - CARD_HEIGHT

    // Create all sample tasks in a grid
    const shapeIds = sampleTasks.map((task, index) => {
      const col = index % COLS
      const row = Math.floor(index / COLS)
      const x = startX + col * (CARD_WIDTH + GAP)
      const y = startY + row * (CARD_HEIGHT + GAP)

      // Build props object, only including optional fields if they have values
      const props: Record<string, unknown> = {
        w: CARD_WIDTH,
        h: CARD_HEIGHT,
        title: task.title,
        abstract: task.abstract,
        status: task.status,
      }
      if (task.branch) props.branch = task.branch
      if (task.message) props.message = task.message

      const shapeId = createShapeId()
      editor.createShape({
        id: shapeId,
        type: 'task' as const,
        x,
        y,
        props,
      } as any)

      return shapeId
    })

    // Select all new shapes
    editor.select(...shapeIds)
  }, [editor])

  return (
    <>
      {/* Tldraw rendered outside shadow DOM via portal */}
      {portalContainer && createPortal(
        <div
          // @ts-expect-error - inert is a valid HTML attribute
          inert={!isOpen ? '' : undefined}
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 500, // Below lizards (1000+)
            background: '#1e1e1e',
            transform: isOpen ? 'translateY(0)' : 'translateY(-100%)',
            transition: 'transform 0.5s cubic-bezier(0.4, 0, 0.2, 1)',
            pointerEvents: isOpen ? 'auto' : 'none',
          }}
        >
          <Tldraw
            persistenceKey={persistenceKey}
            shapeUtils={customShapeUtils}
            onMount={(newEditor) => {
              editorRef.current = newEditor
              whiteboardEditor = newEditor
              setEditor(newEditor)
              newEditor.user.updateUserPreferences({ colorScheme: 'dark' })
            }}
          />

          {/* Toolbar */}
          <div
            style={{
              position: 'absolute',
              top: 16,
              left: '50%',
              transform: 'translateX(-50%)',
              zIndex: 1000,
              display: 'flex',
              alignItems: 'center',
              gap: 8,
            }}
          >
            {/* Add Task button */}
            <button
              onClick={handleAddTask}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                padding: '8px 16px',
                background: 'rgba(59, 130, 246, 0.9)',
                backdropFilter: 'blur(8px)',
                border: '1px solid #3b82f6',
                borderRadius: 8,
                color: '#fff',
                cursor: 'pointer',
                fontFamily: 'system-ui, sans-serif',
                fontSize: 12,
                fontWeight: 500,
                transition: 'all 0.2s',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = '#3b82f6'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'rgba(59, 130, 246, 0.9)'
              }}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M12 5v14" />
                <path d="M5 12h14" />
              </svg>
              Add Task
            </button>

            {/* Roll-up handle */}
            <button
              onClick={handleClose}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                padding: '8px 16px',
                background: 'rgba(39, 39, 42, 0.9)',
                backdropFilter: 'blur(8px)',
                border: '1px solid #3f3f46',
                borderRadius: 8,
                color: '#a1a1aa',
                cursor: 'pointer',
                fontFamily: 'system-ui, sans-serif',
                fontSize: 12,
                transition: 'all 0.2s',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = '#3f3f46'
                e.currentTarget.style.color = '#fff'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'rgba(39, 39, 42, 0.9)'
                e.currentTarget.style.color = '#a1a1aa'
              }}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M12 21V3" />
                <path d="m8 8 4-4 4 4" />
              </svg>
              Roll up
            </button>
          </div>

        </div>,
        portalContainer
      )}

      {/* Chat overlay - rendered in shadow DOM with high z-index to appear above whiteboard */}
      {whiteboardChatAgentId && (
        <div
          className="fixed"
          style={{
            left: chatPosition.x,
            top: chatPosition.y,
            zIndex: 100000,
            pointerEvents: 'auto',
          }}
        >
          <ChatWindow
            lizardId={whiteboardChatAgentId}
            title="Agent Chat"
            onClose={() => setWhiteboardChatAgentId(null)}
          />
        </div>
      )}
    </>
  )
}

export default WhiteboardCurtain
