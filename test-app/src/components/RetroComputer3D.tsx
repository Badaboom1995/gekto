import './RetroComputer3D.css'

interface RetroComputer3DProps {
  computerName: string
}

function RetroComputer3D({ computerName }: RetroComputer3DProps) {
  return (
    <div className="retro-computer-container">
      <div className="retro-computer">
        {/* Monitor */}
        <div className="monitor">
          <div className="monitor-body">
            <div className="monitor-face front">
              <div className="screen">
                <div className="screen-content">
                  <div className="screen-text">{computerName}</div>
                  <div className="cursor">_</div>
                </div>
                <div className="scanlines"></div>
              </div>
              <div className="monitor-bezel"></div>
            </div>
            <div className="monitor-face back"></div>
            <div className="monitor-face left"></div>
            <div className="monitor-face right"></div>
            <div className="monitor-face top"></div>
            <div className="monitor-face bottom"></div>
          </div>
        </div>

        {/* Keyboard */}
        <div className="keyboard">
          <div className="keyboard-body">
            <div className="keyboard-face front">
              <div className="keyboard-keys">
                {[...Array(12)].map((_, i) => (
                  <div key={i} className="key"></div>
                ))}
              </div>
              <div className="keyboard-keys">
                {[...Array(10)].map((_, i) => (
                  <div key={i} className="key"></div>
                ))}
              </div>
              <div className="keyboard-keys">
                <div className="key spacebar"></div>
              </div>
            </div>
            <div className="keyboard-face back"></div>
            <div className="keyboard-face left"></div>
            <div className="keyboard-face right"></div>
            <div className="keyboard-face top"></div>
            <div className="keyboard-face bottom"></div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default RetroComputer3D
