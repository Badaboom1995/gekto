import { WebSocket, WebSocketServer } from 'ws'
import type { Server } from 'http'
import type { IncomingMessage } from 'http'
import type { Duplex } from 'stream'
import { sendMessage, resetSession, getWorkingDir } from './agentPool'

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

    // Send working directory info
    ws.send(JSON.stringify({ type: 'info', workingDir: getWorkingDir() }))

    ws.on('message', async (message: Buffer | string) => {
      try {
        const msg = JSON.parse(message.toString())
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
