#!/usr/bin/env node

const COLORS = {
  reset: '\x1b[0m',
  bold: '\x1b[1m',
  dim: '\x1b[2m',
  green: '\x1b[32m',
  cyan: '\x1b[36m',
  yellow: '\x1b[33m',
  magenta: '\x1b[35m',
  blue: '\x1b[34m',
  gray: '\x1b[90m',
  white: '\x1b[37m',
  bgGreen: '\x1b[42m',
  bgBlue: '\x1b[44m',
}

const SPINNER = ['⠋', '⠙', '⠹', '⠸', '⠼', '⠴', '⠦', '⠧', '⠇', '⠏']
const LIZARD = '🦎'

function clearLine() {
  process.stdout.write('\r\x1b[K')
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

async function spinner(text, duration) {
  const start = Date.now()
  let i = 0
  while (Date.now() - start < duration) {
    clearLine()
    process.stdout.write(`  ${COLORS.cyan}${SPINNER[i % SPINNER.length]}${COLORS.reset} ${text}`)
    i++
    await sleep(80)
  }
  clearLine()
}

async function typeText(text, delay = 30) {
  for (const char of text) {
    process.stdout.write(char)
    await sleep(delay)
  }
}

function printBox(lines, color = COLORS.cyan) {
  const maxLen = Math.max(...lines.map(l => l.replace(/\x1b\[[0-9;]*m/g, '').length))
  const top = `${color}╭${'─'.repeat(maxLen + 2)}╮${COLORS.reset}`
  const bottom = `${color}╰${'─'.repeat(maxLen + 2)}╯${COLORS.reset}`

  console.log(top)
  for (const line of lines) {
    const cleanLen = line.replace(/\x1b\[[0-9;]*m/g, '').length
    const padding = ' '.repeat(maxLen - cleanLen)
    console.log(`${color}│${COLORS.reset} ${line}${padding} ${color}│${COLORS.reset}`)
  }
  console.log(bottom)
}

function printLogo() {
  console.log(`
\x1b[32m   ██████╗ ███████╗██╗  ██╗████████╗ ██████╗ \x1b[0m
\x1b[32m  ██╔════╝ ██╔════╝██║ ██╔╝╚══██╔══╝██╔═══██╗\x1b[0m
\x1b[32m  ██║  ███╗█████╗  █████╔╝    ██║   ██║   ██║\x1b[0m
\x1b[32m  ██║   ██║██╔══╝  ██╔═██╗    ██║   ██║   ██║\x1b[0m
\x1b[32m  ╚██████╔╝███████╗██║  ██╗   ██║   ╚██████╔╝\x1b[0m
\x1b[32m   ╚═════╝ ╚══════╝╚═╝  ╚═╝   ╚═╝    ╚═════╝ \x1b[0m

\x1b[2m  AI Development Assistant\x1b[0m
`)
}

async function main() {
  console.clear()
  printLogo()

  console.log(`  ${COLORS.dim}───────────────────────────────${COLORS.reset}`)
  console.log()

  // Step 1: Initialize
  await spinner('Initializing Gekto runtime...', 800)
  console.log(`  ${COLORS.green}✓${COLORS.reset} Runtime initialized`)

  await sleep(200)

  // Step 2: Scan port
  await spinner('Scanning for development server...', 600)
  console.log(`  ${COLORS.green}✓${COLORS.reset} Found Vite server on port ${COLORS.cyan}5173${COLORS.reset}`)

  await sleep(200)

  // Step 3: Connect
  await spinner('Establishing connection...', 700)
  console.log(`  ${COLORS.green}✓${COLORS.reset} Connected to ${COLORS.cyan}http://localhost:5173${COLORS.reset}`)

  await sleep(200)

  // Step 4: Load tools
  await spinner('Loading AI toolchain...', 900)
  console.log(`  ${COLORS.green}✓${COLORS.reset} Loaded ${COLORS.yellow}12${COLORS.reset} development tools`)

  await sleep(200)

  // Step 5: Start proxy
  await spinner('Starting proxy server...', 600)
  console.log(`  ${COLORS.green}✓${COLORS.reset} Proxy ready on port ${COLORS.magenta}3200${COLORS.reset}`)

  await sleep(300)

  console.log()
  await sleep(400)

  // Summary box
  printBox([
    `${COLORS.bold}Gekto is ready!${COLORS.reset}`,
    ``,
    `${COLORS.dim}Source:${COLORS.reset}  ${COLORS.cyan}http://localhost:5173${COLORS.reset}`,
    `${COLORS.dim}Proxy:${COLORS.reset}   ${COLORS.magenta}http://localhost:3200${COLORS.reset}`,
    `${COLORS.dim}Tools:${COLORS.reset}   ${COLORS.yellow}12 active${COLORS.reset}`,
    ``,
    `${COLORS.dim}Press ${COLORS.white}Ctrl+C${COLORS.dim} to stop${COLORS.reset}`,
  ], COLORS.green)

  console.log()

  // Running state with heartbeat
  let dots = 0
  const statuses = [
    'Watching for changes',
    'Idle',
    'Monitoring DOM',
    'Ready',
  ]
  let statusIdx = 0

  setInterval(() => {
    clearLine()
    const dot = '.'.repeat((dots % 3) + 1).padEnd(3)
    const status = statuses[statusIdx % statuses.length]
    process.stdout.write(`  ${COLORS.green}●${COLORS.reset} ${COLORS.dim}${status}${dot}${COLORS.reset}`)
    dots++
    if (dots % 15 === 0) statusIdx++
  }, 500)

  // Keep running
  process.on('SIGINT', () => {
    clearLine()
    console.log(`\n  ${COLORS.yellow}⚡${COLORS.reset} Shutting down Gekto...`)
    console.log(`  ${COLORS.dim}Goodbye!${COLORS.reset}\n`)
    process.exit(0)
  })
}

main().catch(console.error)
