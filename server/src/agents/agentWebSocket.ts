import { WebSocket, WebSocketServer } from 'ws'
import type { Server } from 'http'
import type { IncomingMessage } from 'http'
import type { Duplex } from 'stream'
import { sendMessage, resetSession, getWorkingDir, getActiveSessions, killSession, killAllSessions, attachWebSocket } from './agentPool'

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

    // Attach this WebSocket to all existing sessions (for reconnection)
    attachWebSocket(ws)

    // Send working directory info
    ws.send(JSON.stringify({ type: 'info', workingDir: getWorkingDir() }))

    ws.on('message', async (message: Buffer | string) => {
      try {
        const msg = JSON.parse(message.toString())

        // Commands that don't require lizardId
        switch (msg.type) {
          case 'list_agents':
            ws.send(JSON.stringify({
              type: 'agents_list',
              agents: getActiveSessions(),
            }))
            return

          case 'kill_all':
            const killedCount = killAllSessions()
            ws.send(JSON.stringify({
              type: 'kill_all_result',
              killed: killedCount,
            }))
            // Notify about state changes
            for (const session of getActiveSessions()) {
              ws.send(JSON.stringify({ type: 'state', lizardId: session.lizardId, state: 'ready' }))
            }
            return
        }

        // Commands that require lizardId
        const lizardId = msg.lizardId
        if (!lizardId) {
          ws.send(JSON.stringify({ type: 'error', message: 'Missing lizardId' }))
          return
        }

        switch (msg.type) {
          case 'chat':
            console.log(`[Agent] [${lizardId}] Processing:`, msg.content.substring(0, 50), '...')
            try {
              await sendMessage(lizardId, msg.content, ws)
            } catch (err) {
              console.error(`[Agent] [${lizardId}] Error:`, err)
            }
            break

          case 'reset':
            resetSession(lizardId)
            ws.send(JSON.stringify({ type: 'state', lizardId, state: 'ready' }))
            break

          case 'kill':
            const killed = killSession(lizardId)
            ws.send(JSON.stringify({
              type: 'kill_result',
              lizardId,
              killed,
            }))
            ws.send(JSON.stringify({ type: 'state', lizardId, state: 'ready' }))
            break
        }
      } catch (err) {
        console.error('[Agent] Failed to parse message:', err)
      }
    })

    ws.on('close', () => {
      console.log('[Agent] Connection closed')
    })

    ws.on('error', (err) => {
      console.error('[Agent] WebSocket error:', err)
    })
  })

  console.log(`[Agent] WebSocket server ready at ${path}`)
  return wss
}
