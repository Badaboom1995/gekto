import { useEffect, useRef } from 'react'
import { Editor, createShapeId } from 'tldraw'
import type { TLShapeId } from 'tldraw'
import type { Agent, Task } from '../../store/store'
import type { TaskShape, TaskStatus as ShapeStatus } from './TaskShape'

// Grid layout for new shapes
const CARD_WIDTH = 300
const CARD_HEIGHT = 200
const GAP = 20
const COLS = 4
const START_X = 100
const START_Y = 100

// Map Claude tool names to shape status
const TOOL_TO_STATUS: Record<string, ShapeStatus> = {
  Read: 'READ',
  Write: 'WRITE',
  Edit: 'EDIT',
  Bash: 'BASH',
  Grep: 'GREP',
  Glob: 'GREP',  // Glob is similar to Grep for display
  Task: 'WRITE', // Task agent shows as writing
  WebFetch: 'READ',
  WebSearch: 'READ',
}

// ============ Normalizer ============

/**
 * Convert Agent + Task → props object (same format as "Add Tasks" button)
 */
function buildShapeProps(agent: Agent, task: Task | undefined, index: number, currentTool?: string, streamingText?: string, workingDir?: string): Record<string, unknown> {
  // Map agent status to shape status
  let status: ShapeStatus = 'idle'
  if (agent.status === 'error') status = 'error'
  else if (agent.status === 'done') status = 'done'
  else if (agent.status === 'pending') status = 'pending'
  else if (agent.status === 'working') {
    // Use current tool if available, otherwise default to READ (agent is thinking)
    status = (currentTool && TOOL_TO_STATUS[currentTool]) || 'READ'
  }
  else if (agent.status === 'idle') status = 'idle'

  // Generate friendly name if no task
  const title = task?.name || `Agent ${index + 1}`

  // Determine abstract based on agent status:
  // - Working: show latest streaming text
  // - Done/Pending: show streaming text (last message) truncated to 100 chars
  // - Otherwise: show task description
  let abstract = task?.description || ''
  if (agent.status === 'working' && streamingText) {
    abstract = streamingText
  } else if ((agent.status === 'done' || agent.status === 'pending') && streamingText) {
    // Show last streaming text truncated to 100 chars
    abstract = streamingText.length > 100 ? streamingText.substring(0, 100) + '...' : streamingText
  }

  // Build props - only include optional fields if they have values (like Add Tasks button)
  const props: Record<string, unknown> = {
    w: CARD_WIDTH,
    h: CARD_HEIGHT,
    title,
    abstract,
    status,
  }

  // Optional fields
  if (task?.error) props.message = task.error
  else if (task?.result) props.message = task.result

  // Always include agentId for reverse lookup
  props.agentId = agent.id

  // Working directory for footer
  if (workingDir) props.workingDir = workingDir

  return props
}

// ============ Hook ============

interface AgentWithTask {
  agent: Agent
  task?: Task
  currentTool?: string
  streamingText?: string
  workingDir?: string
}

/**
 * Syncs agents to TaskShapes on tldraw canvas.
 * Creates shapes exactly like the "Add Tasks" button does.
 * Also syncs deletions back: when user deletes a shape, the agent is removed from store.
 */
export function useAgentShapeSync(
  editor: Editor | null,
  agentsWithTasks: AgentWithTask[],
  onDeleteAgent?: (agentId: string) => void
) {
  // Map agent ID -> shape ID (since we use random IDs like Add Tasks button)
  const agentToShapeRef = useRef<Map<string, TLShapeId>>(new Map())
  const gridIndexRef = useRef(0)
  // Track shapes we're deleting ourselves (to avoid triggering onDeleteAgent)
  const deletingShapesRef = useRef<Set<TLShapeId>>(new Set())

  // Main sync effect
  useEffect(() => {
    if (!editor) return

    const agentToShape = agentToShapeRef.current
    const currentAgentIds = new Set(agentsWithTasks.map(a => a.agent.id))

    // 1. Create shapes for NEW agents (or link to existing shapes from localStorage)
    for (let i = 0; i < agentsWithTasks.length; i++) {
      const { agent, task, currentTool, streamingText, workingDir } = agentsWithTasks[i]
      if (!agentToShape.has(agent.id)) {
        // Check if a shape with this agentId already exists (from tldraw localStorage)
        const existingShape = editor.getCurrentPageShapes().find(
          s => (s.type as string) === 'task' &&
               (s as unknown as TaskShape).props?.agentId === agent.id
        )

        if (existingShape) {
          // Link to existing shape instead of creating new one
          agentToShape.set(agent.id, existingShape.id)
        } else {
          // Calculate grid position for new shape
          const gridIndex = gridIndexRef.current++
          const col = gridIndex % COLS
          const row = Math.floor(gridIndex / COLS)
          const x = START_X + col * (CARD_WIDTH + GAP)
          const y = START_Y + row * (CARD_HEIGHT + GAP)

          // Build props from agent/task data (use array index for "Agent X" naming)
          const props = buildShapeProps(agent, task, i, currentTool, streamingText, workingDir)

          // Create shape ID (no argument, like Add Tasks button)
          const shapeId = createShapeId()

          try {
            // Create shape exactly like Add Tasks button
            editor.createShape({
              id: shapeId,
              type: 'task' as const,
              x,
              y,
              props,
            } as any)

            // Store mapping
            agentToShape.set(agent.id, shapeId)
          } catch (err) {
            console.error('[AgentShapeSync] Error creating shape:', err)
          }
        }
      }
    }

    // 2. Update props for EXISTING agents (no position change)
    for (let i = 0; i < agentsWithTasks.length; i++) {
      const { agent, task, currentTool, streamingText, workingDir } = agentsWithTasks[i]
      const shapeId = agentToShape.get(agent.id)
      if (shapeId) {
        const shape = editor.getShape(shapeId)
        if (shape) {
          const props = buildShapeProps(agent, task, i, currentTool, streamingText, workingDir)
          editor.updateShape({
            id: shapeId,
            type: 'task' as const,
            props,
          } as any)
        }
      }
    }

    // 3. Delete shapes for REMOVED agents (from our mapping)
    for (const [agentId, shapeId] of agentToShape.entries()) {
      if (!currentAgentIds.has(agentId)) {
        if (editor.getShape(shapeId)) {
          // Mark as our deletion so we don't trigger onDeleteAgent
          deletingShapesRef.current.add(shapeId)
          editor.deleteShape(shapeId)
          deletingShapesRef.current.delete(shapeId)
        }
        agentToShape.delete(agentId)
      }
    }

    // 4. Clean up orphaned shapes (have agentId but agent doesn't exist in Zustand)
    const allTaskShapes = editor.getCurrentPageShapes().filter(
      s => (s.type as string) === 'task'
    )
    for (const shape of allTaskShapes) {
      const taskShape = shape as unknown as TaskShape
      const agentId = taskShape.props?.agentId
      if (agentId && !currentAgentIds.has(agentId)) {
        deletingShapesRef.current.add(shape.id)
        editor.deleteShape(shape.id)
        deletingShapesRef.current.delete(shape.id)
      }
    }
  }, [editor, agentsWithTasks])

  // Initialize: rebuild mapping from existing shapes with agentId
  useEffect(() => {
    if (!editor) return

    const agentToShape = agentToShapeRef.current
    const existingShapes = editor.getCurrentPageShapes().filter(
      s => (s.type as string) === 'task'
    )

    // Set grid index to continue after existing shapes
    gridIndexRef.current = existingShapes.length

    // Rebuild mapping from shapes that have agentId
    for (const shape of existingShapes) {
      const taskShape = shape as unknown as TaskShape
      if (taskShape.props?.agentId && !agentToShape.has(taskShape.props.agentId)) {
        agentToShape.set(taskShape.props.agentId, shape.id)
      }
    }
  }, [editor])

  // Listen for shape deletions from tldraw (user deletes shape -> delete agent)
  useEffect(() => {
    if (!editor || !onDeleteAgent) return

    const agentToShape = agentToShapeRef.current

    const handleChange = (change: { changes: { removed?: Record<string, unknown> } }) => {
      const removed = change.changes.removed
      if (!removed) return

      for (const shape of Object.values(removed) as Array<{ id: TLShapeId; type: string; props?: { agentId?: string } }>) {
        // Skip if we triggered this deletion ourselves
        if (deletingShapesRef.current.has(shape.id)) continue

        // Only handle task shapes with agentId
        if (shape.type === 'task' && shape.props?.agentId) {
          const agentId = shape.props.agentId
          onDeleteAgent(agentId)
          agentToShape.delete(agentId)
        }
      }
    }

    const unlisten = editor.store.listen(handleChange, { source: 'user', scope: 'document' })
    return unlisten
  }, [editor, onDeleteAgent])
}
