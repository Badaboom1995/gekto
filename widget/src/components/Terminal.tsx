import { useState, useRef, useEffect } from 'react'
import { useDraggable } from '../hooks/useDraggable'

const TERMINAL_WIDTH = 600
const TERMINAL_HEIGHT = 300

interface TerminalProps {
  isVisible?: boolean
}

export function Terminal({ isVisible = true }: TerminalProps) {
  const [input, setInput] = useState('')
  const [history, setHistory] = useState<Array<{ type: 'input' | 'output'; text: string }>>([
    { type: 'output', text: 'Welcome to Gekto Terminal v1.0.0' },
    { type: 'output', text: 'Type "help" for available commands.' },
  ])
  const inputRef = useRef<HTMLInputElement>(null)
  const historyRef = useRef<HTMLDivElement>(null)

  const { ref, position, isDragging, handlers } = useDraggable({
    initialPosition: {
      x: (window.innerWidth - TERMINAL_WIDTH) / 2,
      y: window.innerHeight - TERMINAL_HEIGHT - 24,
    },
  })

  useEffect(() => {
    if (historyRef.current) {
      historyRef.current.scrollTop = historyRef.current.scrollHeight
    }
  }, [history])

  useEffect(() => {
    if (isVisible && inputRef.current) {
      inputRef.current.focus()
    }
  }, [isVisible])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim()) return

    const newHistory = [...history, { type: 'input' as const, text: input }]

    // Simple command handling
    const cmd = input.trim().toLowerCase()
    let output = ''

    if (cmd === 'help') {
      output = 'Available commands: help, clear, version, date, echo <text>'
    } else if (cmd === 'clear') {
      setHistory([])
      setInput('')
      return
    } else if (cmd === 'version') {
      output = 'Gekto Terminal v1.0.0'
    } else if (cmd === 'date') {
      output = new Date().toLocaleString()
    } else if (cmd.startsWith('echo ')) {
      output = input.slice(5)
    } else {
      output = `Command not found: ${input}`
    }

    setHistory([...newHistory, { type: 'output', text: output }])
    setInput('')
  }

  if (!isVisible) return null

  return (
    <div
      ref={ref}
      className="fixed"
      style={{
        left: position.x,
        top: position.y,
        zIndex: 900,
      }}
    >
      <div
        style={{
          width: TERMINAL_WIDTH,
          height: TERMINAL_HEIGHT,
          background: 'rgba(10, 10, 10, 0.95)',
          borderRadius: 12,
          border: '1px solid rgba(255, 255, 255, 0.1)',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.5)',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
        }}
      >
        {/* Title bar - drag handle */}
        <div
          onMouseDown={handlers.onMouseDown}
          style={{
            display: 'flex',
            alignItems: 'center',
            padding: '10px 14px',
            background: 'rgba(30, 30, 30, 0.8)',
            borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
            cursor: isDragging ? 'grabbing' : 'grab',
          }}
        >
          {/* <div style={{ display: 'flex', gap: 8 }}>
            <button
              onClick={onClose}
              onMouseDown={(e) => e.stopPropagation()}
              style={{
                width: 12,
                height: 12,
                borderRadius: '50%',
                background: '#ff5f57',
                border: 'none',
                cursor: 'pointer',
              }}
            />
            <div
              style={{
                width: 12,
                height: 12,
                borderRadius: '50%',
                background: '#febc2e',
              }}
            />
            <div
              style={{
                width: 12,
                height: 12,
                borderRadius: '50%',
                background: '#28c840',
              }}
            />
          </div> */}
          <span
            style={{
              flex: 1,
              textAlign: 'center',
              fontSize: 12,
              color: 'rgba(255, 255, 255, 0.5)',
              fontWeight: 500,
            }}
          >
            Terminal
          </span>
          <div style={{ width: 52 }} />
        </div>

        {/* Terminal content */}
        <div
          ref={historyRef}
          style={{
            flex: 1,
            padding: 14,
            overflowY: 'auto',
            fontFamily: 'ui-monospace, "SF Mono", Menlo, Monaco, monospace',
            fontSize: 13,
            lineHeight: 1.6,
          }}
        >
          {history.map((item, index) => (
            <div
              key={index}
              style={{
                color: item.type === 'input' ? '#a8f15a' : 'rgba(255, 255, 255, 0.7)',
                marginBottom: 4,
              }}
            >
              {item.type === 'input' ? (
                <span>
                  <span style={{ color: '#6b9eff' }}>➜</span>{' '}
                  <span style={{ color: '#a8f15a' }}>~</span> {item.text}
                </span>
              ) : (
                item.text
              )}
            </div>
          ))}
        </div>

        {/* Input line */}
        <form onSubmit={handleSubmit}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              padding: '10px 14px',
              borderTop: '1px solid rgba(255, 255, 255, 0.05)',
              fontFamily: 'ui-monospace, "SF Mono", Menlo, Monaco, monospace',
              fontSize: 13,
            }}
          >
            <span style={{ color: '#6b9eff', marginRight: 8 }}>➜</span>
            <span style={{ color: '#a8f15a', marginRight: 8 }}>~</span>
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              style={{
                flex: 1,
                background: 'transparent',
                border: 'none',
                outline: 'none',
                color: 'rgba(255, 255, 255, 0.9)',
                fontFamily: 'inherit',
                fontSize: 'inherit',
              }}
              placeholder="Type a command..."
            />
          </div>
        </form>
      </div>
    </div>
  )
}
