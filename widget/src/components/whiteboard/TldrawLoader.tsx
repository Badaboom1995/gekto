import { Suspense, lazy } from 'react'

// Lazy load tldraw - Vite will code-split this into a separate chunk
const Tldraw = lazy(() =>
  import('tldraw').then(mod => {
    // Dynamically inject CSS when tldraw loads
    import('tldraw/tldraw.css')
    return { default: mod.Tldraw }
  })
)

// Loading skeleton
function WhiteboardSkeleton() {
  return (
    <div className="absolute inset-0 bg-zinc-900 flex flex-col items-center justify-center gap-4">
      <div className="relative w-16 h-16">
        <div className="absolute inset-0 rounded-full border-4 border-zinc-700" />
        <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-emerald-500 animate-spin" />
      </div>
      <div className="text-zinc-400 text-sm font-medium">Loading Whiteboard...</div>
      <div className="flex gap-1 mt-2">
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className="w-2 h-2 rounded-full bg-emerald-500 animate-bounce"
            style={{ animationDelay: `${i * 0.15}s` }}
          />
        ))}
      </div>
    </div>
  )
}

interface TldrawLoaderProps {
  onClose?: () => void
  persistenceKey?: string
}

export function TldrawLoader({ onClose, persistenceKey = 'gekto-whiteboard' }: TldrawLoaderProps) {
  return (
    <div style={{ position: 'relative', width: '100%', height: '100%', background: '#18181b' }}>
      {/* Close button */}
      {onClose && (
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-50 p-2 rounded-lg bg-zinc-800/80 hover:bg-zinc-700 text-zinc-300 hover:text-white transition-colors backdrop-blur-sm border border-zinc-700"
          title="Close whiteboard"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>
      )}

      {/* Tldraw canvas */}
      <Suspense fallback={<WhiteboardSkeleton />}>
        <TldrawCanvas persistenceKey={persistenceKey} />
      </Suspense>
    </div>
  )
}

// Separate component to handle the actual tldraw instance
function TldrawCanvas({ persistenceKey }: { persistenceKey: string }) {
  return (
    <div style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }}>
      <Tldraw persistenceKey={persistenceKey} />
    </div>
  )
}

export default TldrawLoader
