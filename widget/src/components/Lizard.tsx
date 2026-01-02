import { useEffect, useState, useRef } from 'react'
import { LizardAvatar } from './LizardAvatar'
import { ChatWindow } from './ChatWindow'
import { useDraggable } from '../hooks/useDraggable'
import { useCopyable } from '../hooks/useCopyable'
import { useSwarm, type LizardSettings } from '../context/SwarmContext'
import { useAgent } from '../context/AgentContext'

const LIZARD_SIZE = 90
const CHAT_WIDTH = 400
const CHAT_HEIGHT = 500

interface LizardProps {
  id: string
  initialPosition: { x: number; y: number }
  settings?: LizardSettings
}

export function Lizard({ id, initialPosition, settings }: LizardProps) {
  const {
    selectedIds,
    activeChatId,
    chatMode,
    defaultSettings,
    addLizard,
    openChat,
    closeChat,
    toggleSelection,
    registerLizard,
    unregisterLizard,
    saveLizards,
    getLizardName,
  } = useSwarm()

  const color = settings?.color ?? defaultSettings.color
  // Use getLizardName to get live updates when name changes
  const agentName = getLizardName(id)

  const { getLizardState } = useAgent()
  const agentState = getLizardState(id)

  const isSelected = selectedIds.has(id)
  const isChatOpen = activeChatId === id

  const [showDone, setShowDone] = useState(false)
  const prevStateRef = useRef(agentState)

  // Show done icon when agent finishes (until user opens chat)
  useEffect(() => {
    if (prevStateRef.current === 'working' && agentState === 'ready') {
      setShowDone(true)
    }
    prevStateRef.current = agentState
  }, [agentState])

  // Clear done badge when chat is opened
  useEffect(() => {
    if (isChatOpen && showDone) {
      setShowDone(false)
    }
  }, [isChatOpen, showDone])

  const { isCopying, copyOrigin, startCopy, endCopy } = useCopyable({
    onCopy: addLizard,
  })

  const { ref, position, setPosition, isDragging, hasMoved, handlers } = useDraggable({
    initialPosition,
    onDragStart: (pos, isAltKey) => {
      if (isAltKey) {
        startCopy(pos)
      }
    },
    onDragEnd: (pos, moved, isAltKey) => {
      if (isAltKey && moved && copyOrigin) {
        // Create new lizard at drop position, snap original back to origin
        endCopy(true, pos)
        setPosition(copyOrigin)
      } else {
        endCopy(false)
        // Save position after drag (only if not copying - copy saves via addLizard)
        if (moved) {
          saveLizards()
        }
      }
    },
  })

  // Register position for rectangular selection and arrangement
  const positionRef = useRef(position)

  useEffect(() => {
    positionRef.current = position
  }, [position])

  useEffect(() => {
    const getPosition = () => positionRef.current
    registerLizard(id, getPosition, setPosition, LIZARD_SIZE)
    return () => unregisterLizard(id)
  }, [id, registerLizard, unregisterLizard, setPosition])

  const handleClick = (e: React.MouseEvent) => {
    if (!hasMoved()) {
      if (e.shiftKey) {
        toggleSelection(id, true)
        return
      }
      openChat(id, 'task')
    }
  }

  return (
    <>
      {/* Original lizard - stays solid at origin when copying */}
      {isCopying && copyOrigin && (
        <div
          className="fixed pointer-events-none"
          style={{
            left: copyOrigin.x,
            top: copyOrigin.y,
            zIndex: 1000,
          }}
        >
          <LizardAvatar size={LIZARD_SIZE} followMouse={false} color={color} />
        </div>
      )}

      {/* Lizard Button - dragged copy is transparent when copying */}
      <div
        ref={ref}
        data-selectable
        className={`fixed cursor-pointer hover:scale-110 ${isDragging ? 'cursor-grabbing' : 'cursor-grab'}`}
        style={{
          left: position.x,
          top: position.y,
          zIndex: isCopying ? 1001 : 1000,
          opacity: isCopying ? 0.4 : 1,
          transition: isDragging ? 'transform 0.2s ease-out' : 'left 0.4s ease-out, top 0.4s ease-out, transform 0.2s ease-out, filter 0.2s ease-out',
          filter: isSelected ? 'brightness(1.4) drop-shadow(0 0 12px rgba(100, 200, 255, 0.8))' : 'none',
        }}
        onMouseDown={handlers.onMouseDown}
        onClick={handleClick}
      >
        <LizardAvatar size={LIZARD_SIZE} color={color} />

        {/* Status indicator - flickering circle on left side */}
        {(agentState !== 'ready' || showDone) && (
          <div
            className="absolute flex items-center justify-center"
            style={{
              top: 4,
              left: 4,
              width: 22,
              height: 22,
              borderRadius: '50%',
              fontSize: 11,
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
            {showDone && agentState === 'ready' && '✓'}
            {agentState === 'working' && '⚡'}
            {agentState === 'queued' && '⏳'}
            {agentState === 'error' && '!'}
          </div>
        )}

        {/* Agent name on left side */}
        {agentName && (
          <div
            className="absolute whitespace-nowrap pointer-events-none"
            style={{
              top: '50%',
              right: LIZARD_SIZE + 8,
              transform: 'translateY(-50%)',
              fontSize: 12,
              fontWeight: 500,
              color: 'rgba(255, 255, 255, 0.9)',
              textShadow: '0 1px 3px rgba(0, 0, 0, 0.5)',
            }}
          >
            {agentName}
          </div>
        )}
      </div>

      {/* Chat Window - positioned to the left of lizard, lizard at bottom */}
      {isChatOpen && (
        <div
          className="fixed"
          data-swarm-ui
          style={{
            left: position.x - CHAT_WIDTH - 20,
            top: position.y + LIZARD_SIZE - CHAT_HEIGHT,
            zIndex: 1002,
          }}
        >
          <ChatWindow
            lizardId={id}
            title={chatMode === 'plan' ? 'Plan Mode' : 'Gekto Chat'}
            onClose={closeChat}
          />
        </div>
      )}
    </>
  )
}

export { LIZARD_SIZE }
