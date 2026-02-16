import fs from 'fs'
import { execSync } from 'child_process'

// Find claude CLI path - check common locations for Homebrew and global npm
function findClaudePath(): string {
  const commonPaths = [
    '/opt/homebrew/bin/claude',      // macOS Apple Silicon Homebrew
    '/usr/local/bin/claude',         // macOS Intel Homebrew / Linux
    '/usr/bin/claude',               // System install
    `${process.env.HOME}/.npm-global/bin/claude`,  // npm global (custom)
    `${process.env.HOME}/.local/bin/claude`,       // pip/pipx style
  ]

  // Try 'which' command first (works on Unix-like systems)
  try {
    const result = execSync('which claude', { encoding: 'utf8', stdio: ['pipe', 'pipe', 'ignore'] })
    const claudePath = result.trim()
    if (claudePath && fs.existsSync(claudePath)) {
      return claudePath
    }
  } catch {
    // which failed, try common paths
  }

  // Try 'where' command on Windows
  try {
    const result = execSync('where claude', { encoding: 'utf8', stdio: ['pipe', 'pipe', 'ignore'] })
    const claudePath = result.trim().split('\n')[0]
    if (claudePath && fs.existsSync(claudePath)) {
      return claudePath
    }
  } catch {
    // where failed, try common paths
  }

  // Check common paths
  for (const p of commonPaths) {
    if (fs.existsSync(p)) {
      return p
    }
  }

  // Fallback to just 'claude' and hope it's in PATH
  return 'claude'
}

// Resolve claude path at startup and export for other modules
export const CLAUDE_PATH = findClaudePath()

console.log(`[Gekto] Resolved CLAUDE_PATH: "${CLAUDE_PATH}"`)

// Verify claude is accessible
if (CLAUDE_PATH === 'claude') {
  console.warn('⚠️  Claude CLI not found in common paths. Make sure it\'s installed and in PATH.')
}
