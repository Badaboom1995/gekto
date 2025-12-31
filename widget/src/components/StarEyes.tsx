import { useEffect, useState } from 'react'

interface StarEyesProps {
  size?: number
  color?: string
  gap?: number
}

export function StarEyes({ size = 12, color = '#A8F15A', gap = 16 }: StarEyesProps) {
  const [offset, setOffset] = useState({ x: 0, y: 0 })

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      const centerX = window.innerWidth / 2
      const centerY = window.innerHeight / 2

      const x = ((e.clientX - centerX) / centerX) * 2
      const y = ((e.clientY - centerY) / centerY) * 2

      setOffset({ x: x * 3, y: y * 3 })
    }

    window.addEventListener('mousemove', handleMouseMove)
    return () => window.removeEventListener('mousemove', handleMouseMove)
  }, [])

  const pixelSize = size / 5

  const StarEye = ({ offsetX }: { offsetX: number }) => (
    <div
      style={{
        position: 'relative',
        width: size,
        height: size,
        transform: `translate(${offset.x + offsetX}px, ${offset.y}px)`,
        transition: 'transform 0.1s ease-out',
      }}
    >
      {/* Center */}
      <div style={{ position: 'absolute', left: pixelSize * 2, top: pixelSize * 2, width: pixelSize, height: pixelSize, background: color }} />
      {/* Top */}
      <div style={{ position: 'absolute', left: pixelSize * 2, top: 0, width: pixelSize, height: pixelSize, background: color }} />
      {/* Bottom */}
      <div style={{ position: 'absolute', left: pixelSize * 2, top: pixelSize * 4, width: pixelSize, height: pixelSize, background: color }} />
      {/* Left */}
      <div style={{ position: 'absolute', left: 0, top: pixelSize * 2, width: pixelSize, height: pixelSize, background: color }} />
      {/* Right */}
      <div style={{ position: 'absolute', left: pixelSize * 4, top: pixelSize * 2, width: pixelSize, height: pixelSize, background: color }} />
    </div>
  )

  return (
    <div style={{ display: 'flex', gap, alignItems: 'center' }}>
      <StarEye offsetX={0} />
      <StarEye offsetX={0} />
    </div>
  )
}
