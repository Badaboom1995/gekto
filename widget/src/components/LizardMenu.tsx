import { useRef, useMemo } from 'react'
import { RadialMenu } from './RadialMenu'
import { useSwarm } from '../context/SwarmContext'

function hslToHex(hsl: string): string {
  const match = hsl.match(/hsl\((\d+),\s*(\d+)%,\s*(\d+)%\)/)
  if (!match) return hsl // Already hex or invalid

  const h = parseInt(match[1]) / 360
  const s = parseInt(match[2]) / 100
  const l = parseInt(match[3]) / 100

  const hue2rgb = (p: number, q: number, t: number) => {
    if (t < 0) t += 1
    if (t > 1) t -= 1
    if (t < 1/6) return p + (q - p) * 6 * t
    if (t < 1/2) return q
    if (t < 2/3) return p + (q - p) * (2/3 - t) * 6
    return p
  }

  let r, g, b
  if (s === 0) {
    r = g = b = l
  } else {
    const q = l < 0.5 ? l * (1 + s) : l + s - l * s
    const p = 2 * l - q
    r = hue2rgb(p, q, h + 1/3)
    g = hue2rgb(p, q, h)
    b = hue2rgb(p, q, h - 1/3)
  }

  const toHex = (c: number) => Math.round(c * 255).toString(16).padStart(2, '0')
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`
}

interface LizardMenuProps {
  lizardId: string
  isVisible: boolean
  size: number
  onHide: () => void
  onShake: () => void
}

export function LizardMenu({ lizardId, isVisible, size, onHide, onShake }: LizardMenuProps) {
  const { lizards, deleteLizard, updateLizardColor, saveLizards } = useSwarm()
  const isLastLizard = lizards.length === 1
  const colorInputRef = useRef<HTMLInputElement>(null)

  const currentLizard = lizards.find(l => l.id === lizardId)
  const currentColor = currentLizard?.settings?.color ?? '#BFFF6B'
  const hexColor = useMemo(() => hslToHex(currentColor), [currentColor])

  const menuItems = [
    {
      id: 'color',
      icon: '🎨',
      label: 'Color',
      onClick: () => {
        colorInputRef.current?.click()
      },
    },
    {
      id: 'delete',
      icon: '🗑',
      label: 'Delete',
      separated: true,
      danger: true,
      onClick: () => {
        if (isLastLizard) {
          onHide()
          onShake()
        } else {
          deleteLizard(lizardId)
          onHide()
        }
      },
    },
  ]

  const handleColorChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    updateLizardColor(lizardId, e.target.value)
    saveLizards()
  }

  return (
    <div data-radial-menu>
      <input
        ref={colorInputRef}
        type="color"
        value={hexColor}
        onChange={handleColorChange}
        style={{ position: 'absolute', opacity: 0, pointerEvents: 'none' }}
      />
      <RadialMenu
        items={menuItems}
        isVisible={isVisible}
        size={size}
      />
    </div>
  )
}
