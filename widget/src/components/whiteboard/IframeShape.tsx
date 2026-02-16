import * as React from 'react'
import {
  ShapeUtil,
  Rectangle2d,
  HTMLContainer,
  resizeBox,
  T,
} from 'tldraw'
import type { TLBaseShape, TLResizeInfo } from 'tldraw'

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
    const isEditing = this.editor.getEditingShapeId() === shape.id
    const [urlInput, setUrlInput] = React.useState(url)

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
            border: '1px solid #3a3a3a',
            borderRadius: 8,
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
            boxShadow: '0 2px 8px rgba(0,0,0,0.4)',
            fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
          }}
        >
          {/* URL bar */}
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
          </div>

          {/* Iframe content */}
          <div style={{ flex: 1, position: 'relative' }}>
            {url ? (
              <iframe
                src={url}
                style={{
                  width: '100%',
                  height: '100%',
                  border: 'none',
                  background: '#fff',
                }}
                sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-popups-to-escape-sandbox allow-storage-access-by-user-activation"
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
            {/* Overlay to allow dragging/selecting shape when not editing */}
            {!isEditing && (
              <div
                style={{
                  position: 'absolute',
                  inset: 0,
                  cursor: 'grab',
                }}
              />
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
