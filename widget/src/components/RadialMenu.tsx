import { useState } from 'react'

interface MenuItem {
  id: string
  icon: React.ReactNode
  label: string
  onClick: () => void
  separated?: boolean
  danger?: boolean
}

interface RadialMenuProps {
  items: MenuItem[]
  isVisible: boolean
  size?: number
}

export function RadialMenu({
  items,
  isVisible,
  size = 90,
}: RadialMenuProps) {
  const [hoveredItem, setHoveredItem] = useState<string | null>(null)

  const bubbleSize = 48
  const dangerBubbleSize = 36
  const gap = 12
  const separatedGap = 12

  const renderItem = (item: MenuItem, index: number, offsetX: number) => {
    const isHovered = hoveredItem === item.id

    return (
      <div
        key={item.id}
        className="absolute pointer-events-auto cursor-pointer"
        style={{
          right: offsetX,
          top: 0,
          opacity: isVisible ? 1 : 0,
          transform: isVisible ? 'translateX(0)' : 'translateX(20px)',
          transition: `opacity 0.2s ease-out ${index * 0.05}s, transform 0.2s ease-out ${index * 0.05}s`,
        }}
        onMouseEnter={() => setHoveredItem(item.id)}
        onMouseLeave={() => setHoveredItem(null)}
        onClick={(e) => {
          e.stopPropagation()
          item.onClick()
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
          {item.label}
        </span>

        {/* Bubble */}
        <div
          className="flex items-center justify-center rounded-full transition-all duration-150"
          style={{
            width: item.danger ? dangerBubbleSize : bubbleSize,
            height: item.danger ? dangerBubbleSize : bubbleSize,
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
      className="absolute pointer-events-none"
      style={{
        right: size + 15,
        top: (size - bubbleSize) / 2,
        height: bubbleSize,
      }}
    >
      {itemsWithOffsets.map(({ item, index, offset }) => renderItem(item, index, offset))}
    </div>
  )
}
