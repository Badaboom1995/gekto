import { useState, useEffect } from 'react'
import { SwarmProvider, useSwarm, useSelectionRect, type LizardData, type LizardSettings } from '../context/SwarmContext'
import { SelectionOverlay } from './SelectionOverlay'
import { Lizard, LIZARD_SIZE } from './Lizard'
import { MasterLizard } from './MasterLizard'
// import { SOSButton } from './SOSButton'

interface LizardsSwarmProps {
  settings?: LizardSettings
}

interface SavedLizard {
  id: string
  position: { x: number; y: number }
  settings?: { color: string }
}

const DEFAULT_LIZARDS: LizardData[] = [
  { id: '1', initialPosition: { x: window.innerWidth - LIZARD_SIZE - 30, y: window.innerHeight - LIZARD_SIZE - 30 } }
]

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
    <>
      <MasterLizard />
      <LizardsList />
      <SelectionRectOverlay />
      {/* <SOSButton /> */}
    </>
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
