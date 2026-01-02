import { useState, useMemo } from 'react'
import { useAgent } from '../context/AgentContext'
import { useSwarm } from '../context/SwarmContext'

export function SOSButton() {
  const [isOpen, setIsOpen] = useState(false)
  const { activeAgents, killAgent, killAllAgents } = useAgent()
  const { lizards } = useSwarm()

  const lizardIds = useMemo(() => new Set(lizards.map(l => l.id)), [lizards])

  const runningAgents = activeAgents.filter(a => a.isRunning || a.isProcessing)
  const hasRunningAgents = runningAgents.length > 0

  // Orphan agents - running but lizard doesn't exist
  const orphanAgents = activeAgents.filter(a => !lizardIds.has(a.lizardId))
  const hasOrphans = orphanAgents.length > 0

  // Kill all orphan agents
  const syncAgents = () => {
    orphanAgents.forEach(agent => killAgent(agent.lizardId))
  }

  return (
    <>
      {/* SOS Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        data-swarm-ui
        style={{
          position: 'fixed',
          bottom: 20,
          left: 20,
          width: 48,
          height: 48,
          borderRadius: '50%',
          background: hasRunningAgents
            ? 'linear-gradient(135deg, #ef4444, #dc2626)'
            : 'linear-gradient(135deg, #6b7280, #4b5563)',
          border: 'none',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: hasRunningAgents
            ? '0 0 20px rgba(239, 68, 68, 0.5)'
            : '0 4px 12px rgba(0, 0, 0, 0.3)',
          zIndex: 9999,
          transition: 'all 0.2s ease',
          animation: hasRunningAgents ? 'pulse 2s infinite' : 'none',
        }}
        title="Agent Control Panel"
      >
        <span style={{ fontSize: 16, fontWeight: 'bold', color: 'white' }}>
          {hasRunningAgents ? runningAgents.length : 'SOS'}
        </span>
      </button>

      {/* Panel */}
      {isOpen && (
        <div
          data-swarm-ui
          style={{
            position: 'fixed',
            bottom: 80,
            left: 20,
            width: 320,
            maxHeight: 400,
            background: 'linear-gradient(135deg, rgb(35, 35, 45), rgb(45, 45, 55))',
            borderRadius: 12,
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            zIndex: 9998,
            overflow: 'hidden',
          }}
        >
          {/* Header */}
          <div
            style={{
              padding: '12px 16px',
              borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <span style={{ color: 'white', fontWeight: 600, fontSize: 14 }}>
              Agents ({activeAgents.length})
            </span>
            <div style={{ display: 'flex', gap: 8 }}>
              {hasOrphans && (
                <button
                  onClick={syncAgents}
                  style={{
                    padding: '4px 12px',
                    borderRadius: 6,
                    background: 'rgba(234, 179, 8, 0.2)',
                    border: '1px solid rgba(234, 179, 8, 0.5)',
                    color: '#eab308',
                    fontSize: 12,
                    fontWeight: 500,
                    cursor: 'pointer',
                  }}
                  title="Kill agents without lizards"
                >
                  Sync ({orphanAgents.length})
                </button>
              )}
              {hasRunningAgents && (
                <button
                  onClick={killAllAgents}
                  style={{
                    padding: '4px 12px',
                    borderRadius: 6,
                    background: 'rgba(239, 68, 68, 0.2)',
                    border: '1px solid rgba(239, 68, 68, 0.5)',
                    color: '#ef4444',
                    fontSize: 12,
                    fontWeight: 500,
                    cursor: 'pointer',
                  }}
                >
                  Kill All
                </button>
              )}
            </div>
          </div>

          {/* Agent List */}
          <div style={{ padding: 12, maxHeight: 300, overflowY: 'auto' }}>
            {activeAgents.length === 0 ? (
              <div style={{ color: 'rgba(255, 255, 255, 0.5)', fontSize: 13, textAlign: 'center', padding: 20 }}>
                No agent sessions
              </div>
            ) : (
              activeAgents.map(agent => {
                const isOrphan = !lizardIds.has(agent.lizardId)
                const isActive = agent.isRunning || agent.isProcessing

                return (
                  <div
                    key={agent.lizardId}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '8px 12px',
                      marginBottom: 8,
                      background: isOrphan
                        ? 'rgba(234, 179, 8, 0.1)'
                        : 'rgba(255, 255, 255, 0.05)',
                      borderRadius: 8,
                      border: isOrphan
                        ? '1px solid rgba(234, 179, 8, 0.3)'
                        : '1px solid rgba(255, 255, 255, 0.1)',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      {/* Status indicator */}
                      <div
                        style={{
                          width: 8,
                          height: 8,
                          borderRadius: '50%',
                          background: isActive
                            ? (agent.isRunning ? '#22c55e' : '#3b82f6')
                            : '#6b7280',
                          boxShadow: isActive
                            ? (agent.isRunning
                              ? '0 0 8px rgba(34, 197, 94, 0.6)'
                              : '0 0 8px rgba(59, 130, 246, 0.6)')
                            : 'none',
                        }}
                      />
                      <div>
                        <div style={{ color: 'white', fontSize: 13, fontWeight: 500, display: 'flex', alignItems: 'center', gap: 6 }}>
                          Lizard {agent.lizardId}
                          {isOrphan && (
                            <span style={{ color: '#eab308', fontSize: 10, fontWeight: 400 }}>
                              (orphan)
                            </span>
                          )}
                        </div>
                        <div style={{ color: 'rgba(255, 255, 255, 0.5)', fontSize: 11 }}>
                          {agent.isRunning ? 'Running' : agent.isProcessing ? 'Processing' : 'Idle'}
                          {agent.queueLength > 0 && ` (${agent.queueLength} queued)`}
                        </div>
                      </div>
                    </div>
                    {isActive && (
                      <button
                        onClick={() => killAgent(agent.lizardId)}
                        style={{
                          padding: '4px 10px',
                          borderRadius: 4,
                          background: 'rgba(239, 68, 68, 0.15)',
                          border: '1px solid rgba(239, 68, 68, 0.3)',
                          color: '#f87171',
                          fontSize: 11,
                          cursor: 'pointer',
                        }}
                      >
                        Kill
                      </button>
                    )}
                  </div>
                )
              })
            )}
          </div>
        </div>
      )}

      {/* CSS for pulse animation */}
      <style>{`
        @keyframes pulse {
          0%, 100% { box-shadow: 0 0 20px rgba(239, 68, 68, 0.5); }
          50% { box-shadow: 0 0 30px rgba(239, 68, 68, 0.8); }
        }
      `}</style>
    </>
  )
}
