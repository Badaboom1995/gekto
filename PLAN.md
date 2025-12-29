# Gekto Architecture Plan

## Overview

Gekto is a developer tool that runs as `npx gekto` in any project directory. It provides a proxy server that injects a React widget overlay into the user's app, enabling browser-based terminal access and AI agent orchestration with full file system access.

```
┌─────────────────────────────────────────────────────────────────────┐
│                         User's Browser                               │
│  ┌─────────────────────────────────────────────────────────────┐    │
│  │              User's App (React, Vue, etc.)                  │    │
│  │  ┌───────────────────────────────────────────────────────┐  │    │
│  │  │          Gekto Widget (React, injected)               │  │    │
│  │  │  • Floating bubbles UI                                │  │    │
│  │  │  • Terminal panels                                    │  │    │
│  │  │  • Agent management                                   │  │    │
│  │  └───────────────────────────────────────────────────────┘  │    │
│  └─────────────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────────────┘
                              │ WebSocket + HTTP
                              ▼
┌─────────────────────────────────────────────────────────────────────┐
│                    Gekto Proxy Server (Node.js)                      │
│  ┌──────────────┐  ┌──────────────┐  ┌────────────────────────┐     │
│  │ HTTP Proxy   │  │  WebSocket   │  │   Agent Orchestrator   │     │
│  │ + Injection  │  │   Server     │  │  • Claude Code         │     │
│  └──────────────┘  └──────────────┘  │  • Codex               │     │
│                                       │  • Gemini API          │     │
│                                       │  • Custom agents       │     │
│                                       └────────────────────────┘     │
│  ┌──────────────────────────────────────────────────────────────┐   │
│  │                    PTY Manager (node-pty)                     │   │
│  │  • Spawns real terminals                                      │   │
│  │  • Manages multiple sessions                                  │   │
│  │  • Full file system access                                    │   │
│  └──────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────────┐
│                      User's Project Directory                        │
│  • Full read/write access                                           │
│  • Git operations                                                   │
│  • Package management                                               │
└─────────────────────────────────────────────────────────────────────┘
```

## How It Works

### The Core Idea

Gekto is a single npx command that spins up a proxy server in the user's project directory. When the user opens the proxy URL in their browser, they see their normal app (React, Vue, whatever) but with the widget overlay injected on top. The proxy intercepts HTML responses and injects the widget's JavaScript and CSS before the closing `</body>` tag.

### The Communication Layer

The proxy server does more than just inject code - it also runs a WebSocket server and a PTY (pseudo-terminal) manager. The widget in the browser connects back to this WebSocket to request real terminal sessions. When the user opens a terminal in the widget, the server spawns an actual shell process using node-pty, and streams the input/output over WebSocket. This means the user can run `claude`, `codex`, or any CLI tool directly from the browser widget, with full access to their project files.

### Agent Orchestration

On top of raw terminals, there's an Agent Orchestrator layer. This lets you programmatically spawn and manage AI agents - start Claude Code with a specific system prompt, run Codex for a different task, or call Gemini's API directly for tasks where CLI agents underperform. The orchestrator can run multiple agents in parallel, route tasks to the best-suited model, and aggregate their outputs. The widget UI shows these as cards or bubbles that users can interact with.

### Developer Experience

The project is a monorepo with four packages: `cli` (the npx entry point), `server` (proxy + WebSocket + agents), `widget` (React + Tailwind, built as a single IIFE bundle), and `shared` (TypeScript types). There's also a `playground` test app. During development, you run the playground on port 5173, the proxy on port 3200, and the widget in watch mode - Turborepo orchestrates all of this with a single `pnpm dev` command. The widget uses Shadow DOM so its styles never clash with the user's app. When you publish, users just run `npx gekto` and everything works.

## Project Structure

```
gekto/
├── packages/
│   ├── cli/                      # npx entry point
│   │   ├── src/
│   │   │   ├── index.ts          # CLI entry
│   │   │   └── commands/
│   │   │       └── start.ts
│   │   ├── package.json          # name: "gekto"
│   │   └── tsconfig.json
│   │
│   ├── server/                   # Proxy + WebSocket + Agent orchestration
│   │   ├── src/
│   │   │   ├── index.ts
│   │   │   ├── proxy/
│   │   │   │   ├── http-proxy.ts
│   │   │   │   └── injector.ts
│   │   │   ├── websocket/
│   │   │   │   ├── server.ts
│   │   │   │   └── handlers/
│   │   │   │       ├── terminal.ts
│   │   │   │       └── agent.ts
│   │   │   ├── agents/
│   │   │   │   ├── orchestrator.ts
│   │   │   │   ├── base-agent.ts
│   │   │   │   ├── claude-code.ts
│   │   │   │   ├── codex.ts
│   │   │   │   └── gemini.ts
│   │   │   ├── pty/
│   │   │   │   └── manager.ts
│   │   │   └── config/
│   │   │       └── schema.ts
│   │   ├── package.json
│   │   └── tsconfig.json
│   │
│   ├── widget/                   # React widget (injected into user's app)
│   │   ├── src/
│   │   │   ├── main.tsx          # Entry, mounts to shadow DOM
│   │   │   ├── App.tsx
│   │   │   ├── components/
│   │   │   │   ├── Bubble.tsx
│   │   │   │   ├── Panel.tsx
│   │   │   │   ├── Terminal.tsx
│   │   │   │   ├── AgentCard.tsx
│   │   │   │   └── ...
│   │   │   ├── hooks/
│   │   │   │   ├── useWebSocket.ts
│   │   │   │   ├── useTerminal.ts
│   │   │   │   └── useAgents.ts
│   │   │   ├── stores/           # Zustand for state
│   │   │   │   ├── terminal.ts
│   │   │   │   └── agents.ts
│   │   │   └── styles/
│   │   │       └── index.css     # Tailwind
│   │   ├── vite.config.ts        # Builds IIFE bundle
│   │   ├── package.json
│   │   ├── tailwind.config.js
│   │   └── tsconfig.json
│   │
│   └── shared/                   # Shared types & utilities
│       ├── src/
│       │   ├── types/
│       │   │   ├── agent.ts
│       │   │   ├── terminal.ts
│       │   │   └── messages.ts
│       │   └── utils/
│       ├── package.json
│       └── tsconfig.json
│
├── apps/
│   └── playground/               # Test React app for DX
│       ├── src/
│       │   ├── main.tsx
│       │   └── App.tsx
│       ├── vite.config.ts
│       └── package.json
│
├── package.json                  # Workspace root (pnpm workspaces)
├── pnpm-workspace.yaml
├── turbo.json                    # Build orchestration
└── tsconfig.base.json
```

## Key Design Decisions

### 1. Monorepo with Workspaces

Use pnpm workspaces + Turborepo for efficient builds. Shared types between server and widget. Single `pnpm build` builds everything in correct order.

### 2. Widget Isolation (Shadow DOM)

```tsx
// widget/src/main.tsx
const container = document.createElement('div');
container.id = 'gekto-root';
document.body.appendChild(container);

const shadow = container.attachShadow({ mode: 'open' });
// Inject Tailwind CSS into shadow DOM
// Mount React here - fully isolated from user's app
```

### 3. WebSocket Protocol

```typescript
// shared/src/types/messages.ts
type Message =
  | { type: 'terminal:input'; sessionId: string; data: string }
  | { type: 'terminal:output'; sessionId: string; data: string }
  | { type: 'terminal:create'; shell?: string }
  | { type: 'agent:start'; agentType: string; config: AgentConfig }
  | { type: 'agent:output'; agentId: string; data: string }
  | { type: 'agent:status'; agentId: string; status: AgentStatus }
  | { type: 'file:watch'; patterns: string[] }
  | { type: 'file:changed'; path: string };
```

### 4. Agent Orchestrator Pattern

```typescript
// server/src/agents/orchestrator.ts
class AgentOrchestrator {
  private agents: Map<string, BaseAgent> = new Map();

  async spawn(type: 'claude' | 'codex' | 'gemini', config: AgentConfig) {
    const agent = AgentFactory.create(type, config);
    await agent.start();
    this.agents.set(agent.id, agent);
    return agent;
  }

  async delegate(task: Task) {
    // Smart routing - e.g., use Gemini for specific tasks
    const agent = this.selectBestAgent(task);
    return agent.execute(task);
  }
}
```

### 5. DX: Development Mode

```bash
# Terminal 1: Run test app
pnpm --filter playground dev  # localhost:5173

# Terminal 2: Run widget in watch mode
pnpm --filter widget dev      # Rebuilds on change

# Terminal 3: Run proxy
pnpm --filter server dev      # localhost:3200, proxies 5173
```

Or with Turbo (single command):

```bash
pnpm dev  # Runs all in parallel with proper deps
```

### 6. Publishing & Usage

```bash
# User runs in their project:
npx gekto --port 3200 --target 5173

# Or with config file (gekto.config.js):
npx gekto
```

## Tech Stack

| Layer | Technology |
|-------|------------|
| CLI | Commander.js, chalk |
| Server | Node.js, Express, ws, node-pty |
| Widget | React 18, Zustand, Tailwind, xterm.js |
| Build | Vite (widget IIFE), tsup (server/cli), Turborepo |
| Types | TypeScript, Zod (validation) |
| Package Manager | pnpm workspaces |

## Implementation Steps

### Phase 1: Foundation
1. Initialize pnpm workspace and Turborepo config
2. Set up shared TypeScript configuration
3. Create CLI skeleton with Commander.js
4. Port proxy server to TypeScript with configurable ports

### Phase 2: Core Infrastructure
5. Add WebSocket server alongside HTTP proxy
6. Implement PTY manager with node-pty
7. Create basic widget scaffold with React + Tailwind + Shadow DOM
8. Integrate xterm.js for terminal rendering

### Phase 3: Widget UI
9. Build terminal component with WebSocket connection
10. Create bubble/panel UI for widget overlay
11. Add state management with Zustand
12. Style with Tailwind (scoped to Shadow DOM)

### Phase 4: Agent System
13. Define base agent interface
14. Implement Claude Code agent (spawns CLI)
15. Implement Codex agent
16. Add Gemini API agent for programmatic tasks
17. Build orchestrator for multi-agent coordination

### Phase 5: Polish & Publish
18. Create playground app for development testing
19. Add configuration file support (gekto.config.js)
20. Write documentation
21. Publish to npm
