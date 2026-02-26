// Shared types for agent system

// === Agent Provider Interface ===

export interface AgentProvider {
  send(message: string, callbacks?: StreamCallbacks): Promise<AgentResponse>
  kill(): boolean
  isRunning(): boolean
  getSessionId(): string | null
  setSessionId(id: string): void
  resetSession(): void
}

export interface StreamCallbacks {
  onToolStart?: (tool: string, input?: Record<string, unknown>) => void
  onToolEnd?: (tool: string) => void
  onText?: (text: string) => void
  onFileChange?: (change: FileChange) => void
}

export interface AgentResponse {
  type: string
  subtype: string
  is_error: boolean
  result: string
  session_id: string
  total_cost_usd: number
  duration_ms: number
}

export interface AgentConfig {
  systemPrompt?: string
  workingDir?: string
  disallowedTools?: string[]
}

export interface FileChange {
  tool: 'Write' | 'Edit'
  filePath: string
  before: string | null  // null if file didn't exist
  after: string
}

// === Gekto Types ===

export interface Task {
  id: string
  description: string
  prompt: string
  files: string[]
  status: 'pending' | 'in_progress' | 'pending_testing' | 'completed' | 'failed'
  dependencies: string[]
}

export interface ExecutionPlan {
  id: string
  status: 'planning' | 'ready' | 'generating_prompts' | 'prompts_ready' | 'executing' | 'completed' | 'failed'
  originalPrompt: string
  reasoning?: string
  buildPrompt?: string
  tasks: Task[]
  createdAt: string
}

export interface GektoToolResult {
  type: 'chat' | 'build' | 'remove'
  message?: string
  plan?: ExecutionPlan
  removedAgents?: string[]
}
