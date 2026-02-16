# Gekto Canvas - Whiteboard Integration Plan

## Overview

Whiteboard becomes the visual representation of the agent swarm. Each running agent appears as a task card that users can organize spatially.

## Task Card Design

```
┌─────────────────────────────┐
│ [BASH]           Task 123   │  ← status badge + title
├─────────────────────────────┤
│ Abstract of what was done   │  ← summary of work
│ desc desc desc desc         │
├─────────────────────────────┤
│ 📁 feature/auth-flow        │  ← worktree branch (optional)
├─────────────────────────────┤
│ [Web] [diff]        [more]  │  ← action buttons
├─────────────────────────────┤
│ Agent stopped. Out of tokens│  ← message zone (errors, results)
└─────────────────────────────┘
```

### Task Card Properties

| Property | Description |
|----------|-------------|
| `title` | Task/agent name |
| `abstract` | Summary of what was done |
| `branch` | Worktree branch name (optional) |
| `status` | Current state badge |
| `message` | Bottom zone for errors, results, pending commands |
| `actions` | Action buttons (Web, diff, more, etc.) |

### Status Badges

**Running states (tool in use):**
- `READ` - reading files
- `WRITE` - writing files
- `BASH` - executing commands
- `GREP` - searching
- `EDIT` - editing files
- etc.

**Final states:**
- `done` (green) - task completed successfully
- `error` (red) - task failed or stopped
- `pending` (yellow) - waiting for user action/approval

## Architecture

```
AgentStore (source of truth)
     │
     ├──► 3D Lizards (visual representation)
     │
     └──► Whiteboard Task Cards (visual representation)
           │
           └──► Positions saved to gekto-storage
```

### Key Principles

1. **Single source of truth**: Agents and task cards come from the same `AgentStore`
2. **Sync**: When agent state changes, task card updates automatically
3. **Persistence**: Card positions saved to gekto-storage
4. **First open**: Default grid layout when no saved positions exist

## Zones/Groups

- Freeform drawn areas for visual organization
- Examples: Store, UI, Feature 1, Feature 2
- **No functional meaning for now** - purely visual convenience

## Chat Integration

The Gekto chat should be able to:
- Know about every task on the board and their state
- Create new tasks/agents
- Delete tasks
- Update task properties
- Approve pending actions

All actions can be triggered via agent chat.

## Sidebar Modes (Future)

Reserved for future features:
- Kanban board view
- Flow diagram view
- Plugins
- Other visualization modes

## Implementation Order

1. **Update TaskShape props** - add status, branch, abstract, message, actions
2. **Update TaskShape UI** - match the mockup design
3. **Create whiteboard-agent sync** - read from agent store, create/update shapes
4. **Add auto-grid layout** - for first-time board opening
5. **Persist positions** - save to gekto-storage
6. **Parent-child arrows** - show task hierarchy (future)

## File Structure

```
widget/src/components/whiteboard/
├── WhiteboardCurtain.tsx   # Main whiteboard wrapper
├── TaskShape.tsx           # Custom tldraw shape for tasks
├── index.ts                # Exports
└── (future files)
    ├── useWhiteboardSync.ts    # Sync agents to shapes
    ├── WhiteboardSidebar.tsx   # Mode switcher, schema view
    └── WhiteboardChat.tsx      # Embedded chat panel
```
