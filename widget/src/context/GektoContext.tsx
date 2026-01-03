import { createContext, useContext, useState, useCallback, useMemo, type ReactNode } from 'react'
import { useSwarm } from './SwarmContext'
import { useAgent } from './AgentContext'

// === Types ===

type PlanStatus = 'planning' | 'ready' | 'executing' | 'completed' | 'failed'
type TaskStatus = 'pending' | 'in_progress' | 'completed' | 'failed'
type ExecutionStrategy = 'parallel-files' | 'sequential' | 'hybrid'
type Provider = 'claude-code' | 'claude-api' | 'openai' | 'local'

interface Task {
  id: string
  description: string
  prompt: string                // The actual prompt to send to the agent
  files: string[]               // Files this task will modify
  assignedLizardId?: string     // Worker lizard assigned
  status: TaskStatus
  dependencies: string[]        // Task IDs that must complete first
  result?: string
  error?: string
}

interface ExecutionPlan {
  id: string
  status: PlanStatus
  originalPrompt: string
  tasks: Task[]
  createdAt: Date
  completedAt?: Date
}

interface GektoConfig {
  strategy: ExecutionStrategy
  defaultProvider: Provider
  maxParallelAgents: number
  autoSpawnWorkers: boolean
}

interface GektoContextValue {
  // Current plan
  currentPlan: ExecutionPlan | null

  // Configuration
  config: GektoConfig

  // Plan actions
  createPlan: (prompt: string) => Promise<void>
  executePlan: () => Promise<void>
  cancelPlan: () => void

  // Task monitoring
  getTaskStatus: (taskId: string) => TaskStatus | undefined
  getTaskByLizardId: (lizardId: string) => Task | undefined

  // Delegation
  delegatePrompt: (prompt: string) => void

  // UI state
  isPlanPanelOpen: boolean
  openPlanPanel: () => void
  closePlanPanel: () => void
}

const DEFAULT_CONFIG: GektoConfig = {
  strategy: 'parallel-files',
  defaultProvider: 'claude-code',
  maxParallelAgents: 5,
  autoSpawnWorkers: true,
}

const GektoContext = createContext<GektoContextValue | null>(null)

export function useGekto() {
  const context = useContext(GektoContext)
  if (!context) {
    throw new Error('useGekto must be used within a GektoProvider')
  }
  return context
}

interface GektoProviderProps {
  children: ReactNode
}

export function GektoProvider({ children }: GektoProviderProps) {
  // Access SwarmContext for worker spawning and removal
  const { spawnWorkerLizard, deleteLizard, lizards } = useSwarm()
  // Access AgentContext for sending messages and WebSocket
  const { sendMessage, getWebSocket } = useAgent()
  const [currentPlan, setCurrentPlan] = useState<ExecutionPlan | null>(null)
  const [config] = useState<GektoConfig>(DEFAULT_CONFIG)
  const [isPlanPanelOpen, setIsPlanPanelOpen] = useState(false)

  // Send message to Gekto - server will decide if planning is needed
  const createPlan = useCallback(async (prompt: string) => {
    console.log('[Gekto] createPlan called with:', prompt.substring(0, 50))

    const ws = getWebSocket()
    console.log('[Gekto] WebSocket state:', ws?.readyState, 'OPEN =', WebSocket.OPEN)

    if (!ws || ws.readyState !== WebSocket.OPEN) {
      console.error('[Gekto] WebSocket not connected')
      return
    }

    const planId = Date.now().toString()
    console.log('[Gekto] Sending to server for decision, planId:', planId)

    // Include current lizards so server knows what agents exist
    const currentLizards = lizards.map(l => ({
      id: l.id,
      isWorker: l.settings?.isWorker || l.id.startsWith('worker_'),
    }))

    ws.send(JSON.stringify({
      type: 'create_plan',
      prompt,
      planId,
      lizards: currentLizards,
    }))
  }, [getWebSocket, lizards])

  // Execute the current plan
  const executePlan = useCallback(async () => {
    if (!currentPlan || currentPlan.status !== 'ready') {
      console.error('[Gekto] No plan ready to execute')
      return
    }

    const ws = getWebSocket()
    if (!ws || ws.readyState !== WebSocket.OPEN) {
      console.error('[Gekto] WebSocket not connected')
      return
    }

    // Update plan status to executing
    setCurrentPlan(prev => prev ? { ...prev, status: 'executing' } : null)

    // Notify server that execution started
    ws.send(JSON.stringify({
      type: 'execute_plan',
      planId: currentPlan.id,
    }))

    // Find tasks that can run (no dependencies or all dependencies completed)
    const completedTaskIds = new Set(
      currentPlan.tasks.filter(t => t.status === 'completed').map(t => t.id)
    )

    const tasksToRun = currentPlan.tasks.filter(task => {
      if (task.status !== 'pending') return false
      // All dependencies must be completed
      return task.dependencies.every(depId => completedTaskIds.has(depId))
    })

    console.log('[Gekto] Starting execution with', tasksToRun.length, 'tasks')

    // Spawn workers and send tasks
    for (const task of tasksToRun) {
      // Spawn a worker lizard
      const lizardId = spawnWorkerLizard(task.id, task.description)
      console.log('[Gekto] Spawned worker', lizardId, 'for task', task.id)

      // Update task status
      setCurrentPlan(prev => {
        if (!prev) return null
        return {
          ...prev,
          tasks: prev.tasks.map(t =>
            t.id === task.id
              ? { ...t, status: 'in_progress' as TaskStatus, assignedLizardId: lizardId }
              : t
          ),
        }
      })

      // Notify server about task start
      ws.send(JSON.stringify({
        type: 'task_started',
        planId: currentPlan.id,
        taskId: task.id,
        lizardId,
      }))

      // Send the task prompt to the worker
      // Small delay to ensure the worker is ready
      setTimeout(() => {
        sendMessage(lizardId, task.prompt)
      }, 100)
    }
  }, [currentPlan, spawnWorkerLizard, sendMessage])

  // Cancel the current plan
  const cancelPlan = useCallback(() => {
    if (!currentPlan) return

    const ws = getWebSocket()
    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({
        type: 'cancel_plan',
        planId: currentPlan.id,
      }))
    }

    setCurrentPlan(null)
    setIsPlanPanelOpen(false)
  }, [currentPlan])

  // Get status of a specific task
  const getTaskStatus = useCallback((taskId: string): TaskStatus | undefined => {
    return currentPlan?.tasks.find(t => t.id === taskId)?.status
  }, [currentPlan])

  // Get task assigned to a specific lizard
  const getTaskByLizardId = useCallback((lizardId: string): Task | undefined => {
    return currentPlan?.tasks.find(t => t.assignedLizardId === lizardId)
  }, [currentPlan])

  // Delegate a follow-up prompt to appropriate agent
  const delegatePrompt = useCallback((prompt: string) => {
    const ws = getWebSocket()
    if (!ws || ws.readyState !== WebSocket.OPEN) {
      console.error('[Gekto] WebSocket not connected')
      return
    }

    ws.send(JSON.stringify({
      type: 'delegate_prompt',
      prompt,
      planId: currentPlan?.id,
    }))
  }, [currentPlan])

  // UI state
  const openPlanPanel = useCallback(() => setIsPlanPanelOpen(true), [])
  const closePlanPanel = useCallback(() => setIsPlanPanelOpen(false), [])

  // Handle incoming WebSocket messages for plan updates
  // This will be called from AgentContext when it receives plan-related messages
  const handlePlanMessage = useCallback((msg: {
    type: string
    plan?: ExecutionPlan
    planId?: string
    taskId?: string
    lizardId?: string
    status?: TaskStatus
    result?: string
    error?: string
    prompt?: string
    message?: string
    removedAgents?: string[]
  }) => {
    switch (msg.type) {
      case 'gekto_chat':
        // Gekto responded with a chat message (not a task)
        console.log('[Gekto] Chat response:', msg.message?.substring(0, 50))
        // Add the response to chat via the message listener system
        if (msg.message) {
          const listener = (window as unknown as { __agentMessageListeners?: Map<string, (message: { id: string; text: string; sender: 'bot'; timestamp: Date }) => void> }).__agentMessageListeners?.get('master')
          if (listener) {
            listener({
              id: Date.now().toString(),
              text: msg.message,
              sender: 'bot',
              timestamp: new Date(),
            })
          }
        }
        break

      case 'gekto_remove':
        // Gekto removed agents
        console.log('[Gekto] Removing agents:', msg.removedAgents)
        if (msg.removedAgents && msg.removedAgents.length > 0) {
          // Remove lizards from UI
          for (const agentId of msg.removedAgents) {
            deleteLizard(agentId)
          }
          // Show confirmation in chat
          const listener = (window as unknown as { __agentMessageListeners?: Map<string, (message: { id: string; text: string; sender: 'bot'; timestamp: Date }) => void> }).__agentMessageListeners?.get('master')
          if (listener) {
            listener({
              id: Date.now().toString(),
              text: `Removed ${msg.removedAgents.length} agent${msg.removedAgents.length > 1 ? 's' : ''}: ${msg.removedAgents.join(', ')}`,
              sender: 'bot',
              timestamp: new Date(),
            })
          }
        }
        break

      case 'plan_created':
        if (msg.plan) {
          setCurrentPlan({
            ...msg.plan,
            status: 'ready',
            createdAt: new Date(msg.plan.createdAt),
          })
          setIsPlanPanelOpen(true)
        }
        break

      case 'plan_updated':
        if (msg.plan) {
          setCurrentPlan({
            ...msg.plan,
            createdAt: new Date(msg.plan.createdAt),
            completedAt: msg.plan.completedAt ? new Date(msg.plan.completedAt) : undefined,
          })
        }
        break

      case 'task_started':
        setCurrentPlan(prev => {
          if (!prev || prev.id !== msg.planId) return prev
          return {
            ...prev,
            tasks: prev.tasks.map(t =>
              t.id === msg.taskId
                ? { ...t, status: 'in_progress' as TaskStatus, assignedLizardId: msg.lizardId }
                : t
            ),
          }
        })
        break

      case 'task_completed':
        setCurrentPlan(prev => {
          if (!prev || prev.id !== msg.planId) return prev
          const updatedTasks = prev.tasks.map(t =>
            t.id === msg.taskId
              ? { ...t, status: 'completed' as TaskStatus, result: msg.result }
              : t
          )
          const allCompleted = updatedTasks.every(t => t.status === 'completed')
          return {
            ...prev,
            tasks: updatedTasks,
            status: allCompleted ? 'completed' : prev.status,
            completedAt: allCompleted ? new Date() : undefined,
          }
        })
        break

      case 'task_failed':
        setCurrentPlan(prev => {
          if (!prev || prev.id !== msg.planId) return prev
          return {
            ...prev,
            tasks: prev.tasks.map(t =>
              t.id === msg.taskId
                ? { ...t, status: 'failed' as TaskStatus, error: msg.error }
                : t
            ),
            status: 'failed',
          }
        })
        break

      case 'plan_failed':
        setCurrentPlan(prev => {
          if (!prev || prev.id !== msg.planId) return prev
          return { ...prev, status: 'failed' }
        })
        break
    }
  }, [sendMessage, deleteLizard])

  // Handle task completion from worker lizards
  const handleTaskComplete = useCallback((lizardId: string, result: string, isError: boolean) => {
    setCurrentPlan(prev => {
      if (!prev) return null

      // Find the task assigned to this worker
      const task = prev.tasks.find(t => t.assignedLizardId === lizardId)
      if (!task) return prev

      console.log('[Gekto] Task completed:', task.id, isError ? 'with error' : 'successfully')

      const updatedTasks = prev.tasks.map(t =>
        t.id === task.id
          ? {
              ...t,
              status: (isError ? 'failed' : 'completed') as TaskStatus,
              result: isError ? undefined : result,
              error: isError ? result : undefined,
            }
          : t
      )

      const allCompleted = updatedTasks.every(t => t.status === 'completed')
      const anyFailed = updatedTasks.some(t => t.status === 'failed')

      // Notify server about task completion
      const ws = getWebSocket()
      if (ws && ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({
          type: isError ? 'task_failed' : 'task_completed',
          planId: prev.id,
          taskId: task.id,
          result: isError ? undefined : result,
          error: isError ? result : undefined,
        }))
      }

      // Check if there are more tasks to run (with satisfied dependencies)
      if (!isError && !allCompleted) {
        const completedTaskIds = new Set(
          updatedTasks.filter(t => t.status === 'completed').map(t => t.id)
        )

        const nextTasks = updatedTasks.filter(t => {
          if (t.status !== 'pending') return false
          return t.dependencies.every(depId => completedTaskIds.has(depId))
        })

        // Spawn workers for next tasks
        for (const nextTask of nextTasks) {
          const nextLizardId = spawnWorkerLizard(nextTask.id, nextTask.description)
          console.log('[Gekto] Spawning next worker', nextLizardId, 'for task', nextTask.id)

          // Update the task in our local state
          updatedTasks.forEach(t => {
            if (t.id === nextTask.id) {
              t.status = 'in_progress'
              t.assignedLizardId = nextLizardId
            }
          })

          // Send task to worker with delay
          setTimeout(() => {
            sendMessage(nextLizardId, nextTask.prompt)
          }, 100)
        }
      }

      return {
        ...prev,
        tasks: updatedTasks,
        status: anyFailed ? 'failed' : allCompleted ? 'completed' : prev.status,
        completedAt: allCompleted ? new Date() : undefined,
      }
    })
  }, [spawnWorkerLizard, sendMessage])

  // Expose handlers for AgentContext to call
  // We use direct window assignment because these need to be available immediately
  type PlanMessageHandler = (msg: {
    type: string
    plan?: ExecutionPlan
    planId?: string
    taskId?: string
    lizardId?: string
    status?: TaskStatus
    result?: string
    error?: string
  }) => void
  type TaskCompleteHandler = (lizardId: string, result: string, isError: boolean) => void

  const windowWithHandlers = window as unknown as {
    __gektoMessageHandler?: PlanMessageHandler
    __gektoTaskComplete?: TaskCompleteHandler
  }
  windowWithHandlers.__gektoMessageHandler = handlePlanMessage
  windowWithHandlers.__gektoTaskComplete = handleTaskComplete

  const value = useMemo<GektoContextValue>(() => ({
    currentPlan,
    config,
    createPlan,
    executePlan,
    cancelPlan,
    getTaskStatus,
    getTaskByLizardId,
    delegatePrompt,
    isPlanPanelOpen,
    openPlanPanel,
    closePlanPanel,
  }), [
    currentPlan,
    config,
    createPlan,
    executePlan,
    cancelPlan,
    getTaskStatus,
    getTaskByLizardId,
    delegatePrompt,
    isPlanPanelOpen,
    openPlanPanel,
    closePlanPanel,
  ])

  return (
    <GektoContext.Provider value={value}>
      {children}
    </GektoContext.Provider>
  )
}

export type { ExecutionPlan, Task, TaskStatus, PlanStatus, GektoConfig }
