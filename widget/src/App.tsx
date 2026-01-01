import { useState, useEffect } from 'react'
import { LizardsSwarm, LIZARD_SIZE } from './components/LizardsSwarm'
import { AgentProvider } from './context/AgentContext'

interface SavedLizard {
  id: string
  position: { x: number; y: number }
  settings?: { color: string }
}

const DEFAULT_LIZARDS = [
  { id: '1', initialPosition: { x: window.innerWidth - LIZARD_SIZE - 30, y: window.innerHeight - LIZARD_SIZE - 30 } }
]

function App() {
  const [lizards, setLizards] = useState<Array<{ id: string; initialPosition: { x: number; y: number }; settings?: { color: string } }> | null>(null)

  // Load lizards from server on mount
  useEffect(() => {
    fetch('/__gekto/api/lizards')
      .then(res => res.json())
      .then((saved: SavedLizard[]) => {
        if (saved && saved.length > 0) {
          // Convert saved format to initialPosition format, preserving settings
          setLizards(saved.map(l => ({ id: l.id, initialPosition: l.position, settings: l.settings })))
        } else {
          setLizards(DEFAULT_LIZARDS)
        }
      })
      .catch(() => {
        setLizards(DEFAULT_LIZARDS)
      })
  }, [])

  // Don't render until lizards are loaded
  if (!lizards) return null
  console.log('lizards', lizards)
  return (
    <AgentProvider>
      <LizardsSwarm initialLizards={lizards} />
    </AgentProvider>
  )
}

export default App
