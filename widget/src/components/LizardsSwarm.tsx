import { useState, useEffect, useCallback } from 'react'
import { SwarmProvider, useSwarm, useSelectionRect, type LizardData, type LizardSettings } from '../context/SwarmContext'
import { GektoProvider } from '../context/GektoContext'
import { SelectionOverlay } from './SelectionOverlay'
import { Lizard, LIZARD_SIZE } from './Lizard'
import { MasterLizard } from './MasterLizard'
// import { SOSButton } from './SOSButton'

// Test button component for debugging task flow through the plan system
function TestButton() {
  const [isRunning, setIsRunning] = useState(false)

  const handleTestSpawn = useCallback(() => {
    if (isRunning) return
    setIsRunning(true)

    // Create unique IDs
    const taskId = `test_${Date.now()}`
    const planId = `plan_${taskId}`

    // Use the gekto message handler to create the plan
    const handler = (window as unknown as { __gektoMessageHandler?: (msg: unknown) => void }).__gektoMessageHandler
    
    if (!handler) {
      setIsRunning(false)
      return
    }

    // Create plan with 3 lightweight test tasks
    const plan = {
      id: planId,
      status: 'ready',
      originalPrompt: 'Test: spawn 3 agents with lightweight tasks',
      tasks: [
        {
          id: `${taskId}_1`,
          description: 'Agent 1: Say hello',
          prompt: 'Say "Hello from Agent 1!" and nothing else.',
          files: [],
          status: 'pending',
          dependencies: [],
        },
        {
          id: `${taskId}_2`,
          description: 'Agent 2: Count to 3',
          prompt: 'Count from 1 to 3, one number per line.',
          files: [],
          status: 'pending',
          dependencies: [],
        },
        {
          id: `${taskId}_3`,
          description: 'Agent 3: Say goodbye',
          prompt: 'Say "Goodbye from Agent 3!" and nothing else.',
          files: [],
          status: 'pending',
          dependencies: [],
        },
      ],
      createdAt: new Date().toISOString(),
    }

    // Send same message format as server does
    handler({ type: 'plan_created', planId, plan })
    setIsRunning(false)
  }, [isRunning])

  return (
    <button
      onClick={handleTestSpawn}
      disabled={isRunning}
      style={{
        position: 'fixed',
        top: 20,
        left: 20,
        zIndex: 9999,
        padding: '8px 16px',
        background: isRunning ? 'rgba(100, 100, 100, 0.8)' : 'rgba(255, 107, 107, 0.8)',
        color: 'white',
        border: 'none',
        borderRadius: 8,
        cursor: isRunning ? 'wait' : 'pointer',
        fontSize: 12,
        fontWeight: 600,
        boxShadow: '0 2px 10px rgba(0,0,0,0.3)',
      }}
    >
      {isRunning ? 'Running...' : '🧪 Test'}
    </button>
  )
}

interface LizardsSwarmProps {
  settings?: LizardSettings
}

interface SavedLizard {
  id: string
  position: { x: number; y: number }
  settings?: { color: string }
}

const DEFAULT_LIZARDS: LizardData[] = []

function SelectionRectOverlay() {
  const rect = useSelectionRect()
  return <SelectionOverlay rect={rect} />
}

function LizardsList() {
  const { lizards } = useSwarm()

  return (
    <>
      {lizards.map(lizard => (
        <Lizard
          key={lizard.id}
          id={lizard.id}
          initialPosition={lizard.initialPosition}
          settings={lizard.settings}
        />
      ))}
    </>
  )
}

function SwarmContent() {
  return (
    <GektoProvider>
      {/* <TestButton /> */}
      <MasterLizard />
      <LizardsList />
      <SelectionRectOverlay />
      {/* <SOSButton /> */}
    </GektoProvider>
  )
}

export function LizardsSwarm({ settings }: LizardsSwarmProps) {
  const [lizards, setLizards] = useState<LizardData[] | null>(null)

  useEffect(() => {
    fetch('/__gekto/api/lizards')
      .then(res => res.json())
      .then((saved: SavedLizard[]) => {
        if (saved && saved.length > 0) {
          setLizards(saved.map(l => ({ id: l.id, initialPosition: l.position, settings: l.settings })))
        } else {
          setLizards(DEFAULT_LIZARDS)
        }
      })
      .catch(() => {
        setLizards(DEFAULT_LIZARDS)
      })
  }, [])

  if (!lizards) return null

  return (
    <SwarmProvider initialLizards={lizards} defaultSettings={settings}>
      <SwarmContent />
    </SwarmProvider>
  )
}

export { LIZARD_SIZE }
export type { LizardSettings }
