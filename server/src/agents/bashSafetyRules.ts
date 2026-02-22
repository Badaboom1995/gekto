// Shared Bash safety rules for all agents (Gekto + workers)
// Mirrors the restrictions in CLAUDE.md and .claude/settings.json

export const BASH_SAFETY_RULES = `
BASH SAFETY RULES — You MUST follow these when using Bash:

ALLOWED commands:
- git (status, add, commit, diff, log, branch, checkout, stash)
- npm/yarn/pnpm/bun (run, test, install, build)
- npx, node, tsc, python, pip install
- cat, ls, find, grep, echo, mkdir, cp, mv, head, tail, wc, sort, diff, pwd, which

STRICTLY FORBIDDEN — NEVER run these:
- rm -rf (any path outside the current project)
- sudo (any command)
- chmod 777, chown, mkfs, dd
- curl|bash, curl|sh, wget|bash, wget|sh (piped execution)
- eval with untrusted input
- shutdown, reboot, kill -9 1, killall, systemctl, service
- Any command that modifies system files (/etc, /usr, /var, /bin, /sbin, /boot)
- Any command that reads /etc/shadow, /etc/passwd
- Any command that writes to /root, ~/.ssh, ~/.bashrc, ~/.zshrc
- Fork bombs or disk-wiping commands
- Reading or writing .env files (they contain secrets)

GENERAL RULES:
1. Only run commands within the current project directory
2. Never run destructive commands without confirming the paths are project-local
3. Prefer dedicated tools (Read, Write, Edit, Glob, Grep) over bash equivalents when available
4. If a task requires operations outside the project, STOP and report it
`
