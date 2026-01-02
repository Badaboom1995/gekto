import { useEffect, useRef } from 'react'
import { LizardAvatar } from './LizardAvatar'
import { ChatWindow } from './ChatWindow'
import { useDraggable } from '../hooks/useDraggable'
import { useSwarm } from '../context/SwarmContext'
import { useAgent } from '../context/AgentContext'

const MASTER_LIZARD_SIZE = 140
const CHAT_HEIGHT = 500
const MASTER_ID = 'master'
const MASTER_COLOR = '#BFFF6B'

export function MasterLizard() {
  const {
    activeChatId,
    chatMode,
    openChat,
    closeChat,
    saveLizards,
  } = useSwarm()

  const { getLizardState } = useAgent()
  const agentState = getLizardState(MASTER_ID)

  const isChatOpen = activeChatId === MASTER_ID
  const inputRef = useRef<HTMLInputElement>(null)

  // Shift+Enter to open master chat and focus input
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.shiftKey && e.key === 'Enter') {
        e.preventDefault()
        openChat(MASTER_ID, 'task')
        // Focus input after chat opens
        setTimeout(() => inputRef.current?.focus(), 50)
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [openChat])

  const { ref, position, isDragging, hasMoved, handlers } = useDraggable({
    initialPosition: {
      x: 30,
      y: window.innerHeight - MASTER_LIZARD_SIZE - 30,
    },
    onDragEnd: (_, moved) => {
      if (moved) {
        saveLizards()
      }
    },
  })

  const handleClick = () => {
    if (!hasMoved()) {
      openChat(MASTER_ID, 'task')
    }
  }

  return (
    <>
      {/* Master Lizard */}
      <div
        ref={ref}
        className={`fixed cursor-pointer hover:scale-105 ${isDragging ? 'cursor-grabbing' : 'cursor-grab'}`}
        style={{
          left: position.x,
          top: position.y,
          zIndex: 1000,
          transition: isDragging ? 'transform 0.2s ease-out' : 'left 0.4s ease-out, top 0.4s ease-out, transform 0.2s ease-out',
        }}
        onMouseDown={handlers.onMouseDown}
        onClick={handleClick}
      >
        <LizardAvatar size={MASTER_LIZARD_SIZE} color={MASTER_COLOR} faceRight />

        {/* Status indicator */}
        {agentState !== 'ready' && (
          <div
            className="absolute flex items-center justify-center"
            style={{
              top: 8,
              left: 8,
              width: 28,
              height: 28,
              borderRadius: '50%',
              fontSize: 14,
              color: 'white',
              background: agentState === 'error'
                ? 'rgba(239, 68, 68, 0.9)'
                : agentState === 'working'
                ? 'rgba(59, 130, 246, 0.9)'
                : 'rgba(60, 60, 70, 0.95)',
              border: '2px solid rgba(255, 255, 255, 0.2)',
              boxShadow: agentState === 'working'
                ? '0 0 12px rgba(59, 130, 246, 0.6), 0 0 24px rgba(59, 130, 246, 0.3)'
                : '0 2px 6px rgba(0,0,0,0.4)',
              animation: agentState === 'working' ? 'flicker 1.5s ease-in-out infinite' : 'none',
            }}
          >
            {agentState === 'working' && '⚡'}
            {agentState === 'queued' && '⏳'}
            {agentState === 'error' && '!'}
          </div>
        )}

        {/* Name label */}
        <div
          className="absolute whitespace-nowrap pointer-events-none"
          style={{
            bottom: MASTER_LIZARD_SIZE - 18,
            left: '30%',
            transform: 'translateX(-50%)',
            fontSize: 14,
            fontWeight: 600,
            color: MASTER_COLOR,
            textShadow: '0 1px 3px rgba(0, 0, 0, 0.5)',
          }}
        >
          Gekto
        </div>
      </div>

      {/* Chat Window - positioned to the right of master lizard */}
      {isChatOpen && (
        <div
          className="fixed"
          data-swarm-ui
          style={{
            left: position.x + MASTER_LIZARD_SIZE + 20,
            top: position.y + MASTER_LIZARD_SIZE - CHAT_HEIGHT,
            zIndex: 1002,
          }}
        >
          <ChatWindow
            lizardId={MASTER_ID}
            title={chatMode === 'plan' ? 'Master Plan' : 'Gekto Chat'}
            color="rgba(191, 255, 107, 0.5)"
            onClose={closeChat}
            inputRef={inputRef}
          />
        </div>
      )}
    </>
  )
}

export { MASTER_ID, MASTER_LIZARD_SIZE }
