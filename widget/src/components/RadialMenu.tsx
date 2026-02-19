import { useState, useRef, useEffect, useMemo } from 'react'
import { SunIcon, MoonIcon } from '@radix-ui/react-icons'

const THEME_STORAGE_KEY = 'gekto-menu-theme'

// Detect if site has light background, with manual override
function useMenuTheme(): { isLight: boolean; toggle: () => void } {
  const [manualOverride, setManualOverride] = useState<'light' | 'dark' | null>(() => {
    try {
      return localStorage.getItem(THEME_STORAGE_KEY) as 'light' | 'dark' | null
    } catch {
      return null
    }
  })
  const [autoDetected, setAutoDetected] = useState(false)

  useEffect(() => {
    const checkTheme = () => {
      const bg = getComputedStyle(document.body).backgroundColor
      const rgb = bg.match(/\d+/g)?.map(Number) || [255, 255, 255]
      const luminance = (0.299 * rgb[0] + 0.587 * rgb[1] + 0.114 * rgb[2]) / 255
      setAutoDetected(luminance > 0.5)
    }

    checkTheme()
    const observer = new MutationObserver(checkTheme)
    observer.observe(document.body, { attributes: true, attributeFilter: ['class', 'style'] })
    return () => observer.disconnect()
  }, [])

  const toggle = () => {
    const current = manualOverride !== null ? (manualOverride === 'light') : autoDetected
    const newValue = current ? 'dark' : 'light'
    setManualOverride(newValue)
    try {
      localStorage.setItem(THEME_STORAGE_KEY, newValue)
    } catch {
      // Ignore storage errors
    }
  }

  const isLight = manualOverride !== null ? (manualOverride === 'light') : autoDetected

  return { isLight, toggle }
}

interface MenuItem {
  id: string
  icon: React.ReactNode
  label: string
  onClick: () => void
  separated?: boolean
  danger?: boolean
  active?: boolean // highlight when active
  holdDuration?: number // ms to hold before action triggers
  hotkey?: string // keyboard shortcut label e.g. "⇧C"
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
  const { isLight: isLightTheme, toggle: toggleTheme } = useMenuTheme()

  // Theme-aware colors
  const colors = useMemo(() => ({
    cardBg: isLightTheme ? 'rgba(255, 255, 255, 0.7)' : 'rgba(30, 30, 35, 0.6)',
    cardBorder: isLightTheme ? 'rgba(0, 0, 0, 0.08)' : 'rgba(255, 255, 255, 0.15)',
    cardShadow: isLightTheme ? '0 2px 12px rgba(0, 0, 0, 0.1)' : '0 2px 8px rgba(0, 0, 0, 0.3)',
    labelColor: isLightTheme ? 'rgba(0, 0, 0, 0.7)' : 'rgba(255, 255, 255, 0.7)',
    iconColor: isLightTheme ? 'rgba(0, 0, 0, 0.7)' : 'rgba(255, 255, 255, 0.9)',
    dangerBg: 'rgba(220, 80, 80, 0.4)',
    dangerBorder: 'rgba(220, 80, 80, 0.3)',
  }), [isLightTheme])

  const cardWidth = 40
  const cardHeight = 48
  const dangerCardWidth = 32
  const dangerCardHeight = 36
  const borderRadius = 12
  const gap = 10
  const separatedGap = 10

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
    const currentWidth = item.danger ? dangerCardWidth : cardWidth
    const currentHeight = item.danger ? dangerCardHeight : cardHeight

    return (
      <div
        key={item.id}
        className="absolute pointer-events-auto cursor-pointer"
        style={{
          ...(side === 'left' ? { right: offsetX } : { left: offsetX }),
          top: (cardHeight - currentHeight) / 2,
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
          className="absolute bottom-full mb-2 text-xs whitespace-nowrap"
          style={{
            color: colors.labelColor,
            opacity: isHovered ? 1 : 0,
            transform: isHovered ? 'translateY(0)' : 'translateY(5px)',
            transition: 'opacity 0.15s ease-out, transform 0.15s ease-out',
            ...(side === 'left' ? { right: 0 } : { left: 0 }),
          }}
        >
          {isHolding ? 'Hold...' : item.label}
          {!isHolding && item.hotkey && (
            <span style={{ opacity: 0.4, marginLeft: 6 }}>{item.hotkey}</span>
          )}
        </span>
        {/* Card */}
        <div
          className="relative flex items-center justify-center transition-all duration-150 overflow-hidden"
          style={{
            width: currentWidth,
            height: currentHeight,
            borderRadius: borderRadius,
            background: item.danger ? colors.dangerBg : item.active ? 'rgba(59, 130, 246, 0.3)' : colors.cardBg,
            border: `1px solid ${item.danger ? colors.dangerBorder : item.active ? 'rgba(59, 130, 246, 0.5)' : colors.cardBorder}`,
            boxShadow: colors.cardShadow,
            transform: isHovered ? 'scale(1.1)' : 'scale(1)',
          }}
        >
          {/* Fill-up progress for hold items (like glass filling with water) */}
          {item.holdDuration && (
            <div
              className="absolute inset-0 pointer-events-none"
              style={{
                top: isHolding ? `${(1 - holdProgress) * 100}%` : '100%',
                background: 'rgba(239, 68, 68, 0.9)',
              }}
            />
          )}
          <span className="relative z-10" style={{ fontSize: item.danger ? 16 : 20, color: colors.iconColor }}>
            {item.icon}
          </span>
        </div>
      </div>
    )
  }

  // Calculate positions from right to left
  const itemsWithOffsets = items.reduce<Array<{ item: MenuItem; index: number; offset: number }>>((acc, item, index) => {
    const prevOffset = acc.length > 0 ? acc[acc.length - 1].offset + cardWidth : 0
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
        top: (size - cardHeight) / 2,
        height: cardHeight,
      }}
    >
      {itemsWithOffsets.map(({ item, index, offset }) => renderItem(item, index, offset))}

      {/* Theme toggle button - positioned below and mirrored */}
      <div
        className="absolute pointer-events-auto cursor-pointer"
        style={{
          ...(side === 'left' ? { right: -6 } : { left: -18 }),
          bottom: -45,
          width: 34,
          height: 34,
          borderRadius: '50%',
          background: colors.cardBg,
          border: `1px solid ${colors.cardBorder}`,
          boxShadow: colors.cardShadow,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: 12,
          opacity: isVisible ? 1 : 0,
          transform: isVisible ? 'scale(1)' : 'scale(0.8)',
          transition: 'opacity 0.2s ease-out 0.1s, transform 0.2s ease-out 0.1s, background 0.15s ease-out',
        }}
        onClick={(e) => {
          e.stopPropagation()
          toggleTheme()
        }}
        onMouseEnter={(e) => {
          (e.currentTarget as HTMLElement).style.transform = 'scale(1.15)'
        }}
        onMouseLeave={(e) => {
          (e.currentTarget as HTMLElement).style.transform = 'scale(1)'
        }}
        title={isLightTheme ? 'Switch to dark' : 'Switch to light'}
      >
        {isLightTheme
          ? <MoonIcon width={16} height={16} style={{ color: colors.iconColor }} />
          : <SunIcon width={16} height={16} style={{ color: colors.iconColor }} />
        }
      </div>
    </div>
  )
}
