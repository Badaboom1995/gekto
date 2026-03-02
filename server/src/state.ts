// Server-authoritative state — THE single source of truth
//
// All durable state lives here. Widget receives a full snapshot on connect
// and incremental diffs on every mutation. Persisted to gekto-store.json.

import fs from 'fs'
import path from 'path'
import type { WebSocket } from 'ws'
import type { FileChange, ExecutionPlan } from './agents/types.js'

// ============ State Shape ============

export interface Message {
  id: string
  text: string
  sender: 'user' | 'bot' | 'system'
  timestamp: string // ISO string for serialization
  isTerminal?: boolean
  images?: string[]
  toolUse?: {
    tool: string
    input?: string
    fullInput?: Record<string, unknown>
    status: 'running' | 'completed'
    startTime: string
    endTime?: string
  }
  systemType?: 'mode' | 'status' | 'info'
  systemData?: Record<string, unknown>
  isStreaming?: boolean
}

export interface Persona {
  id: string
  name: string
  systemPrompt: string
  avatar?: string
}

export type TaskStatus = 'pending' | 'in_progress' | 'pending_testing' | 'completed' | 'failed'

export interface Task {
  id: string
  name: string
  description: string
  prompt: string
  status: TaskStatus
  planId?: string
  files?: string[]
  assignedAgentId?: string
  dependencies?: string[]
  result?: string
  error?: string
  sessionId?: string
}

export type AgentStatus = 'idle' | 'working' | 'done' | 'pending' | 'error'

export interface Agent {
  id: string
  taskId: string
  personaId: string
  status: AgentStatus
  fileChanges?: FileChange[]
}

export type PlanStatus = 'executing' | 'completed' | 'failed' | 'canceled'

export interface Plan {
  id: string
  name: string
  status: PlanStatus
  taskIds: string[]
  originalPrompt?: string
  createdAt: string
  completedAt?: string
}

export interface LizardVisual {
  position: { x: number; y: number }
  color: string
}

export interface GektoSession {
  id: string
  title: string
  messages: Message[]
  plan?: ExecutionPlan
  gektoSessionId: string
  createdAt: string
}

export interface GektoAppState {
  plan: ExecutionPlan | null
  tasks: Record<string, Task>
  agents: Record<string, Agent>
  visuals: Record<string, LizardVisual>
  chats: Record<string, Message[]>
  personas: Persona[]
  plans: Record<string, Plan>
  gektoSessions: GektoSession[]
}

// ============ Default Values ============

const DEFAULT_PERSONAS: Persona[] = [
  { id: 'plain', name: 'Plain', systemPrompt: 'You are a helpful coding assistant.' },
  { id: 'architect', name: 'Architect', systemPrompt: 'You are a senior software architect. Focus on system design, patterns, and best practices.' },
  { id: 'codekeeper', name: 'Codekeeper', systemPrompt: 'You are a meticulous code reviewer. Focus on code quality, bugs, and improvements.' },
]

function createEmptyState(): GektoAppState {
  return {
    plan: null,
    tasks: {},
    agents: {},
    visuals: {},
    chats: {},
    personas: DEFAULT_PERSONAS,
    plans: {},
    gektoSessions: [],
  }
}

// ============ Persistence ============

const STORE_FILENAME = 'gekto-store.json'

function getStorePath(): string {
  return path.join(process.cwd(), STORE_FILENAME)
}

// ============ In-Memory State ============

let state: GektoAppState = createEmptyState()

// Connected WebSocket clients for broadcasting diffs
const connectedClients = new Set<WebSocket>()

// ============ Public API ============

/** Load state from disk or create empty. Call once at startup. */
export function initState(): void {
  const storePath = getStorePath()
  try {
    if (fs.existsSync(storePath)) {
      const raw = fs.readFileSync(storePath, 'utf8')
      const stored = JSON.parse(raw)

      // Support both old format (version/data wrapper) and new format (direct state)
      if (stored.version && stored.data) {
        // Old format — migrate
        const data = stored.data as Record<string, unknown>
        state = createEmptyState()

        // Migrate old store data
        if (data.store && typeof data.store === 'object') {
          const oldStore = data.store as Record<string, unknown>
          if (oldStore.tasks) state.tasks = oldStore.tasks as Record<string, Task>
          if (oldStore.agents) state.agents = oldStore.agents as Record<string, Agent>
          if (oldStore.plans) state.plans = oldStore.plans as Record<string, Plan>
          if (oldStore.personas) state.personas = oldStore.personas as Persona[]
        }

        // Migrate lizards → visuals
        if (Array.isArray(data.lizards)) {
          for (const l of data.lizards as Array<{ id: string; position: { x: number; y: number }; settings?: { color?: string } }>) {
            state.visuals[l.id] = {
              position: l.position,
              color: l.settings?.color || '#BFFF6B',
            }
          }
        }

        // Migrate chats
        if (data.chats && typeof data.chats === 'object') {
          state.chats = data.chats as Record<string, Message[]>
        }

        // Persist in new format
        persistState()
      } else {
        // New format — load directly
        state = { ...createEmptyState(), ...stored }
      }
    }
  } catch (err) {
    console.error('[State] Failed to load state, starting fresh:', err)
    state = createEmptyState()
  }
}

/** Return a readonly reference to current state. */
export function getState(): GektoAppState {
  return state
}

/**
 * Apply a mutation to state, persist to disk, and broadcast diff to all
 * connected WebSocket clients.
 *
 * @param path  Dot-separated path into state (e.g. "tasks.task_1.status")
 * @param value The new value to set at that path
 */
export function mutate(path: string, value: unknown): void {
  setNestedValue(state as unknown as Record<string, unknown>, path, value)
  persistState()
  broadcastDiff(path, value)
}

/**
 * Apply multiple mutations atomically — single persist + single diff broadcast.
 */
export function mutateBatch(mutations: Array<{ path: string; value: unknown }>): void {
  for (const { path, value } of mutations) {
    setNestedValue(state as unknown as Record<string, unknown>, path, value)
  }
  persistState()

  // Broadcast all diffs as a batch
  const msg = JSON.stringify({
    type: 'state_diff',
    diffs: mutations.map(m => ({ path: m.path, value: m.value })),
  })
  for (const client of connectedClients) {
    if (client.readyState === 1) { // WebSocket.OPEN
      client.send(msg)
    }
  }
}

/** Register a WebSocket client for receiving diffs. */
export function addClient(ws: WebSocket): void {
  connectedClients.add(ws)
}

/** Unregister a WebSocket client. */
export function removeClient(ws: WebSocket): void {
  connectedClients.delete(ws)
}

/** Send full state snapshot to a single client. */
export function sendSnapshot(ws: WebSocket): void {
  if (ws.readyState === 1) {
    ws.send(JSON.stringify({
      type: 'state_snapshot',
      state,
    }))
  }
}

/** Get set of connected clients (for broadcasts outside of mutate). */
export function getClients(): Set<WebSocket> {
  return connectedClients
}

// ============ Helpers ============

function setNestedValue(obj: Record<string, unknown>, path: string, value: unknown): void {
  const keys = path.split('.')
  let current = obj as Record<string, unknown>
  for (let i = 0; i < keys.length - 1; i++) {
    const key = keys[i]
    if (current[key] === undefined || current[key] === null || typeof current[key] !== 'object') {
      current[key] = {}
    }
    current = current[key] as Record<string, unknown>
  }
  const lastKey = keys[keys.length - 1]
  if (value === undefined) {
    delete current[lastKey]
  } else {
    current[lastKey] = value
  }
}

function persistState(): void {
  try {
    const storePath = getStorePath()
    fs.writeFileSync(storePath, JSON.stringify(state, null, 2), 'utf8')
  } catch (err) {
    console.error('[State] Failed to persist state:', err)
  }
}

function broadcastDiff(path: string, value: unknown): void {
  const msg = JSON.stringify({
    type: 'state_diff',
    diffs: [{ path, value }],
  })
  for (const client of connectedClients) {
    if (client.readyState === 1) { // WebSocket.OPEN
      client.send(msg)
    }
  }
}
