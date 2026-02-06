import { useEffect, useRef, useCallback } from 'react'
import { Editor, TLShapeId, TLShape } from 'tldraw'

// Grid layout constants
const CARD_WIDTH = 300
const CARD_HEIGHT = 200
const GAP = 20
const COLS = 4
const GRID_ORIGIN_X = 100
const GRID_ORIGIN_Y = 100

// Storage key for persisted positions
const POSITIONS_STORAGE_KEY = 'gekto-whiteboard-positions'

// Position data structure
interface CardPosition {
  shapeId: TLShapeId
  x: number
  y: number
}

interface PositionsState {
  positions: CardPosition[]
  lastUpdated: number
}

/**
 * Load positions from localStorage
 */
function loadPositionsFromStorage(): PositionsState | null {
  try {
    const saved = localStorage.getItem(POSITIONS_STORAGE_KEY)
    if (saved) {
      return JSON.parse(saved)
    }
  } catch (err) {
    console.error('[Whiteboard] Failed to load positions from storage:', err)
  }
  return null
}

/**
 * Save positions to localStorage
 */
function savePositionsToStorage(state: PositionsState): void {
  try {
    localStorage.setItem(POSITIONS_STORAGE_KEY, JSON.stringify(state))
  } catch (err) {
    console.error('[Whiteboard] Failed to save positions to storage:', err)
  }
}

/**
 * Check if a position overlaps with existing shapes
 */
function isPositionOccupied(
  x: number,
  y: number,
  existingPositions: Array<{ x: number; y: number }>
): boolean {
  const threshold = 50 // Allow some overlap tolerance
  return existingPositions.some(
    pos =>
      Math.abs(pos.x - x) < CARD_WIDTH - threshold &&
      Math.abs(pos.y - y) < CARD_HEIGHT - threshold
  )
}

/**
 * Get the next available grid position for a new card
 */
export function getNextGridPosition(
  existingPositions: Array<{ x: number; y: number }>
): { x: number; y: number } {
  // Scan grid slots until we find an unoccupied one
  for (let row = 0; row < 100; row++) {
    for (let col = 0; col < COLS; col++) {
      const x = GRID_ORIGIN_X + col * (CARD_WIDTH + GAP)
      const y = GRID_ORIGIN_Y + row * (CARD_HEIGHT + GAP)
      if (!isPositionOccupied(x, y, existingPositions)) {
        return { x, y }
      }
    }
  }
  // Fallback: place at origin (shouldn't happen with 100 rows)
  return { x: GRID_ORIGIN_X, y: GRID_ORIGIN_Y }
}

/**
 * Hook to manage whiteboard positions with persistence
 *
 * Features:
 * - Auto-grid layout for new cards
 * - Persistence via localStorage
 * - Debounced saves on position changes
 * - Restore positions on load
 */
export function useWhiteboardPositions(editor: Editor | null) {
  const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const positionsMapRef = useRef<Map<TLShapeId, { x: number; y: number }>>(new Map())
  const initializedRef = useRef(false)

  /**
   * Save current positions with debounce
   */
  const savePositions = useCallback(() => {
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current)
    }

    saveTimeoutRef.current = setTimeout(() => {
      const positions: CardPosition[] = []
      positionsMapRef.current.forEach((pos, shapeId) => {
        positions.push({ shapeId, x: pos.x, y: pos.y })
      })

      const state: PositionsState = {
        positions,
        lastUpdated: Date.now(),
      }
      savePositionsToStorage(state)
    }, 500) // Debounce 500ms
  }, [])

  /**
   * Get next grid position based on current shapes
   */
  const getNextPosition = useCallback((): { x: number; y: number } => {
    const existingPositions = Array.from(positionsMapRef.current.values())
    return getNextGridPosition(existingPositions)
  }, [])

  /**
   * Initialize positions from storage and set up listeners
   */
  useEffect(() => {
    if (!editor || initializedRef.current) return

    // Load saved positions
    const savedState = loadPositionsFromStorage()
    if (savedState) {
      savedState.positions.forEach(pos => {
        positionsMapRef.current.set(pos.shapeId, { x: pos.x, y: pos.y })
      })
    }

    // Get all task shapes and their current positions
    const taskShapes = editor.getCurrentPageShapes().filter(
      (shape): shape is TLShape & { type: 'task' } => shape.type === 'task'
    )

    // Update positions map with current shape positions
    taskShapes.forEach(shape => {
      if (!positionsMapRef.current.has(shape.id)) {
        // New shape - record its position
        positionsMapRef.current.set(shape.id, { x: shape.x, y: shape.y })
      }
    })

    // Subscribe to store changes to track shape movements
    const unsubscribe = editor.store.listen(
      (change) => {
        let hasPositionChanges = false

        // Process added records
        for (const record of Object.values(change.changes.added)) {
          if (record.typeName === 'shape' && (record as TLShape).type === 'task') {
            const shape = record as TLShape
            positionsMapRef.current.set(shape.id, { x: shape.x, y: shape.y })
            hasPositionChanges = true
          }
        }

        // Process updated records
        for (const [_, to] of Object.values(change.changes.updated)) {
          if (to.typeName === 'shape' && (to as TLShape).type === 'task') {
            const shape = to as TLShape
            const existing = positionsMapRef.current.get(shape.id)
            if (!existing || existing.x !== shape.x || existing.y !== shape.y) {
              positionsMapRef.current.set(shape.id, { x: shape.x, y: shape.y })
              hasPositionChanges = true
            }
          }
        }

        // Process removed records
        for (const record of Object.values(change.changes.removed)) {
          if (record.typeName === 'shape' && (record as TLShape).type === 'task') {
            const shape = record as TLShape
            positionsMapRef.current.delete(shape.id)
            hasPositionChanges = true
          }
        }

        // Save if positions changed
        if (hasPositionChanges) {
          savePositions()
        }
      },
      { source: 'all', scope: 'document' }
    )

    initializedRef.current = true

    return () => {
      unsubscribe()
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current)
      }
    }
  }, [editor, savePositions])

  /**
   * Restore saved positions to shapes (call after shapes are created)
   */
  const restorePositions = useCallback(() => {
    if (!editor) return

    const savedState = loadPositionsFromStorage()
    if (!savedState) return

    const shapesToUpdate: Array<{ id: TLShapeId; type: 'task'; x: number; y: number }> = []

    savedState.positions.forEach(pos => {
      const shape = editor.getShape(pos.shapeId)
      if (shape && shape.type === 'task') {
        // Only update if position differs
        if (shape.x !== pos.x || shape.y !== pos.y) {
          shapesToUpdate.push({
            id: pos.shapeId,
            type: 'task',
            x: pos.x,
            y: pos.y,
          })
        }
      }
    })

    if (shapesToUpdate.length > 0) {
      editor.updateShapes(shapesToUpdate)
    }
  }, [editor])

  /**
   * Clear all saved positions
   */
  const clearPositions = useCallback(() => {
    positionsMapRef.current.clear()
    localStorage.removeItem(POSITIONS_STORAGE_KEY)
  }, [])

  return {
    getNextPosition,
    restorePositions,
    clearPositions,
    savePositions,
  }
}

export type { CardPosition, PositionsState }
