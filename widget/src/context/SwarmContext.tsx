import { createContext, useContext, useState, useCallback, useEffect, useRef, useMemo, type ReactNode } from 'react'

type ChatMode = 'task' | 'plan'

interface Position {
  x: number
  y: number
}

interface LizardSettings {
  color: string
}

interface LizardData {
  id: string
  initialPosition: Position
  settings?: LizardSettings
}

interface SelectableItem {
  id: string
  getPosition: () => Position
  size: number
}

interface SwarmContextValue {
  // Lizard collection
  lizards: LizardData[]

  // Selection state
  selectedIds: Set<string>

  // Chat state
  activeChatId: string | null
  chatMode: ChatMode

  // Default settings for new lizards
  defaultSettings: LizardSettings

  // Actions
  addLizard: (position: Position) => void
  deleteLizard: (id: string) => void
  updateLizardColor: (id: string, color: string) => void
  openChat: (id: string, mode: ChatMode) => void
  closeChat: () => void
  toggleSelection: (id: string, addToSelection: boolean) => void
  clearSelection: () => void

  // Position registration for rectangular selection
  registerLizard: (id: string, getPosition: () => Position, size: number) => void
  unregisterLizard: (id: string) => void

  // Persistence
  saveLizards: () => void
}

const SwarmContext = createContext<SwarmContextValue | null>(null)
const SelectionRectContext = createContext<{ startX: number; startY: number; endX: number; endY: number } | null>(null)

export function useSwarm() {
  const context = useContext(SwarmContext)
  if (!context) {
    throw new Error('useSwarm must be used within a SwarmProvider')
  }
  return context
}

export function useSelectionRect() {
  return useContext(SelectionRectContext)
}

interface SwarmProviderProps {
  children: ReactNode
  initialLizards: LizardData[]
  defaultSettings?: LizardSettings
}

const DEFAULT_SETTINGS: LizardSettings = { color: '#BFFF6B' }

function parseHue(color: string): number | null {
  // Handle HSL
  const hslMatch = color.match(/hsl\((\d+)/)
  if (hslMatch) return parseInt(hslMatch[1])
  // Handle hex - convert to HSL
  if (color.startsWith('#')) {
    const hex = color.slice(1)
    const r = parseInt(hex.substring(0, 2), 16) / 255
    const g = parseInt(hex.substring(2, 4), 16) / 255
    const b = parseInt(hex.substring(4, 6), 16) / 255
    const max = Math.max(r, g, b), min = Math.min(r, g, b)
    if (max === min) return 0
    const d = max - min
    let h = 0
    if (max === r) h = ((g - b) / d + (g < b ? 6 : 0)) / 6
    else if (max === g) h = ((b - r) / d + 2) / 6
    else h = ((r - g) / d + 4) / 6
    return Math.round(h * 360)
  }
  return null
}

function randomDistinctColor(existingColors: string[]): string {
  const existingHues = existingColors.map(parseHue).filter((h): h is number => h !== null)
  const MIN_HUE_DISTANCE = 30

  // Try to find a hue that's far enough from all existing hues
  let bestHue = Math.floor(Math.random() * 360)
  let bestMinDistance = 0

  for (let attempt = 0; attempt < 36; attempt++) {
    const candidateHue = (attempt * 10 + Math.floor(Math.random() * 10)) % 360
    let minDistance = 180

    for (const existingHue of existingHues) {
      const distance = Math.min(
        Math.abs(candidateHue - existingHue),
        360 - Math.abs(candidateHue - existingHue)
      )
      minDistance = Math.min(minDistance, distance)
    }

    if (minDistance > bestMinDistance) {
      bestMinDistance = minDistance
      bestHue = candidateHue
      if (minDistance >= MIN_HUE_DISTANCE) break
    }
  }

  const saturation = 70 + Math.floor(Math.random() * 20)
  const lightness = 60 + Math.floor(Math.random() * 15)
  return `hsl(${bestHue}, ${saturation}%, ${lightness}%)`
}

export function SwarmProvider({ children, initialLizards, defaultSettings = DEFAULT_SETTINGS }: SwarmProviderProps) {
  const [lizards, setLizards] = useState<LizardData[]>(initialLizards)
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [activeChatId, setActiveChatId] = useState<string | null>(null)
  const [chatMode, setChatMode] = useState<ChatMode>('task')
  const selectableItemsRef = useRef<Map<string, SelectableItem>>(new Map())
  const [selectionRect, setSelectionRect] = useState<{ startX: number; startY: number; endX: number; endY: number } | null>(null)
  const [isShiftPressed, setIsShiftPressed] = useState(false)

  // Track shift key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Shift') setIsShiftPressed(true)
    }
    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.key === 'Shift') setIsShiftPressed(false)
    }
    window.addEventListener('keydown', handleKeyDown)
    window.addEventListener('keyup', handleKeyUp)
    return () => {
      window.removeEventListener('keydown', handleKeyDown)
      window.removeEventListener('keyup', handleKeyUp)
    }
  }, [])

  // Refs to avoid stale closures in event handlers
  const startPosRef = useRef<Position | null>(null)
  const selectionRectRef = useRef<typeof selectionRect>(null)
  const selectedIdsRef = useRef(selectedIds)

  // Keep refs in sync
  selectionRectRef.current = selectionRect
  selectedIdsRef.current = selectedIds

  // Rectangular selection with shift+drag
  useEffect(() => {
    if (!isShiftPressed) {
      setSelectionRect(null)
      return
    }

    const handleMouseDown = (e: MouseEvent) => {
      const target = e.target as HTMLElement
      if (target.closest('[data-selectable]')) return
      startPosRef.current = { x: e.clientX, y: e.clientY }
      setSelectionRect({ startX: e.clientX, startY: e.clientY, endX: e.clientX, endY: e.clientY })
    }

    const handleMouseMove = (e: MouseEvent) => {
      if (!startPosRef.current) return
      setSelectionRect({
        startX: startPosRef.current.x,
        startY: startPosRef.current.y,
        endX: e.clientX,
        endY: e.clientY,
      })
    }

    const handleMouseUp = () => {
      const currentRect = selectionRectRef.current
      if (currentRect) {
        const rect = getNormalizedRect(currentRect)
        const newSelected = new Set(selectedIdsRef.current)

        selectableItemsRef.current.forEach(item => {
          const pos = item.getPosition()
          const itemCenter = { x: pos.x + item.size / 2, y: pos.y + item.size / 2 }
          if (isPointInRect(itemCenter, rect)) {
            newSelected.add(item.id)
          }
        })

        setSelectedIds(newSelected)
      }
      startPosRef.current = null
      setSelectionRect(null)
    }

    window.addEventListener('mousedown', handleMouseDown)
    window.addEventListener('mousemove', handleMouseMove)
    window.addEventListener('mouseup', handleMouseUp)
    return () => {
      window.removeEventListener('mousedown', handleMouseDown)
      window.removeEventListener('mousemove', handleMouseMove)
      window.removeEventListener('mouseup', handleMouseUp)
    }
  }, [isShiftPressed])

  // Backspace to delete selected
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Backspace' && selectedIds.size > 0) {
        const remainingCount = lizards.length - selectedIds.size
        if (remainingCount < 1) {
          // Keep at least one lizard
          const idsToDelete = Array.from(selectedIds).slice(0, selectedIds.size - 1)
          if (idsToDelete.length === 0) return
          setLizards(prev => prev.filter(l => !idsToDelete.includes(l.id)))
          if (activeChatId && idsToDelete.includes(activeChatId)) {
            setActiveChatId(null)
          }
        } else {
          setLizards(prev => prev.filter(l => !selectedIds.has(l.id)))
          if (activeChatId && selectedIds.has(activeChatId)) {
            setActiveChatId(null)
          }
        }
        setSelectedIds(new Set())
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [selectedIds, lizards.length, activeChatId])

  // Click outside to clear selection (but not chat)
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      // Don't clear during shift+drag selection
      if (e.shiftKey) return

      const target = e.target as HTMLElement
      if (!target.closest('[data-selectable]') && !target.closest('[data-swarm-ui]')) {
        setSelectedIds(new Set())
      }
    }

    window.addEventListener('click', handleClick)
    return () => window.removeEventListener('click', handleClick)
  }, [])

  const addLizard = useCallback((position: Position) => {
    setLizards(prev => {
      const existingColors = prev.map(l => l.settings?.color ?? defaultSettings.color)
      const newColor = randomDistinctColor(existingColors)
      return [...prev, { id: Date.now().toString(), initialPosition: position, settings: { color: newColor } }]
    })
  }, [defaultSettings.color])

  const deleteLizard = useCallback((id: string) => {
    setLizards(prev => {
      if (prev.length <= 1) return prev // Keep at least one
      return prev.filter(l => l.id !== id)
    })
    if (activeChatId === id) {
      setActiveChatId(null)
    }
  }, [activeChatId])

  const updateLizardColor = useCallback((id: string, color: string) => {
    setLizards(prev => prev.map(l =>
      l.id === id ? { ...l, settings: { ...l.settings, color } } : l
    ))
  }, [])

  const openChat = useCallback((id: string, mode: ChatMode) => {
    setActiveChatId(id)
    setChatMode(mode)
  }, [])

  const closeChat = useCallback(() => {
    setActiveChatId(null)
  }, [])

  const toggleSelection = useCallback((id: string, addToSelection: boolean) => {
    setSelectedIds(prev => {
      const next = new Set(addToSelection ? prev : [])
      if (next.has(id)) {
        next.delete(id)
      } else {
        next.add(id)
      }
      return next
    })
  }, [])

  const clearSelection = useCallback(() => {
    setSelectedIds(new Set())
  }, [])

  const registerLizard = useCallback((id: string, getPosition: () => Position, size: number) => {
    selectableItemsRef.current.set(id, { id, getPosition, size })
  }, [])

  const unregisterLizard = useCallback((id: string) => {
    selectableItemsRef.current.delete(id)
  }, [])

  // Save lizards to server
  const saveLizardsRef = useRef<() => void>(() => {})

  const saveLizards = useCallback(() => {
    const lizardData = lizards.map(l => {
      const item = selectableItemsRef.current.get(l.id)
      const position = item ? item.getPosition() : l.initialPosition
      console.log('[Swarm] Lizard', l.id, 'position:', position, 'settings:', l.settings, 'from ref:', !!item)
      return { id: l.id, position, settings: l.settings }
    })

    console.log('[Swarm] Saving lizards:', lizardData)
    fetch('/__gekto/api/lizards', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(lizardData),
    })
      .then(res => res.json())
      .then(data => console.log('[Swarm] Save response:', data))
      .catch(err => console.error('[Swarm] Failed to save lizards:', err))
  }, [lizards])

  saveLizardsRef.current = saveLizards

  // Auto-save when lizards are added/removed (debounced)
  const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  useEffect(() => {
    // Skip initial render
    if (lizards === initialLizards) return

    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current)
    }
    saveTimeoutRef.current = setTimeout(() => {
      saveLizardsRef.current()
    }, 500)

    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current)
      }
    }
  }, [lizards, initialLizards])

  const value = useMemo<SwarmContextValue>(() => ({
    lizards,
    selectedIds,
    activeChatId,
    chatMode,
    defaultSettings,
    addLizard,
    deleteLizard,
    updateLizardColor,
    openChat,
    closeChat,
    toggleSelection,
    clearSelection,
    registerLizard,
    unregisterLizard,
    saveLizards,
  }), [lizards, selectedIds, activeChatId, chatMode, defaultSettings, addLizard, deleteLizard, updateLizardColor, openChat, closeChat, toggleSelection, clearSelection, registerLizard, unregisterLizard, saveLizards])

  return (
    <SwarmContext.Provider value={value}>
      <SelectionRectContext.Provider value={selectionRect}>
        {children}
      </SelectionRectContext.Provider>
    </SwarmContext.Provider>
  )
}

// Helpers
function getNormalizedRect(rect: { startX: number; startY: number; endX: number; endY: number }) {
  return {
    left: Math.min(rect.startX, rect.endX),
    top: Math.min(rect.startY, rect.endY),
    right: Math.max(rect.startX, rect.endX),
    bottom: Math.max(rect.startY, rect.endY),
  }
}

function isPointInRect(point: Position, rect: { left: number; top: number; right: number; bottom: number }) {
  return point.x >= rect.left && point.x <= rect.right && point.y >= rect.top && point.y <= rect.bottom
}

export type { LizardData, LizardSettings, ChatMode, Position }
