import type { Editor } from 'tldraw'

/**
 * Auto-layout children inside a frame in a grid.
 */
export function orderFrameElements(editor: Editor, frameShape: ReturnType<Editor['getShape']>) {
  if (!frameShape) return

  const childIds = editor.getSortedChildIdsForParent(frameShape.id)
  if (childIds.length === 0) return

  const children = childIds
    .map(id => editor.getShape(id))
    .filter((s): s is NonNullable<typeof s> => s != null)

  if (children.length === 0) return

  // Get frame bounds
  const frameBounds = editor.getShapeGeometry(frameShape).bounds
  const padding = 20
  const gap = 16

  // Get each child's size
  const childSizes = children.map(child => {
    const bounds = editor.getShapeGeometry(child).bounds
    return { id: child.id, type: child.type, w: bounds.w, h: bounds.h }
  })

  // Calculate columns that fit in the frame
  const maxChildW = Math.max(...childSizes.map(c => c.w))
  const availableW = frameBounds.w - padding * 2
  const cols = Math.max(1, Math.floor((availableW + gap) / (maxChildW + gap)))

  // Lay out in grid rows
  const updates: Array<{ id: typeof children[0]['id']; type: string; x: number; y: number }> = []
  let row = 0
  let col = 0
  let rowHeight = 0
  let y = padding

  for (const child of childSizes) {
    if (col >= cols) {
      col = 0
      row++
      y += rowHeight + gap
      rowHeight = 0
    }

    const x = padding + col * (maxChildW + gap)
    updates.push({ id: child.id, type: 'geo', x, y })
    rowHeight = Math.max(rowHeight, child.h)
    col++
  }

  editor.updateShapes(updates as any)
}
