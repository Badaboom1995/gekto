import * as React from 'react'
import {
  ShapeUtil,
  Rectangle2d,
  HTMLContainer,
  resizeBox,
  T,
} from 'tldraw'
import type { TLBaseShape, TLResizeInfo } from 'tldraw'

// Route a URL through the local proxy to strip X-Frame-Options/CSP headers
function proxyUrl(url: string): string {
  if (!url) return ''
  // Don't double-proxy
  if (url.includes('/__gekto/iframe-proxy/')) return url
  // Only proxy http/https URLs
  if (!/^https?:\/\//i.test(url)) return url
  return `/__gekto/iframe-proxy/${url}`
}

// Define the shape type
export type IframeShape = TLBaseShape<
  'iframe',
  {
    w: number
    h: number
    url: string
  }
>

// Props validator for tldraw
const iframeShapeProps = {
  w: T.number,
  h: T.number,
  url: T.string,
}

export class IframeShapeUtil extends ShapeUtil<any> {
  static override type = 'iframe' as const
  static override props = iframeShapeProps

  getDefaultProps(): IframeShape['props'] {
    return {
      w: 800,
      h: 600,
      url: 'https://claude.ai',
    }
  }

  getGeometry(shape: IframeShape) {
    return new Rectangle2d({
      width: shape.props.w,
      height: shape.props.h,
      isFilled: true,
    })
  }

  canResize() {
    return true
  }

  canEdit() {
    return true
  }

  override onResize(shape: IframeShape, info: TLResizeInfo<any>) {
    return resizeBox(shape as any, info as any)
  }

  component(shape: IframeShape) {
    const { w, h, url } = shape.props
    const [urlInput, setUrlInput] = React.useState(url)
    const [interactive, setInteractive] = React.useState(false)

    // Sync input when prop changes externally
    React.useEffect(() => {
      setUrlInput(url)
    }, [url])

    const handleNavigate = () => {
      let finalUrl = urlInput.trim()
      if (!finalUrl) return
      if (!/^https?:\/\//i.test(finalUrl)) {
        finalUrl = 'https://' + finalUrl
      }
      if (finalUrl !== url) {
        this.editor.updateShape<any>({
          id: shape.id,
          type: 'iframe',
          props: { url: finalUrl },
        })
      }
    }

    const handleKeyDown = (e: React.KeyboardEvent) => {
      e.stopPropagation()
      if (e.key === 'Enter') {
        handleNavigate()
      }
    }

    return (
      <HTMLContainer
        style={{
          width: w,
          height: h,
          pointerEvents: 'all',
        }}
      >
        <div
          style={{
            width: '100%',
            height: '100%',
            background: '#1e1e1e',
            border: interactive ? '2px solid #3b82f6' : '1px solid #3a3a3a',
            borderRadius: 8,
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
            boxShadow: interactive
              ? '0 0 0 1px #3b82f6, 0 2px 8px rgba(59,130,246,0.3)'
              : '0 2px 8px rgba(0,0,0,0.4)',
            fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
          }}
        >
          {/* URL bar — always interactive, also serves as drag handle */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              padding: '6px 8px',
              background: '#2a2a2a',
              borderBottom: '1px solid #3a3a3a',
            }}
          >
            {/* Globe icon */}
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#888"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              style={{ flexShrink: 0 }}
            >
              <circle cx="12" cy="12" r="10" />
              <line x1="2" y1="12" x2="22" y2="12" />
              <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
            </svg>
            <input
              value={urlInput}
              onChange={(e) => setUrlInput(e.target.value)}
              onBlur={handleNavigate}
              onKeyDown={handleKeyDown}
              onPointerDown={(e) => e.stopPropagation()}
              onClick={(e) => e.stopPropagation()}
              placeholder="Enter URL..."
              style={{
                flex: 1,
                fontSize: 12,
                color: '#e5e5e5',
                background: '#1a1a1a',
                border: '1px solid #444',
                borderRadius: 4,
                padding: '4px 8px',
                outline: 'none',
                fontFamily: 'ui-monospace, monospace',
                minWidth: 0,
              }}
            />
            <div
              onPointerDown={(e) => {
                e.stopPropagation()
                e.preventDefault()
                handleNavigate()
              }}
              style={{
                padding: '4px 10px',
                borderRadius: 4,
                background: '#3b82f6',
                color: '#fff',
                fontSize: 11,
                fontWeight: 500,
                cursor: 'pointer',
                flexShrink: 0,
                userSelect: 'none',
              }}
            >
              Go
            </div>
            {/* Interactive mode toggle */}
            <div
              onPointerDown={(e) => {
                e.stopPropagation()
                e.preventDefault()
                setInteractive(!interactive)
              }}
              title={interactive ? 'Lock (switch to move mode)' : 'Unlock (interact with page)'}
              style={{
                padding: '3px 6px',
                borderRadius: 4,
                background: interactive ? '#3b82f630' : '#ffffff10',
                color: interactive ? '#3b82f6' : '#888',
                cursor: 'pointer',
                flexShrink: 0,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                userSelect: 'none',
                transition: 'all 0.15s ease',
              }}
            >
              {interactive ? (
                // Unlocked icon
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                  <path d="M7 11V7a5 5 0 0 1 9.9-1" />
                </svg>
              ) : (
                // Locked icon
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                  <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                </svg>
              )}
            </div>
          </div>

          {/* Iframe content */}
          <div style={{ flex: 1, position: 'relative' }}>
            {url ? (
              <iframe
                src={proxyUrl(url)}
                style={{
                  width: '100%',
                  height: '100%',
                  border: 'none',
                  background: '#fff',
                }}
                allow="clipboard-read; clipboard-write"
              />
            ) : (
              <div
                style={{
                  width: '100%',
                  height: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#666',
                  fontSize: 14,
                }}
              >
                Enter a URL above to load content
              </div>
            )}
            {/* Overlay blocks iframe interaction when locked — allows drag/select */}
            {!interactive && (
              <div
                style={{
                  position: 'absolute',
                  inset: 0,
                  cursor: 'grab',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  background: 'rgba(0,0,0,0.03)',
                }}
              >
                <span
                  style={{
                    background: 'rgba(0,0,0,0.6)',
                    color: '#fff',
                    padding: '6px 14px',
                    borderRadius: 6,
                    fontSize: 12,
                    fontWeight: 500,
                    opacity: 0.8,
                    pointerEvents: 'none',
                  }}
                >
                  Click the lock icon to interact
                </span>
              </div>
            )}
          </div>
        </div>
      </HTMLContainer>
    )
  }

  indicator(shape: IframeShape) {
    return (
      <rect
        width={shape.props.w}
        height={shape.props.h}
        rx={8}
        ry={8}
      />
    )
  }
}
