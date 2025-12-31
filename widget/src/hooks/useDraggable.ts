import { useState, useRef, useEffect, useCallback } from 'react'

interface Position {
  x: number
  y: number
}

interface UseDraggableOptions {
  initialPosition?: Position
  onDragStart?: (position: Position, isAltKey: boolean) => void
  onDragEnd?: (position: Position, hasMoved: boolean, isAltKey: boolean) => void
}

export function useDraggable(options: UseDraggableOptions = {}) {
  const {
    initialPosition = { x: window.innerWidth - 80, y: window.innerHeight - 80 },
    onDragStart,
    onDragEnd,
  } = options

  const ref = useRef<HTMLDivElement>(null)
  const [position, setPosition] = useState<Position>(initialPosition)
  const [isDragging, setIsDragging] = useState(false)
  const dragState = useRef({
    offset: { x: 0, y: 0 },
    startPos: { x: 0, y: 0 },
    hasMoved: false,
    altKeyPressed: false,
  })

  const DRAG_THRESHOLD = 5 // pixels before counting as drag

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (!ref.current) return

    const rect = ref.current.getBoundingClientRect()
    dragState.current = {
      offset: {
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
      },
      startPos: { x: e.clientX, y: e.clientY },
      hasMoved: false,
      altKeyPressed: e.altKey,
    }

    setIsDragging(true)
    onDragStart?.(position, e.altKey)
  }, [onDragStart, position])

  useEffect(() => {
    if (!isDragging) return

    const handleMouseMove = (e: MouseEvent) => {
      const deltaX = Math.abs(e.clientX - dragState.current.startPos.x)
      const deltaY = Math.abs(e.clientY - dragState.current.startPos.y)

      // Only count as moved if we exceed the threshold
      if (deltaX > DRAG_THRESHOLD || deltaY > DRAG_THRESHOLD) {
        dragState.current.hasMoved = true
        const newX = e.clientX - dragState.current.offset.x
        const newY = e.clientY - dragState.current.offset.y
        setPosition({ x: newX, y: newY })
      }
    }

    const handleMouseUp = () => {
      const { hasMoved, altKeyPressed } = dragState.current

      setIsDragging(false)
      onDragEnd?.(position, hasMoved, altKeyPressed)
    }

    document.addEventListener('mousemove', handleMouseMove)
    document.addEventListener('mouseup', handleMouseUp)

    return () => {
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseup', handleMouseUp)
    }
  }, [isDragging, position, onDragEnd])

  return {
    ref,
    position,
    setPosition,
    isDragging,
    hasMoved: () => dragState.current.hasMoved,
    isAltKey: () => dragState.current.altKeyPressed,
    handlers: {
      onMouseDown: handleMouseDown,
    },
  }
}
