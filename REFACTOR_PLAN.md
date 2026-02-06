# Gekto Refactor Plan

## Goal

Decouple Task and Agent entities. Global store synced with gekto-store, mounted in AgentsContext which handles all server communication.

## Architecture

```
                         Global Store
              (tasks, agents, personas, plans)
                            │
                            │ syncs with gekto-store.json
                            │
                      AgentsContext
              (WebSocket, REST, send/receive)
                            │
       ┌──────────┬─────────┼─────────┬──────────┐
       │          │         │         │          │
       ▼          ▼         ▼         ▼          ▼
 LizardsSwarm Whiteboard   Plan   ChatWindow  (future)
```

## Data Model

```typescript
// Persona - reusable template
interface Persona {
  id: string
  name: string              // "Plain", "Architect"
  systemPrompt: string
  avatar?: string
}

// Task - work item (exists before agent runs)
interface Task {
  id: string
  name: string              // "Add filters"
  description: string       // longer explanation
  prompt: string            // actual prompt for agent
  chatHistory: Message[]
  sessionId?: string        // Claude resume
  status: 'pending' | 'in_progress' | 'review' | 'done' | 'error'
  planId?: string           // optional, standalone if not set
}

// Agent - runtime entity executing a task
interface Agent {
  id: string
  taskId: string            // which task it's working on
  personaId: string         // which persona it uses
  status: 'idle' | 'working' | 'done' | 'error'
}

// Plan - group of tasks
interface Plan {
  id: string
  name: string
  status: 'pending' | 'running' | 'done' | 'canceled'
  taskIds: string[]
}
```

## Flow

```
1. Create Plan
   └── Creates Tasks (pending, no agents yet)

2. Run Plan
   └── For each Task:
       └── Create Agent (taskId + personaId)
       └── Agent starts working

3. Visual consumers show Agents
   └── LizardsSwarm: 3D avatar per agent
   └── Whiteboard: TaskShape per agent
   └── ChatWindow: chat for selected agent (uses task.chatHistory)
```

## Global Store

```typescript
interface GektoStore {
  personas: Persona[]
  tasks: Record<string, Task>
  agents: Record<string, Agent>
  plans: Record<string, Plan>

  // Visual state (lizards only)
  lizards: Record<string, {
    position: { x: number, y: number }
    color: string
  }>
}
```

## AgentsContext Responsibilities

- **Mounts global store** - single source of truth
- **Syncs with gekto-store.json** - persistence
- **WebSocket** - real-time communication with server
- **REST** - chat history persistence
- **Send/receive messages** - agent communication
- **Agent state** - working, idle, error
- **CRUD** - personas, tasks, agents, plans

Does NOT handle:
- Visual positions (LizardsSwarm manages)
- Whiteboard shapes (tldraw manages)

## Storage (gekto-store.json)

```json
{
  "data": {
    "personas": [
      { "id": "plain", "name": "Plain", "systemPrompt": "..." }
    ],
    "tasks": {
      "task_1": {
        "name": "Add filters",
        "description": "Add filters to catalog",
        "prompt": "Implement filters...",
        "chatHistory": [...],
        "sessionId": "abc",
        "status": "done",
        "planId": "plan_1"
      }
    },
    "agents": {
      "agent_1": {
        "taskId": "task_1",
        "personaId": "plain",
        "status": "done"
      }
    },
    "plans": {
      "plan_1": {
        "name": "Build catalog",
        "status": "done",
        "taskIds": ["task_1", "task_2"]
      }
    },
    "lizards": {
      "agent_1": {
        "position": { "x": 100, "y": 200 },
        "color": "#3b82f6"
      }
    }
  }
}
```

## Consumer Responsibilities

### Plan Panel
- Shows tasks grouped by plan
- Create/approve/cancel plans
- Reads tasks and plans from store

### LizardsSwarm
- Shows 3D avatar per **agent**
- Manages positions, colors, selection
- Delete → removes agent (and optionally task)

### Whiteboard
- Shows TaskShape per **agent**
- tldraw manages positions
- Delete → removes agent (and optionally task)

### ChatWindow
- Shows chat for selected agent
- Reads `task.chatHistory` via `agent.taskId`
- Send message → AgentsContext handles

## Migration Steps

1. Define interfaces (Persona, Task, Agent, Plan)
2. Create global store with sync to gekto-store.json
3. Mount store in AgentsContext
4. Move WebSocket/REST logic to AgentsContext
5. Implement CRUD for all entities
6. Update Plan panel to use new store
7. Update LizardsSwarm to consume agents
8. Update Whiteboard to consume agents
9. Update ChatWindow to use task.chatHistory
10. Remove old contexts (SwarmContext, GektoContext)
11. Add sessionId persistence per task
