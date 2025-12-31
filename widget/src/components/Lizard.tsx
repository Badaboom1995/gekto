import { useEffect, useState, useRef } from 'react'
import { LizardAvatar } from './LizardAvatar'
import { LizardMenu } from './LizardMenu'
import { ChatWindow } from './ChatWindow'
import { useDraggable } from '../hooks/useDraggable'
import { useCopyable } from '../hooks/useCopyable'
import { useOrderable } from '../hooks/useOrderable'
import { useSwarm } from '../context/SwarmContext'

const LIZARD_SIZE = 90
const CHAT_WIDTH = 350
const CHAT_HEIGHT = 500

interface LizardProps {
  id: string
  initialPosition: { x: number; y: number }
}

export function Lizard({ id, initialPosition }: LizardProps) {
  const {
    selectedIds,
    activeChatId,
    chatMode,
    addLizard,
    openChat,
    closeChat,
    toggleSelection,
    registerLizard,
    unregisterLizard,
  } = useSwarm()

  const isSelected = selectedIds.has(id)
  const isChatOpen = activeChatId === id

  const [isHovered, setIsHovered] = useState(false)
  const [menuVisible, setMenuVisible] = useState(false)
  const [isShaking, setIsShaking] = useState(false)

  const { isCopying, copyOrigin, startCopy, endCopy } = useCopyable({
    onCopy: addLizard,
  })

  const { targetPosition } = useOrderable({ id, size: LIZARD_SIZE })

  const { ref, position, setPosition, isDragging, hasMoved, handlers } = useDraggable({
    initialPosition,
    onDragStart: (pos, isAltKey) => {
      if (isAltKey) {
        startCopy(pos)
      }
      setMenuVisible(false)
    },
    onDragEnd: (_pos, moved, isAltKey) => {
      if (isAltKey && moved) {
        endCopy(true)
      } else {
        endCopy(false)
      }
    },
  })

  // Animate to target position when triggered by OrderableContainer
  useEffect(() => {
    if (targetPosition) {
      setPosition(targetPosition)
    }
  }, [targetPosition, setPosition])

  // Register position for rectangular selection
  const positionRef = useRef(position)

  useEffect(() => {
    positionRef.current = position
  }, [position])

  useEffect(() => {
    const getPosition = () => positionRef.current
    registerLizard(id, getPosition, LIZARD_SIZE)
    return () => unregisterLizard(id)
  }, [id, registerLizard, unregisterLizard])

  // Hide menu immediately when conditions change
  const shouldShowMenu = isHovered && !isDragging && !isChatOpen
  if (!shouldShowMenu && menuVisible) {
    setMenuVisible(false)
  }

  // Show menu on hover with delay
  useEffect(() => {
    if (!shouldShowMenu) return
    const timer = setTimeout(() => setMenuVisible(true), 300)
    return () => clearTimeout(timer)
  }, [shouldShowMenu])

  const handleClick = (e: React.MouseEvent) => {
    if (!hasMoved()) {
      if (e.shiftKey) {
        toggleSelection(id, true)
        return
      }
      openChat(id, 'task')
    }
  }

  const handleShake = () => {
    setIsShaking(true)
    setTimeout(() => setIsShaking(false), 500)
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
          <LizardAvatar size={LIZARD_SIZE} followMouse={false} />
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
          zIndex: menuVisible ? 1100 : (isCopying ? 1001 : 1000),
          opacity: isCopying ? 0.4 : 1,
          transition: isDragging ? 'transform 0.2s ease-out' : 'left 0.4s ease-out, top 0.4s ease-out, transform 0.2s ease-out, filter 0.2s ease-out',
          filter: isSelected ? 'brightness(1.4) drop-shadow(0 0 12px rgba(100, 200, 255, 0.8))' : 'none',
        }}
        onMouseDown={handlers.onMouseDown}
        onClick={handleClick}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        {/* Invisible hover extension to the left for menu */}
        {menuVisible && (
          <div
            className="absolute"
            style={{
              right: LIZARD_SIZE,
              top: -20,
              width: 220,
              height: LIZARD_SIZE + 40,
            }}
          />
        )}

        <LizardAvatar size={LIZARD_SIZE} isShaking={isShaking} />

        <LizardMenu
          lizardId={id}
          isVisible={menuVisible}
          size={LIZARD_SIZE}
          onHide={() => setMenuVisible(false)}
          onShake={handleShake}
        />
      </div>

      {/* Chat Window - positioned above lizard */}
      {isChatOpen && (
        <div
          className="fixed"
          data-swarm-ui
          style={{
            left: position.x + LIZARD_SIZE - CHAT_WIDTH,
            top: position.y - CHAT_HEIGHT + 60,
            zIndex: 1002,
          }}
        >
          <ChatWindow
            title={chatMode === 'plan' ? 'Plan Mode' : 'Gekto Chat'}
            onClose={closeChat}
          />
        </div>
      )}
    </>
  )
}

export { LIZARD_SIZE }
