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
