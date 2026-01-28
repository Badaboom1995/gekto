import { createContext, useContext, useState, useCallback, useMemo, useEffect, type ReactNode } from 'react'
import { useSwarm } from './SwarmContext'
import { useAgent } from './AgentContext'

// === Types ===

type PlanStatus = 'planning' | 'ready' | 'executing' | 'completed' | 'failed'
type TaskStatus = 'pending' | 'in_progress' | 'pending_testing' | 'completed' | 'failed'
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

  // Mode: plan (default) or direct
  directMode: boolean
  setDirectMode: (enabled: boolean) => void

  // Plan actions
  createPlan: (prompt: string) => Promise<void>
  executePlan: () => Promise<void>
  cancelPlan: () => void

  // Task monitoring
  getTaskStatus: (taskId: string) => TaskStatus | undefined
  getTaskByLizardId: (lizardId: string) => Task | undefined
  markTaskResolved: (taskId: string) => void
  retryTask: (taskId: string) => void  // Mark as pending and open agent chat
  markTaskInProgress: (lizardId: string) => void  // Mark linked task as in_progress when message sent

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

const PLAN_STORAGE_KEY = 'gekto-current-plan'

// Load plan from localStorage
function loadPlanFromStorage(): ExecutionPlan | null {
  try {
    const saved = localStorage.getItem(PLAN_STORAGE_KEY)
    if (saved) {
      const plan = JSON.parse(saved)
      // Convert date strings back to Date objects
      return {
        ...plan,
        createdAt: new Date(plan.createdAt),
        completedAt: plan.completedAt ? new Date(plan.completedAt) : undefined,
      }
    }
  } catch (err) {
    console.error('[Gekto] Failed to load plan from storage:', err)
  }
  return null
}

// Save plan to localStorage
function savePlanToStorage(plan: ExecutionPlan | null) {
  try {
    if (plan) {
      localStorage.setItem(PLAN_STORAGE_KEY, JSON.stringify(plan))
    } else {
      localStorage.removeItem(PLAN_STORAGE_KEY)
    }
  } catch (err) {
    console.error('[Gekto] Failed to save plan to storage:', err)
  }
}

export function GektoProvider({ children }: GektoProviderProps) {
  // Access SwarmContext for worker spawning, removal, and chat control
  const { spawnWorkerLizard, deleteLizard, lizards, openChat } = useSwarm()
  // Access AgentContext for sending messages and WebSocket
  const { sendMessage, getWebSocket } = useAgent()
  const [currentPlan, setCurrentPlan] = useState<ExecutionPlan | null>(() => loadPlanFromStorage())
  const [config] = useState<GektoConfig>(DEFAULT_CONFIG)
  const [isPlanPanelOpen, setIsPlanPanelOpen] = useState(false)
  const [directMode, setDirectMode] = useState(false)

  // Persist plan changes to localStorage
  useEffect(() => {
    savePlanToStorage(currentPlan)
  }, [currentPlan])

  // Send message to Gekto - server will decide if planning is needed
  const createPlan = useCallback(async (prompt: string) => {
    const ws = getWebSocket()
    if (!ws || ws.readyState !== WebSocket.OPEN) {
      return
    }

    const taskId = `test_${Date.now()}`
    const planId = `plan_${taskId}`

    // Include current lizards so server knows what agents exist
    const currentLizards = lizards.map(l => ({
      id: l.id,
      isWorker: l.settings?.isWorker || l.id.startsWith('worker_'),
    }))

    ws.send(JSON.stringify({
      type: 'create_plan',
      prompt,
      planId,
      mode: directMode ? 'direct' : 'plan',
      lizards: currentLizards,
    }))
  }, [getWebSocket, lizards, directMode])
  

  // Execute the current plan
  const executePlan = useCallback(async () => {
    if (!currentPlan || currentPlan.status !== 'ready') {
      return
    }

    const ws = getWebSocket()
    if (!ws || ws.readyState !== WebSocket.OPEN) {
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

    // Spawn workers and collect assignments
    const taskAssignments: { taskId: string; lizardId: string; prompt: string }[] = []
    for (const task of tasksToRun) {
      const lizardId = spawnWorkerLizard(task.id, task.description)
      taskAssignments.push({ taskId: task.id, lizardId, prompt: task.prompt })

      // Notify server about task start
      ws.send(JSON.stringify({
        type: 'task_started',
        planId: currentPlan.id,
        taskId: task.id,
        lizardId,
      }))
    }

    // Update all task statuses in a single state update
    setCurrentPlan(prev => {
      if (!prev) return null
      const assignmentMap = new Map(taskAssignments.map(a => [a.taskId, a.lizardId]))
      return {
        ...prev,
        tasks: prev.tasks.map(t =>
          assignmentMap.has(t.id)
            ? { ...t, status: 'in_progress' as TaskStatus, assignedLizardId: assignmentMap.get(t.id) }
            : t
        ),
      }
    })

    // Send task prompts to workers (with delay to ensure state is updated)
    setTimeout(() => {
      for (const { lizardId, prompt } of taskAssignments) {
        sendMessage(lizardId, prompt)
      }
    }, 100)
  }, [currentPlan, getWebSocket, spawnWorkerLizard, sendMessage])

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

  // Mark a task as resolved - removes task and linked agent
  const markTaskResolved = useCallback((taskId: string) => {
    // Get lizardId before removing task
    const task = currentPlan?.tasks.find(t => t.id === taskId)
    const lizardId = task?.assignedLizardId

    setCurrentPlan(prev => {
      if (!prev) return null
      // Remove the task instead of marking completed
      const remainingTasks = prev.tasks.filter(t => t.id !== taskId)
      const allDone = remainingTasks.length === 0
      return {
        ...prev,
        tasks: remainingTasks,
        status: allDone ? 'completed' : prev.status,
        completedAt: allDone ? new Date() : undefined,
      }
    })

    // Remove the linked agent
    if (lizardId) {
      deleteLizard(lizardId)
    }
  }, [currentPlan, deleteLizard])

  // Retry a task - reset to pending and open agent chat for user to provide feedback
  const retryTask = useCallback((taskId: string) => {
    // Get lizardId before state update (currentPlan is captured in closure)
    const task = currentPlan?.tasks.find(t => t.id === taskId)
    const lizardId = task?.assignedLizardId

    setCurrentPlan(prev => {
      if (!prev) return null
      return {
        ...prev,
        tasks: prev.tasks.map(t =>
          t.id === taskId ? { ...t, status: 'pending' as TaskStatus, error: undefined, result: undefined } : t
        ),
      }
    })

    // Open chat for the assigned lizard so user can provide feedback
    if (lizardId) {
      openChat(lizardId, 'task')
    }
  }, [currentPlan, openChat])

  // Mark a task as in_progress when user sends message to linked worker
  const markTaskInProgress = useCallback((lizardId: string) => {
    setCurrentPlan(prev => {
      if (!prev) return null
      const task = prev.tasks.find(t => t.assignedLizardId === lizardId)
      // Only update if task is in pending state (after retry)
      if (!task || task.status !== 'pending') return prev
      return {
        ...prev,
        tasks: prev.tasks.map(t =>
          t.assignedLizardId === lizardId ? { ...t, status: 'in_progress' as TaskStatus } : t
        ),
      }
    })
  }, [])

  // Delegate a follow-up prompt to appropriate agent
  const delegatePrompt = useCallback((prompt: string) => {
    const ws = getWebSocket()
    if (!ws || ws.readyState !== WebSocket.OPEN) {
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
    mode?: string
    text?: string
    timing?: { classifyMs?: number; workMs?: number }
  }) => {
    switch (msg.type) {
      case 'gekto_text':
        // Streaming text from Gekto (optional - could be used for live updates)
        break

      case 'gekto_chat':
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
          // Normalize plan structure to match Test button format exactly
          const normalizedPlan: ExecutionPlan = {
            id: msg.plan.id,
            status: 'ready',
            originalPrompt: msg.plan.originalPrompt,
            tasks: (msg.plan.tasks || []).map((t: Partial<Task>, i: number) => ({
              id: t.id || `${msg.plan.id}_task_${i + 1}`,
              description: t.description || 'Task',
              prompt: t.prompt || msg.plan.originalPrompt,
              files: t.files || [],
              status: 'pending' as TaskStatus,
              dependencies: t.dependencies || [],
            })),
            createdAt: new Date(msg.plan.createdAt),
          }
          console.log('[Gekto] Plan created:', normalizedPlan)
          setCurrentPlan(normalizedPlan)
          setIsPlanPanelOpen(true)
        }
        break

      case 'plan_updated':
        if (msg.plan) {
          console.log('[Gekto] Plan updated:', msg.plan)
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
        // Agent thinks it's done - set to pending_testing for user to verify
        setCurrentPlan(prev => {
          if (!prev || prev.id !== msg.planId) return prev
          return {
            ...prev,
            tasks: prev.tasks.map(t =>
              t.id === msg.taskId
                ? { ...t, status: 'pending_testing' as TaskStatus, result: msg.result }
                : t
            ),
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
      if (!prev) {
        console.warn('[Gekto] No current plan!')
        return null
      }

      // Find the task assigned to this worker
      const task = prev.tasks.find(t => t.assignedLizardId === lizardId)
      if (!task) {
        console.warn('[Gekto] No task found for lizard:', lizardId)
        return prev
      }

      // Set to pending_testing (not completed) - user must verify and mark as resolved
      const updatedTasks = prev.tasks.map(t =>
        t.id === task.id
          ? {
              ...t,
              status: (isError ? 'failed' : 'pending_testing') as TaskStatus,
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
  }, [spawnWorkerLizard, sendMessage, getWebSocket])

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
    directMode,
    setDirectMode,
    createPlan,
    executePlan,
    cancelPlan,
    getTaskStatus,
    getTaskByLizardId,
    markTaskResolved,
    retryTask,
    markTaskInProgress,
    delegatePrompt,
    isPlanPanelOpen,
    openPlanPanel,
    closePlanPanel,
  }), [
    currentPlan,
    config,
    directMode,
    createPlan,
    executePlan,
    cancelPlan,
    getTaskStatus,
    getTaskByLizardId,
    markTaskResolved,
    retryTask,
    markTaskInProgress,
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
