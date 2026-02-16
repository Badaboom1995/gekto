import { useState, useCallback, useEffect, useRef, useMemo } from 'react'
import { createPortal } from 'react-dom'
import { Tldraw, Editor, DefaultToolbar, TldrawUiMenuItem, useTools, useIsToolSelected } from 'tldraw'
import { TaskShapeUtil, setOnOpenChat, setOnViewDiff, setOnTitleChange } from './TaskShape'
import { DiffModal } from './DiffModal'
import { useAgentShapeSync } from './useAgentShapeSync'
import { useStore } from '../../store/store'
import { useAgent } from '../../context/AgentContext'
import { ChatWindow } from '../ChatWindow'

// Custom shape utils for tldraw
const customShapeUtils = [TaskShapeUtil]

// Custom toolbar with only: select, hand, draw, eraser, rectangle, and Add Task
function CustomToolbar({ onAddTask }: { onAddTask: () => void }) {
  const tools = useTools()
  const isSelectSelected = useIsToolSelected(tools['select'])
  const isHandSelected = useIsToolSelected(tools['hand'])
  const isDrawSelected = useIsToolSelected(tools['draw'])
  const isEraserSelected = useIsToolSelected(tools['eraser'])
  const isRectangleSelected = useIsToolSelected(tools['rectangle'])

  return (
    <DefaultToolbar>
      <TldrawUiMenuItem {...tools['select']} isSelected={isSelectSelected} />
      <TldrawUiMenuItem {...tools['hand']} isSelected={isHandSelected} />
      <TldrawUiMenuItem {...tools['draw']} isSelected={isDrawSelected} />
      <TldrawUiMenuItem {...tools['eraser']} isSelected={isEraserSelected} />
      {tools['rectangle'] && <TldrawUiMenuItem {...tools['rectangle']} isSelected={isRectangleSelected} />}
      <button
        onClick={onAddTask}
        className="tlui-button tlui-button__tool"
        title="Add Task"
        style={{ color: 'inherit' }}
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <rect x="3" y="3" width="18" height="18" rx="2" />
          <path d="M12 8v8" />
          <path d="M8 12h8" />
        </svg>
      </button>
    </DefaultToolbar>
  )
}

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

  // Track which agent's diff modal is open
  const [diffAgentId, setDiffAgentId] = useState<string | null>(null)

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

  // Register callback for viewing diffs from TaskShape
  useEffect(() => {
    setOnViewDiff((agentId: string) => {
      setDiffAgentId(agentId)
    })
    return () => setOnViewDiff(null)
  }, [])

  // Get agents and tasks from store
  const agents = useStore((s) => s.agents)
  const tasks = useStore((s) => s.tasks)
  const deleteAgent = useStore((s) => s.deleteAgent)
  const updateTask = useStore((s) => s.updateTask)

  // Register callback for title changes from TaskShape
  useEffect(() => {
    setOnTitleChange((agentId: string, newTitle: string) => {
      // Find the agent and update its task name
      const agent = agents[agentId]
      if (agent?.taskId) {
        updateTask(agent.taskId, { name: newTitle })
      }
    })
    return () => setOnTitleChange(null)
  }, [agents, updateTask])

  // Get sessions, workingDir, and file changes from AgentContext
  const { sessions, getWorkingDir, getFileChanges } = useAgent()
  const workingDir = getWorkingDir()

  // Build agentsWithTasks array for sync hook
  const agentsWithTasks = useMemo(() =>
    Object.values(agents).map(agent => {
      const session = sessions.get(agent.id)
      const fileChanges = getFileChanges(agent.id)
      return {
        agent,
        task: tasks[agent.taskId],
        currentTool: session?.currentTool?.tool,
        streamingText: session?.streamingText,
        workingDir,
        fileChangeCount: fileChanges.length,
      }
    }),
    [agents, tasks, sessions, workingDir, getFileChanges]
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

  // Get store actions for creating tasks/agents
  const createTask = useStore((s) => s.createTask)
  const createAgent = useStore((s) => s.createAgent)

  const handleAddTask = useCallback(() => {
    if (!editor) return

    // Generate unique IDs
    const timestamp = Date.now()
    const taskId = `task_${timestamp}`
    const agentId = `agent_${timestamp}`

    // Count existing agents for naming
    const existingCount = Object.keys(agents).length

    // Create task in store
    createTask({
      id: taskId,
      name: `New Task ${existingCount + 1}`,
      description: 'Click to add a prompt...',
      prompt: '',
      status: 'pending',
    })

    // Create agent linked to task
    createAgent({
      id: agentId,
      taskId,
      personaId: 'plain',
      status: 'idle',
    })

    // Shape will be created automatically by useAgentShapeSync
  }, [editor, agents, createTask, createAgent])

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
            components={{
              Toolbar: () => <CustomToolbar onAddTask={handleAddTask} />,
              ActionsMenu: null,
              HelpMenu: null,
              NavigationPanel: null,
              PageMenu: null,
              StylePanel: null,
              DebugMenu: null,
              DebugPanel: null,
            }}
          />

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

      {/* Diff modal - rendered in portal to appear above tldraw */}
      {diffAgentId && portalContainer && createPortal(
        <DiffModal
          fileChanges={getFileChanges(diffAgentId)}
          onClose={() => setDiffAgentId(null)}
        />,
        portalContainer
      )}
    </>
  )
}

export default WhiteboardCurtain
