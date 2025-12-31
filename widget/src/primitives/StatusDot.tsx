type Status = 'idle' | 'active' | 'loading' | 'error'

interface StatusDotProps {
  status?: Status
  size?: 'sm' | 'md'
  className?: string
}

const statusColors: Record<Status, string> = {
  idle: '#6B7280',
  active: '#22C55E',
  loading: '#F59E0B',
  error: '#EF4444',
}

export function StatusDot({ status = 'active', size = 'md', className = '' }: StatusDotProps) {
  const color = statusColors[status]
  const sizeClass = size === 'sm' ? 'w-2 h-2' : 'w-2.5 h-2.5'

  return (
    <div
      className={`absolute -top-0.5 -right-0.5 rounded-full ${sizeClass} ${className}`}
      style={{
        background: color,
        boxShadow: `0 0 4px ${color}`,
        border: '1.5px solid rgba(255, 255, 255, 0.5)',
      }}
    />
  )
}
