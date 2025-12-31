import { LizardsSwarm, LIZARD_SIZE } from './components/LizardsSwarm'
import { XTerminal } from './components/XTerminal'
import { useDraggable } from './hooks/useDraggable'

const TERMINAL_WIDTH = 700
const TERMINAL_HEIGHT = 400

function App() {
  const initialLizards = [
    { id: '1', initialPosition: { x: window.innerWidth - LIZARD_SIZE - 30, y: window.innerHeight - LIZARD_SIZE - 30 } }
  ]
  
  const { ref, position, isDragging, handlers } = useDraggable({
    initialPosition: {
      x: (window.innerWidth - TERMINAL_WIDTH) / 2,
      y: window.innerHeight - TERMINAL_HEIGHT - 24,
    },
  })

  return (
    <>
      <LizardsSwarm initialLizards={initialLizards} />
      <div
        ref={ref}
        data-swarm-ui
        style={{
          position: 'fixed',
          left: position.x,
          top: position.y,
          zIndex: 900,
        }}
      > 
        {/* <XTerminal
          width={TERMINAL_WIDTH}
          height={TERMINAL_HEIGHT}
          onTitleBarMouseDown={handlers.onMouseDown}
          isDragging={isDragging}
        /> */}
     </div>
    </>
  )
}

export default App
