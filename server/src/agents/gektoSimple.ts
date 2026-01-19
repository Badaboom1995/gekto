import { spawn } from 'child_process'

// Simple Gekto - just chat with Haiku and return text response

const GEKTO_SYSTEM_PROMPT = `You are Gekto, a friendly coding assistant. Decide what to do with the user's message.

Options:
1. answer - For greetings, questions, conversation. Just reply naturally.
2. write_code - For coding tasks that need implementation.
3. plan - For complex tasks that need breaking into steps.

Respond with JSON: { "action": "answer|write_code|plan", "response": "your message" }

Examples:
- "yo" -> { "action": "answer", "response": "Hey! What can I help you with?" }
- "add dark mode" -> { "action": "write_code", "response": "I'll spawn an agent to add dark mode." }
- "refactor the auth system" -> { "action": "plan", "response": "Let me break this down into steps..." }

Always respond with valid JSON.`

export type GektoAction = 'answer' | 'write_code' | 'plan'

export interface SimpleGektoResult {
  type: 'chat'
  action: GektoAction
  message: string
  durationMs: number
}

export async function processSimple(
  prompt: string,
  workingDir: string
): Promise<SimpleGektoResult> {
  const startTime = Date.now()

  console.log('[GektoSimple] Processing:', prompt.substring(0, 100))

  try {
    const rawResponse = await runHaiku(prompt, GEKTO_SYSTEM_PROMPT, workingDir)
    const durationMs = Date.now() - startTime
    console.log('[GektoSimple] Done in', durationMs, 'ms')
    console.log('[GektoSimple] Raw response:', rawResponse.substring(0, 200))

    // Parse JSON response
    const jsonMatch = rawResponse.match(/\{[\s\S]*\}/)
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0])
      return {
        type: 'chat',
        action: parsed.action || 'answer',
        message: parsed.response || rawResponse,
        durationMs,
      }
    }

    // Fallback: use raw response as message
    return {
      type: 'chat',
      action: 'answer',
      message: rawResponse,
      durationMs,
    }
  } catch (err) {
    const durationMs = Date.now() - startTime
    console.error('[GektoSimple] Error:', err)

    // Always return a friendly message, never an error
    return {
      type: 'chat',
      action: 'answer',
      message: "Hey! Something went wrong on my end. Could you try again?",
      durationMs,
    }
  }
}

function runHaiku(
  prompt: string,
  systemPrompt: string,
  workingDir: string
): Promise<string> {
  return new Promise((resolve) => {
    const args = [
      '-p', prompt,
      '--output-format', 'stream-json',
      '--model', 'claude-haiku-4-5-20251001',
      '--system-prompt', systemPrompt,
      '--dangerously-skip-permissions',
    ]

    console.log('[GektoSimple] Calling Haiku...')

    const proc = spawn('claude', args, {
      cwd: workingDir,
      env: process.env,
      stdio: ['pipe', 'pipe', 'pipe'],
    })

    proc.stdin?.end()

    let buffer = ''
    let resultText = ''
    let allOutput = ''

    proc.stdout.on('data', (data) => {
      const chunk = data.toString()
      buffer += chunk
      allOutput += chunk

      const lines = buffer.split('\n')
      buffer = lines.pop() || ''

      for (const line of lines) {
        if (!line.trim()) continue
        try {
          const event = JSON.parse(line)
          // Capture any text content
          if (event.type === 'result' && event.result) {
            resultText = event.result
          } else if (event.type === 'assistant' && event.message?.content) {
            // Also check for assistant message format
            for (const block of event.message.content) {
              if (block.type === 'text') {
                resultText = block.text
              }
            }
          } else if (event.type === 'content_block_delta' && event.delta?.text) {
            resultText += event.delta.text
          }
        } catch {
          // Ignore parse errors
        }
      }
    })

    proc.stderr.on('data', (data) => {
      console.error('[GektoSimple] stderr:', data.toString())
    })

    proc.on('close', (code) => {
      console.log('[GektoSimple] Exit code:', code)

      // Try to parse remaining buffer
      if (buffer.trim()) {
        try {
          const event = JSON.parse(buffer)
          if (event.type === 'result' && event.result) {
            resultText = event.result
          }
        } catch {
          // Ignore
        }
      }

      // Always resolve with something
      if (resultText) {
        console.log('[GektoSimple] Result:', resultText.substring(0, 100))
        resolve(resultText)
      } else {
        // Log all output for debugging
        console.log('[GektoSimple] No result found. All output:', allOutput.substring(0, 500))
        resolve('{ "action": "answer", "response": "Hey there! How can I help?" }')
      }
    })

    proc.on('error', (err) => {
      console.error('[GektoSimple] Spawn error:', err)
      // Still resolve with a default response
      resolve('{ "action": "answer", "response": "Hey! How can I help you today?" }')
    })
  })
}
