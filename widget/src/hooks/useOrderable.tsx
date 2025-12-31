import { createContext, useContext, useCallback, useEffect, useRef, useState, type ReactNode } from 'react'

interface Position {
  x: number
  y: number
}

interface OrderableItem {
  id: string
  setPosition: (pos: Position) => void
  size: number
}

interface OrderableContextValue {
  register: (item: OrderableItem) => void
  unregister: (id: string) => void
}

const OrderableContext = createContext<OrderableContextValue | null>(null)

type Arrangement = 'grid' | 'stack' | 'row' | 'column'
type Corner = 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right'

interface OrderableContainerProps {
  children: ReactNode
  hotkey?: string
  arrangement?: Arrangement
  corner?: Corner
  gap?: number
}

export function OrderableContainer({
  children,
  hotkey = 'ArrowRight',
  arrangement = 'grid',
  corner = 'bottom-right',
  gap = -30,
}: OrderableContainerProps) {
  const itemsRef = useRef<Map<string, OrderableItem>>(new Map())

  const register = useCallback((item: OrderableItem) => {
    itemsRef.current.set(item.id, item)
  }, [])

  const unregister = useCallback((id: string) => {
    itemsRef.current.delete(id)
  }, [])

  const arrange = useCallback(() => {
    const items = Array.from(itemsRef.current.values())
    if (items.length === 0) return

    const avgSize = items.reduce((sum, item) => sum + item.size, 0) / items.length
    const padding = 30

    // Calculate corner origin
    let originX: number
    let originY: number
    let dirX: number
    let dirY: number

    switch (corner) {
      case 'top-left':
        originX = padding
        originY = padding
        dirX = 1
        dirY = 1
        break
      case 'top-right':
        originX = window.innerWidth - avgSize - padding
        originY = padding
        dirX = -1
        dirY = 1
        break
      case 'bottom-left':
        originX = padding
        originY = window.innerHeight - avgSize - padding
        dirX = 1
        dirY = -1
        break
      case 'bottom-right':
      default:
        originX = window.innerWidth - avgSize - padding
        originY = window.innerHeight - avgSize - padding
        dirX = -1
        dirY = -1
        break
    }

    items.forEach((item, index) => {
      let x: number
      let y: number

      switch (arrangement) {
        case 'stack':
          x = originX
          y = originY
          break
        case 'row':
          x = originX + dirX * index * (item.size + gap)
          y = originY
          break
        case 'column':
          x = originX
          y = originY + dirY * index * (item.size + gap)
          break
        case 'grid':
        default: {
          const rows = Math.floor((window.innerHeight * 0.8) / (avgSize + gap)) || 1
          const row = index % rows
          const col = Math.floor(index / rows)
          x = originX + dirX * col * (item.size + gap)
          y = originY + dirY * row * (item.size + gap)
          break
        }
      }

      item.setPosition({ x, y })
    })
  }, [arrangement, corner, gap])

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === hotkey) {
        arrange()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [hotkey, arrange])

  return (
    <OrderableContext.Provider value={{ register, unregister }}>
      {children}
    </OrderableContext.Provider>
  )
}

interface UseOrderableOptions {
  id: string
  size?: number
}

export function useOrderable({ id, size = 100 }: UseOrderableOptions) {
  const context = useContext(OrderableContext)
  const [targetPosition, setTargetPosition] = useState<Position | null>(null)

  useEffect(() => {
    if (!context) return

    const item: OrderableItem = {
      id,
      setPosition: setTargetPosition,
      size,
    }

    context.register(item)
    return () => context.unregister(id)
  }, [context, id, size])

  return {
    targetPosition,
  }
}
