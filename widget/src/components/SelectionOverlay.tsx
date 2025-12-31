interface SelectionRect {
  startX: number
  startY: number
  endX: number
  endY: number
}

interface SelectionOverlayProps {
  rect: SelectionRect | null
}

export function SelectionOverlay({ rect }: SelectionOverlayProps) {
  if (!rect) return null

  const left = Math.min(rect.startX, rect.endX)
  const top = Math.min(rect.startY, rect.endY)
  const width = Math.abs(rect.endX - rect.startX)
  const height = Math.abs(rect.endY - rect.startY)

  return (
    <div
      className="fixed pointer-events-none"
      style={{
        left,
        top,
        width,
        height,
        backgroundColor: 'rgba(100, 180, 255, 0.2)',
        border: '1px solid rgba(100, 180, 255, 0.6)',
        borderRadius: 2,
        zIndex: 9999,
      }}
    />
  )
}
