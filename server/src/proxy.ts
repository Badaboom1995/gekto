import http from 'http'
import https from 'https'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import { parseArgs } from 'util'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

// Parse CLI arguments
const { values: args } = parseArgs({
  options: {
    port: { type: 'string', short: 'p' },
    target: { type: 'string', short: 't' },
    help: { type: 'boolean', short: 'h' },
  },
  strict: false,
})

if (args.help) {
  console.log(`
  Gekto Proxy - Inject widget into any web app

  Usage:
    bun gekto.ts --target 3000
    bun gekto.ts -t 3000 -p 8080

  Options:
    -t, --target  Target app port (required)
    -p, --port    Proxy port (default: 3200)
    -h, --help    Show this help
  `)
  process.exit(0)
}

// Only require --target for bundled version (not dev mode)
if (!args.target && !process.env.TARGET_PORT && !process.env.GEKTO_DEV) {
  console.error('Error: --target port is required\n')
  console.error('Usage: bun gekto.ts --target 3000')
  process.exit(1)
}

// Configuration
const PROXY_PORT = parseInt(args.port || process.env.PORT || '3200')
const TARGET_PORT = parseInt(args.target || process.env.TARGET_PORT || '5173')
const WIDGET_PORT = parseInt(process.env.WIDGET_PORT || '5174')
const DEV_MODE = process.env.GEKTO_DEV === '1'

// Widget paths
const WIDGET_DIST_PATH = path.resolve(__dirname, '../../widget/dist')
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
    // In dev mode, load as ES module from widget dev server
    return `
<!-- Gekto Widget (dev) -->
<script type="module" id="gekto-widget" src="http://localhost:${WIDGET_PORT}/src/main.tsx"></script>
`
  }
  // In production, load IIFE bundle
  return `
<!-- Gekto Widget -->
<script id="gekto-widget" src="/__gekto/widget.js"></script>
`
}

const server = http.createServer((req, res) => {
  const url = req.url || '/'

  // Serve widget assets - proxy to widget dev server or serve from dist
  if (url.startsWith('/__gekto/')) {
    if (DEV_MODE) {
      // Proxy to widget dev server for HMR
      const widgetPath = url.replace('/__gekto/', '/@fs' + path.resolve(__dirname, '../../widget/') + '/')
      const widgetReq = http.request({
        hostname: 'localhost',
        port: WIDGET_PORT,
        path: url === '/__gekto/widget.js' ? '/src/main.tsx' : widgetPath,
        method: 'GET',
        headers: { host: `localhost:${WIDGET_PORT}` }
      }, (widgetRes) => {
        const headers: Record<string, string | string[] | undefined> = {}
        for (const [key, value] of Object.entries(widgetRes.headers)) {
          headers[key] = value
        }
        res.writeHead(widgetRes.statusCode || 200, headers)
        widgetRes.pipe(res)
      })
      widgetReq.on('error', () => {
        // Fallback to dist if widget dev server not available
        res.writeHead(200, { 'Content-Type': 'application/javascript', 'Cache-Control': 'no-cache' })
        const { js } = loadWidgetBundle()
        res.end(js)
      })
      widgetReq.end()
      return
    } else {
      // Production: serve from dist
      if (url === '/__gekto/widget.js') {
        res.writeHead(200, { 'Content-Type': 'application/javascript', 'Cache-Control': 'no-cache' })
        const { js } = loadWidgetBundle()
        res.end(js)
        return
      }
      if (url === '/__gekto/widget.css') {
        res.writeHead(200, { 'Content-Type': 'text/css', 'Cache-Control': 'no-cache' })
        const { css } = loadWidgetBundle()
        res.end(css)
        return
      }
    }
  }

  // Proxy request to target
  const proxyReq = http.request({
    hostname: 'localhost',
    port: TARGET_PORT,
    path: url,
    method: req.method,
    headers: {
      ...req.headers,
      host: `localhost:${TARGET_PORT}`
    }
  }, (proxyRes) => {
    const contentType = proxyRes.headers['content-type'] || ''
    const isHtml = contentType.includes('text/html')

    console.log(`[${new Date().toISOString()}] ${req.method} ${url}${isHtml ? ' → injecting widget' : ''}`)

    if (isHtml) {
      // Buffer HTML response and inject widget
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

        // Copy headers but remove content-length
        const headers: Record<string, string | string[] | undefined> = {}
        for (const [key, value] of Object.entries(proxyRes.headers)) {
          if (key.toLowerCase() !== 'content-length' && key.toLowerCase() !== 'transfer-encoding') {
            headers[key] = value
          }
        }

        res.writeHead(proxyRes.statusCode || 200, headers)
        res.end(html)
      })
    } else {
      // Stream non-HTML responses directly
      const headers: Record<string, string | string[] | undefined> = {}
      for (const [key, value] of Object.entries(proxyRes.headers)) {
        headers[key] = value
      }

      res.writeHead(proxyRes.statusCode || 200, headers)
      proxyRes.pipe(res)
    }
  })

  proxyReq.on('error', (err) => {
    console.error('Proxy error:', err.message)
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

  // Forward request body
  req.pipe(proxyReq)
})

// Handle WebSocket upgrades for Vite HMR
server.on('upgrade', (req, socket, head) => {
  const proxyReq = http.request({
    hostname: 'localhost',
    port: TARGET_PORT,
    path: req.url,
    method: req.method,
    headers: {
      ...req.headers,
      host: `localhost:${TARGET_PORT}`
    }
  })

  proxyReq.on('upgrade', (proxyRes, proxySocket, proxyHead) => {
    socket.write('HTTP/1.1 101 Switching Protocols\r\n' +
      Object.entries(proxyRes.headers)
        .map(([k, v]) => `${k}: ${v}`)
        .join('\r\n') +
      '\r\n\r\n')

    proxySocket.pipe(socket)
    socket.pipe(proxySocket)
  })

  proxyReq.on('error', (err) => {
    console.error('WebSocket proxy error:', err.message)
    socket.end()
  })

  proxyReq.end()
})

server.listen(PROXY_PORT, () => {
  console.log(`
  Gekto Proxy Server

  Proxy:  http://localhost:${PROXY_PORT}
  Target: http://localhost:${TARGET_PORT}
  Mode:   ${DEV_MODE ? 'development' : 'production'}${DEV_MODE ? `
  Widget: http://localhost:${WIDGET_PORT}` : ''}
  `)
})
