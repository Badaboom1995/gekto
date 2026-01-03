import { WebSocket, WebSocketServer } from 'ws'
import type { Server } from 'http'
import type { IncomingMessage } from 'http'
import type { Duplex } from 'stream'
import { sendMessage, resetSession, getWorkingDir, getActiveSessions, killSession, killAllSessions, attachWebSocket } from './agentPool'
import { processWithTools, type ExecutionPlan } from './gektoTools'

// Store active plans
const activePlans = new Map<string, ExecutionPlan>()

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

    // Send current state for all active sessions
    const activeSessions = getActiveSessions()
    for (const session of activeSessions) {
      ws.send(JSON.stringify({
        type: 'state',
        lizardId: session.lizardId,
        state: session.state,
      }))
      console.log(`[Agent] Sent state sync: ${session.lizardId} = ${session.state}`)
    }

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

          case 'debug_pool':
            const sessions = getActiveSessions()
            console.log('\n========== AGENT POOL DEBUG ==========')
            console.log('Active sessions:', sessions.length)
            sessions.forEach(s => {
              console.log(`  - ${s.lizardId}: processing=${s.isProcessing}, running=${s.isRunning}, queue=${s.queueLength}`)
            })
            console.log('=======================================\n')
            ws.send(JSON.stringify({
              type: 'debug_pool_result',
              sessions,
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

          case 'create_plan':
            // Process message with Gekto tools
            console.log('[Agent] Processing Gekto message:', msg.prompt?.substring(0, 50))

            // Set master lizard to working state
            ws.send(JSON.stringify({ type: 'state', lizardId: 'master', state: 'working' }))

            try {
              // Use lizards from client if provided, otherwise fall back to server sessions
              const clientLizards = msg.lizards || []
              const activeAgents = clientLizards.length > 0
                ? clientLizards.map((l: { id: string; isWorker?: boolean }) => ({
                    lizardId: l.id,
                    isProcessing: false,
                    queueLength: 0,
                    isWorker: l.isWorker,
                  }))
                : getActiveSessions()

              console.log('[Agent] Available agents for removal:', activeAgents.map((a: { lizardId: string }) => a.lizardId))

              const response = await processWithTools(
                msg.prompt,
                msg.planId,
                getWorkingDir(),
                activeAgents
              )

              switch (response.type) {
                case 'chat':
                  // Gekto responded with a chat message
                  ws.send(JSON.stringify({
                    type: 'gekto_chat',
                    planId: msg.planId,
                    message: response.message,
                  }))
                  break

                case 'build':
                  // Gekto created a plan
                  if (response.plan) {
                    activePlans.set(response.plan.id, response.plan)
                    ws.send(JSON.stringify({ type: 'plan_created', plan: response.plan }))
                  }
                  break

                case 'remove':
                  // Gekto wants to remove agents
                  if (response.removedAgents && response.removedAgents.length > 0) {
                    for (const agentId of response.removedAgents) {
                      killSession(agentId)
                    }
                    ws.send(JSON.stringify({
                      type: 'gekto_remove',
                      planId: msg.planId,
                      removedAgents: response.removedAgents,
                    }))
                  } else {
                    ws.send(JSON.stringify({
                      type: 'gekto_chat',
                      planId: msg.planId,
                      message: 'No agents to remove.',
                    }))
                  }
                  break
              }

              ws.send(JSON.stringify({ type: 'state', lizardId: 'master', state: 'ready' }))
            } catch (err) {
              console.error('[Agent] Gekto processing failed:', err)
              ws.send(JSON.stringify({
                type: 'gekto_chat',
                planId: msg.planId,
                message: `Error: ${err instanceof Error ? err.message : 'Processing failed'}`,
              }))
              ws.send(JSON.stringify({ type: 'state', lizardId: 'master', state: 'ready' }))
            }
            return

          case 'execute_plan':
            // Execute an existing plan
            const plan = activePlans.get(msg.planId)
            if (!plan) {
              ws.send(JSON.stringify({ type: 'error', message: 'Plan not found' }))
              return
            }
            // Start executing tasks - this will be handled by the client
            // which will spawn workers and send individual chat messages
            plan.status = 'executing'
            ws.send(JSON.stringify({ type: 'plan_updated', plan }))
            return

          case 'cancel_plan':
            const cancelPlan = activePlans.get(msg.planId)
            if (cancelPlan) {
              cancelPlan.status = 'failed'
              activePlans.delete(msg.planId)
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
