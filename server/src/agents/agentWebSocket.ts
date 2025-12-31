import { WebSocket, WebSocketServer } from 'ws'
import type { Server } from 'http'
import type { IncomingMessage } from 'http'
import type { Duplex } from 'stream'
import { HeadlessAgent } from './HeadlessAgent'

// Summarize tool input for display (e.g., show file path for Read, pattern for Grep)
function summarizeInput(input: Record<string, unknown>): string {
  if (input.file_path) return String(input.file_path)
  if (input.pattern) return String(input.pattern)
  if (input.command) return String(input.command).substring(0, 50)
  if (input.path) return String(input.path)
  return ''
}

interface AgentSession {
  agent: HeadlessAgent
  ws: WebSocket
  isProcessing: boolean
}

const sessions = new Map<WebSocket, AgentSession>()

const DEFAULT_SYSTEM_PROMPT = `You are a helpful coding assistant. Be concise and direct in your responses.`

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
    console.log('[Agent] New connection')

    const agent = new HeadlessAgent({
      systemPrompt: DEFAULT_SYSTEM_PROMPT,
      workingDir: process.cwd(),
    })

    const session: AgentSession = {
      agent,
      ws,
      isProcessing: false,
    }
    sessions.set(ws, session)

    // Send ready state and working directory immediately
    ws.send(JSON.stringify({ type: 'state', state: 'ready' }))
    ws.send(JSON.stringify({ type: 'info', workingDir: process.cwd() }))

    ws.on('message', async (message: Buffer | string) => {
      try {
        const msg = JSON.parse(message.toString())

        switch (msg.type) {
          case 'chat':
            if (session.isProcessing) {
              ws.send(JSON.stringify({
                type: 'error',
                message: 'Already processing a request'
              }))
              return
            }

            session.isProcessing = true
            ws.send(JSON.stringify({ type: 'state', state: 'working' }))

            try {
              console.log('[Agent] Processing message:', msg.content.substring(0, 50), '...')

              // Set up streaming callbacks
              const callbacks = {
                onToolStart: (tool: string, input?: Record<string, unknown>) => {
                  console.log('[Agent] Tool started:', tool)
                  ws.send(JSON.stringify({
                    type: 'tool',
                    status: 'running',
                    tool,
                    input: input ? summarizeInput(input) : undefined,
                  }))
                },
                onToolEnd: (tool: string) => {
                  console.log('[Agent] Tool ended:', tool)
                  ws.send(JSON.stringify({
                    type: 'tool',
                    status: 'completed',
                    tool,
                  }))
                },
              }

              const response = await session.agent.send(msg.content, callbacks)

              console.log('[Agent] Got response, sending to client...')
              console.log('[Agent] Response text:', response.result?.substring(0, 100))

              const responseMsg = JSON.stringify({
                type: 'response',
                text: response.result,
                sessionId: response.session_id,
                cost: response.total_cost_usd,
                duration: response.duration_ms,
              })
              console.log('[Agent] Sending:', responseMsg.substring(0, 200))
              ws.send(responseMsg)
              console.log('[Agent] Response sent!')
            } catch (err) {
              console.error('[Agent] Error:', err)
              ws.send(JSON.stringify({
                type: 'error',
                message: String(err)
              }))
            } finally {
              session.isProcessing = false
              console.log('[Agent] Setting state back to ready')
              ws.send(JSON.stringify({ type: 'state', state: 'ready' }))
            }
            break

          case 'reset':
            session.agent.resetSession()
            ws.send(JSON.stringify({ type: 'state', state: 'ready' }))
            break
        }
      } catch (err) {
        console.error('[Agent] Failed to parse message:', err)
      }
    })

    ws.on('close', () => {
      console.log('[Agent] Connection closed')
      sessions.delete(ws)
    })

    ws.on('error', (err) => {
      console.error('[Agent] WebSocket error:', err)
      sessions.delete(ws)
    })
  })

  console.log(`[Agent] WebSocket server ready at ${path}`)
  return wss
}
