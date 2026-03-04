import { WebSocket, WebSocketServer } from 'ws'
import type { Server } from 'http'
import type { IncomingMessage } from 'http'
import type { Duplex } from 'stream'
import { sendMessage, resumeSession, resetSession, getWorkingDir, getActiveSessions, killSession, killAllSessions, attachWebSocket, revertFiles, saveImagesToTempFiles } from './agentPool.js'
import { processWithTools, generateTaskPrompts, type ExecutionPlan, type PlanCallbacks, type PromptGenCallbacks } from './gektoTools.js'
import { randomUUID } from 'crypto'
import { initGekto, getGektoState, abortGekto, setStateCallback, resetGektoSession, restoreGektoSession, getGektoSessionId } from './gektoPersistent.js'
import { getState, mutate, mutateBatch, addClient, removeClient, sendSnapshot, getClients, type Agent, type Task, type Message, type GektoSession } from '../state.js'

let gektoInitialized = false

function broadcastGektoState(state: 'loading' | 'ready' | 'error') {
  const message = JSON.stringify({ type: 'gekto_state', state })
  for (const client of getClients()) {
    if (client.readyState === 1) {
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
    // Track client for state diffs
    addClient(ws)

    // Always ensure Gekto is initialized and callback is set
    setStateCallback(broadcastGektoState)
    if (!gektoInitialized) {
      initGekto(getWorkingDir(), broadcastGektoState)
      gektoInitialized = true
    }

    // Attach this WebSocket to all existing sessions (for reconnection)
    attachWebSocket(ws)

    // Send full state snapshot on connect
    sendSnapshot(ws)

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
            ws.send(JSON.stringify({
              type: 'debug_pool_result',
              sessions,
            }))
            return

          case 'kill_all': {
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

          case 'create_plan': {
            // Set master lizard to working state
            ws.send(JSON.stringify({ type: 'state', lizardId: 'master', state: 'working' }))

            // Save attached images to temp files
            const planImages = msg.images as string[] | undefined
            let planImagePaths: string[] | undefined
            if (planImages && planImages.length > 0) {
              planImagePaths = saveImagesToTempFiles(planImages)
            }

            try {
              // Server-side accumulators and block counter
              let accThinking = ''
              let accText = ''
              let blockIndex = 0

              // Streaming callbacks for tool events and text
              const planCallbacks: PlanCallbacks = {
                onToolStart: (tool, input) => {
                  accThinking = ''
                  accText = ''
                  blockIndex++
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
                  accText += text
                  ws.send(JSON.stringify({
                    type: 'gekto_text',
                    planId: msg.planId,
                    text: accText,
                    blockIndex,
                  }))
                },
                onThinking: (text) => {
                  accThinking += text
                  ws.send(JSON.stringify({
                    type: 'gekto_thinking',
                    planId: msg.planId,
                    text: accThinking,
                    blockIndex,
                  }))
                },
              }

              // Signal client that planning has started
              ws.send(JSON.stringify({
                type: 'planning_started',
                planId: msg.planId,
                prompt: msg.prompt,
              }))

              const planResult = await processWithTools(
                msg.prompt,
                msg.planId,
                getWorkingDir(),
                getActiveSessions(),
                planCallbacks,
                msg.existingPlan,
                planImagePaths,
              )

              if (planResult.type === 'build' && planResult.plan) {
                // Store plan in server state
                mutate('plan', planResult.plan)

                // Show reasoning/message in chat so the user knows what Gekto decided
                if (planResult.message) {
                  ws.send(JSON.stringify({
                    type: 'gekto_chat',
                    planId: msg.planId,
                    message: planResult.message,
                  }))
                }

                ws.send(JSON.stringify({
                  type: 'plan_created',
                  planId: msg.planId,
                  plan: planResult.plan,
                }))
              } else if (planResult.type === 'remove' && planResult.removedAgents) {
                // Remove agents from server state
                for (const agentId of planResult.removedAgents) {
                  mutate(`agents.${agentId}`, undefined)
                }
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
          }

          case 'generate_prompts': {
            const currentState = getState()
            const genPlan = currentState.plan
            if (!genPlan || genPlan.id !== msg.planId) {
              ws.send(JSON.stringify({ type: 'error', message: 'Plan not found' }))
              return
            }

            // Set master to working while generating
            ws.send(JSON.stringify({ type: 'state', lizardId: 'master', state: 'working' }))

            try {
              const genCallbacks: PromptGenCallbacks = {
                onTaskPromptGenerated: (taskId, prompt) => {
                  // Update plan task prompt in server state
                  const state = getState()
                  if (state.plan) {
                    const taskIdx = state.plan.tasks.findIndex(t => t.id === taskId)
                    if (taskIdx >= 0) {
                      mutate(`plan.tasks.${taskIdx}.prompt`, prompt)
                    }
                  }
                  // Notify client
                  ws.send(JSON.stringify({
                    type: 'prompt_generated',
                    planId: msg.planId,
                    taskId,
                    prompt,
                  }))
                },
                onAllPromptsReady: () => {
                  mutate('plan.status', 'prompts_ready')
                  ws.send(JSON.stringify({
                    type: 'prompts_ready',
                    planId: msg.planId,
                  }))
                },
                onError: (taskId, error) => {
                  const state = getState()
                  const fallback = state.plan?.tasks.find(t => t.id === taskId)?.description || 'Execute task'
                  ws.send(JSON.stringify({
                    type: 'prompt_generated',
                    planId: msg.planId,
                    taskId,
                    prompt: fallback,
                    error,
                  }))
                },
              }

              await generateTaskPrompts(genPlan, getWorkingDir(), genCallbacks)
            } catch (err) {
              console.error('[Agent] Prompt generation failed:', err)
              ws.send(JSON.stringify({
                type: 'gekto_chat',
                planId: msg.planId,
                message: `Error generating prompts: ${err instanceof Error ? err.message : 'Failed'}`,
              }))
            }

            ws.send(JSON.stringify({ type: 'state', lizardId: 'master', state: 'ready' }))
            return
          }

          case 'execute_plan': {
            // Update plan status in server state
            const currentState = getState()
            if (currentState.plan && currentState.plan.id === msg.planId) {
              mutate('plan.status', 'executing')
            }
            return
          }

          case 'cancel_plan': {
            const currentState = getState()
            if (currentState.plan && currentState.plan.id === msg.planId) {
              mutate('plan', null)
            }
            return
          }

          // Client creates task+agent in server state before sending chat
          case 'create_task_and_agent': {
            const { task, agent } = msg as { task: Task; agent: Agent }
            mutateBatch([
              { path: `tasks.${task.id}`, value: task },
              { path: `agents.${agent.id}`, value: agent },
            ])

            // Update plan task with agent assignment
            const state = getState()
            if (state.plan) {
              const taskIdx = state.plan.tasks.findIndex(t => t.id === task.id)
              if (taskIdx >= 0) {
                mutateBatch([
                  { path: `plan.tasks.${taskIdx}.status`, value: 'in_progress' },
                  { path: `plan.tasks.${taskIdx}.assignedAgentId`, value: agent.id },
                ])
              }
            }
            return
          }

          // Client updates a chat message list
          case 'save_chat': {
            const { agentId, messages } = msg as { agentId: string; messages: Message[] }
            mutate(`chats.${agentId}`, messages)

            // Prune old chats — keep only the 50 most recent
            const MAX_CHATS = 50
            const allChats = getState().chats
            const chatKeys = Object.keys(allChats)
            if (chatKeys.length > MAX_CHATS) {
              // Sort by latest message timestamp (oldest first)
              const sorted = chatKeys
                .map(key => {
                  const msgs = allChats[key]
                  const lastMsg = msgs?.[msgs.length - 1]
                  const ts = lastMsg?.timestamp ? new Date(lastMsg.timestamp as unknown as string).getTime() : 0
                  return { key, ts }
                })
                .sort((a, b) => a.ts - b.ts)

              const toRemove = sorted.slice(0, sorted.length - MAX_CHATS)
              for (const { key } of toRemove) {
                mutate(`chats.${key}`, undefined)
              }
            }
            return
          }

          // Generic state mutation from client
          case 'save_state': {
            const { path: statePath, value: stateValue } = msg as { path: string; value: unknown }
            if (statePath) {
              mutate(statePath, stateValue)
            }
            return
          }

          // Client saves visual positions
          case 'save_visuals': {
            const { visuals } = msg as { visuals: Record<string, { position: { x: number; y: number }; color: string }> }
            mutate('visuals', visuals)
            return
          }

          // Task completion reported by client
          case 'task_completed': {
            const state = getState()
            if (state.plan) {
              const taskIdx = state.plan.tasks.findIndex(t => t.id === msg.taskId)
              if (taskIdx >= 0) {
                mutate(`plan.tasks.${taskIdx}.status`, 'pending_testing')
                if (msg.result) {
                  mutate(`plan.tasks.${taskIdx}.result`, msg.result)
                }
              }
            }
            if (msg.taskId && state.tasks[msg.taskId]) {
              mutate(`tasks.${msg.taskId}.status`, 'pending_testing')
            }
            return
          }

          case 'task_failed': {
            const state = getState()
            if (state.plan) {
              const taskIdx = state.plan.tasks.findIndex(t => t.id === msg.taskId)
              if (taskIdx >= 0) {
                mutateBatch([
                  { path: `plan.tasks.${taskIdx}.status`, value: 'failed' },
                  { path: `plan.tasks.${taskIdx}.error`, value: msg.error },
                ])
              }
            }
            if (msg.taskId && state.tasks[msg.taskId]) {
              mutate(`tasks.${msg.taskId}.status`, 'failed')
            }
            return
          }

          case 'task_started': {
            const state = getState()
            if (state.plan) {
              const taskIdx = state.plan.tasks.findIndex(t => t.id === msg.taskId)
              if (taskIdx >= 0) {
                mutateBatch([
                  { path: `plan.tasks.${taskIdx}.status`, value: 'in_progress' },
                  { path: `plan.tasks.${taskIdx}.assignedAgentId`, value: msg.lizardId },
                ])
              }
            }
            return
          }

          // Update agent status in server state
          case 'update_agent': {
            const { agentId, updates } = msg as { agentId: string; updates: Partial<Agent> }
            const state = getState()
            if (state.agents[agentId]) {
              for (const [key, value] of Object.entries(updates)) {
                mutate(`agents.${agentId}.${key}`, value)
              }
            }
            return
          }

          // Delete agent from server state
          case 'delete_agent': {
            mutate(`agents.${msg.agentId}`, undefined)
            mutate(`visuals.${msg.agentId}`, undefined)
            return
          }

          // Mark task resolved — remove from plan
          case 'mark_task_resolved': {
            const state = getState()
            if (state.plan) {
              const remainingTasks = state.plan.tasks.filter(t => t.id !== msg.taskId)
              const allDone = remainingTasks.length === 0
              mutateBatch([
                { path: 'plan.tasks', value: remainingTasks },
                ...(allDone ? [
                  { path: 'plan.status', value: 'completed' },
                  { path: 'plan.completedAt', value: new Date().toISOString() },
                ] : []),
              ])
            }
            // Remove linked agent
            if (msg.agentId) {
              mutate(`agents.${msg.agentId}`, undefined)
              mutate(`visuals.${msg.agentId}`, undefined)
            }
            return
          }

          case 'archive_gekto_session': {
            const { messages: archiveMessages, plan: archivePlan } = msg as {
              messages: Message[]
              plan?: unknown
            }
            const archiveSessionId = getGektoSessionId()

            // Extract title from first user message
            const firstUserMsg = archiveMessages.find(m => m.sender === 'user')
            const title = firstUserMsg
              ? firstUserMsg.text.slice(0, 50) + (firstUserMsg.text.length > 50 ? '...' : '')
              : 'Untitled session'

            const session: GektoSession = {
              id: randomUUID(),
              title,
              messages: archiveMessages,
              plan: archivePlan as GektoSession['plan'],
              gektoSessionId: archiveSessionId,
              createdAt: new Date().toISOString(),
            }

            const state = getState()
            const updated = [session, ...state.gektoSessions].slice(0, 50)
            mutate('gektoSessions', updated)
            return
          }

          case 'restore_gekto_session': {
            const { sessionId: restoreId } = msg as { sessionId: string }
            const state = getState()
            const session = state.gektoSessions.find(s => s.id === restoreId)
            if (!session) {
              ws.send(JSON.stringify({ type: 'error', message: 'Session not found' }))
              return
            }

            // Restore chat messages
            mutate('chats.master', session.messages)

            // Restore plan if session had one
            if (session.plan) {
              mutate('plan', session.plan)
            }

            // Switch Claude session ID
            restoreGektoSession(session.gektoSessionId)

            // Notify client
            ws.send(JSON.stringify({
              type: 'session_restored',
              sessionId: session.id,
              plan: session.plan || null,
            }))
            return
          }

          case 'delete_gekto_session': {
            const { sessionId: deleteId } = msg as { sessionId: string }
            const state = getState()
            const filtered = state.gektoSessions.filter(s => s.id !== deleteId)
            mutate('gektoSessions', filtered)
            return
          }

          case 'resume_agent': {
            const { lizardId: resumeId, sessionId: resumeSessionId, prompt: resumePrompt } = msg
            if (!resumeId) {
              ws.send(JSON.stringify({ type: 'error', message: 'Missing lizardId for resume' }))
              return
            }
            // Create session with restored sessionId
            resumeSession(resumeId, resumeSessionId, ws)
            // Send the original prompt to resume work
            try {
              await sendMessage(resumeId, resumePrompt || 'Continue where you left off.', ws)
            } catch (err) {
              console.error(`[Agent] Resume failed for ${resumeId}:`, err)
            }
            return
          }
        }

        // Commands that require lizardId
        const lizardId = msg.lizardId
        if (!lizardId) {
          ws.send(JSON.stringify({ type: 'error', message: 'Missing lizardId' }))
          return
        }

        switch (msg.type) {
          case 'chat':
            try {
              // Update agent status in state
              const state = getState()
              if (state.agents[lizardId]) {
                mutate(`agents.${lizardId}.status`, 'working')
              }
              const images = (msg.images as string[] | undefined)
              await sendMessage(lizardId, msg.content, ws, images)
            } catch (err) {
              console.error(`[Agent] [${lizardId}] Error:`, err)
            }
            break

          case 'reset':
            if (lizardId === 'master') {
              resetGektoSession()
            } else {
              resetSession(lizardId)
            }
            ws.send(JSON.stringify({ type: 'state', lizardId, state: 'ready' }))
            break

          case 'revert_files': {
            const revertResult = revertFiles(msg.filePaths || [], msg.fileChanges || [])
            ws.send(JSON.stringify({
              type: 'files_reverted',
              lizardId,
              reverted: revertResult.reverted,
              failed: revertResult.failed,
            }))
            // Remove reverted file changes from server state
            const agentState = getState().agents[lizardId]
            if (agentState?.fileChanges) {
              const revertedSet = new Set(revertResult.reverted)
              const remaining = agentState.fileChanges.filter(fc => !revertedSet.has(fc.filePath))
              mutate(`agents.${lizardId}.fileChanges`, remaining)
            }
            break
          }

          case 'kill': {
            // For master, abort the persistent Gekto process instead of killing session
            const killed = lizardId === 'master' ? abortGekto() : killSession(lizardId)
            ws.send(JSON.stringify({
              type: 'kill_result',
              lizardId,
              killed,
            }))
            ws.send(JSON.stringify({ type: 'state', lizardId, state: 'ready' }))
            break
          }
        }
      } catch (err) {
        console.error('[Agent] Failed to parse message:', err)
      }
    })

    ws.on('close', () => {
      removeClient(ws)
    })

    ws.on('error', (err) => {
      console.error('[Agent] WebSocket error:', err)
    })
  })

  return wss
}
