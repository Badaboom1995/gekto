import { useState, useRef, useEffect } from 'react'

interface MenuItem {
  id: string
  icon: React.ReactNode
  label: string
  onClick: () => void
  separated?: boolean
  danger?: boolean
  holdDuration?: number // ms to hold before action triggers
}

interface RadialMenuProps {
  items: MenuItem[]
  isVisible: boolean
  size?: number
  side?: 'left' | 'right'
}

export function RadialMenu({
  items,
  isVisible,
  size = 90,
  side = 'left',
}: RadialMenuProps) {
  const [hoveredItem, setHoveredItem] = useState<string | null>(null)
  const [holdingItem, setHoldingItem] = useState<string | null>(null)
  const [holdProgress, setHoldProgress] = useState(0)
  const holdIdRef = useRef(0)
  const holdAnimationRef = useRef<number | null>(null)

  const bubbleSize = 48
  const dangerBubbleSize = 36
  const gap = 12
  const separatedGap = 12

  // Clean up animation on unmount or when not visible
  useEffect(() => {
    if (!isVisible && holdAnimationRef.current) {
      cancelAnimationFrame(holdAnimationRef.current)
      holdAnimationRef.current = null
    }
    return () => {
      if (holdAnimationRef.current) {
        cancelAnimationFrame(holdAnimationRef.current)
      }
    }
  }, [isVisible])

  // Reset hold state when menu becomes invisible
  useEffect(() => {
    if (!isVisible) {
      holdIdRef.current += 1
    }
  }, [isVisible])

  const startHold = (item: MenuItem) => {
    if (!item.holdDuration) return

    holdIdRef.current += 1
    const currentHoldId = holdIdRef.current
    let startTime: number | null = null

    setHoldingItem(item.id)
    setHoldProgress(0)

    const animate = (timestamp: number) => {
      if (holdIdRef.current !== currentHoldId || !item.holdDuration) return

      if (startTime === null) startTime = timestamp
      const elapsed = timestamp - startTime
      const progress = Math.min(elapsed / item.holdDuration, 1)
      setHoldProgress(progress)

      if (progress >= 1) {
        // Action complete
        item.onClick()
        cancelHold()
      } else {
        holdAnimationRef.current = requestAnimationFrame(animate)
      }
    }

    holdAnimationRef.current = requestAnimationFrame(animate)
  }

  const cancelHold = () => {
    holdIdRef.current += 1
    setHoldingItem(null)
    setHoldProgress(0)
    if (holdAnimationRef.current) {
      cancelAnimationFrame(holdAnimationRef.current)
      holdAnimationRef.current = null
    }
  }

  const renderItem = (item: MenuItem, index: number, offsetX: number) => {
    const isHovered = hoveredItem === item.id
    const isHolding = holdingItem === item.id
    const currentSize = item.danger ? dangerBubbleSize : bubbleSize

    return (
      <div
        key={item.id}
        className="absolute pointer-events-auto cursor-pointer"
        style={{
          ...(side === 'left' ? { right: offsetX } : { left: offsetX }),
          top: 0,
          opacity: isVisible ? 1 : 0,
          transform: isVisible ? 'translateX(0)' : `translateX(${side === 'left' ? '20px' : '-20px'})`,
          transition: `opacity 0.2s ease-out ${index * 0.05}s, transform 0.2s ease-out ${index * 0.05}s`,
        }}
        onMouseEnter={() => setHoveredItem(item.id)}
        onMouseLeave={() => {
          setHoveredItem(null)
          cancelHold()
        }}
        onMouseDown={(e) => {
          e.stopPropagation()
          if (item.holdDuration) {
            startHold(item)
          }
        }}
        onMouseUp={() => {
          if (item.holdDuration) {
            cancelHold()
          }
        }}
        onClick={(e) => {
          e.stopPropagation()
          e.preventDefault()
          // Only trigger immediately if no holdDuration
          if (!item.holdDuration) {
            item.onClick()
          }
        }}
      >
        {/* Label */}
        <span
          className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 text-white/70 text-xs whitespace-nowrap"
          style={{
            opacity: isHovered ? 1 : 0,
            transform: isHovered ? 'translateY(0)' : 'translateY(5px)',
            transition: 'opacity 0.15s ease-out, transform 0.15s ease-out',
          }}
        >
          {isHolding ? 'Hold...' : item.label}
        </span>

        {/* Bubble */}
        <div
          className="relative flex items-center justify-center rounded-full transition-all duration-150"
          style={{
            width: currentSize,
            height: currentSize,
            background: item.danger
              ? (isHovered ? 'rgba(220, 80, 80, 0.4)' : 'rgba(60, 30, 30, 0.85)')
              : (isHovered ? 'rgba(255, 255, 255, 0.2)' : 'rgba(30, 30, 35, 0.85)'),
            border: item.danger
              ? '1px solid rgba(220, 80, 80, 0.3)'
              : '1px solid rgba(255, 255, 255, 0.15)',
            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.3)',
            transform: isHovered ? 'scale(1.1)' : 'scale(1)',
          }}
        >
          {/* Progress ring for hold items */}
          {item.holdDuration && isHolding && (
            <svg
              className="absolute inset-0"
              style={{ width: currentSize, height: currentSize }}
            >
              <circle
                cx={currentSize / 2}
                cy={currentSize / 2}
                r={(currentSize / 2) - 3}
                fill="none"
                stroke="rgba(220, 80, 80, 0.8)"
                strokeWidth="3"
                strokeDasharray={Math.PI * (currentSize - 6)}
                strokeDashoffset={Math.PI * (currentSize - 6) * (1 - holdProgress)}
                style={{
                  transform: 'rotate(-90deg)',
                  transformOrigin: 'center',
                }}
              />
            </svg>
          )}
          <span style={{ fontSize: item.danger ? 16 : 20 }}>
            {item.icon}
          </span>
        </div>
      </div>
    )
  }

  // Calculate positions from right to left
  const itemsWithOffsets = items.reduce<Array<{ item: MenuItem; index: number; offset: number }>>((acc, item, index) => {
    const prevOffset = acc.length > 0 ? acc[acc.length - 1].offset + bubbleSize : 0
    const gapToAdd = index > 0 ? (item.separated ? separatedGap : gap) : 0
    const offset = prevOffset + gapToAdd
    acc.push({ item, index, offset })
    return acc
  }, [])

  return (
    <div
      data-radial-menu
      className="absolute pointer-events-none"
      style={{
        ...(side === 'left' ? { right: size - 10 } : { left: size - 10 }),
        top: (size - bubbleSize) / 2,
        height: bubbleSize,
      }}
    >
      {itemsWithOffsets.map(({ item, index, offset }) => renderItem(item, index, offset))}
    </div>
  )
}
