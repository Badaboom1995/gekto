import { WebSocket, WebSocketServer } from 'ws'
import type { Server } from 'http'
import type { IncomingMessage } from 'http'
import type { Duplex } from 'stream'
import { sendMessage, resetSession, getWorkingDir, getActiveSessions, killSession, killAllSessions, attachWebSocket } from './agentPool.js'
import { processWithTools, type ExecutionPlan } from './gektoTools.js'
import { initGekto, sendToGekto, getGektoState, type GektoCallbacks } from './gektoPersistent.js'

// Track connected clients to broadcast Gekto state
const connectedClients = new Set<WebSocket>()
let gektoInitialized = false

function broadcastGektoState(state: 'loading' | 'ready' | 'error') {
  const message = JSON.stringify({ type: 'gekto_state', state })
  for (const client of connectedClients) {
    if (client.readyState === 1) { // WebSocket.OPEN
      client.send(message)
    }
  }
}

// Summarize tool input for display
function summarizeToolInput(input?: Record<string, unknown>): string {
  if (!input) return ''
  if (input.file_path) return String(input.file_path)
  if (input.pattern) return String(input.pattern)
  if (input.command) return String(input.command).substring(0, 50)
  if (input.path) return String(input.path)
  if (input.query) return String(input.query).substring(0, 50)
  return ''
}

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

    // Track connected clients for Gekto state broadcasts
    connectedClients.add(ws)

    // Initialize Gekto on first connection (with state broadcast callback)
    if (!gektoInitialized) {
      initGekto(getWorkingDir(), broadcastGektoState)
      gektoInitialized = true
    }

    // Attach this WebSocket to all existing sessions (for reconnection)
    attachWebSocket(ws)

    // Send working directory info
    ws.send(JSON.stringify({ type: 'info', workingDir: getWorkingDir() }))

    // Send current Gekto state
    ws.send(JSON.stringify({ type: 'gekto_state', state: getGektoState() }))

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
            // Two-mode Gekto: classify first, then direct or plan
            console.log('[Agent] Processing Gekto message:', msg.prompt?.substring(0, 50))

            // Set master lizard to working state
            ws.send(JSON.stringify({ type: 'state', lizardId: 'master', state: 'working' }))

            try {
              // Create callbacks for streaming events to client
              const callbacks: GektoCallbacks = {
                onClassified: (mode) => {
                  console.log('[Agent] Gekto classified as:', mode)
                  ws.send(JSON.stringify({
                    type: 'gekto_classified',
                    planId: msg.planId,
                    mode,
                  }))
                },
                onToolStart: (tool, input) => {
                  ws.send(JSON.stringify({
                    type: 'tool',
                    lizardId: 'master',
                    status: 'running',
                    tool,
                    input: summarizeToolInput(input),
                    fullInput: input,
                  }))
                },
                onToolEnd: (tool) => {
                  ws.send(JSON.stringify({
                    type: 'tool',
                    lizardId: 'master',
                    status: 'completed',
                    tool,
                  }))
                },
                onText: (text) => {
                  ws.send(JSON.stringify({
                    type: 'gekto_text',
                    planId: msg.planId,
                    text,
                  }))
                },
              }

              const response = await sendToGekto(msg.prompt, callbacks)

              if (response.mode === 'plan') {
                // Plan mode - use gektoTools for task breakdown
                console.log('[Agent] Switching to plan mode')
                const planResult = await processWithTools(
                  msg.prompt,
                  msg.planId,
                  getWorkingDir(),
                  getActiveSessions()
                )

                if (planResult.type === 'build' && planResult.plan) {
                  activePlans.set(msg.planId, planResult.plan)
                  ws.send(JSON.stringify({
                    type: 'plan_created',
                    planId: msg.planId,
                    plan: planResult.plan,
                  }))
                } else if (planResult.type === 'remove' && planResult.removedAgents) {
                  ws.send(JSON.stringify({
                    type: 'gekto_remove',
                    planId: msg.planId,
                    agents: planResult.removedAgents,
                  }))
                } else {
                  ws.send(JSON.stringify({
                    type: 'gekto_chat',
                    planId: msg.planId,
                    message: planResult.message || 'Plan created.',
                  }))
                }
              } else {
                // Direct mode - response already sent via callbacks
                ws.send(JSON.stringify({
                  type: 'gekto_chat',
                  planId: msg.planId,
                  message: response.message,
                  timing: {
                    classifyMs: response.classifyMs,
                    workMs: response.workMs,
                  },
                }))
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
      connectedClients.delete(ws)
    })

    ws.on('error', (err) => {
      console.error('[Agent] WebSocket error:', err)
    })
  })

  console.log(`[Agent] WebSocket server ready at ${path}`)
  return wss
}
