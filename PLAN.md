# Gekto Architecture Plan

## Overview

Gekto is a developer tool that injects a React widget overlay into any web app via a proxy server. Future versions will enable browser-based terminal access and AI agent orchestration.

```
┌─────────────────────────────────────────────────────────────────────┐
│                         User's Browser                               │
│  ┌─────────────────────────────────────────────────────────────┐    │
│  │              User's App (React, Vue, etc.)                  │    │
│  │  ┌───────────────────────────────────────────────────────┐  │    │
│  │  │          Gekto Widget (React, injected)               │  │    │
│  │  │  • Floating UI overlay                                │  │    │
│  │  │  • Shadow DOM isolated                                │  │    │
│  │  └───────────────────────────────────────────────────────┘  │    │
│  └─────────────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────────────┘
                              │ HTTP
                              ▼
┌─────────────────────────────────────────────────────────────────────┐
│                    Gekto Proxy Server (Bun)                         │
│  ┌──────────────────────────────────────────────────────────────┐   │
│  │ HTTP Proxy + HTML Injection                                   │   │
│  │ • Intercepts HTML responses                                   │   │
│  │ • Injects widget script before </body>                        │   │
│  │ • Proxies WebSocket for HMR                                   │   │
│  └──────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────────┐
│                      Target App (any port)                          │
└─────────────────────────────────────────────────────────────────────┘
```

## Current Implementation

### Project Structure

```
gekto/
├── server/                    # Proxy server
│   ├── src/
│   │   └── proxy.ts          # HTTP proxy with widget injection
│   └── package.json
│
├── widget/                    # React widget (injected into user's app)
│   ├── src/
│   │   ├── main.tsx          # Entry, mounts to Shadow DOM
│   │   ├── App.tsx           # Widget UI
│   │   └── index.css         # Tailwind styles
│   ├── vite.config.ts        # Builds IIFE bundle
│   └── package.json
│
├── test-app/                  # Test React app for development
│   └── ...
│
├── scripts/
│   └── bundle.ts             # Creates distributable bundle
│
├── dist/                      # Bundled output (single file)
│   └── gekto.ts              # Self-contained proxy + embedded widget
│
└── package.json               # Workspace root (bun workspaces)
```

### How It Works

1. **Proxy Server** - Intercepts all HTTP requests to target app
2. **HTML Injection** - Detects HTML responses and injects widget script before `</body>`
3. **Widget Loading** - In dev mode, loads from Vite dev server (HMR). In production, widget is embedded in proxy
4. **Shadow DOM** - Widget renders in isolated Shadow DOM to prevent style conflicts

### Scripts

```bash
# Development (with HMR for both test-app and widget)
bun run dev

# Preview production build
bun run preview

# Build widget + server
bun run build

# Create distributable bundle
bun run bundle
```

### Using the Bundle

```bash
# Build the distributable
bun run bundle

# Copy dist/gekto.ts to any project and run:
bun gekto.ts --target 3000

# Options:
#   -t, --target  Target app port (required)
#   -p, --port    Proxy port (default: 3200)
#   -h, --help    Show help
```

### Key Design Decisions

#### 1. Widget Isolation (Shadow DOM)

```tsx
// widget/src/main.tsx
const container = document.createElement('div');
container.id = 'gekto-root';
document.body.appendChild(container);

const shadow = container.attachShadow({ mode: 'open' });
// Inject Tailwind CSS into shadow DOM
// Mount React here - fully isolated from user's app
```

#### 2. Dev vs Production Mode

- **Dev mode** (`GEKTO_DEV=1`): Widget loads from Vite dev server for HMR
- **Production mode** (default): Widget is embedded as base64 in the proxy script

#### 3. Single File Distribution

The `bun run bundle` command creates a self-contained `gekto.ts` file with:
- Full proxy server code
- Widget bundle embedded as base64
- CLI argument parsing

## Tech Stack

| Layer | Technology |
|-------|------------|
| Runtime | Bun |
| Server | Node.js http module |
| Widget | React 19, Tailwind CSS v4 |
| Build | Vite (widget IIFE) |
| Package Manager | bun workspaces |

## Implementation Progress

### Phase 1: Foundation ✅
- [x] Set up bun workspace
- [x] Create proxy server with HTML injection
- [x] Create widget with React + Tailwind + Shadow DOM
- [x] Dev mode with HMR support
- [x] Production build with embedded widget

### Phase 2: Distribution ✅
- [x] CLI argument parsing (--target, --port, --help)
- [x] Bundle script for single-file distribution
- [x] Base64 widget embedding

### Phase 3: Future - Core Infrastructure
- [ ] Add WebSocket server for bidirectional communication
- [ ] Implement PTY manager with node-pty
- [ ] Integrate xterm.js for terminal rendering

### Phase 4: Future - Widget UI
- [ ] Build terminal component with WebSocket connection
- [ ] Create bubble/panel UI for widget overlay
- [ ] Add state management with Zustand

### Phase 5: Future - Agent System
- [ ] Define base agent interface
- [ ] Implement Claude Code agent (spawns CLI)
- [ ] Implement Codex agent
- [ ] Add Gemini API agent
- [ ] Build orchestrator for multi-agent coordination

### Phase 6: Future - Polish & Publish
- [ ] Publish to npm (`npx gekto`)
- [ ] Configuration file support (gekto.config.js)
- [ ] Documentation

---

# Whiteboard Integration - 3 Parallel Agents

Based on CANVAS.md, here's the plan for 3 parallel agents to implement whiteboard task cards.

---

## Agent 1: TaskShape Enhancement

**Goal**: Update TaskShape component with new props and UI to match the mockup design.

**File**: `widget/src/components/whiteboard/TaskShape.tsx`

### Tasks:

1. **Update TaskShape type definition** - Replace old props with:
   ```typescript
   {
     w: number
     h: number
     title: string
     abstract: string       // NEW - summary of work done
     branch?: string        // NEW - worktree branch name (optional)
     status: 'READ' | 'WRITE' | 'BASH' | 'GREP' | 'EDIT' | 'done' | 'error' | 'pending'
     message?: string       // NEW - bottom zone for errors/results
     agentId?: string       // NEW - link to agent in AgentStore
   }
   ```

2. **Update UI to match mockup**:
   ```
   ┌─────────────────────────────┐
   │ [STATUS]         Task Title │  ← status badge + title
   ├─────────────────────────────┤
   │ Abstract of what was done   │  ← summary of work
   ├─────────────────────────────┤
   │ 📁 feature/auth-flow        │  ← worktree branch (optional)
   ├─────────────────────────────┤
   │ [Web] [diff]        [more]  │  ← action buttons
   ├─────────────────────────────┤
   │ Agent stopped. Out of tokens│  ← message zone
   └─────────────────────────────┘
   ```

3. **Status badge colors**:
   - Running tools (`READ`, `WRITE`, `BASH`, `GREP`, `EDIT`) → blue accent
   - `done` → green accent
   - `error` → red accent
   - `pending` → yellow accent

4. **Action buttons row**: Web, diff, more menu

5. **Remove old props**: `description`, `isExpanded`, `isLoading`, `color`

---

## Agent 2: Whiteboard-Agent Sync

**Goal**: Create sync mechanism between AgentContext and TaskShapes.

**Files**:
- CREATE `widget/src/components/whiteboard/useWhiteboardSync.ts`
- MODIFY `widget/src/components/whiteboard/WhiteboardCurtain.tsx`

### Tasks:

1. **Create `useWhiteboardSync.ts` hook**:
   ```typescript
   import { useAgent } from '../../context/AgentContext'
   import { Editor } from 'tldraw'

   export function useWhiteboardSync(editor: Editor | null) {
     const { activeAgents, sessions, getCurrentTool } = useAgent()

     useEffect(() => {
       if (!editor) return
       // For each active agent, ensure TaskShape exists
       // Update shape props when agent state changes
     }, [editor, activeAgents, sessions])
   }
   ```

2. **Sync logic**:
   - New agent → create TaskShape at next grid position
   - Agent tool change → update `status` prop to tool name
   - Agent complete → set `status: 'done'`
   - Agent error → set `status: 'error'`
   - Sync `abstract` from agent's last response
   - Sync `message` from current tool input or error

3. **Shape-agent mapping**: `Map<agentId, shapeId>` in memory

4. **Integrate in WhiteboardCurtain**: Call hook with editor ref

5. **Data sources from AgentContext**:
   - `activeAgents` array → all running agents
   - `sessions` map → state per agent
   - `getCurrentTool(id)` → active tool name

---

## Agent 3: Position Management

**Goal**: Auto-grid layout for new cards + persist positions.

**Files**:
- CREATE `widget/src/components/whiteboard/useWhiteboardPositions.ts`
- MODIFY `widget/src/components/whiteboard/WhiteboardCurtain.tsx`

### Tasks:

1. **Create `useWhiteboardPositions.ts` hook**:
   ```typescript
   interface CardPosition { shapeId: string; x: number; y: number }

   export function useWhiteboardPositions(editor: Editor | null) {
     // Load from gekto-storage API
     // Save when shapes move
     // getNextGridPosition() for new cards
   }
   ```

2. **Auto-grid algorithm**:
   ```typescript
   const CARD_WIDTH = 300, CARD_HEIGHT = 200, GAP = 20, COLS = 4

   function getNextGridPosition(existingShapes) {
     // Find first unoccupied grid slot
     for (let row = 0; row < 100; row++) {
       for (let col = 0; col < COLS; col++) {
         const x = col * (CARD_WIDTH + GAP)
         const y = row * (CARD_HEIGHT + GAP)
         if (!occupied(x, y)) return { x, y }
       }
     }
   }
   ```

3. **Persistence via API**:
   - Load: `GET /__gekto/api/storage/whiteboard-positions`
   - Save: `POST /__gekto/api/storage/whiteboard-positions`
   - Debounce saves (500ms)

4. **Subscribe to shape changes**:
   ```typescript
   editor.store.listen((change) => {
     // Queue position save when TaskShapes move
   })
   ```

5. **Load behavior**:
   - No saved positions → use auto-grid
   - Has saved positions → restore them
   - New cards → place at next grid slot

---

## Agent Coordination

```
Agent 1 (TaskShape)  ──┐
                       ├──► All can start in parallel
Agent 2 (Sync)       ──┤    Agent 2 & 3 define hook interfaces first
                       │    Then integrate with Agent 1's types
Agent 3 (Positions)  ──┘
```

### Files Summary

| Agent | Creates | Modifies |
|-------|---------|----------|
| 1 | - | `TaskShape.tsx` |
| 2 | `useWhiteboardSync.ts` | `WhiteboardCurtain.tsx` |
| 3 | `useWhiteboardPositions.ts` | `WhiteboardCurtain.tsx` |

---

## Testing Checklist

- [ ] TaskShape renders new UI with status badge
- [ ] Status badges show correct colors
- [ ] Shapes auto-create when agents start
- [ ] Shapes update status in real-time as tools run
- [ ] Positions persist across page reload
- [ ] New cards appear in grid layout
- [ ] Drag repositioning saves correctly
