import { spawn, type ChildProcess } from 'child_process'
import { CLAUDE_PATH } from '../claudePath.js'

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
  disallowedTools?: string[]
}

export class HeadlessAgent {
  private sessionId: string | null = null
  private config: HeadlessAgentConfig
  private currentProc: ChildProcess | null = null

  constructor(config: HeadlessAgentConfig = {}) {
    this.config = config
  }

  kill(): boolean {
    if (this.currentProc && !this.currentProc.killed) {
      this.currentProc.kill('SIGTERM')
      this.currentProc = null
      return true
    }
    return false
  }

  isRunning(): boolean {
    return this.currentProc !== null && !this.currentProc.killed
  }

  async send(message: string, callbacks?: StreamCallbacks): Promise<AgentResponse> {
    const args = [
      '-p', message,
      '--output-format', 'stream-json',
      '--verbose',
      '--model', 'claude-opus-4-5-20251101',
      '--dangerously-skip-permissions',
    ]

    if (this.config.systemPrompt) {
      args.push('--system-prompt', this.config.systemPrompt)
    }

    if (this.config.disallowedTools && this.config.disallowedTools.length > 0) {
      args.push('--disallowed-tools', this.config.disallowedTools.join(','))
    }

    if (this.sessionId) {
      args.push('--resume', this.sessionId)
    }

    return this.runClaudeStreaming(args, callbacks)
  }

  private runClaudeStreaming(args: string[], callbacks?: StreamCallbacks): Promise<AgentResponse> {
    return new Promise((resolve, reject) => {
      console.log(`[HeadlessAgent] Spawning: "${CLAUDE_PATH}"`)

      const proc = spawn(CLAUDE_PATH, args, {
        cwd: this.config.workingDir || process.cwd(),
        env: process.env,
        stdio: ['pipe', 'pipe', 'pipe'],
      })

      proc.on('error', (err) => {
        console.error(`[HeadlessAgent] Spawn error:`, err)
      })
      this.currentProc = proc

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
          } catch {
            // Ignore parse errors
          }
        }
      })

      proc.stderr.on('data', () => {
        // Ignore stderr
      })

      proc.on('close', () => {
        this.currentProc = null

        if (buffer.trim()) {
          try {
            const event = JSON.parse(buffer)
            if (event.type === 'result') {
              lastResult = event
              this.sessionId = event.session_id
            }
          } catch {
            // Ignore parse errors
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

      proc.on('error', reject)
    })
  }

  private processStreamEvent(
    event: Record<string, unknown>,
    callbacks?: StreamCallbacks,
    setCurrentTool?: (tool: string | null) => void,
    clearCurrentTool?: () => void
  ) {
    if (event.type === 'assistant' && event.message) {
      const message = event.message as { content?: Array<{ type: string; name?: string; text?: string; input?: Record<string, unknown> }> }
      if (message.content) {
        for (const block of message.content) {
          if (block.type === 'tool_use' && block.name) {
            setCurrentTool?.(block.name)
            callbacks?.onToolStart?.(block.name, block.input)
          }
          // Extract text content from assistant messages
          if (block.type === 'text' && block.text) {
            callbacks?.onText?.(block.text)
          }
        }
      }
    }

    if (event.type === 'user' && event.message) {
      const message = event.message as { content?: Array<{ type: string }> }
      if (message.content) {
        for (const block of message.content) {
          if (block.type === 'tool_result') {
            clearCurrentTool?.()
          }
        }
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
