# Gekto

A development widget that injects into any web app via proxy, providing a draggable terminal and other dev tools.

## Requirements

- **Node.js 18+** (recommended: 20 or 22)
- npm or yarn

### Why Node.js 18+?

Gekto's terminal uses `node-pty`, a native module that spawns real pseudo-terminals. This requires:
- A compatible Node.js version (18, 20, or 22)
- Build tools for native compilation (usually pre-installed on dev machines)

If you encounter build errors during installation:
- **macOS**: Install Xcode Command Line Tools: `xcode-select --install`
- **Linux**: Install build-essential: `apt install build-essential`
- **Windows**: Install Visual Studio Build Tools

## Installation

```bash
# Clone the repository
git clone https://github.com/your-username/gekto.git
cd gekto

# Install dependencies
npm install

# Install server dependencies
cd server && npm install && cd ..

# Install widget dependencies
cd widget && npm install && cd ..
```

## Usage

### Development Mode

Start your target app (e.g., on port 5173), then run:

```bash
# Terminal 1: Start widget dev server
cd widget && npm run dev

# Terminal 2: Start proxy server
cd server && npm run dev
```

Open `http://localhost:3200` - your app will load with the Gekto widget injected.

### Production Mode

```bash
# Build the widget
cd widget && npm run build

# Run the proxy pointing to your app
cd server && npm run preview -- --target 3000
```

## Architecture

```
┌─────────────────────┐     ┌─────────────────────┐     ┌─────────────────────┐
│   Your App          │     │   Gekto Proxy       │     │   Browser           │
│   (port 5173)       │ ←── │   (port 3200)       │ ←── │                     │
│                     │     │   + Widget injection │     │   + Gekto Widget    │
└─────────────────────┘     │   + Terminal WS      │     │   + Terminal UI     │
                            └─────────────────────┘     └─────────────────────┘
```

## Features

- Draggable lizard mascots
- In-browser terminal with full PTY support (Ctrl+C, arrow keys, colors)
- Injects into any web app via proxy

## License

MIT
