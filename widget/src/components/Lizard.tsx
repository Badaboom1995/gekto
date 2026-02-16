import { useEffect, useState, useRef } from 'react'
import { LizardAvatar } from './LizardAvatar'
import { ChatWindow, getChatSize } from './ChatWindow'
import { useDraggable } from '../hooks/useDraggable'
import { useCopyable } from '../hooks/useCopyable'
import { useSwarm } from '../context/SwarmContext'
import { useAgent } from '../context/AgentContext'
import { useStore } from '../store/store'

const LIZARD_SIZE = 90

interface LizardProps {
  agentId: string
}

export function Lizard({ agentId }: LizardProps) {
  const {
    selectedIds,
    activeChatId,
    chatMode,
    addAgent,
    openChat,
    closeChat,
    toggleSelection,
    registerLizard,
    unregisterLizard,
    saveVisuals,
    getVisual,
  } = useSwarm()

  // Get agent from global store
  const agent = useStore((s) => s.agents[agentId])
  const agents = useStore((s) => s.agents)
  const tasks = useStore((s) => s.tasks)
  const isWhiteboardOpen = useStore((s) => s.isWhiteboardOpen)

  // Calculate agent index and name
  const agentIds = Object.keys(agents)
  const agentIndex = agentIds.indexOf(agentId)
  const task = agent ? tasks[agent.taskId] : undefined
  const agentName = task?.name || `Agent ${agentIndex + 1}`

  // Get visual from SwarmContext (local state)
  const visual = getVisual(agentId)
  const color = visual?.color ?? '#BFFF6B'
  const initialPosition = visual?.position ?? { x: 100, y: 100 }

  const { sessions, getLizardState } = useAgent()
  const agentState = sessions.get(agentId)?.state ?? getLizardState(agentId)

  const isSelected = selectedIds.has(agentId)
  const isChatOpen = activeChatId === agentId

  const [chatSize, setChatSize] = useState(getChatSize)
  const [showDone, setShowDone] = useState(false)
  const prevStateRef = useRef(agentState)

  // Show done icon when agent finishes
  useEffect(() => {
    if (prevStateRef.current === 'working' && agentState === 'ready') {
      setShowDone(true)
    }
    prevStateRef.current = agentState
  }, [agentState])

  // Clear done badge when chat is opened
  useEffect(() => {
    if (isChatOpen && showDone) {
      setShowDone(false)
    }
  }, [isChatOpen, showDone])

  const { isCopying, copyOrigin, startCopy, endCopy } = useCopyable({
    onCopy: addAgent,
  })

  const { ref, position, setPosition, isDragging, hasMoved, handlers } = useDraggable({
    initialPosition,
    onDragStart: (pos, isAltKey) => {
      if (isAltKey) {
        startCopy(pos)
      }
    },
    onDragEnd: (pos, moved, isAltKey) => {
      if (isAltKey && moved && copyOrigin) {
        endCopy(true, pos)
        setPosition(copyOrigin)
      } else {
        endCopy(false)
        if (moved) {
          saveVisuals()
        }
      }
    },
  })

  // Register position for selection and arrangement
  const positionRef = useRef(position)

  useEffect(() => {
    positionRef.current = position
  }, [position])

  useEffect(() => {
    const getPosition = () => positionRef.current
    registerLizard(agentId, getPosition, setPosition, LIZARD_SIZE)
    return () => unregisterLizard(agentId)
  }, [agentId, registerLizard, unregisterLizard, setPosition])

  const handleClick = (e: React.MouseEvent) => {
    if (!hasMoved()) {
      if (e.shiftKey) {
        toggleSelection(agentId, true)
        return
      }
      openChat(agentId, 'task')
    }
  }

  if (!agent) return null

  // Hide when whiteboard is open (default to false if undefined during hydration)
  if (isWhiteboardOpen === true) return null

  return (
    <>
      {/* Original lizard at copy origin */}
      {isCopying && copyOrigin && (
        <div
          className="fixed pointer-events-none"
          style={{
            left: copyOrigin.x,
            top: copyOrigin.y,
            zIndex: 1000,
          }}
        >
          <LizardAvatar size={LIZARD_SIZE} followMouse={false} color={color} />
        </div>
      )}

      {/* Main lizard */}
      <div
        ref={ref}
        data-selectable
        className={`fixed cursor-pointer hover:scale-110 ${isDragging ? 'cursor-grabbing' : 'cursor-grab'}`}
        style={{
          left: position.x,
          top: position.y,
          zIndex: isCopying ? 1001 : 1000,
          pointerEvents: 'auto',
          opacity: isCopying ? 0.4 : 1,
          transition: isDragging ? 'transform 0.2s ease-out' : 'left 0.4s ease-out, top 0.4s ease-out, transform 0.2s ease-out, filter 0.2s ease-out',
          filter: isSelected ? 'brightness(1.4) drop-shadow(0 0 12px rgba(100, 200, 255, 0.8))' : 'none',
        }}
        onMouseDown={handlers.onMouseDown}
        onClick={handleClick}
      >
        <LizardAvatar size={LIZARD_SIZE} color={color} isSpinning={agentState === 'working'} disableMouseFollow={showDone} />

        {/* Name label - to the left of avatar, vertically centered */}
        <div
          className="absolute whitespace-nowrap pointer-events-none"
          style={{
            right: '100%',
            top: '50%',
            transform: 'translateY(-50%)',
            marginRight: 8,
            fontSize: 12,
            fontWeight: 600,
            color: '#9ca3af',
            textShadow: '0 1px 3px rgba(0, 0, 0, 0.5)',
          }}
        >
          {agentName}
        </div>
      </div>

      {/* Chat Window */}
      {isChatOpen && (
        <div
          className="fixed"
          data-swarm-ui
          style={{
            left: position.x - chatSize.width - 20,
            top: position.y + LIZARD_SIZE - chatSize.height,
            zIndex: 1002,
            pointerEvents: 'auto',
          }}
        >
          <ChatWindow
            lizardId={agentId}
            title={chatMode === 'plan' ? 'Plan Mode' : 'Gekto Chat'}
            onClose={closeChat}
            onResize={setChatSize}
          />
        </div>
      )}
    </>
  )
}

export { LIZARD_SIZE }
