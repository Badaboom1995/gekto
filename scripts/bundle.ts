import fs from 'fs'
import path from 'path'

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

// Read proxy source
const proxySource = fs.readFileSync(
  path.join(ROOT, 'server/src/proxy.ts'),
  'utf8'
)

// Modify proxy to embed widget instead of reading from file
// Use base64 encoding to avoid string escaping issues
const widgetBase64 = Buffer.from(widgetJs).toString('base64')

const embeddedProxy = proxySource
  // Remove fs import for widget loading
  .replace(
    /\/\/ Widget paths[\s\S]*?function loadWidgetBundle[\s\S]*?^}/m,
    `// Embedded widget bundle (base64 encoded)
const WIDGET_BASE64 = "${widgetBase64}";

function loadWidgetBundle(): { js: string; css: string } {
  const js = Buffer.from(WIDGET_BASE64, 'base64').toString('utf8')
  return { js, css: '' }
}`
  )
  // Remove unused path references
  .replace(/const WIDGET_DIST_PATH.*\n/, '')
  .replace(/const WIDGET_JS_PATH.*\n/, '')
  .replace(/const WIDGET_CSS_PATH.*\n/, '')
  // Force production mode - no dev server in bundle
  .replace(/const DEV_MODE = .*/, 'const DEV_MODE = false')
  // Remove unused WIDGET_PORT
  .replace(/const WIDGET_PORT.*\n/, '')

// Write standalone proxy
fs.writeFileSync(path.join(DIST, 'gekto.ts'), embeddedProxy)

// Create a simple runner script
const runner = `#!/usr/bin/env bun
import './gekto.ts'
`
fs.writeFileSync(path.join(DIST, 'run.ts'), runner)

console.log(`
  Bundle created in dist/

  Usage:
    bun dist/gekto.ts --target 3000
    bun dist/gekto.ts -t 3000 -p 8080

  Or copy dist/gekto.ts to any project and run:
    bun gekto.ts --target 3000
`)
