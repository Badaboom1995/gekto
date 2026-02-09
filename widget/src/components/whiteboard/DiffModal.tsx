import { useState, useMemo } from 'react'
import { DiffEditor } from '@monaco-editor/react'
import type { FileChange } from '../../context/AgentContext'

interface DiffModalProps {
  fileChanges: FileChange[]
  onClose: () => void
}

export function DiffModal({ fileChanges, onClose }: DiffModalProps) {
  // Track selected file index
  const [selectedIndex, setSelectedIndex] = useState(0)
  const selectedChange = fileChanges[selectedIndex]

  // Get filename from path
  const getFileName = (filePath: string) => {
    return filePath.split('/').pop() || filePath
  }

  // Get short path for display (last 2 segments)
  const getShortPath = (filePath: string) => {
    const parts = filePath.split('/')
    return parts.slice(-2).join('/')
  }

  // Detect language from file extension
  const language = useMemo(() => {
    if (!selectedChange) return 'plaintext'
    const ext = selectedChange.filePath.split('.').pop()?.toLowerCase()
    const langMap: Record<string, string> = {
      ts: 'typescript',
      tsx: 'typescript',
      js: 'javascript',
      jsx: 'javascript',
      json: 'json',
      md: 'markdown',
      css: 'css',
      scss: 'scss',
      html: 'html',
      py: 'python',
      go: 'go',
      rs: 'rust',
      yaml: 'yaml',
      yml: 'yaml',
    }
    return langMap[ext || ''] || 'plaintext'
  }, [selectedChange])

  if (fileChanges.length === 0) {
    return (
      <div
        style={{
          position: 'fixed',
          inset: 0,
          zIndex: 10000,
          background: 'rgba(0, 0, 0, 0.8)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
        onClick={onClose}
      >
        <div
          style={{
            background: '#1e1e1e',
            borderRadius: 12,
            padding: 32,
            color: '#a1a1aa',
          }}
          onClick={(e) => e.stopPropagation()}
        >
          No file changes to display
        </div>
      </div>
    )
  }

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 10000,
        background: 'rgba(0, 0, 0, 0.85)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        pointerEvents: 'auto',
      }}
      onClick={onClose}
    >
      <div
        style={{
          width: '90vw',
          height: '85vh',
          background: '#1e1e1e',
          borderRadius: 12,
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          border: '1px solid #3f3f46',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '12px 16px',
            borderBottom: '1px solid #3f3f46',
            background: '#27272a',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#3b82f6"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M4 6h16" />
              <path d="M4 12h16" />
              <path d="M4 18h16" />
            </svg>
            <span style={{ color: '#fff', fontWeight: 600, fontSize: 14 }}>
              {fileChanges.length} file{fileChanges.length > 1 ? 's' : ''} changed
            </span>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'transparent',
              border: 'none',
              color: '#71717a',
              cursor: 'pointer',
              padding: 4,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Main content: sidebar + diff viewer */}
        <div style={{ display: 'flex', flex: 1, minHeight: 0 }}>
          {/* File list sidebar */}
          <div
            style={{
              width: 280,
              borderRight: '1px solid #3f3f46',
              overflowY: 'auto',
              background: '#18181b',
            }}
          >
            {fileChanges.map((change, index) => (
              <button
                key={`${change.filePath}-${index}`}
                onClick={() => setSelectedIndex(index)}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  border: 'none',
                  background: selectedIndex === index ? '#3b82f6' : 'transparent',
                  color: selectedIndex === index ? '#fff' : '#a1a1aa',
                  textAlign: 'left',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  borderBottom: '1px solid #27272a',
                }}
              >
                {/* File icon */}
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  style={{ flexShrink: 0 }}
                >
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                  <polyline points="14 2 14 8 20 8" />
                </svg>
                <div style={{ minWidth: 0, flex: 1 }}>
                  <div
                    style={{
                      fontSize: 13,
                      fontWeight: 500,
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {getFileName(change.filePath)}
                  </div>
                  <div
                    style={{
                      fontSize: 11,
                      opacity: 0.7,
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {getShortPath(change.filePath)}
                  </div>
                </div>
                {/* Tool badge */}
                <span
                  style={{
                    fontSize: 10,
                    fontWeight: 600,
                    padding: '2px 6px',
                    borderRadius: 4,
                    background: change.tool === 'Write' ? '#22c55e20' : '#3b82f620',
                    color: change.tool === 'Write' ? '#22c55e' : '#3b82f6',
                    flexShrink: 0,
                  }}
                >
                  {change.tool === 'Write' && !change.before ? 'NEW' : change.tool.toUpperCase()}
                </span>
              </button>
            ))}
          </div>

          {/* Monaco diff editor */}
          <div style={{ flex: 1, minWidth: 0 }}>
            {selectedChange && (
              <DiffEditor
                original={selectedChange.before || ''}
                modified={selectedChange.after}
                language={language}
                theme="vs-dark"
                options={{
                  readOnly: true,
                  renderSideBySide: true,
                  minimap: { enabled: false },
                  scrollBeyondLastLine: false,
                  fontSize: 13,
                  lineHeight: 20,
                  wordWrap: 'on',
                  diffWordWrap: 'on',
                  scrollbar: {
                    vertical: 'auto',
                    horizontal: 'auto',
                  },
                }}
              />
            )}
          </div>
        </div>

        {/* Footer: file path */}
        {selectedChange && (
          <div
            style={{
              padding: '8px 16px',
              borderTop: '1px solid #3f3f46',
              background: '#18181b',
              fontSize: 12,
              color: '#71717a',
              fontFamily: 'ui-monospace, monospace',
            }}
          >
            {selectedChange.filePath}
          </div>
        )}
      </div>
    </div>
  )
}
