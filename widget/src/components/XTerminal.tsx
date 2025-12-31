import { useRef, useEffect, useState } from 'react'
import { Terminal } from '@xterm/xterm'
import '@xterm/xterm/css/xterm.css'
import { useDraggable } from '../hooks/useDraggable'

export function XTerminal() {
  const containerRef = useRef<HTMLDivElement>(null)
  const termRef = useRef<Terminal | null>(null)
  const [isDragging, setIsDragging] = useState(false)

  const { ref: dragRef, position, handlers } = useDraggable({
    initialPosition: {
      x: (window.innerWidth - 700) / 2,
      y: window.innerHeight - 450,
    },
    onDragStart: () => setIsDragging(true),
    onDragEnd: () => setIsDragging(false),
  })

  useEffect(() => {
    if (!containerRef.current || termRef.current) return

    const term = new Terminal({
      cols: 80,
      rows: 24,
      theme: {
        background: 'rgba(255, 255, 255, 0.0)',
        foreground: '#fff',
      },
    })

    term.open(containerRef.current)
    termRef.current = term

    // Connect WebSocket
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:'
    const ws = new WebSocket(`${protocol}//${window.location.host}/__gekto/terminal`)

    ws.onopen = () => {
      ws.send(JSON.stringify({ type: 'resize', cols: 80, rows: 24 }))
    }

    ws.onmessage = (event) => {
      try {
        const msg = JSON.parse(event.data)
        if (msg.type === 'output') {
          term.write(msg.data)
        }
      } catch {
        term.write(event.data)
      }
    }

    term.onData((data) => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({ type: 'input', data }))
      }
    })

    return () => {
      ws.close()
      term.dispose()
      termRef.current = null
    }
  }, [])

  return (
    <div
      ref={dragRef}
      data-swarm-ui
      style={{
        position: 'fixed',
        left: position.x,
        top: position.y,
        zIndex: 900,
      }}
    >
      {/* Liquid glass container */}
      <div
        className="rounded-2xl overflow-hidden"
        style={{
          background: 'rgba(0, 0, 0, 0.85)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          boxShadow: `
            0 8px 32px rgba(0, 0, 0, 0.5),
            inset 0 1px 0 rgba(255, 255, 255, 0.1),
            inset 0 -1px 0 rgba(0, 0, 0, 0.2)
          `,
        }}
      >
        {/* Title bar - drag handle */}
        <div
          onMouseDown={handlers.onMouseDown}
          className="px-4 py-2 flex items-center gap-2"
          style={{
            cursor: isDragging ? 'grabbing' : 'grab',
            background: 'rgba(255, 255, 255, 0.05)',
            borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
          }}
        >
          <div className="flex gap-1.5">
            <div className="w-3 h-3 rounded-full bg-red-500/80" />
            <div className="w-3 h-3 rounded-full bg-yellow-500/80" />
            <div className="w-3 h-3 rounded-full bg-green-500/80" />
          </div>
          <span className="text-white/50 text-sm ml-2">Terminal</span>
        </div>

        {/* Terminal content */}
        <div className="p-4">
          <div ref={containerRef} />
        </div>
      </div>
    </div>
  )
}
