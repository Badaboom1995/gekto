import { useState, useCallback, useEffect, useRef } from 'react'

interface Position {
  x: number
  y: number
}

interface SelectionRect {
  startX: number
  startY: number
  endX: number
  endY: number
}

interface SelectableItem {
  id: string
  getPosition: () => Position
  size: number
}

interface UseSelectableContainerOptions {
  onSelectionChange?: (selectedIds: Set<string>) => void
  onClickOutside?: () => void
}

export function useSelectableContainer(options: UseSelectableContainerOptions = {}) {
  const { onSelectionChange, onClickOutside } = options
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [selectionRect, setSelectionRect] = useState<SelectionRect | null>(null)
  const [isSelecting, setIsSelecting] = useState(false)
  const itemsRef = useRef<Map<string, SelectableItem>>(new Map())

  const registerItem = useCallback((item: SelectableItem) => {
    itemsRef.current.set(item.id, item)
  }, [])

  const unregisterItem = useCallback((id: string) => {
    itemsRef.current.delete(id)
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

  const selectItems = useCallback((ids: string[]) => {
    setSelectedIds(new Set(ids))
  }, [])

  // Check which items are inside the selection rectangle
  const getItemsInRect = useCallback((rect: SelectionRect): string[] => {
    const minX = Math.min(rect.startX, rect.endX)
    const maxX = Math.max(rect.startX, rect.endX)
    const minY = Math.min(rect.startY, rect.endY)
    const maxY = Math.max(rect.startY, rect.endY)

    const result: string[] = []
    itemsRef.current.forEach((item, id) => {
      const pos = item.getPosition()
      const centerX = pos.x + item.size / 2
      const centerY = pos.y + item.size / 2

      if (centerX >= minX && centerX <= maxX && centerY >= minY && centerY <= maxY) {
        result.push(id)
      }
    })
    return result
  }, [])

  // Handle rectangular selection and click outside to clear
  useEffect(() => {
    const handleMouseDown = (e: MouseEvent) => {
      // Check if clicking on a selectable item (let item handle it)
      const target = e.target as HTMLElement
      if (target.closest('[data-selectable]')) return

      // Shift+drag starts rectangular selection
      if (e.shiftKey) {
        setIsSelecting(true)
        setSelectionRect({
          startX: e.clientX,
          startY: e.clientY,
          endX: e.clientX,
          endY: e.clientY,
        })
      } else {
        // Click outside clears selection and notifies parent
        clearSelection()
        onClickOutside?.()
      }
    }

    const handleMouseMove = (e: MouseEvent) => {
      if (!isSelecting || !selectionRect) return

      setSelectionRect(prev => prev ? {
        ...prev,
        endX: e.clientX,
        endY: e.clientY,
      } : null)
    }

    const handleMouseUp = () => {
      if (isSelecting && selectionRect) {
        const ids = getItemsInRect(selectionRect)
        if (ids.length > 0) {
          selectItems(ids)
        }
      }
      setIsSelecting(false)
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
  }, [isSelecting, selectionRect, getItemsInRect, selectItems, clearSelection, onClickOutside])

  // Notify parent of selection changes
  useEffect(() => {
    onSelectionChange?.(selectedIds)
  }, [selectedIds, onSelectionChange])

  return {
    selectedIds,
    selectionRect,
    isSelecting,
    registerItem,
    unregisterItem,
    toggleSelection,
    clearSelection,
    selectItems,
  }
}

interface UseSelectableOptions {
  id: string
  getPosition: () => Position
  size: number
  isSelected: boolean
  onToggleSelection: (id: string, addToSelection: boolean) => void
}

export function useSelectable({
  id,
  getPosition: _getPosition,
  size: _size,
  isSelected,
  onToggleSelection,
}: UseSelectableOptions) {
  const handleShiftClick = useCallback((e: React.MouseEvent) => {
    if (e.shiftKey) {
      e.stopPropagation()
      e.preventDefault()
      onToggleSelection(id, true)
      return true
    }
    return false
  }, [id, onToggleSelection])

  return {
    isSelected,
    handleShiftClick,
    selectableProps: {
      'data-selectable': true,
      'data-selected': isSelected,
    },
  }
}
