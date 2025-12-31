import { useState, useCallback } from 'react'

interface Position {
  x: number
  y: number
}

interface UseCopyableOptions {
  onCopy?: (position: Position) => void
}

export function useCopyable(options: UseCopyableOptions = {}) {
  const { onCopy } = options

  const [isCopying, setIsCopying] = useState(false)
  const [copyOrigin, setCopyOrigin] = useState<Position | null>(null)

  const startCopy = useCallback((currentPosition: Position) => {
    setIsCopying(true)
    setCopyOrigin({ ...currentPosition })
  }, [])

  const endCopy = useCallback((shouldCreateCopy: boolean) => {
    if (shouldCreateCopy && copyOrigin && onCopy) {
      onCopy(copyOrigin)
    }
    setIsCopying(false)
    setCopyOrigin(null)
  }, [copyOrigin, onCopy])

  const cancelCopy = useCallback(() => {
    setIsCopying(false)
    setCopyOrigin(null)
  }, [])

  return {
    isCopying,
    copyOrigin,
    startCopy,
    endCopy,
    cancelCopy,
  }
}
