import { useEffect, useState } from 'react'
import { TriangleLizard3D } from './TriangleLizard3D'
import { ChatWindow } from './ChatWindow'
import { RadialMenu } from './RadialMenu'
import { useDraggable } from '../hooks/useDraggable'
import { useCopyable } from '../hooks/useCopyable'
import { useOrderable } from '../hooks/useOrderable'

const LIZARD_SIZE = 90
const CHAT_WIDTH = 350
const CHAT_HEIGHT = 500

type ChatMode = 'task' | 'plan'

export interface LizardProps {
  id: string
  initialPosition: { x: number; y: number }
  isChatOpen?: boolean
  chatMode?: ChatMode
  isLastLizard?: boolean
  isSelected?: boolean
  onCopy?: (position: { x: number; y: number }) => void
  onOpenChat?: (id: string, mode: ChatMode) => void
  onCloseChat?: (id: string) => void
  onDelete?: (id: string) => void
  onToggleSelection?: (id: string, addToSelection: boolean) => void
  onRegisterPosition?: (id: string, getPosition: () => { x: number; y: number }, size: number) => void
  onUnregisterPosition?: (id: string) => void
}

export function Lizard({
  id,
  initialPosition,
  isChatOpen = false,
  chatMode = 'task',
  isLastLizard = false,
  isSelected = false,
  onCopy,
  onOpenChat,
  onCloseChat,
  onDelete,
  onToggleSelection,
  onRegisterPosition,
  onUnregisterPosition,
}: LizardProps) {
  const [isHovered, setIsHovered] = useState(false)
  const [menuVisible, setMenuVisible] = useState(false)
  const [isShaking, setIsShaking] = useState(false)

  const { isCopying, copyOrigin, startCopy, endCopy } = useCopyable({
    onCopy,
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
  useEffect(() => {
    const getPosition = () => position
    onRegisterPosition?.(id, getPosition, LIZARD_SIZE)
    return () => onUnregisterPosition?.(id)
  }, [id, position, onRegisterPosition, onUnregisterPosition])

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
      // Shift+click toggles selection
      if (e.shiftKey) {
        onToggleSelection?.(id, true)
        return
      }
      // Default action: open task chat
      onOpenChat?.(id, 'task')
    }
  }

  const menuItems = [
    {
      id: 'task',
      icon: '💬',
      label: 'Task',
      onClick: () => {
        onOpenChat?.(id, 'task')
        setMenuVisible(false)
      },
    },
    {
      id: 'plan',
      icon: '📋',
      label: 'Plan',
      onClick: () => {
        onOpenChat?.(id, 'plan')
        setMenuVisible(false)
      },
    },
    {
      id: 'delete',
      icon: '🗑',
      label: 'Delete',
      separated: true,
      danger: true,
      onClick: () => {
        if (isLastLizard) {
          setMenuVisible(false)
          setIsShaking(true)
          setTimeout(() => setIsShaking(false), 500)
        } else {
          onDelete?.(id)
          setMenuVisible(false)
        }
      },
    },
  ]

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
          <TriangleLizard3D size={LIZARD_SIZE} followMouse={false} skinColor='#BFFF6B' detailColor='#A8F15A' eyeColor='black' />
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
        {/* Invisible hover extension to the left for menu - only when menu visible */}
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

        <div
          style={{
            animation: isShaking ? 'shake 0.5s ease-in-out' : 'none',
          }}
        >
          <style>{`
            @keyframes shake {
              0%, 100% { transform: rotate(0deg); }
              20% { transform: rotate(-15deg); }
              40% { transform: rotate(12deg); }
              60% { transform: rotate(-8deg); }
              80% { transform: rotate(5deg); }
            }
          `}</style>
          <TriangleLizard3D size={LIZARD_SIZE} followMouse={!isShaking} skinColor='#BFFF6B' detailColor='#A8F15A' eyeColor='black' />
        </div>

        {/* Radial Menu */}
        <RadialMenu
          items={menuItems}
          isVisible={menuVisible}
          size={LIZARD_SIZE}
        />
      </div>

      {/* Chat Window - positioned above lizard */}
      {isChatOpen && (
        <div
          className="fixed"
          style={{
            left: position.x + LIZARD_SIZE - CHAT_WIDTH,
            top: position.y - CHAT_HEIGHT + 60,
            zIndex: 1002,
          }}
        >
          <ChatWindow
            title={chatMode === 'plan' ? 'Plan Mode' : 'Gekto Chat'}
            onClose={() => onCloseChat?.(id)}
          />
        </div>
      )}
    </>
  )
}

export { LIZARD_SIZE }
