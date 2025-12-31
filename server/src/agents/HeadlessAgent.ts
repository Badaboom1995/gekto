import { spawn } from 'child_process'

export interface AgentResponse {
  type: string
  subtype: string
  is_error: boolean
  result: string
  session_id: string
  total_cost_usd: number
  duration_ms: number
}

export interface StreamCallbacks {
  onToolStart?: (tool: string, input?: Record<string, unknown>) => void
  onToolEnd?: (tool: string) => void
  onText?: (text: string) => void
}

export interface HeadlessAgentConfig {
  systemPrompt?: string
  workingDir?: string
}

export class HeadlessAgent {
  private sessionId: string | null = null
  private config: HeadlessAgentConfig

  constructor(config: HeadlessAgentConfig = {}) {
    this.config = config
  }

  async send(message: string, callbacks?: StreamCallbacks): Promise<AgentResponse> {
    const args = [
      '-p', message,
      '--output-format', 'stream-json',
      '--verbose',
      '--dangerously-skip-permissions',
    ]

    if (this.config.systemPrompt) {
      args.push('--system-prompt', this.config.systemPrompt)
    }

    if (this.sessionId) {
      args.push('--resume', this.sessionId)
    }

    console.log('[HeadlessAgent] Running: claude', args.join(' '))

    const response = await this.runClaudeStreaming(args, callbacks)
    console.log('[HeadlessAgent] Response received')
    console.log('[HeadlessAgent] Result:', response.result?.substring(0, 100))
    return response
  }

  private runClaudeStreaming(args: string[], callbacks?: StreamCallbacks): Promise<AgentResponse> {
    return new Promise((resolve, reject) => {
      const proc = spawn('claude', args, {
        cwd: this.config.workingDir || process.cwd(),
        env: process.env,
        stdio: ['pipe', 'pipe', 'pipe'],
      })
      console.log('[HeadlessAgent] Spawned claude with pid:', proc.pid)

      // Close stdin immediately - we pass everything via args
      proc.stdin?.end()

      let buffer = ''
      let lastResult: AgentResponse | null = null
      let currentTool: string | null = null

      proc.stdout.on('data', (data) => {
        buffer += data.toString()

        const lines = buffer.split('\n')
        buffer = lines.pop() || ''

        for (const line of lines) {
          if (!line.trim()) continue

          try {
            const event = JSON.parse(line)

            this.processStreamEvent(event, callbacks, (tool) => {
              currentTool = tool
            }, () => {
              currentTool = null
            })

            if (event.type === 'result') {
              lastResult = event
              this.sessionId = event.session_id
            }
          } catch (err) {
            console.error('[HeadlessAgent] Failed to parse stream line:', line.substring(0, 100))
          }
        }
      })

      proc.stderr.on('data', (data) => {
        console.error('[HeadlessAgent] stderr:', data.toString())
      })

      proc.on('close', (code) => {
        console.log('[HeadlessAgent] Process closed, code:', code)

        if (buffer.trim()) {
          try {
            const event = JSON.parse(buffer)
            if (event.type === 'result') {
              lastResult = event
              this.sessionId = event.session_id
            }
          } catch (err) {
            console.error('[HeadlessAgent] Failed to parse final buffer')
          }
        }

        if (currentTool && callbacks?.onToolEnd) {
          callbacks.onToolEnd(currentTool)
        }

        if (lastResult) {
          resolve(lastResult)
        } else {
          reject(new Error('No result received from Claude'))
        }
      })

      proc.on('error', (err) => {
        console.error('[HeadlessAgent] Spawn error:', err)
        reject(err)
      })
    })
  }

  private processStreamEvent(
    event: Record<string, unknown>,
    callbacks?: StreamCallbacks,
    setCurrentTool?: (tool: string | null) => void,
    clearCurrentTool?: () => void
  ) {
    if (event.type === 'assistant' && event.message) {
      const message = event.message as { content?: Array<{ type: string; name?: string; input?: Record<string, unknown> }> }
      if (message.content) {
        for (const block of message.content) {
          if (block.type === 'tool_use' && block.name) {
            console.log('[HeadlessAgent] Tool started:', block.name)
            setCurrentTool?.(block.name)
            callbacks?.onToolStart?.(block.name, block.input)
          }
        }
      }
    }

    if (event.type === 'user' && event.message) {
      const message = event.message as { content?: Array<{ type: string }> }
      if (message.content) {
        for (const block of message.content) {
          if (block.type === 'tool_result') {
            console.log('[HeadlessAgent] Tool completed')
            clearCurrentTool?.()
          }
        }
      }
    }

    if (event.type === 'content_block_delta') {
      const delta = event.delta as { type?: string; text?: string } | undefined
      if (delta?.type === 'text_delta' && delta.text) {
        callbacks?.onText?.(delta.text)
      }
    }
  }

  getSessionId(): string | null {
    return this.sessionId
  }

  resetSession(): void {
    this.sessionId = null
  }
}
