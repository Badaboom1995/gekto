import { useEffect, useRef, useState } from 'react'
import { LizardAvatar } from './LizardAvatar'
import { ChatWindow, getChatSize } from './ChatWindow'
import { GektoPlanPanel } from './GektoPlanPanel'
import { RadialMenu } from './RadialMenu'
import { useDraggable } from '../hooks/useDraggable'
import { useSwarm } from '../context/SwarmContext'
import { useAgent } from '../context/AgentContext'
import { useGekto } from '../context/GektoContext'

const MASTER_LIZARD_SIZE = 140
const MASTER_ID = 'master'
const MASTER_COLOR = '#BFFF6B'

export function MasterLizard() {
  const {
    activeChatId,
    chatMode,
    openChat,
    closeChat,
    saveLizards,
    addLizard,
    clearAllLizards,
  } = useSwarm()

  const { sessions, getLizardState } = useAgent()
  // Subscribe to sessions to trigger re-render on state changes
  const agentState = sessions.get(MASTER_ID)?.state ?? getLizardState(MASTER_ID)

  const { currentPlan, isPlanPanelOpen, closePlanPanel } = useGekto()

  const isChatOpen = activeChatId === MASTER_ID
  const inputRef = useRef<HTMLInputElement>(null)
  const [isHovered, setIsHovered] = useState(false)
  const [chatSize, setChatSize] = useState(getChatSize)

  const menuItems = [
    {
      id: 'chat',
      icon: '💬',
      label: 'Chat',
      onClick: () => openChat(MASTER_ID, 'task'),
    },
    {
      id: 'spawn',
      icon: '🦎',
      label: 'Spawn Agent',
      onClick: () => {
        addLizard()
      },
    },
    {
      id: 'clear',
      icon: '🧹',
      label: 'Clear All',
      onClick: () => {
        clearAllLizards()
      },
      danger: true,
      holdDuration: 1000,
    },
  ]

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

  const handleClick = (e: React.MouseEvent) => {
    // Don't open chat if clicking on menu items
    if ((e.target as HTMLElement).closest('[data-radial-menu]')) {
      return
    }
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
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        <LizardAvatar size={MASTER_LIZARD_SIZE} color={MASTER_COLOR} faceRight isSpinning={agentState === 'working'} />

        {/* Extended hover area for menu */}
        <div
          className="absolute pointer-events-auto"
          style={{
            left: MASTER_LIZARD_SIZE - 20,
            top: 0,
            width: 200,
            height: MASTER_LIZARD_SIZE,
          }}
          onClick={(e) => e.stopPropagation()}
          onMouseDown={(e) => e.stopPropagation()}
        />

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

        {/* Radial Menu */}
        <RadialMenu
          items={menuItems}
          isVisible={isHovered && !isDragging}
          size={MASTER_LIZARD_SIZE}
          side="right"
        />
      </div>

      {/* Chat Window - positioned to the right of master lizard */}
      {isChatOpen && (
        <div
          className="fixed"
          data-swarm-ui
          style={{
            left: position.x + MASTER_LIZARD_SIZE + 20,
            top: position.y + MASTER_LIZARD_SIZE - chatSize.height,
            zIndex: 1002,
          }}
        >
          <ChatWindow
            lizardId={MASTER_ID}
            title={chatMode === 'plan' ? 'Master Plan' : 'Gekto Chat'}
            color="rgba(191, 255, 107, 0.5)"
            onClose={closeChat}
            onResize={setChatSize}
            inputRef={inputRef}
          />
        </div>
      )}

      {/* Plan Panel - positioned to the right of chat or master lizard */}
      {isPlanPanelOpen && currentPlan && (
        <GektoPlanPanel
          position={{
            x: isChatOpen
              ? position.x + MASTER_LIZARD_SIZE + 20 + chatSize.width + 20  // Right of chat
              : position.x + MASTER_LIZARD_SIZE + 20,       // Right of master
            y: position.y + MASTER_LIZARD_SIZE - chatSize.height,
          }}
          onClose={closePlanPanel}
        />
      )}
    </>
  )
}

export { MASTER_ID, MASTER_LIZARD_SIZE }
