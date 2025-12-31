import { SwarmProvider, useSwarm, useSelectionRect, type LizardData } from '../context/SwarmContext'
import { OrderableContainer } from '../hooks/useOrderable'
import { SelectionOverlay } from './SelectionOverlay'
import { Lizard, LIZARD_SIZE } from './Lizard'

interface LizardsSwarmProps {
  initialLizards: LizardData[]
}

// Separate component so rect changes don't re-render lizards
function SelectionRectOverlay() {
  const rect = useSelectionRect()
  return <SelectionOverlay rect={rect} />
}

function LizardsList() {
  const { lizards } = useSwarm()

  return (
    <OrderableContainer hotkey="ArrowRight" arrangement="grid" corner="bottom-right" gap={-30}>
      {lizards.map(lizard => (
        <Lizard
          key={lizard.id}
          id={lizard.id}
          initialPosition={lizard.initialPosition}
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

export function LizardsSwarm({ initialLizards }: LizardsSwarmProps) {
  return (
    <SwarmProvider initialLizards={initialLizards}>
      <SwarmContent />
    </SwarmProvider>
  )
}

export { LIZARD_SIZE }
