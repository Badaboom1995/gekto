import * as pty from 'node-pty'

export type AgentState = 'loading' | 'ready' | 'working' | 'waiting_input' | 'completed' | 'error'

export interface AgentConfig {
  workingDir: string
  onOutput: (data: string) => void
  onStateChange: (state: AgentState) => void
  onReady: () => void
}

export class ClaudeAgent {
  private pty: pty.IPty
  private buffer: string = ''
  private state: AgentState = 'loading'
  private config: AgentConfig
  private readyPromise: Promise<void>
  private resolveReady!: () => void

  constructor(config: AgentConfig) {
    this.config = config

    this.readyPromise = new Promise((resolve) => {
      this.resolveReady = resolve
    })

    this.pty = pty.spawn('claude', [], {
      name: 'xterm-256color',
      cols: 120,
      rows: 40,
      cwd: config.workingDir,
      env: process.env as Record<string, string>,
    })

    this.pty.onData((data: string) => {
      this.buffer += data
      this.config.onOutput(data)
      this.detectState(data)
    })

    this.pty.onExit(({ exitCode }) => {
      console.log(`[ClaudeAgent] Exited with code ${exitCode}`)
      this.setState('error')
    })
  }

  private setState(state: AgentState) {
    if (this.state !== state) {
      this.state = state
      this.config.onStateChange(state)
    }
  }

  private detectState(data: string) {
    // Strip ANSI codes for analysis
    const clean = data.replace(/\x1b\[[0-9;]*m/g, '').replace(/\x1b\[[0-9;]*[A-Za-z]/g, '')

    // Check for ready prompt (Claude Code shows > or ❯ when ready for input)
    // This indicates Claude has finished and is waiting for next input
    if ((clean.includes('>') || clean.includes('❯')) && (this.state === 'loading' || this.state === 'working')) {
      if (this.state === 'loading') {
        this.config.onReady()
        this.resolveReady()
      }
      this.setState('ready')
    }

    // Check for permission prompts
    if (/Do you want to|Allow|Proceed\?|\[y\/N\]|\[Y\/n\]/i.test(clean)) {
      this.setState('waiting_input')
    }
  }

  async waitUntilReady(): Promise<void> {
    return this.readyPromise
  }

  sendMessage(message: string): void {
    this.setState('working')
    this.buffer = ''
    this.pty.write(message + '\r')
  }

  respond(input: string): void {
    this.setState('working')
    this.pty.write(input + '\r')
  }

  getState(): AgentState {
    return this.state
  }

  kill(): void {
    this.pty.kill()
  }
}
