import { useState, useMemo } from 'react'
import { DiffEditor } from '@monaco-editor/react'
import type { FileChange } from '../../context/AgentContext'

interface DiffModalProps {
  fileChanges: FileChange[]
  onClose: () => void
  onRevertFile?: (filePath: string) => void
  onRevertAll?: () => void
  onAcceptAll?: () => void
}

export function DiffModal({ fileChanges, onClose, onRevertFile, onRevertAll, onAcceptAll }: DiffModalProps) {
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
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            {onAcceptAll && (
              <button
                onClick={onAcceptAll}
                style={{
                  background: '#22c55e20',
                  border: '1px solid #22c55e40',
                  color: '#22c55e',
                  cursor: 'pointer',
                  padding: '4px 10px',
                  borderRadius: 6,
                  fontSize: 12,
                  fontWeight: 600,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 4,
                }}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
                Accept All
              </button>
            )}
            {onRevertAll && fileChanges.length > 0 && (
              <button
                onClick={onRevertAll}
                style={{
                  background: '#ef444420',
                  border: '1px solid #ef444440',
                  color: '#ef4444',
                  cursor: 'pointer',
                  padding: '4px 10px',
                  borderRadius: 6,
                  fontSize: 12,
                  fontWeight: 600,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 4,
                }}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polyline points="1 4 1 10 7 10" />
                  <path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10" />
                </svg>
                Revert All
              </button>
            )}
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
              <div
                key={`${change.filePath}-${index}`}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  borderBottom: '1px solid #27272a',
                  background: selectedIndex === index ? '#3b82f6' : 'transparent',
                }}
              >
                <button
                  onClick={() => setSelectedIndex(index)}
                  style={{
                    flex: 1,
                    padding: '10px 12px',
                    border: 'none',
                    background: 'transparent',
                    color: selectedIndex === index ? '#fff' : '#a1a1aa',
                    textAlign: 'left',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    minWidth: 0,
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
                {/* Revert button per file */}
                {onRevertFile && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      onRevertFile(change.filePath)
                      // Adjust selected index if needed
                      if (selectedIndex >= fileChanges.length - 1 && selectedIndex > 0) {
                        setSelectedIndex(selectedIndex - 1)
                      }
                    }}
                    title={`Revert ${getFileName(change.filePath)}`}
                    style={{
                      background: 'transparent',
                      border: 'none',
                      color: selectedIndex === index ? '#fca5a5' : '#71717a',
                      cursor: 'pointer',
                      padding: '4px 8px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                    }}
                    onMouseEnter={(e) => { (e.target as HTMLElement).style.color = '#ef4444' }}
                    onMouseLeave={(e) => { (e.target as HTMLElement).style.color = selectedIndex === index ? '#fca5a5' : '#71717a' }}
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <polyline points="1 4 1 10 7 10" />
                      <path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10" />
                    </svg>
                  </button>
                )}
              </div>
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

        {/* Footer */}
        {selectedChange && (
          <div
            style={{
              padding: '8px 16px',
              borderTop: '1px solid #3f3f46',
              background: '#18181b',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <span
              style={{
                fontSize: 12,
                color: '#71717a',
                fontFamily: 'ui-monospace, monospace',
              }}
            >
              {selectedChange.filePath}
            </span>
            {onRevertFile && (
              <button
                onClick={() => {
                  onRevertFile(selectedChange.filePath)
                  if (selectedIndex >= fileChanges.length - 1 && selectedIndex > 0) {
                    setSelectedIndex(selectedIndex - 1)
                  }
                }}
                style={{
                  background: '#ef444420',
                  border: '1px solid #ef444440',
                  color: '#ef4444',
                  cursor: 'pointer',
                  padding: '4px 10px',
                  borderRadius: 6,
                  fontSize: 12,
                  fontWeight: 600,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 4,
                }}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polyline points="1 4 1 10 7 10" />
                  <path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10" />
                </svg>
                Revert This File
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
