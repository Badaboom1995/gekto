import { RadialMenu } from './RadialMenu'
import { useSwarm } from '../context/SwarmContext'

interface LizardMenuProps {
  lizardId: string
  isVisible: boolean
  size: number
  onHide: () => void
  onShake: () => void
}

export function LizardMenu({ lizardId, isVisible, size, onHide, onShake }: LizardMenuProps) {
  const { lizards, openChat, deleteLizard } = useSwarm()
  const isLastLizard = lizards.length === 1

  const menuItems = [
    {
      id: 'task',
      icon: '💬',
      label: 'Task',
      onClick: () => {
        openChat(lizardId, 'task')
        onHide()
      },
    },
    {
      id: 'plan',
      icon: '📋',
      label: 'Plan',
      onClick: () => {
        openChat(lizardId, 'plan')
        onHide()
      },
    },
    {
      id: 'delete',
      icon: '🗑',
      label: 'Delete',
      separated: true,
      danger: true,
      onClick: () => {
        if (isLastLizard) {
          onHide()
          onShake()
        } else {
          deleteLizard(lizardId)
          onHide()
        }
      },
    },
  ]

  return (
    <RadialMenu
      items={menuItems}
      isVisible={isVisible}
      size={size}
    />
  )
}
