import { useMemo } from 'react'
import { TriangleLizard3D } from './TriangleLizard3D'

interface LizardAvatarProps {
  size: number
  isShaking?: boolean
  followMouse?: boolean
  color?: string
  faceRight?: boolean
}

// Derive a slightly darker detail color from the main color
function deriveDetailColor(color: string): string {
  // Handle HSL colors
  if (color.startsWith('hsl')) {
    const match = color.match(/hsl\((\d+),\s*(\d+)%,\s*(\d+)%\)/)
    if (match) {
      const [, h, s, l] = match
      return `hsl(${h}, ${s}%, ${Math.max(0, parseInt(l) - 10)}%)`
    }
  }
  // Parse hex color
  const hex = color.replace('#', '')
  const r = parseInt(hex.substring(0, 2), 16)
  const g = parseInt(hex.substring(2, 4), 16)
  const b = parseInt(hex.substring(4, 6), 16)
  // Darken by 10%
  const darken = (c: number) => Math.max(0, Math.floor(c * 0.9))
  return `#${darken(r).toString(16).padStart(2, '0')}${darken(g).toString(16).padStart(2, '0')}${darken(b).toString(16).padStart(2, '0')}`
}

export function LizardAvatar({ size, isShaking = false, followMouse = true, color = '#BFFF6B', faceRight = false }: LizardAvatarProps) {
  const detailColor = useMemo(() => deriveDetailColor(color), [color])

  return (
    <div
      style={{
        animation: isShaking ? 'shake 0.5s ease-in-out' : 'none',
      }}
    >
      <style>{`
        @keyframes shake {
          0%, 100% { transform: rotate(0deg); }
          20% { transform: rotate(-15deg); }
          40% { transform: rotate(12deg); }
          60% { transform: rotate(-8deg); }
          80% { transform: rotate(5deg); }
        }
      `}</style>
      <TriangleLizard3D
        size={size}
        followMouse={followMouse && !isShaking}
        skinColor={color}
        detailColor={detailColor}
        eyeColor="black"
        faceRight={faceRight}
      />
    </div>
  )
}
