import { useState } from 'react'
import { GlassContainer } from '../primitives/GlassContainer'
import { StatusDot } from '../primitives/StatusDot'
import { useDraggable } from '../hooks/useDraggable'

interface BubbleProps {
  color?: string
  status?: 'idle' | 'active' | 'loading' | 'error'
  icon?: React.ReactNode
  onClick?: () => void
  onExpand?: (expanded: boolean) => void
}

export function Bubble({
  color = '#8B5CF6',
  status = 'active',
  icon,
  onClick,
  onExpand,
}: BubbleProps) {
  const [isExpanded, setIsExpanded] = useState(false)

  const { ref, position, isDragging, hasMoved, handlers } = useDraggable({
    initialPosition: { x: window.innerWidth - 80, y: window.innerHeight - 80 },
  })

  const handleClick = () => {
    // Only toggle if we didn't drag
    if (!hasMoved()) {
      const newExpanded = !isExpanded
      setIsExpanded(newExpanded)
      onExpand?.(newExpanded)
      onClick?.()
    }
  }

  return (
    <GlassContainer
      ref={ref}
      position={position}
      size={{ width: 80, height: 80 }}
      color={color}
      rounded="full"
      active={isExpanded}
      isDragging={isDragging}
      onClick={handleClick}
      onMouseDown={handlers.onMouseDown}
    >
      {/* Icon */}
      {icon || <DefaultIcon />}

      {/* Status indicator */}
      <StatusDot status={status} />
    </GlassContainer>
  )
}

function DefaultIcon() {
  return (
    <svg
      className="w-10 h-10 text-white drop-shadow-lg"
      viewBox="0 0 24 24"
      fill="currentColor"
    >
      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z" />
    </svg>
  )
}
