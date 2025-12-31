import { forwardRef, type ReactNode, type CSSProperties } from 'react'

interface GlassContainerProps {
  children: ReactNode
  position?: { x: number; y: number }
  size?: { width: number; height: number }
  color?: string
  rounded?: 'full' | 'lg' | 'md'
  className?: string
  style?: CSSProperties
  active?: boolean
  isDragging?: boolean
  onClick?: (e: React.MouseEvent) => void
  onMouseDown?: (e: React.MouseEvent) => void
}

export const GlassContainer = forwardRef<HTMLDivElement, GlassContainerProps>(
  function GlassContainer(
    {
      children,
      position,
      size,
      color = '#8B5CF6',
      rounded = 'full',
      className = '',
      style = {},
      active = false,
      isDragging = false,
      onClick,
      onMouseDown,
    },
    ref
  ) {
    const roundedClass = {
      full: 'rounded-full',
      lg: 'rounded-2xl',
      md: 'rounded-xl',
    }[rounded]

    return (
      <div
        ref={ref}
        className={`
          fixed flex items-center justify-center
          transition-transform duration-200
          hover:scale-105
          ${roundedClass}
          ${active ? 'ring-4 ring-white/50 scale-105' : ''}
          ${isDragging ? 'cursor-grabbing z-50 scale-110' : 'cursor-grab z-40'}
          ${className}
        `}
        style={{
          left: position ? `${position.x}px` : undefined,
          top: position ? `${position.y}px` : undefined,
          width: size?.width,
          height: size?.height,
          background: `linear-gradient(135deg, ${color}15, ${color}25)`,
          backdropFilter: 'blur(8px) saturate(180%)',
          WebkitBackdropFilter: 'blur(8px) saturate(180%)',
          border: '1px solid rgba(255, 255, 255, 0.18)',
          boxShadow: `
            0 8px 32px 0 rgba(31, 38, 135, 0.37),
            inset 0 1px 0 0 rgba(255, 255, 255, 0.5),
            0 0 0 1px ${color}44
          `,
          ...style,
        }}
        onClick={onClick}
        onMouseDown={onMouseDown}
      >
        {children}
      </div>
    )
  }
)
