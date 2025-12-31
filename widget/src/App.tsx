import { useState, useCallback, useEffect } from 'react'
import { Lizard, LIZARD_SIZE } from './components/Lizard'
import { Terminal } from './components/Terminal'
import { OrderableContainer } from './hooks/useOrderable'
import { useSelectableContainer } from './hooks/useSelectable'
import { SelectionOverlay } from './components/SelectionOverlay'

type ChatMode = 'task' | 'plan'

interface LizardData {
  id: string
  initialPosition: { x: number; y: number }
}

interface OpenChat {
  lizardId: string
  mode: ChatMode
}

function App() {
  const [lizards, setLizards] = useState<LizardData[]>([
    { id: '1', initialPosition: { x: window.innerWidth - LIZARD_SIZE - 30, y: window.innerHeight - LIZARD_SIZE - 30 } }
  ])
  const [openChat, setOpenChat] = useState<OpenChat | null>(null)
  const [isTerminalOpen, setIsTerminalOpen] = useState(true)

  const handleCloseChat = useCallback(() => {
    setOpenChat(null)
  }, [])

  const {
    selectedIds,
    selectionRect,
    toggleSelection,
    clearSelection,
    registerItem,
    unregisterItem,
  } = useSelectableContainer({
    onClickOutside: handleCloseChat,
  })

  const handleCopy = useCallback((position: { x: number; y: number }) => {
    setLizards(prev => [
      ...prev,
      {
        id: Date.now().toString(),
        initialPosition: position
      }
    ])
  }, [])

  const handleOpenChat = useCallback((id: string, mode: ChatMode) => {
    setOpenChat({ lizardId: id, mode })
  }, [])

  const handleDelete = useCallback((id: string) => {
    setLizards(prev => prev.filter(l => l.id !== id))
    if (openChat?.lizardId === id) {
      setOpenChat(null)
    }
  }, [openChat])

  const handleRegisterPosition = useCallback((id: string, getPosition: () => { x: number; y: number }, size: number) => {
    registerItem({ id, getPosition, size })
  }, [registerItem])

  const handleUnregisterPosition = useCallback((id: string) => {
    unregisterItem(id)
  }, [unregisterItem])

  // Delete selected lizards on Backspace
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Backspace' && selectedIds.size > 0) {
        // Don't delete if it would remove all lizards
        const remainingCount = lizards.length - selectedIds.size
        if (remainingCount < 1) {
          // Keep at least one lizard - delete all but the first selected
          const idsToDelete = Array.from(selectedIds).slice(0, selectedIds.size - 1)
          if (idsToDelete.length === 0) return
          setLizards(prev => prev.filter(l => !idsToDelete.includes(l.id)))
          if (openChat && idsToDelete.includes(openChat.lizardId)) {
            setOpenChat(null)
          }
        } else {
          setLizards(prev => prev.filter(l => !selectedIds.has(l.id)))
          if (openChat && selectedIds.has(openChat.lizardId)) {
            setOpenChat(null)
          }
        }
        clearSelection()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [selectedIds, lizards.length, openChat, clearSelection])

  return (
    <>
      <OrderableContainer hotkey="ArrowRight" arrangement="grid" corner="bottom-right" gap={-30}>
        {lizards.map(lizard => (
          <Lizard
            key={lizard.id}
            id={lizard.id}
            initialPosition={lizard.initialPosition}
            isChatOpen={openChat?.lizardId === lizard.id}
            chatMode={openChat?.lizardId === lizard.id ? openChat.mode : 'task'}
            isLastLizard={lizards.length === 1}
            isSelected={selectedIds.has(lizard.id)}
            onCopy={handleCopy}
            onOpenChat={handleOpenChat}
            onCloseChat={handleCloseChat}
            onDelete={handleDelete}
            onToggleSelection={toggleSelection}
            onRegisterPosition={handleRegisterPosition}
            onUnregisterPosition={handleUnregisterPosition}
          />
        ))}
      </OrderableContainer>
      <SelectionOverlay rect={selectionRect} />
      <Terminal isVisible={isTerminalOpen} onClose={() => setIsTerminalOpen(false)} />
    </>
  )
}

export default App