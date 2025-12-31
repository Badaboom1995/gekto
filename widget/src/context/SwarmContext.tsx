import { createContext, useContext, useState, useCallback, useEffect, useRef, useMemo, type ReactNode } from 'react'

type ChatMode = 'task' | 'plan'

interface Position {
  x: number
  y: number
}

interface LizardData {
  id: string
  initialPosition: Position
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

  // Actions
  addLizard: (position: Position) => void
  deleteLizard: (id: string) => void
  openChat: (id: string, mode: ChatMode) => void
  closeChat: () => void
  toggleSelection: (id: string, addToSelection: boolean) => void
  clearSelection: () => void

  // Position registration for rectangular selection
  registerLizard: (id: string, getPosition: () => Position, size: number) => void
  unregisterLizard: (id: string) => void
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
}

export function SwarmProvider({ children, initialLizards }: SwarmProviderProps) {
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

  // Click outside to clear selection and close chat
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      // Don't clear during shift+drag selection
      if (e.shiftKey) return

      const target = e.target as HTMLElement
      if (!target.closest('[data-selectable]') && !target.closest('[data-swarm-ui]')) {
        setSelectedIds(new Set())
        setActiveChatId(null)
      }
    }

    window.addEventListener('click', handleClick)
    return () => window.removeEventListener('click', handleClick)
  }, [])

  const addLizard = useCallback((position: Position) => {
    setLizards(prev => [...prev, { id: Date.now().toString(), initialPosition: position }])
  }, [])

  const deleteLizard = useCallback((id: string) => {
    setLizards(prev => {
      if (prev.length <= 1) return prev // Keep at least one
      return prev.filter(l => l.id !== id)
    })
    if (activeChatId === id) {
      setActiveChatId(null)
    }
  }, [activeChatId])

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

  const value = useMemo<SwarmContextValue>(() => ({
    lizards,
    selectedIds,
    activeChatId,
    chatMode,
    addLizard,
    deleteLizard,
    openChat,
    closeChat,
    toggleSelection,
    clearSelection,
    registerLizard,
    unregisterLizard,
  }), [lizards, selectedIds, activeChatId, chatMode, addLizard, deleteLizard, openChat, closeChat, toggleSelection, clearSelection, registerLizard, unregisterLizard])

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

export type { LizardData, ChatMode, Position }
