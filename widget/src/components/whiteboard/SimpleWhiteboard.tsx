import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { Tldraw } from 'tldraw'
import 'tldraw/tldraw.css'

interface SimpleWhiteboardProps {
  onClose?: () => void
}

export function SimpleWhiteboard({ onClose }: SimpleWhiteboardProps) {
  const [container, setContainer] = useState<HTMLElement | null>(null)

  useEffect(() => {
    // Create container outside shadow DOM
    const div = document.createElement('div')
    div.id = 'gekto-whiteboard-portal'
    document.body.appendChild(div)

    // Inject tldraw CSS into main document
    const styleId = 'tldraw-portal-styles'
    if (!document.getElementById(styleId)) {
      const link = document.createElement('link')
      link.id = styleId
      link.rel = 'stylesheet'
      link.href = 'https://unpkg.com/tldraw@3/tldraw.css'
      document.head.appendChild(link)
    }

    setContainer(div)

    return () => {
      div.remove()
    }
  }, [])

  if (!container) return null

  return createPortal(
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 99999,
      }}
    >
      {onClose && (
        <button
          onClick={onClose}
          style={{
            position: 'absolute',
            top: 16,
            right: 16,
            zIndex: 100000,
            padding: '8px 16px',
            background: '#27272a',
            border: '1px solid #3f3f46',
            borderRadius: 8,
            color: '#fff',
            cursor: 'pointer',
            fontFamily: 'system-ui, sans-serif',
          }}
        >
          Close
        </button>
      )}
      <Tldraw persistenceKey="gekto-whiteboard" />
    </div>,
    container
  )
}

export default SimpleWhiteboard
