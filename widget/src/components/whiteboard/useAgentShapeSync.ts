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

// ============ Normalizer ============

/**
 * Convert Agent + Task → props object (same format as "Add Tasks" button)
 */
function buildShapeProps(agent: Agent, task: Task | undefined): Record<string, unknown> {
  // Map agent status to shape status
  let status: ShapeStatus = 'pending'
  if (agent.status === 'error') status = 'error'
  else if (agent.status === 'done') status = 'done'
  else if (agent.status === 'working') status = 'WRITE'

  // Build props - only include optional fields if they have values (like Add Tasks button)
  const props: Record<string, unknown> = {
    w: CARD_WIDTH,
    h: CARD_HEIGHT,
    title: task?.name || agent.id,
    abstract: task?.description || '',
    status,
  }

  // Optional fields
  if (task?.error) props.message = task.error
  else if (task?.result) props.message = task.result

  // Always include agentId for reverse lookup
  props.agentId = agent.id

  return props
}

// ============ Hook ============

interface AgentWithTask {
  agent: Agent
  task?: Task
}

/**
 * Syncs agents to TaskShapes on tldraw canvas.
 * Creates shapes exactly like the "Add Tasks" button does.
 */
export function useAgentShapeSync(
  editor: Editor | null,
  agentsWithTasks: AgentWithTask[]
) {
  // Map agent ID -> shape ID (since we use random IDs like Add Tasks button)
  const agentToShapeRef = useRef<Map<string, TLShapeId>>(new Map())
  const gridIndexRef = useRef(0)

  // Main sync effect
  useEffect(() => {
    if (!editor) return

    const agentToShape = agentToShapeRef.current
    const currentAgentIds = new Set(agentsWithTasks.map(a => a.agent.id))

    // 1. Create shapes for NEW agents
    for (const { agent, task } of agentsWithTasks) {
      if (!agentToShape.has(agent.id)) {
        // Calculate grid position
        const index = gridIndexRef.current++
        const col = index % COLS
        const row = Math.floor(index / COLS)
        const x = START_X + col * (CARD_WIDTH + GAP)
        const y = START_Y + row * (CARD_HEIGHT + GAP)

        // Build props from agent/task data
        const props = buildShapeProps(agent, task)
       
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

    // 2. Update props for EXISTING agents (no position change)
    for (const { agent, task } of agentsWithTasks) {
      const shapeId = agentToShape.get(agent.id)
      if (shapeId) {
        const shape = editor.getShape(shapeId)
        if (shape) {
          const props = buildShapeProps(agent, task)
          editor.updateShape({
            id: shapeId,
            type: 'task' as const,
            props,
          } as any)
        }
      }
    }

    // 3. Delete shapes for REMOVED agents
    for (const [agentId, shapeId] of agentToShape.entries()) {
      if (!currentAgentIds.has(agentId)) {
        if (editor.getShape(shapeId)) {
          editor.deleteShape(shapeId)
        }
        agentToShape.delete(agentId)
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
}
