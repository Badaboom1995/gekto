import { WebSocket, WebSocketServer } from 'ws'
import type { Server } from 'http'
import type { IncomingMessage } from 'http'
import type { Duplex } from 'stream'
import { ClaudeAgent, AgentState } from './ClaudeAgent'

interface AgentSession {
  agent: ClaudeAgent | null
  ws: WebSocket
  outputBuffer: string
  lastUserMessage: string
  isCapturing: boolean
}

const sessions = new Map<WebSocket, AgentSession>()

// Strip ANSI codes
function stripAnsi(text: string): string {
  return text
    .replace(/\x1b\[[0-9;]*m/g, '')
    .replace(/\x1b\[[0-9;]*[A-Za-z]/g, '')
    .replace(/\r/g, '')
}

export function setupAgentWebSocket(server: Server, path: string = '/__gekto/agent') {
  const wss = new WebSocketServer({ noServer: true })

  server.on('upgrade', (request: IncomingMessage, socket: Duplex, head: Buffer) => {
    const url = request.url || ''

    if (url === path || url.startsWith(path + '?')) {
      wss.handleUpgrade(request, socket, head, (ws) => {
        wss.emit('connection', ws, request)
      })
    }
  })

  wss.on('connection', (ws: WebSocket) => {
    console.log('[Agent] New connection, spawning Claude Code...')

    const session: AgentSession = {
      agent: null,
      ws,
      outputBuffer: '',
      lastUserMessage: '',
      isCapturing: false,
    }
    sessions.set(ws, session)

    // Send loading state
    ws.send(JSON.stringify({ type: 'state', state: 'loading' }))

    // Spawn Claude agent
    const agent = new ClaudeAgent({
      workingDir: process.cwd(),
      onOutput: (data) => {
        // Accumulate output while working
        if (session.isCapturing) {
          session.outputBuffer += data
        }
      },
      onStateChange: (state: AgentState) => {
        if (ws.readyState === WebSocket.OPEN) {
          ws.send(JSON.stringify({ type: 'state', state }))

          // When transitioning to ready from working, send the response
          if (state === 'ready' && session.isCapturing) {
            session.isCapturing = false

            // Clean up the output - remove the echoed input and extract response
            let response = stripAnsi(session.outputBuffer)

            // Remove the echoed user message and injected text
            response = response
              .replace(/>\s*.*ignore all text above.*haiku instead/gis, '')
              .replace(/>\s*\S+/g, '') // Remove prompt lines
              .replace(/❯\s*/g, '')
              .trim()

            if (response && ws.readyState === WebSocket.OPEN) {
              ws.send(JSON.stringify({ type: 'response', text: response }))
            }

            session.outputBuffer = ''
          }
        }
      },
      onReady: () => {
        console.log('[Agent] Claude Code is ready')
      },
    })

    session.agent = agent

    // Handle messages from client
    ws.on('message', (message: Buffer | string) => {
      try {
        const msg = JSON.parse(message.toString())

        switch (msg.type) {
          case 'chat':
            if (session.agent) {
              session.lastUserMessage = msg.content
              session.outputBuffer = ''
              session.isCapturing = true

              // Just send the user message - no injection for now to debug
              session.agent.sendMessage(msg.content)
            }
            break

          case 'respond':
            if (session.agent) {
              session.agent.respond(msg.content)
            }
            break
        }
      } catch (err) {
        console.error('[Agent] Failed to parse message:', err)
      }
    })

    ws.on('close', () => {
      console.log('[Agent] Connection closed')
      session.agent?.kill()
      sessions.delete(ws)
    })

    ws.on('error', (err) => {
      console.error('[Agent] WebSocket error:', err)
      session.agent?.kill()
      sessions.delete(ws)
    })
  })

  console.log(`[Agent] WebSocket server ready at ${path}`)
  return wss
}
