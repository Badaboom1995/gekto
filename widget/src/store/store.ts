// Gekto Store - Zustand with server persistence
import { create } from 'zustand'
import { persist, createJSONStorage, type StateStorage } from 'zustand/middleware'

// ============ Types ============

export interface Message {
  id: string
  text: string
  sender: 'user' | 'bot' | 'system'
  timestamp: Date
  isTerminal?: boolean
  toolUse?: ToolMessage
  systemType?: 'mode' | 'status' | 'info'
  systemData?: Record<string, unknown>
}

export interface ToolMessage {
  tool: string
  input?: string
  fullInput?: Record<string, unknown>
  status: 'running' | 'completed'
  startTime: Date
  endTime?: Date
}

export interface Persona {
  id: string
  name: string
  systemPrompt: string
  avatar?: string
}

export interface Task {
  id: string
  name: string
  description: string
  prompt: string
  chatHistory: Message[]
  sessionId?: string
  status: TaskStatus
  planId?: string
  // Execution fields
  files?: string[]              // Files this task will modify
  assignedAgentId?: string      // Agent assigned to this task
  dependencies?: string[]       // Task IDs that must complete first
  result?: string               // Completion result
  error?: string                // Error message if failed
}

// pending_testing = agent finished, awaiting user verification
export type TaskStatus = 'pending' | 'in_progress' | 'pending_testing' | 'completed' | 'failed'

export interface FileChange {
  tool: 'Write' | 'Edit'
  filePath: string
  before: string | null
  after: string
}

export interface Agent {
  id: string
  taskId: string
  personaId: string
  status: AgentStatus
  fileChanges?: FileChange[]
}

export type AgentStatus = 'idle' | 'working' | 'done' | 'pending' | 'error'

export interface Plan {
  id: string
  name: string
  status: PlanStatus
  taskIds: string[]
  originalPrompt?: string       // Original user prompt that created this plan
  createdAt: Date
  completedAt?: Date
}

// Real plans only exist after execution starts
export type PlanStatus = 'executing' | 'completed' | 'failed' | 'canceled'

// ============ Store State ============

interface GektoState {
  personas: Persona[]
  tasks: Record<string, Task>
  agents: Record<string, Agent>
  plans: Record<string, Plan>
  // UI state (not persisted)
  isWhiteboardOpen: boolean
}

interface GektoActions {
  // Tasks
  createTask: (task: Omit<Task, 'chatHistory'> & { chatHistory?: Message[] }) => Task
  updateTask: (id: string, updates: Partial<Task>) => void
  deleteTask: (id: string) => void
  addMessageToTask: (taskId: string, message: Message) => void

  // Agents
  createAgent: (agent: Agent) => void
  updateAgent: (id: string, updates: Partial<Agent>) => void
  deleteAgent: (id: string) => void
  clearAllAgents: () => void
  addFileChange: (agentId: string, change: FileChange) => void
  removeFileChanges: (agentId: string, filePaths: string[]) => void

  // Plans
  createPlan: (plan: Omit<Plan, 'createdAt'> & { createdAt?: Date }) => Plan
  updatePlan: (id: string, updates: Partial<Plan>) => void
  deletePlan: (id: string) => void
  addTaskToPlan: (planId: string, taskId: string) => void
  removeTaskFromPlan: (planId: string, taskId: string) => void

  // Personas
  createPersona: (persona: Persona) => void
  updatePersona: (id: string, updates: Partial<Persona>) => void
  deletePersona: (id: string) => void

  // Bulk
  reset: () => void

  // UI state
  setWhiteboardOpen: (open: boolean) => void
}

type GektoStore = GektoState & GektoActions

// ============ Default Values ============

const DEFAULT_PERSONAS: Persona[] = [
  { id: 'plain', name: 'Plain', systemPrompt: 'You are a helpful coding assistant.' },
  { id: 'architect', name: 'Architect', systemPrompt: 'You are a senior software architect. Focus on system design, patterns, and best practices.' },
  { id: 'codekeeper', name: 'Codekeeper', systemPrompt: 'You are a meticulous code reviewer. Focus on code quality, bugs, and improvements.' },
]

const INITIAL_STATE: GektoState = {
  personas: DEFAULT_PERSONAS,
  tasks: {},
  agents: {},
  plans: {},
  isWhiteboardOpen: false,
}

// ============ Server Storage ============

const serverStorage: StateStorage = {
  getItem: async (): Promise<string | null> => {
    try {
      const res = await fetch(`/__gekto/api/store`)
      if (!res.ok) return null
      const data = await res.json()
      // Parse dates on load
      if (data?.state) {
        const state = data.state
        for (const task of Object.values(state.tasks || {}) as Task[]) {
          if (task.chatHistory) {
            task.chatHistory = task.chatHistory.map((msg: Message & { timestamp: string | Date }) => ({
              ...msg,
              timestamp: new Date(msg.timestamp),
            }))
          }
        }
        for (const plan of Object.values(state.plans || {}) as (Plan & { createdAt: string | Date })[]) {
          plan.createdAt = new Date(plan.createdAt)
          if (plan.completedAt) plan.completedAt = new Date(plan.completedAt)
        }
      }
      return JSON.stringify(data)
    } catch {
      return null
    }
  },
  setItem: async (_, value: string): Promise<void> => {
    try {
      const data = JSON.parse(value)
      await fetch(`/__gekto/api/store`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data.state),
      })
    } catch (err) {
      console.error('[Store] Failed to save:', err)
    }
  },
  removeItem: async (): Promise<void> => {
    // Not implemented - we don't delete the store
  },
}

// ============ Create Store ============

export const useStore = create<GektoStore>()(
  persist(
    (set) => ({
      ...INITIAL_STATE,

      // Tasks
      createTask: (task) => {
        const newTask: Task = { ...task, chatHistory: task.chatHistory || [] }
        set((s) => ({ tasks: { ...s.tasks, [task.id]: newTask } }))
        return newTask
      },
      updateTask: (id, updates) => {
        set((s) => {
          const task = s.tasks[id]
          if (!task) return s
          return { tasks: { ...s.tasks, [id]: { ...task, ...updates } } }
        })
      },
      deleteTask: (id) => {
        set((s) => ({
          tasks: Object.fromEntries(Object.entries(s.tasks).filter(([k]) => k !== id)),
        }))
      },
      addMessageToTask: (taskId, message) => {
        set((s) => {
          const task = s.tasks[taskId]
          if (!task) return s
          return {
            tasks: {
              ...s.tasks,
              [taskId]: { ...task, chatHistory: [...task.chatHistory, message] },
            },
          }
        })
      },

      // Agents
      createAgent: (agent) => {
        set((s) => ({ agents: { ...s.agents, [agent.id]: agent } }))
      },
      updateAgent: (id, updates) => {
        set((s) => {
          const agent = s.agents[id]
          if (!agent) return s
          return { agents: { ...s.agents, [id]: { ...agent, ...updates } } }
        })
      },
      deleteAgent: (id) => {
        set((s) => ({
          agents: Object.fromEntries(Object.entries(s.agents).filter(([k]) => k !== id)),
        }))
      },
      clearAllAgents: () => {
        set({ agents: {} })
      },
      addFileChange: (agentId, change) => {
        set((s) => {
          const agent = s.agents[agentId]
          if (!agent) return s
          const existing = agent.fileChanges ?? []
          const existingIndex = existing.findIndex(fc => fc.filePath === change.filePath)
          let updated: FileChange[]
          if (existingIndex >= 0) {
            updated = [...existing]
            updated[existingIndex] = {
              ...updated[existingIndex],
              after: change.after,
              tool: change.tool,
            }
          } else {
            updated = [...existing, change]
          }
          return { agents: { ...s.agents, [agentId]: { ...agent, fileChanges: updated } } }
        })
      },
      removeFileChanges: (agentId, filePaths) => {
        set((s) => {
          const agent = s.agents[agentId]
          if (!agent) return s
          const revertedSet = new Set(filePaths)
          const updated = (agent.fileChanges ?? []).filter(fc => !revertedSet.has(fc.filePath))
          return { agents: { ...s.agents, [agentId]: { ...agent, fileChanges: updated } } }
        })
      },

      // Plans
      createPlan: (plan) => {
        const newPlan: Plan = { ...plan, createdAt: plan.createdAt || new Date() }
        set((s) => ({ plans: { ...s.plans, [plan.id]: newPlan } }))
        return newPlan
      },
      updatePlan: (id, updates) => {
        set((s) => {
          const plan = s.plans[id]
          if (!plan) return s
          return { plans: { ...s.plans, [id]: { ...plan, ...updates } } }
        })
      },
      deletePlan: (id) => {
        set((s) => ({
          plans: Object.fromEntries(Object.entries(s.plans).filter(([k]) => k !== id)),
        }))
      },
      addTaskToPlan: (planId, taskId) => {
        set((s) => {
          const plan = s.plans[planId]
          if (!plan || plan.taskIds.includes(taskId)) return s
          return {
            plans: { ...s.plans, [planId]: { ...plan, taskIds: [...plan.taskIds, taskId] } },
          }
        })
      },
      removeTaskFromPlan: (planId, taskId) => {
        set((s) => {
          const plan = s.plans[planId]
          if (!plan) return s
          return {
            plans: {
              ...s.plans,
              [planId]: { ...plan, taskIds: plan.taskIds.filter((id) => id !== taskId) },
            },
          }
        })
      },

      // Personas
      createPersona: (persona) => {
        set((s) => ({ personas: [...s.personas, persona] }))
      },
      updatePersona: (id, updates) => {
        set((s) => ({
          personas: s.personas.map((p) => (p.id === id ? { ...p, ...updates } : p)),
        }))
      },
      deletePersona: (id) => {
        set((s) => ({ personas: s.personas.filter((p) => p.id !== id) }))
      },

      // Bulk
      reset: () => set(INITIAL_STATE),

      // UI state
      setWhiteboardOpen: (open) => set({ isWhiteboardOpen: open }),
    }),
    {
      name: 'gekto-store',
      storage: createJSONStorage(() => serverStorage),
      partialize: (state) => ({
        personas: state.personas,
        tasks: state.tasks,
        agents: state.agents,
        plans: state.plans,
      }),
    }
  )
)

// ============ Selectors ============

export const selectTasks = (state: GektoStore) => state.tasks
export const selectTask = (id: string) => (state: GektoStore) => state.tasks[id]
export const selectAgents = (state: GektoStore) => state.agents
export const selectAgent = (id: string) => (state: GektoStore) => state.agents[id]
export const selectPlans = (state: GektoStore) => state.plans
export const selectPlan = (id: string) => (state: GektoStore) => state.plans[id]
export const selectPersonas = (state: GektoStore) => state.personas

// ============ Helper to get agent by task ============

export const selectAgentByTaskId = (taskId: string) => (state: GektoStore) =>
  Object.values(state.agents).find((a) => a.taskId === taskId)
