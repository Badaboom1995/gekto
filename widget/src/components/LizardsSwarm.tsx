import { SwarmProvider, useSwarm, useSelectionRect, type LizardData, type LizardSettings } from '../context/SwarmContext'
import { OrderableContainer } from '../hooks/useOrderable'
import { SelectionOverlay } from './SelectionOverlay'
import { Lizard, LIZARD_SIZE } from './Lizard'

interface LizardsSwarmProps {
  initialLizards: LizardData[]
  settings?: LizardSettings
}

// Separate component so rect changes don't re-render lizards
function SelectionRectOverlay() {
  const rect = useSelectionRect()
  return <SelectionOverlay rect={rect} />
}

function LizardsList() {
  const { lizards, saveLizards } = useSwarm()

  return (
    <OrderableContainer
      hotkey="ArrowRight"
      arrangement="grid"
      corner="bottom-right"
      gap={-30}
      onArrange={saveLizards}
    >
      {lizards.map(lizard => (
        <Lizard
          key={lizard.id}
          id={lizard.id}
          initialPosition={lizard.initialPosition}
          settings={lizard.settings}
        />
      ))}
    </OrderableContainer>
  )
}

function SwarmContent() {
  return (
    <>
      <LizardsList />
      <SelectionRectOverlay />
    </>
  )
}

export function LizardsSwarm({ initialLizards, settings }: LizardsSwarmProps) {
  return (
    <SwarmProvider initialLizards={initialLizards} defaultSettings={settings}>
      <SwarmContent />
    </SwarmProvider>
  )
}

export { LIZARD_SIZE }
export type { LizardSettings }
