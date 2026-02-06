import { useEffect, useRef, useCallback } from 'react'
import { Editor, createShapeId, TLShapeId } from 'tldraw'
import { useAgent } from '../../context/AgentContext'
import { useGekto } from '../../context/GektoContext'
import type { TaskShape, TaskStatus } from './TaskShape'

// Grid layout constants
const CARD_WIDTH = 300
const CARD_HEIGHT = 200
const GAP = 20
const COLS = 4
const GRID_OFFSET_X = 100
const GRID_OFFSET_Y = 100

// Map tool names to status values
function mapToolToStatus(tool: string | undefined): TaskStatus {
  if (!tool) return 'pending'
  const upperTool = tool.toUpperCase()
  if (['READ', 'WRITE', 'BASH', 'GREP', 'EDIT'].includes(upperTool)) {
    return upperTool as TaskStatus
  }
  // Map common tool names to status
  if (tool.toLowerCase().includes('read') || tool.toLowerCase().includes('glob')) return 'READ'
  if (tool.toLowerCase().includes('write') || tool.toLowerCase().includes('edit')) return 'WRITE'
  if (tool.toLowerCase().includes('bash') || tool.toLowerCase().includes('command')) return 'BASH'
  if (tool.toLowerCase().includes('grep') || tool.toLowerCase().includes('search')) return 'GREP'
  return 'pending'
}

// Map agent state to status
function mapStateToStatus(state: string, currentTool: string | undefined, isRunning: boolean): TaskStatus {
  if (state === 'error') return 'error'
  if (state === 'working' || isRunning) {
    return mapToolToStatus(currentTool)
  }
  if (state === 'queued') return 'pending'
  if (state === 'ready') return 'done'
  return 'pending'
}

/**
 * Hook to sync agents from AgentContext to TaskShapes on the whiteboard.
 *
 * - Creates TaskShape for each active agent
 * - Updates shape props when agent state changes
 * - Maintains agentId → shapeId mapping
 */
export function useWhiteboardSync(editor: Editor | null) {
  const { activeAgents, sessions, getCurrentTool, getLizardState } = useAgent()
  const { getTaskByLizardId } = useGekto()
  console.log('activeAgents', activeAgents)
  // Map agentId → shapeId for tracking which shapes belong to which agents
  const agentShapeMapRef = useRef<Map<string, TLShapeId>>(new Map())

  // Track grid position for new shapes
  const nextGridIndexRef = useRef(0)

  // Calculate grid position for a new card
  const getNextGridPosition = useCallback(() => {
    const index = nextGridIndexRef.current
    nextGridIndexRef.current++

    const col = index % COLS
    const row = Math.floor(index / COLS)

    return {
      x: GRID_OFFSET_X + col * (CARD_WIDTH + GAP),
      y: GRID_OFFSET_Y + row * (CARD_HEIGHT + GAP),
    }
  }, [])

  // Create a TaskShape for an agent
  const createAgentShape = useCallback((agentId: string, title: string) => {
    if (!editor) return null

    const shapeId = createShapeId()
    const position = getNextGridPosition()

    // Get initial state
    const state = getLizardState(agentId)
    const tool = getCurrentTool(agentId)
    const isRunning = state === 'working'

    editor.createShape<TaskShape>({
      id: shapeId,
      type: 'task',
      x: position.x,
      y: position.y,
      props: {
        w: CARD_WIDTH,
        h: CARD_HEIGHT,
        title: title || agentId,
        abstract: '',
        status: mapStateToStatus(state, tool?.tool, isRunning),
        message: tool?.input,
        agentId,
      },
    })

    // Store mapping
    agentShapeMapRef.current.set(agentId, shapeId)

    return shapeId
  }, [editor, getNextGridPosition, getLizardState, getCurrentTool])

  // Update an existing TaskShape with new agent state
  const updateAgentShape = useCallback((agentId: string, shapeId: TLShapeId) => {
    if (!editor) return

    const state = getLizardState(agentId)
    const tool = getCurrentTool(agentId)
    const session = sessions.get(agentId)
    const agent = activeAgents.find(a => a.lizardId === agentId)
    const isRunning = state === 'working' || agent?.isRunning || agent?.isProcessing || false

    // Determine status
    const status = mapStateToStatus(state, tool?.tool, isRunning)

    // Build abstract from last response if available
    let abstract = ''
    if (session?.lastResponse) {
      abstract = session.lastResponse.slice(0, 300)
      if (session.lastResponse.length > 300) abstract += '...'
    }

    // Build message from current tool input
    let message: string | undefined
    if (tool?.input) {
      message = tool.input
    } else if (status === 'error' && session?.lastResponse) {
      message = session.lastResponse.slice(0, 200)
    }

    // editor.updateShape<TaskShape>({
    //   id: shapeId,
    //   type: 'task',
    //   props: {
    //     status,
    //     abstract,
    //     message,
    //   },
    // })
  }, [editor, getLizardState, getCurrentTool, sessions, activeAgents])

  // Sync agents to shapes
  useEffect(() => {
    if (!editor) return

    const agentShapeMap = agentShapeMapRef.current

    // Process each active agent
    for (const agent of activeAgents) {
      const { lizardId } = agent

      // Skip master lizard - it's the main chat, not a task
      if (lizardId === 'master') continue

      const existingShapeId = agentShapeMap.get(lizardId)

      if (existingShapeId) {
        // Check if shape still exists in editor
        const shape = editor.getShape(existingShapeId)
        if (shape) {
          // Update existing shape
          updateAgentShape(lizardId, existingShapeId)
        } else {
          // Shape was deleted, remove from map
          agentShapeMap.delete(lizardId)
        }
      } else {
        // Create new shape for this agent - use task description if available
        const task = getTaskByLizardId(lizardId)
        const displayName = task?.description || lizardId
        createAgentShape(lizardId, displayName)
      }
    }

    // Mark inactive agents as done (don't delete - user may want to keep them)
    const activeAgentIds = new Set(activeAgents.map(a => a.lizardId))
    for (const [agentId, shapeId] of agentShapeMap.entries()) {
      if (!activeAgentIds.has(agentId)) {
        const shape = editor.getShape(shapeId)
        if (shape) {
          editor.updateShape<TaskShape>({
            id: shapeId,
            type: 'task',
            props: {
              status: 'done',
            },
          })
        }
      }
    }
  }, [editor, activeAgents, sessions, createAgentShape, updateAgentShape, getTaskByLizardId])

  // Initialize grid index based on existing shapes
  useEffect(() => {
    if (!editor) return

    const taskShapes = editor.getCurrentPageShapes().filter(s => s.type === 'task')
    nextGridIndexRef.current = taskShapes.length

    // Also rebuild agentShapeMap from existing shapes
    const agentShapeMap = agentShapeMapRef.current
    for (const shape of taskShapes) {
      const taskShape = shape as TaskShape
      if (taskShape.props.agentId) {
        agentShapeMap.set(taskShape.props.agentId, shape.id)
      }
    }
  }, [editor])

  // Return utilities for external use
  return {
    agentShapeMap: agentShapeMapRef.current,
    createAgentShape,
    updateAgentShape,
    getNextGridPosition,
  }
}
