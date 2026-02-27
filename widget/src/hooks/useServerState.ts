// useServerState — single hook that mirrors server-authoritative state
//
// On connect: receives full state_snapshot
// On mutation: receives state_diff patches
// Components read from `state`, send actions via `send()`

import { useState, useEffect, useCallback, useSyncExternalStore } from 'react'

// ============ Types (mirror server/src/state.ts) ============

export interface Message {
  id: string
  text: string
  sender: 'user' | 'bot' | 'system'
  timestamp: Date | string
  isTerminal?: boolean
  toolUse?: {
    tool: string
    input?: string
    fullInput?: Record<string, unknown>
    status: 'running' | 'completed'
    startTime: Date | string
    endTime?: Date | string
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

export type ExecutionPlanStatus = 'planning' | 'ready' | 'generating_prompts' | 'prompts_ready' | 'executing' | 'completed' | 'failed'

export interface ExecutionPlanTask {
  id: string
  description: string
  prompt: string
  files: string[]
  assignedAgentId?: string
  status: TaskStatus
  dependencies: string[]
  result?: string
  error?: string
}

export interface ExecutionPlan {
  id: string
  status: ExecutionPlanStatus
  originalPrompt: string
  reasoning?: string
  buildPrompt?: string
  tasks: ExecutionPlanTask[]
  createdAt: string
  completedAt?: string
}

export interface GektoAppState {
  plan: ExecutionPlan | null
  tasks: Record<string, Task>
  agents: Record<string, Agent>
  visuals: Record<string, LizardVisual>
  chats: Record<string, Message[]>
  personas: Persona[]
  plans: Record<string, Plan>
}

// ============ State Store (external store for useSyncExternalStore) ============

type Listener = () => void

let currentState: GektoAppState = {
  plan: null,
  tasks: {},
  agents: {},
  visuals: {},
  chats: {},
  personas: [],
  plans: {},
}

const listeners = new Set<Listener>()

function getSnapshot(): GektoAppState {
  return currentState
}

function subscribe(listener: Listener): () => void {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

function emitChange(): void {
  for (const listener of listeners) {
    listener()
  }
}

function setState(newState: GektoAppState): void {
  currentState = newState
  emitChange()
}

function applyDiffs(diffs: Array<{ path: string; value: unknown }>): void {
  // Create a shallow clone at the top level to trigger React re-render
  const next = { ...currentState } as Record<string, unknown>

  for (const { path, value } of diffs) {
    const keys = path.split('.')

    // Clone each level along the path for immutability
    let current = next
    for (let i = 0; i < keys.length - 1; i++) {
      const key = keys[i]
      if (current[key] === undefined || current[key] === null || typeof current[key] !== 'object') {
        current[key] = {}
      } else if (Array.isArray(current[key])) {
        current[key] = [...(current[key] as unknown[])]
      } else {
        current[key] = { ...(current[key] as Record<string, unknown>) }
      }
      current = current[key] as Record<string, unknown>
    }

    const lastKey = keys[keys.length - 1]
    if (value === undefined || value === null) {
      delete current[lastKey]
    } else {
      current[lastKey] = value
    }
  }

  currentState = next as unknown as GektoAppState
  emitChange()
}

// ============ Singleton WebSocket Connection ============

let wsInstance: WebSocket | null = null
let wsConnected = false
const connectionListeners = new Set<Listener>()

function initWebSocket(): void {
  if (wsInstance) return // Already initialized

  const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:'
  const ws = new WebSocket(`${protocol}//${window.location.host}/__gekto/agent`)
  wsInstance = ws

  // Expose globally for backward compat
  ;(window as unknown as { __gektoWebSocket?: WebSocket }).__gektoWebSocket = ws

  ws.onopen = () => {
    wsConnected = true
    for (const l of connectionListeners) l()
    // Request agent list on connect
    ws.send(JSON.stringify({ type: 'list_agents' }))
  }

  ws.onmessage = (event) => {
    try {
      const msg = JSON.parse(event.data)

      switch (msg.type) {
        case 'state_snapshot':
          setState(msg.state)
          break

        case 'state_diff':
          if (msg.diffs && Array.isArray(msg.diffs)) {
            applyDiffs(msg.diffs)
          }
          break

        default:
          // Forward to raw message handler
          if (rawMessageHandler) {
            rawMessageHandler(msg)
          }
          break
      }
    } catch (err) {
      console.error('[useServerState] Failed to parse message:', err)
    }
  }

  ws.onclose = () => {
    wsConnected = false
    wsInstance = null
    ;(window as unknown as { __gektoWebSocket?: WebSocket }).__gektoWebSocket = undefined
    for (const l of connectionListeners) l()
  }

  ws.onerror = (error) => {
    console.error('[useServerState] WebSocket error:', error)
  }
}

// ============ Hook ============

export interface UseServerStateReturn {
  state: GektoAppState
  send: (action: Record<string, unknown>) => void
  isConnected: boolean
  ws: WebSocket | null
}

export function useServerState(): UseServerStateReturn {
  const state = useSyncExternalStore(subscribe, getSnapshot, getSnapshot)
  const [isConnected, setIsConnected] = useState(wsConnected)

  // Initialize WS connection once
  useEffect(() => {
    initWebSocket()

    const listener = () => setIsConnected(wsConnected)
    connectionListeners.add(listener)
    // Sync current state
    setIsConnected(wsConnected)

    return () => {
      connectionListeners.delete(listener)
    }
  }, [])

  const send = useCallback((action: Record<string, unknown>) => {
    if (wsInstance && wsInstance.readyState === WebSocket.OPEN) {
      wsInstance.send(JSON.stringify(action))
    }
  }, [])

  return {
    state,
    send,
    isConnected,
    ws: wsInstance,
  }
}

// ============ Raw Message Handler ============

let rawMessageHandler: ((msg: Record<string, unknown>) => void) | null = null

export function setRawMessageHandler(handler: ((msg: Record<string, unknown>) => void) | null): void {
  rawMessageHandler = handler
}

// ============ Direct state access (for use outside React) ============

export function getServerState(): GektoAppState {
  return currentState
}

export function subscribeToServerState(listener: Listener): () => void {
  return subscribe(listener)
}
