#!/usr/bin/env node
import * as p from '@clack/prompts'

// Colors for TUI
const c = {
  reset: '\x1b[0m',
  bold: '\x1b[1m',
  dim: '\x1b[2m',
  green: '\x1b[32m',
  cyan: '\x1b[36m',
  magenta: '\x1b[35m',
  yellow: '\x1b[33m',
  white: '\x1b[37m',
}

function printLogo() {
  console.log(`
${c.green}   ██████╗ ███████╗██╗  ██╗████████╗ ██████╗ ${c.reset}
${c.green}  ██╔════╝ ██╔════╝██║ ██╔╝╚══██╔══╝██╔═══██╗${c.reset}
${c.green}  ██║  ███╗█████╗  █████╔╝    ██║   ██║   ██║${c.reset}
${c.green}  ██║   ██║██╔══╝  ██╔═██╗    ██║   ██║   ██║${c.reset}
${c.green}  ╚██████╔╝███████╗██║  ██╗   ██║   ╚██████╔╝${c.reset}
${c.green}   ╚═════╝ ╚══════╝╚═╝  ╚═╝   ╚═╝    ╚═════╝ ${c.reset}

${c.dim}  AI Development Assistant${c.reset}
`)
}

// Print a box around lines of text
function printBox(lines: string[], color = '\x1b[32m') {
  const reset = '\x1b[0m'
  const maxLen = Math.max(...lines.map(l => l.replace(/\x1b\[[0-9;]*m/g, '').length))
  const top = `${color}╭${'─'.repeat(maxLen + 2)}╮${reset}`
  const bottom = `${color}╰${'─'.repeat(maxLen + 2)}╯${reset}`

  console.log(top)
  for (const line of lines) {
    const cleanLen = line.replace(/\x1b\[[0-9;]*m/g, '').length
    const padding = ' '.repeat(maxLen - cleanLen)
    console.log(`${color}│${reset} ${line}${padding} ${color}│${reset}`)
  }
  console.log(bottom)
}

// Configuration - will be set after prompts
let PROXY_PORT = 3200
let TARGET_PORT = 5173
type ProjectType = 'frontend' | 'backend' | 'cli' | 'fullstack' | 'mobile' | 'other'
let PROJECT_TYPE: ProjectType = 'frontend'
let DEV_MODE = false
let WIDGET_PORT = 5174


// Settings interface
interface GektoSettings {
  projectType: ProjectType
  targetPort: number
  proxyPort: number
  onboardingCompleted: boolean
  email?: string
}

// Save lead to SheetDB
async function saveLeadToSheetDB(data: { project_type: string; port: string; email: string }) {
  try {
    await fetch('https://sheetdb.io/api/v1/hxn1hd5nzjxhd?sheet=npx%20data', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ data }),
    })
  } catch {
    // Silently fail - don't block onboarding
  }
}

// Load settings from store (imported dynamically later)
let loadSettings: () => GektoSettings | undefined
let saveSettings: (settings: GektoSettings) => void

// Onboarding prompts - runs FIRST before anything else
async function runOnboarding() {
  // Skip onboarding in dev mode (bun run dev)
  if (process.env.GEKTO_DEV === '1') {
    DEV_MODE = true
    TARGET_PORT = 5173
    return
  }

  // Dynamic import to avoid loading before onboarding
  const fs = await import('fs')
  const path = await import('path')

  const STORE_PATH = path.join(process.cwd(), 'gekto-store.json')

  loadSettings = () => {
    try {
      if (fs.existsSync(STORE_PATH)) {
        const store = JSON.parse(fs.readFileSync(STORE_PATH, 'utf8'))
        return store.data?.settings as GektoSettings | undefined
      }
    } catch {}
    return undefined
  }

  saveSettings = (settings: GektoSettings) => {
    let store = { version: 1, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(), data: {} as Record<string, unknown> }
    try {
      if (fs.existsSync(STORE_PATH)) {
        store = JSON.parse(fs.readFileSync(STORE_PATH, 'utf8'))
      }
    } catch {}
    store.data.settings = settings
    store.updatedAt = new Date().toISOString()
    fs.writeFileSync(STORE_PATH, JSON.stringify(store, null, 2))
  }

  // Check for existing settings
  const existingSettings = loadSettings()
  if (existingSettings?.onboardingCompleted) {
    // Use saved settings
    PROJECT_TYPE = existingSettings.projectType
    TARGET_PORT = existingSettings.targetPort
    PROXY_PORT = existingSettings.proxyPort
    console.log(`${c.dim}Loaded settings from gekto-store.json${c.reset}`)
    return
  }

  console.clear()

  p.intro(`${c.green}${c.bold}create-gekto${c.reset}`)

  // Ask project type
  const projectType = await p.select({
    message: 'Select project type',
    options: [
      { label: 'Frontend (React, Vue, Next.js, etc.)', value: 'frontend' },
      { label: 'Backend (Node.js, Express, FastAPI, etc.)', value: 'backend' },
      { label: 'CLI (Command-line tools)', value: 'cli' },
      { label: 'Fullstack (Frontend + Backend)', value: 'fullstack' },
      { label: 'Mobile (React Native, Flutter, etc.)', value: 'mobile' },
      { label: 'Other', value: 'other' },
    ],
  })

  if (p.isCancel(projectType)) {
    p.cancel('Setup cancelled.')
    process.exit(0)
  }

  PROJECT_TYPE = projectType as ProjectType

  // For frontend apps, ask for the port
  if (PROJECT_TYPE === 'frontend') {
    const portAnswer = await p.text({
      message: 'What port is your app running on?',
      placeholder: '3000',
      defaultValue: '3000',
    })

    if (p.isCancel(portAnswer)) {
      p.cancel('Setup cancelled.')
      process.exit(0)
    }

    TARGET_PORT = parseInt(portAnswer, 10)
  }

  // Ask for email
  const emailAnswer = await p.text({
    message: 'Enter your email for updates (optional)',
    placeholder: 'you@example.com',
  })

  if (p.isCancel(emailAnswer)) {
    p.cancel('Setup cancelled.')
    process.exit(0)
  }

  const email = emailAnswer || ''

  // Show spinner while saving
  const spinner = p.spinner()
  spinner.start('Preparing Gekto...')

  // Save lead to SheetDB (always send, even if email is empty)
  await saveLeadToSheetDB({
    project_type: PROJECT_TYPE,
    port: String(TARGET_PORT),
    email,
  })

  // Save settings for next time
  saveSettings({
    projectType: PROJECT_TYPE,
    targetPort: TARGET_PORT,
    proxyPort: PROXY_PORT,
    onboardingCompleted: true,
    email,
  })

  spinner.stop('Ready!')

  p.outro(`${c.green}Starting Gekto...${c.reset}`)
}

// Main function - runs after onboarding completes
async function main() {
  // === STEP 1: Run onboarding FIRST (nothing else runs yet) ===
  await runOnboarding()

  // === STEP 2: Now load all the heavy modules ===
  const http = await import('http')
  const fs = await import('fs')
  const path = await import('path')
  const { fileURLToPath } = await import('url')
  const { parseArgs } = await import('util')
  const { setupTerminalWebSocket } = await import('./terminal.js')
  const { setupAgentWebSocket } = await import('./agents/agentWebSocket.js')
  const { initStore, getData, setData } = await import('./store.js')

  const __dirname = path.dirname(fileURLToPath(import.meta.url))

  // Parse CLI arguments (for overrides)
  const { values: args } = parseArgs({
    options: {
      port: { type: 'string', short: 'p' },
      target: { type: 'string', short: 't' },
    },
    strict: false,
  })

  // Apply CLI overrides if provided
  if (args.port && typeof args.port === 'string') PROXY_PORT = parseInt(args.port, 10)
  if (args.target && typeof args.target === 'string') TARGET_PORT = parseInt(args.target, 10)

  DEV_MODE = process.env.GEKTO_DEV === '1'
  WIDGET_PORT = parseInt(process.env.WIDGET_PORT ?? '5174', 10)

  // Initialize store
  initStore()

  // Widget paths - check multiple locations
  const possibleWidgetPaths = [
    path.resolve(__dirname, './widget'),           // production (dist/widget)
    path.resolve(__dirname, '../../widget/dist'),  // dev/preview mode
  ]
  const WIDGET_DIST_PATH = possibleWidgetPaths.find(p =>
    fs.existsSync(path.join(p, 'gekto-widget.iife.js'))
  ) || possibleWidgetPaths[0]
  const WIDGET_JS_PATH = path.join(WIDGET_DIST_PATH, 'gekto-widget.iife.js')
  const WIDGET_CSS_PATH = path.join(WIDGET_DIST_PATH, 'style.css')

  // Load widget bundle
  function loadWidgetBundle(): { js: string; css: string } {
    try {
      const js = fs.readFileSync(WIDGET_JS_PATH, 'utf8')
      const css = fs.existsSync(WIDGET_CSS_PATH)
        ? fs.readFileSync(WIDGET_CSS_PATH, 'utf8')
        : ''
      return { js, css }
    } catch (err) {
      console.error('❌ Could not load widget bundle:', err)
      return { js: '// Widget bundle not found', css: '' }
    }
  }

  // Generate injection script
  function getInjectionScript(): string {
    if (DEV_MODE) {
      return `
<!-- Gekto Widget (dev) -->
<script type="module" id="gekto-widget" src="http://localhost:${WIDGET_PORT}/src/main.tsx"></script>
`
    }
    return `
<!-- Gekto Widget -->
<script id="gekto-widget" src="/__gekto/widget.js"></script>
`
  }

  // === STEP 3: Create and start server ===
  const server = http.createServer((req, res) => {
    const url = req.url || '/'

    // API: Get lizards
    if (url === '/__gekto/api/lizards' && req.method === 'GET') {
      const lizards = getData<Array<{ id: string; position: { x: number; y: number } }>>('lizards') || []
      res.writeHead(200, { 'Content-Type': 'application/json' })
      res.end(JSON.stringify(lizards))
      return
    }

    // API: Save lizards
    if (url === '/__gekto/api/lizards' && req.method === 'POST') {
      let body = ''
      req.on('data', (chunk: Buffer) => { body += chunk })
      req.on('end', () => {
        try {
          const lizards = JSON.parse(body)
          setData('lizards', lizards)
          res.writeHead(200, { 'Content-Type': 'application/json' })
          res.end(JSON.stringify({ success: true }))
        } catch (err) {
          res.writeHead(400, { 'Content-Type': 'application/json' })
          res.end(JSON.stringify({ error: 'Invalid JSON' }))
        }
      })
      return
    }

    // API: Get chat history
    const chatGetMatch = url.match(/^\/__gekto\/api\/chats\/([^/]+)$/)
    if (chatGetMatch && req.method === 'GET') {
      const lizardId = chatGetMatch[1]
      const allChats = getData<Record<string, Array<unknown>>>('chats') || {}
      const messages = allChats[lizardId] || []
      res.writeHead(200, { 'Content-Type': 'application/json' })
      res.end(JSON.stringify(messages))
      return
    }

    // API: Save chat history
    const chatPostMatch = url.match(/^\/__gekto\/api\/chats\/([^/]+)$/)
    if (chatPostMatch && req.method === 'POST') {
      const lizardId = chatPostMatch[1]
      let body = ''
      req.on('data', (chunk: Buffer) => { body += chunk })
      req.on('end', () => {
        try {
          const messages = JSON.parse(body)
          const allChats = getData<Record<string, unknown>>('chats') || {}
          allChats[lizardId] = messages
          setData('chats', allChats)
          res.writeHead(200, { 'Content-Type': 'application/json' })
          res.end(JSON.stringify({ success: true }))
        } catch (err) {
          res.writeHead(400, { 'Content-Type': 'application/json' })
          res.end(JSON.stringify({ error: 'Invalid JSON' }))
        }
      })
      return
    }

    // Serve widget assets
    if (url.startsWith('/__gekto/')) {
      if (DEV_MODE) {
        if (url === '/__gekto/widget.js') {
          res.writeHead(200, { 'Content-Type': 'application/javascript', 'Cache-Control': 'no-cache' })
          res.end(`
            const script = document.createElement('script');
            script.type = 'module';
            script.src = 'http://localhost:${WIDGET_PORT}/src/main.tsx';
            document.head.appendChild(script);
          `)
          return
        }
        const widgetPath = url.replace('/__gekto/', '/@fs' + path.resolve(__dirname, '../../widget/') + '/')
        const widgetReq = http.request({
          hostname: 'localhost',
          port: WIDGET_PORT,
          path: widgetPath,
          method: 'GET',
          headers: { host: `localhost:${WIDGET_PORT}` }
        }, (widgetRes) => {
          res.writeHead(widgetRes.statusCode || 200, widgetRes.headers as Record<string, string>)
          widgetRes.pipe(res)
        })
        widgetReq.on('error', () => {
          res.writeHead(200, { 'Content-Type': 'application/javascript', 'Cache-Control': 'no-cache' })
          res.end(loadWidgetBundle().js)
        })
        widgetReq.end()
        return
      } else {
        if (url === '/__gekto/widget.js') {
          res.writeHead(200, { 'Content-Type': 'application/javascript', 'Cache-Control': 'no-cache' })
          res.end(loadWidgetBundle().js)
          return
        }
        if (url === '/__gekto/widget.css') {
          res.writeHead(200, { 'Content-Type': 'text/css', 'Cache-Control': 'no-cache' })
          res.end(loadWidgetBundle().css)
          return
        }
      }
    }

    // For non-frontend projects, serve standalone page
    if (PROJECT_TYPE !== 'frontend' && (url === '/' || url === '/index.html')) {
      const injection = getInjectionScript()
      res.writeHead(200, { 'Content-Type': 'text/html' })
      res.end(`
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1">
            <title>Gekto</title>
            <style>
              * { margin: 0; padding: 0; box-sizing: border-box; }
              body { background: #0a0a0a; min-height: 100vh; }
            </style>
          </head>
          <body>
            ${injection}
          </body>
        </html>
      `)
      return
    }

    // Proxy request to target
    const forwardHeaders: Record<string, string | string[] | undefined> = {
      ...req.headers,
      host: `localhost:${TARGET_PORT}`
    }
    delete forwardHeaders['accept-encoding']
    delete forwardHeaders['if-none-match']
    delete forwardHeaders['if-modified-since']

    const proxyReq = http.request({
      hostname: 'localhost',
      port: TARGET_PORT,
      path: url,
      method: req.method,
      headers: forwardHeaders
    }, (proxyRes) => {
      const contentType = proxyRes.headers['content-type'] || ''
      const isHtml = contentType.includes('text/html')

      if (isHtml) {
        const chunks: Buffer[] = []
        proxyRes.on('data', (chunk) => chunks.push(chunk))
        proxyRes.on('end', () => {
          let html = Buffer.concat(chunks).toString('utf8')
          const injection = getInjectionScript()

          if (html.includes('</body>')) {
            html = html.replace('</body>', `${injection}</body>`)
          } else if (html.includes('</html>')) {
            html = html.replace('</html>', `${injection}</html>`)
          } else {
            html += injection
          }

          const headers: Record<string, string | string[] | undefined> = {}
          const skipHeaders = ['content-length', 'transfer-encoding', 'content-encoding', 'content-security-policy', 'content-security-policy-report-only']
          for (const [key, value] of Object.entries(proxyRes.headers)) {
            if (!skipHeaders.includes(key.toLowerCase())) {
              headers[key] = value
            }
          }

          res.writeHead(proxyRes.statusCode || 200, headers)
          res.end(html)
        })
      } else {
        res.writeHead(proxyRes.statusCode || 200, proxyRes.headers as Record<string, string>)
        proxyRes.pipe(res)
      }
    })

    proxyReq.on('error', (err) => {
      res.writeHead(502, { 'Content-Type': 'text/html' })
      res.end(`
        <html>
          <body style="font-family: system-ui; display: flex; align-items: center; justify-content: center; height: 100vh; margin: 0; background: linear-gradient(135deg, #ff6b6b, #ff8e53);">
            <div style="text-align: center; color: white;">
              <h1>🔥 Proxy Error</h1>
              <p>Could not connect to localhost:${TARGET_PORT}</p>
              <pre style="background: rgba(0,0,0,0.2); padding: 10px; border-radius: 5px;">${err.message}</pre>
            </div>
          </body>
        </html>
      `)
    })

    req.pipe(proxyReq)
  })

  // Setup WebSockets
  setupTerminalWebSocket(server)
  setupAgentWebSocket(server)

  // Handle WebSocket upgrades for Vite HMR
  server.on('upgrade', (req, socket, _head) => {
    const url = req.url || ''
    if (url.startsWith('/__gekto/terminal') || url.startsWith('/__gekto/agent')) {
      return
    }

    const proxyReq = http.request({
      hostname: 'localhost',
      port: TARGET_PORT,
      path: req.url,
      method: req.method,
      headers: { ...req.headers, host: `localhost:${TARGET_PORT}` }
    })

    proxyReq.on('upgrade', (proxyRes, proxySocket, _proxyHead) => {
      socket.write('HTTP/1.1 101 Switching Protocols\r\n' +
        Object.entries(proxyRes.headers).map(([k, v]) => `${k}: ${v}`).join('\r\n') +
        '\r\n\r\n')
      proxySocket.pipe(socket)
      socket.pipe(proxySocket)
    })

    proxyReq.on('error', () => socket.end())
    proxyReq.end()
  })

  // === STEP 4: Show logo and start listening ===
  console.clear()
  printLogo()

  server.listen(PROXY_PORT, () => {
    if (PROJECT_TYPE === 'frontend') {
      printBox([
        `${c.bold}Gekto is ready!${c.reset}`,
        ``,
        `${c.dim}Source:${c.reset}  ${c.cyan}http://localhost:${TARGET_PORT}${c.reset}`,
        `${c.dim}Proxy:${c.reset}   ${c.magenta}http://localhost:${PROXY_PORT}${c.reset}`,
        `${c.dim}Mode:${c.reset}    ${c.yellow}${DEV_MODE ? 'development' : 'production'}${c.reset}`,
        ``,
        `${c.dim}Open ${c.white}http://localhost:${PROXY_PORT}${c.dim} in your browser${c.reset}`,
        `${c.dim}Press ${c.white}Ctrl+C${c.dim} to stop${c.reset}`,
      ], c.green)
    } else {
      printBox([
        `${c.bold}Gekto is ready!${c.reset}`,
        ``,
        `${c.dim}Open:${c.reset}  ${c.magenta}http://localhost:${PROXY_PORT}${c.reset}`,
        `${c.dim}Mode:${c.reset}  ${c.yellow}${DEV_MODE ? 'development' : 'production'}${c.reset}`,
        ``,
        `${c.dim}Press ${c.white}Ctrl+C${c.dim} to stop${c.reset}`,
      ], c.green)
    }

    // Footer
    console.log()
    console.log(`  ${c.dim}Enjoying Gekto? ⭐ Star us on GitHub: ${c.white}https://github.com/Badaboom1995/gekto${c.reset}`)
    console.log()
  })
}

// Run
main().catch(console.error)
