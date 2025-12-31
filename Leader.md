# Leader-Worker Agent System

## Architecture Overview

```
┌─────────────────────────────────────────────────────────┐
│                    Your Widget UI                        │
├─────────────────────────────────────────────────────────┤
│  ┌─────────────┐                                        │
│  │ Green Lizard │  ← Chat Interface (Leader Agent)      │
│  │   (Leader)   │     You type: "build catalog page"    │
│  └──────┬──────┘                                        │
│         │                                               │
│         ▼                                               │
│  ┌─────────────────────────────────────────────┐       │
│  │ Leader responds with JSON plan:              │       │
│  │ {                                            │       │
│  │   "tasks": [                                 │       │
│  │     { "role": "API Dev", "files": [...] },  │       │
│  │     { "role": "UI Dev", "files": [...] },   │       │
│  │     { "role": "Stylist", "files": [...] }   │       │
│  │   ]                                          │       │
│  │ }                                            │       │
│  └─────────────────────────────────────────────┘       │
│         │                                               │
│         ▼  Your script spawns workers                   │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐              │
│  │ 🦎 Blue   │  │ 🦎 Red    │  │ 🦎 Yellow │              │
│  │ API Dev  │  │ UI Dev   │  │ Stylist  │              │
│  │ [term]   │  │ [term]   │  │ [term]   │              │
│  │ ●working │  │ ⏸ waiting│  │ ✓ done   │              │
│  └──────────┘  └──────────┘  └──────────┘              │
└─────────────────────────────────────────────────────────┘
```

## How It Works

### 1. User Input Flow
1. User types in chat: "build catalog page"
2. Your script wraps it with system prompt for Leader Agent
3. Leader Agent (Claude Code) receives enhanced prompt

### 2. Leader Agent System Prompt
```
You are a Lead Developer coordinating a team of parallel Claude Code agents.

When given a task:
1. Analyze the task and split it into parallel sub-tasks
2. Ensure sub-tasks work on DIFFERENT files (no conflicts)
3. Define clear roles and responsibilities
4. Respond ONLY with JSON in this format:

{
  "plan": "Brief description of the approach",
  "tasks": [
    {
      "id": 1,
      "role": "API Developer",
      "color": "blue",
      "description": "Create API endpoints for catalog",
      "files": ["src/api/catalog.ts", "src/types/catalog.ts"],
      "prompt": "Create REST API endpoints for catalog: GET /api/catalog, GET /api/catalog/:id..."
    },
    {
      "id": 2,
      "role": "UI Developer",
      "color": "red",
      "description": "Build catalog page components",
      "files": ["src/pages/Catalog.tsx", "src/components/CatalogItem.tsx"],
      "prompt": "Create React components for catalog page with grid layout..."
    }
  ],
  "sequence": "parallel"  // or "sequential" if tasks depend on each other
}

RULES:
- Maximum 4 parallel agents
- Files arrays MUST NOT overlap between tasks
- Each task should be completable independently
- Be specific in prompts - include file paths and requirements
```

### 3. Worker Agent Lifecycle

```
┌─────────────────────────────────────────────────────────┐
│                    Worker States                         │
├─────────────────────────────────────────────────────────┤
│                                                         │
│   ⚪ IDLE        → Agent spawned, waiting for task      │
│       │                                                 │
│       ▼                                                 │
│   🔵 WORKING     → Executing task, streaming output     │
│       │                                                 │
│       ├──────────────────────┐                         │
│       ▼                      ▼                         │
│   🟡 WAITING_INPUT      ✅ COMPLETED                   │
│   (needs permission)     (task done)                    │
│       │                      │                         │
│       ▼                      ▼                         │
│   [User responds]       [Report to Leader]              │
│       │                                                 │
│       └──► Back to WORKING                             │
│                                                         │
│   🔴 ERROR       → Something went wrong                 │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

## Implementation Components

### Server Side (node-pty)

```typescript
// src/agents/types.ts
interface AgentTask {
  id: number
  role: string
  color: string
  description: string
  files: string[]
  prompt: string
}

interface AgentStatus {
  id: number
  state: 'idle' | 'working' | 'waiting_input' | 'completed' | 'error'
  output: string
  progress?: string
}

interface LeaderPlan {
  plan: string
  tasks: AgentTask[]
  sequence: 'parallel' | 'sequential'
}
```

```typescript
// src/agents/AgentManager.ts
import * as pty from 'node-pty'

class AgentManager {
  private agents: Map<number, ClaudeAgent> = new Map()
  private leaderAgent: ClaudeAgent | null = null

  // Spawn the leader agent (green lizard)
  async spawnLeader(workingDir: string): Promise<void>

  // Send user prompt to leader, get back plan
  async planTask(userPrompt: string): Promise<LeaderPlan>

  // Spawn worker agents based on plan
  async spawnWorkers(plan: LeaderPlan): Promise<void>

  // Monitor agent status
  getStatus(): AgentStatus[]

  // Handle permission requests
  async respondToAgent(agentId: number, response: string): Promise<void>
}
```

```typescript
// src/agents/ClaudeAgent.ts
class ClaudeAgent {
  private pty: pty.IPty
  private buffer: string = ''
  private state: AgentState = 'idle'
  private onStatusChange: (status: AgentStatus) => void

  constructor(config: AgentConfig) {
    this.pty = pty.spawn('claude', ['--dangerously-skip-permissions'], {
      name: 'xterm-256color',
      cols: 120,
      rows: 40,
      cwd: config.workingDir,
      env: process.env,
    })

    this.pty.onData((data) => {
      this.buffer += data
      this.parseOutput(data)
    })
  }

  private parseOutput(data: string) {
    // Detect state changes:
    // - "waiting for input" → state = 'waiting_input'
    // - Tool calls finishing → track progress
    // - Prompt returning → state = 'idle' (completed)

    // Strip ANSI codes for analysis
    const clean = stripAnsi(data)

    if (clean.includes('Do you want to proceed?') ||
        clean.includes('[y/N]')) {
      this.state = 'waiting_input'
      this.onStatusChange(this.getStatus())
    }

    if (clean.includes('❯') && this.state === 'working') {
      this.state = 'completed'
      this.onStatusChange(this.getStatus())
    }
  }

  sendPrompt(prompt: string): void {
    this.state = 'working'
    this.buffer = ''
    this.pty.write(prompt + '\r')
  }

  respond(input: string): void {
    this.state = 'working'
    this.pty.write(input + '\r')
  }
}
```

### WebSocket Protocol

```typescript
// Client → Server messages
interface ClientMessage {
  type: 'chat' | 'respond' | 'abort'
  agentId?: number
  content: string
}

// Server → Client messages
interface ServerMessage {
  type: 'plan' | 'status' | 'output' | 'completed' | 'error'
  agentId?: number
  data: any
}

// Example flow:
// 1. Client sends: { type: 'chat', content: 'build catalog page' }
// 2. Server sends: { type: 'plan', data: LeaderPlan }
// 3. Server sends: { type: 'status', agentId: 1, data: { state: 'working' } }
// 4. Server sends: { type: 'output', agentId: 1, data: '...' }
// 5. Server sends: { type: 'status', agentId: 2, data: { state: 'waiting_input' } }
// 6. Client sends: { type: 'respond', agentId: 2, content: 'y' }
// 7. Server sends: { type: 'completed', agentId: 1, data: { success: true } }
```

### Widget UI Components

```tsx
// LizardAgent.tsx - Individual agent card
interface LizardAgentProps {
  id: number
  color: string
  role: string
  state: AgentState
  output: string
  onRespond?: (response: string) => void
}

function LizardAgent({ id, color, role, state, output, onRespond }: LizardAgentProps) {
  return (
    <div className={`lizard-agent lizard-${color}`}>
      <div className="lizard-header">
        <Lizard color={color} />
        <span className="role">{role}</span>
        <StatusIndicator state={state} />
      </div>

      <div className="terminal-output">
        <XTerminal output={output} />
      </div>

      {state === 'waiting_input' && (
        <div className="input-prompt">
          <button onClick={() => onRespond?.('y')}>Yes</button>
          <button onClick={() => onRespond?.('n')}>No</button>
          <input
            placeholder="Custom response..."
            onKeyDown={(e) => {
              if (e.key === 'Enter') onRespond?.(e.currentTarget.value)
            }}
          />
        </div>
      )}
    </div>
  )
}
```

```tsx
// AgentSwarm.tsx - Container for all agents
function AgentSwarm() {
  const [plan, setPlan] = useState<LeaderPlan | null>(null)
  const [agents, setAgents] = useState<AgentStatus[]>([])
  const ws = useWebSocket('/__gekto/agents')

  const sendTask = (prompt: string) => {
    ws.send({ type: 'chat', content: prompt })
  }

  return (
    <div className="agent-swarm">
      {/* Leader Agent - Chat Interface */}
      <LeaderChat onSubmit={sendTask} plan={plan} />

      {/* Worker Agents Grid */}
      <div className="workers-grid">
        {agents.map(agent => (
          <LizardAgent
            key={agent.id}
            {...agent}
            onRespond={(response) => {
              ws.send({ type: 'respond', agentId: agent.id, content: response })
            }}
          />
        ))}
      </div>

      {/* Overall Progress */}
      <ProgressBar agents={agents} />
    </div>
  )
}
```

## Detecting Agent States

### Pattern Matching for Claude Code Output

```typescript
const STATE_PATTERNS = {
  // Waiting for user input
  PERMISSION_REQUEST: /Do you want to (proceed|allow|run)/i,
  YES_NO_PROMPT: /\[y\/N\]|\[Y\/n\]/,
  QUESTION: /\?\s*$/,

  // Working indicators
  TOOL_CALL: /⠋|⠙|⠹|⠸|⠼|⠴|⠦|⠧|⠇|⠏/,  // Spinner
  READING: /Reading .+\.\.\./,
  WRITING: /Writing to .+/,
  RUNNING: /Running .+/,

  // Completion indicators
  PROMPT_READY: /❯\s*$/,
  TASK_COMPLETE: /✓|Done|Completed/i,

  // Error indicators
  ERROR: /Error:|Failed:|✗/i,
}

function detectState(output: string): AgentState {
  const clean = stripAnsi(output)
  const lastLines = clean.split('\n').slice(-5).join('\n')

  if (STATE_PATTERNS.PERMISSION_REQUEST.test(lastLines) ||
      STATE_PATTERNS.YES_NO_PROMPT.test(lastLines)) {
    return 'waiting_input'
  }

  if (STATE_PATTERNS.ERROR.test(lastLines)) {
    return 'error'
  }

  if (STATE_PATTERNS.PROMPT_READY.test(lastLines)) {
    return 'completed'
  }

  if (STATE_PATTERNS.TOOL_CALL.test(lastLines) ||
      STATE_PATTERNS.READING.test(lastLines)) {
    return 'working'
  }

  return 'idle'
}
```

## File Structure

```
server/src/
├── agents/
│   ├── types.ts           # Type definitions
│   ├── ClaudeAgent.ts     # Single agent wrapper
│   ├── AgentManager.ts    # Orchestrates all agents
│   ├── LeaderPrompt.ts    # System prompt for leader
│   └── stateDetector.ts   # Output parsing logic
├── terminal.ts            # Existing terminal WS
└── proxy.ts               # Existing proxy

widget/src/
├── components/
│   ├── LizardAgent.tsx    # Individual agent UI
│   ├── AgentSwarm.tsx     # Container component
│   ├── LeaderChat.tsx     # Chat with leader
│   └── XTerminal.tsx      # Existing terminal
└── hooks/
    └── useAgentManager.ts # Client-side state
```

## Next Steps

1. **Phase 1**: Create `ClaudeAgent` class with node-pty
2. **Phase 2**: Build `AgentManager` for spawning/tracking agents
3. **Phase 3**: Add WebSocket endpoint for agent communication
4. **Phase 4**: Create UI components for agent visualization
5. **Phase 5**: Implement Leader Agent system prompt
6. **Phase 6**: Add state detection and permission handling
