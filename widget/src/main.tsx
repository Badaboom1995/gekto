import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import styles from './index.css?inline'

function mountWidget() {
  // Create container
  const container = document.createElement('div')
  container.id = 'gekto-root'
  document.body.appendChild(container)

  // Attach Shadow DOM for style isolation
  const shadow = container.attachShadow({ mode: 'open' })

  // Inject styles into shadow DOM
  const styleEl = document.createElement('style')
  styleEl.textContent = styles
  shadow.appendChild(styleEl)

  // Create mount point for React
  const mountPoint = document.createElement('div')
  mountPoint.id = 'gekto-mount'
  shadow.appendChild(mountPoint)

  // Mount React app
  createRoot(mountPoint).render(
    <StrictMode>
      <App />
    </StrictMode>,
  )
}

// Auto-mount when script loads
mountWidget()
