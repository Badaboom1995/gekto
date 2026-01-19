import fs from 'fs'
import path from 'path'
import { execSync } from 'child_process'
import * as esbuild from 'esbuild'

const ROOT = path.resolve(import.meta.dirname, '..')
const DIST = path.join(ROOT, 'dist')

// Clean and create dist folder
if (fs.existsSync(DIST)) {
  fs.rmSync(DIST, { recursive: true })
}
fs.mkdirSync(DIST)

// Read widget bundle
const widgetJs = fs.readFileSync(
  path.join(ROOT, 'widget/dist/gekto-widget.iife.js'),
  'utf8'
)

// Encode widget as base64 to embed in the bundle
const widgetBase64 = Buffer.from(widgetJs).toString('base64')

// Create a virtual entry point that embeds the widget
const entryContent = `
// Embedded widget bundle
const WIDGET_BASE64 = "${widgetBase64}";

// Override the loadWidgetBundle function before importing proxy
globalThis.__EMBEDDED_WIDGET__ = {
  js: Buffer.from(WIDGET_BASE64, 'base64').toString('utf8'),
  css: ''
};

// Re-export everything from proxy
export * from '../server/src/proxy.js'
`

const entryPath = path.join(DIST, '_entry.ts')
fs.writeFileSync(entryPath, entryContent)

// We need to modify proxy.ts to use embedded widget if available
const proxyPath = path.join(ROOT, 'server/src/proxy.ts')
const proxySource = fs.readFileSync(proxyPath, 'utf8')

// Create modified proxy that checks for embedded widget
const modifiedProxy = proxySource
  .replace(
    /function loadWidgetBundle\(\): \{ js: string; css: string \} \{[\s\S]*?^\}/m,
    `function loadWidgetBundle(): { js: string; css: string } {
  // Check for embedded widget (bundled mode)
  if ((globalThis as any).__EMBEDDED_WIDGET__) {
    return (globalThis as any).__EMBEDDED_WIDGET__
  }
  // Fallback to file system
  try {
    const js = fs.readFileSync(WIDGET_JS_PATH, 'utf8')
    const css = fs.existsSync(WIDGET_CSS_PATH)
      ? fs.readFileSync(WIDGET_CSS_PATH, 'utf8')
      : ''
    return { js, css }
  } catch (err) {
    console.error('❌ Could not load widget bundle:', err)
    return { js: '// Widget bundle not found', css: '' }
  }
}`
  )
  // Force production mode in bundle
  .replace(/const DEV_MODE = .*/, 'const DEV_MODE = false')
  // Disable terminal (removes node-pty dependency)
  .replace(/import \{ setupTerminalWebSocket \}.*\n/, '')
  .replace(/setupTerminalWebSocket\(server\)/, '// Terminal disabled in bundle')

const modifiedProxyPath = path.join(DIST, '_proxy_modified.ts')
fs.writeFileSync(modifiedProxyPath, modifiedProxy)

// Copy other server files to dist for bundling
const serverSrcDir = path.join(ROOT, 'server/src')
const serverFiles = ['store.ts']  // terminal.ts excluded (no node-pty)
const agentFiles = ['HeadlessAgent.ts', 'agentPool.ts', 'agentWebSocket.ts', 'gektoTools.ts']

// Create agents directory
fs.mkdirSync(path.join(DIST, 'agents'), { recursive: true })

for (const file of serverFiles) {
  const src = path.join(serverSrcDir, file)
  if (fs.existsSync(src)) {
    fs.copyFileSync(src, path.join(DIST, file))
  }
}

for (const file of agentFiles) {
  const src = path.join(serverSrcDir, 'agents', file)
  if (fs.existsSync(src)) {
    fs.copyFileSync(src, path.join(DIST, 'agents', file))
  }
}

// Bundle with esbuild
await esbuild.build({
  entryPoints: [modifiedProxyPath],
  bundle: true,
  platform: 'node',
  target: 'node18',
  format: 'esm',
  outfile: path.join(DIST, 'gekto.mjs'),
  banner: {
    js: '#!/usr/bin/env node'
  },
  external: [],  // everything bundled (terminal disabled, no node-pty needed)
  nodePaths: [path.join(ROOT, 'server/node_modules'), path.join(ROOT, 'node_modules')],
})

// Clean up temp files
fs.unlinkSync(entryPath)
fs.unlinkSync(modifiedProxyPath)
for (const file of serverFiles) {
  const p = path.join(DIST, file)
  if (fs.existsSync(p)) fs.unlinkSync(p)
}
for (const file of agentFiles) {
  const p = path.join(DIST, 'agents', file)
  if (fs.existsSync(p)) fs.unlinkSync(p)
}
fs.rmdirSync(path.join(DIST, 'agents'))

// Make executable
fs.chmodSync(path.join(DIST, 'gekto.mjs'), '755')

console.log(`
  ✅ Bundle created: dist/gekto.mjs

  Usage:
    node dist/gekto.mjs --target 3000
    node dist/gekto.mjs -t 3000 -p 8080

  Note: Terminal feature disabled in bundle (no dependencies required)
`)
