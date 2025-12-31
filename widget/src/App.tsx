import { LizardsSwarm, LIZARD_SIZE } from './components/LizardsSwarm'
import { Terminal } from './components/Terminal'

function App() {
  const initialLizards = [
    { id: '1', initialPosition: { x: window.innerWidth - LIZARD_SIZE - 30, y: window.innerHeight - LIZARD_SIZE - 30 } }
  ]

  return (
    <>
      <LizardsSwarm initialLizards={initialLizards} />
      <Terminal />
    </>
  )
}

export default App
