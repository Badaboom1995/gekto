import { useState } from 'react'
import { ChatBubbleIcon, ChevronDownIcon, ChevronUpIcon } from '@radix-ui/react-icons'
import { useGekto, type Task, type TaskStatus } from '../context/GektoContext'

interface GektoPlanPanelProps {
  position: { x: number; y: number }
  onClose: () => void
}

function TaskStatusIcon({ status }: { status: TaskStatus }) {
  switch (status) {
    case 'pending':
      return <span className="text-gray-400">○</span>
    case 'in_progress':
      // Pulsing empty circle for in-progress tasks
      return <span className="text-blue-400 animate-pulse">○</span>
    case 'pending_testing':
      return <span className="text-yellow-400">◎</span>
    case 'completed':
      return <span className="text-green-400">✓</span>
    case 'failed':
      return <span className="text-red-400">✗</span>
  }
}

interface TaskRowProps {
  task: Task
  onMarkResolved?: (taskId: string) => void
  onRetry?: (taskId: string) => void
}

function TaskRow({ task, onMarkResolved, onRetry }: TaskRowProps) {
  const [isDescriptionExpanded, setIsDescriptionExpanded] = useState(false)
  const [isPromptVisible, setIsPromptVisible] = useState(false)
  const [isRemoving, setIsRemoving] = useState(false)

  const handleMarkResolved = () => {
    setIsRemoving(true)
    // Wait for animation to complete before actually removing
    setTimeout(() => {
      onMarkResolved?.(task.id)
    }, 300)
  }

  const getBackgroundStyle = () => {
    switch (task.status) {
      case 'in_progress':
        return { bg: 'rgba(59, 130, 246, 0.1)', border: '1px solid rgba(59, 130, 246, 0.3)' }
      case 'pending_testing':
        return { bg: 'rgba(234, 179, 8, 0.1)', border: '1px solid rgba(234, 179, 8, 0.3)' }
      case 'completed':
        return { bg: 'rgba(34, 197, 94, 0.05)', border: '1px solid rgba(255, 255, 255, 0.05)' }
      case 'failed':
        return { bg: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.3)' }
      default:
        return { bg: 'rgba(255, 255, 255, 0.02)', border: '1px solid rgba(255, 255, 255, 0.05)' }
    }
  }

  const style = getBackgroundStyle()

  // Split description into lines and check if truncation needed
  const descriptionLines = task.description.split('\n')
  const needsTruncation = descriptionLines.length > 2
  const truncatedDescription = needsTruncation && !isDescriptionExpanded
    ? descriptionLines.slice(0, 2).join('\n') + '...'
    : task.description

  return (
    <div
      className="flex items-start gap-3 p-3 rounded-lg transition-all duration-300"
      style={{
        background: style.bg,
        border: style.border,
        opacity: isRemoving ? 0 : 1,
        transform: isRemoving ? 'translateX(20px) scale(0.95)' : 'translateX(0) scale(1)',
        maxHeight: isRemoving ? 0 : 500,
        marginBottom: isRemoving ? 0 : undefined,
        padding: isRemoving ? 0 : undefined,
        overflow: 'hidden',
      }}
    >
      <div className="mt-0.5">
        <TaskStatusIcon status={task.status} />
      </div>
      <div className="flex-1 min-w-0">
        {/* Description - truncated to 2 lines, expandable */}
        <div className="mb-1">
          <div
            className="text-white text-sm font-medium whitespace-pre-wrap"
            style={{ wordBreak: 'break-word' }}
          >
            {truncatedDescription}
          </div>
          {needsTruncation && (
            <button
              onClick={() => setIsDescriptionExpanded(!isDescriptionExpanded)}
              className="flex items-center gap-1 mt-1 text-xs text-white/50 hover:text-white/70 transition-colors"
            >
              {isDescriptionExpanded ? (
                <>
                  <ChevronUpIcon width={12} height={12} />
                  <span>Show less</span>
                </>
              ) : (
                <>
                  <ChevronDownIcon width={12} height={12} />
                  <span>Show more</span>
                </>
              )}
            </button>
          )}
        </div>

        {/* Prompt button - elegant icon button */}
        {task.prompt && task.prompt !== task.description && (
          <div className="mt-2">
            <button
              onClick={() => setIsPromptVisible(!isPromptVisible)}
              className="flex items-center gap-1.5 px-2 py-1 rounded-md text-xs transition-all"
              style={{
                background: isPromptVisible ? 'rgba(168, 85, 247, 0.2)' : 'rgba(255, 255, 255, 0.05)',
                color: isPromptVisible ? 'rgb(192, 132, 252)' : 'rgba(255, 255, 255, 0.5)',
                border: isPromptVisible ? '1px solid rgba(168, 85, 247, 0.3)' : '1px solid rgba(255, 255, 255, 0.1)',
              }}
            >
              <ChatBubbleIcon width={12} height={12} />
              <span>Agent Prompt</span>
              {isPromptVisible ? (
                <ChevronUpIcon width={12} height={12} />
              ) : (
                <ChevronDownIcon width={12} height={12} />
              )}
            </button>

            {/* Prompt content */}
            {isPromptVisible && (
              <div
                className="mt-2 p-2 rounded-md text-xs text-white/70 whitespace-pre-wrap"
                style={{
                  background: 'rgba(0, 0, 0, 0.2)',
                  border: '1px solid rgba(168, 85, 247, 0.2)',
                  maxHeight: 200,
                  overflowY: 'auto',
                  wordBreak: 'break-word',
                }}
              >
                {task.prompt}
              </div>
            )}
          </div>
        )}

        {task.files.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-2">
            {task.files.map((file, i) => (
              <span
                key={i}
                className="text-xs px-1.5 py-0.5 rounded font-mono"
                style={{
                  background: 'rgba(255, 255, 255, 0.1)',
                  color: 'rgba(255, 255, 255, 0.7)',
                }}
              >
                {file.split('/').pop()}
              </span>
            ))}
          </div>
        )}
        {task.assignedLizardId && (
          <div className="text-xs text-white/40 mt-1">
            Agent: {task.assignedLizardId}
          </div>
        )}
        {task.error && (
          <div className="text-xs text-red-400 mt-1">
            {task.error}
          </div>
        )}

        {/* Action buttons for pending_testing status */}
        {task.status === 'pending_testing' && !isRemoving && (
          <div className="flex gap-2 mt-2">
            <button
              onClick={handleMarkResolved}
              className="px-2 py-1 text-xs rounded transition-colors"
              style={{
                background: 'rgba(34, 197, 94, 0.2)',
                color: 'rgb(74, 222, 128)',
                border: '1px solid rgba(34, 197, 94, 0.3)',
              }}
            >
              Mark Resolved
            </button>
            <button
              onClick={() => onRetry?.(task.id)}
              className="px-2 py-1 text-xs rounded transition-colors"
              style={{
                background: 'rgba(239, 68, 68, 0.2)',
                color: 'rgb(248, 113, 113)',
                border: '1px solid rgba(239, 68, 68, 0.3)',
              }}
            >
              Retry
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

export function GektoPlanPanel({ position, onClose }: GektoPlanPanelProps) {
  const { currentPlan, executePlan, cancelPlan, markTaskResolved, retryTask } = useGekto()
  if (!currentPlan) return null

  const completedCount = currentPlan.tasks.filter(t => t.status === 'completed').length
  const pendingTestingCount = currentPlan.tasks.filter(t => t.status === 'pending_testing').length
  const totalCount = currentPlan.tasks.length
  const progress = totalCount > 0 ? (completedCount / totalCount) * 100 : 0

  return (
    <div
      className="fixed"
      data-swarm-ui
      style={{
        left: position.x,
        top: position.y,
        zIndex: 1003,
        width: 400,
        maxHeight: 600,
      }}
    >
      <div
        className="flex flex-col rounded-2xl overflow-hidden"
        style={{
          background: 'linear-gradient(135deg, rgb(35, 35, 45), rgb(45, 45, 55))',
          backdropFilter: 'blur(12px) saturate(180%)',
          WebkitBackdropFilter: 'blur(12px) saturate(180%)',
          border: '1px solid rgba(255, 255, 255, 0.18)',
          boxShadow: '0 8px 32px 0 rgba(31, 38, 135, 0.37)',
        }}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between px-4 py-3"
          style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.1)' }}
        >
          <div className="flex items-center gap-2">
            <span className="text-white font-medium text-sm">Execution Plan</span>
            {currentPlan.status === 'planning' && (
              <span className="text-xs px-2 py-0.5 rounded bg-yellow-500/20 text-yellow-400">
                Planning...
              </span>
            )}
            {currentPlan.status === 'ready' && (
              <span className="text-xs px-2 py-0.5 rounded bg-blue-500/20 text-blue-400">
                Ready
              </span>
            )}
            {currentPlan.status === 'executing' && (
              <span className="text-xs px-2 py-0.5 rounded bg-green-500/20 text-green-400">
                Executing
              </span>
            )}
            {currentPlan.status === 'completed' && (
              <span className="text-xs px-2 py-0.5 rounded bg-green-500/20 text-green-400">
                Completed
              </span>
            )}
            {currentPlan.status === 'failed' && (
              <span className="text-xs px-2 py-0.5 rounded bg-red-500/20 text-red-400">
                Failed
              </span>
            )}
          </div>
          <button
            onClick={onClose}
            className="text-white/60 hover:text-white transition-colors w-6 h-6 flex items-center justify-center rounded hover:bg-white/10"
          >
            ✕
          </button>
        </div>

        {/* Original prompt */}
        <div
          className="px-4 py-2 text-xs text-white/60"
          style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.05)' }}
        >
          <span className="text-white/40">Prompt: </span>
          {currentPlan.originalPrompt.length > 100
            ? currentPlan.originalPrompt.slice(0, 100) + '...'
            : currentPlan.originalPrompt}
        </div>

        {/* Progress bar */}
        {currentPlan.status === 'executing' && (
          <div className="px-4 py-2">
            <div className="flex items-center gap-2 text-xs text-white/60 mb-1">
              <span>Progress</span>
              <span>{completedCount}/{totalCount}</span>
              {pendingTestingCount > 0 && (
                <span className="text-yellow-400">({pendingTestingCount} pending review)</span>
              )}
            </div>
            <div
              className="h-1 rounded-full overflow-hidden"
              style={{ background: 'rgba(255, 255, 255, 0.1)' }}
            >
              <div
                className="h-full rounded-full transition-all duration-300"
                style={{
                  width: `${progress}%`,
                  background: 'linear-gradient(90deg, #BFFF6B, #6BFF9B)',
                }}
              />
            </div>
          </div>
        )}

        {/* Tasks list */}
        <div
          className="flex-1 p-3 space-y-2 overflow-y-auto"
          style={{ maxHeight: 400 }}
        >
          {currentPlan.status === 'planning' ? (
            <div className="flex items-center justify-center py-8">
              <div className="text-white/60 text-sm">
                <span className="inline-flex gap-1">
                  <span className="animate-bounce">.</span>
                  <span className="animate-bounce" style={{ animationDelay: '0.1s' }}>.</span>
                  <span className="animate-bounce" style={{ animationDelay: '0.2s' }}>.</span>
                </span>
                <span className="ml-2">Analyzing task and creating plan</span>
              </div>
            </div>
          ) : currentPlan.tasks.length === 0 ? (
            <div className="text-white/40 text-sm text-center py-4">
              No tasks in plan
            </div>
          ) : (
            currentPlan.tasks.map(task => (
              <TaskRow
                key={task.id}
                task={task}
                onMarkResolved={markTaskResolved}
                onRetry={retryTask}
              />
            ))
          )}
        </div>
        
        {/* Actions */}
        <div
          className="flex gap-2 p-3"
          style={{ borderTop: '1px solid rgba(255, 255, 255, 0.1)' }}
        >
          {currentPlan.status === 'ready' && (
            <>
              <button
                onClick={() => executePlan()}
                className="flex-1 px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                style={{
                  background: 'rgba(191, 255, 107, 0.2)',
                  color: '#BFFF6B',
                  border: '1px solid rgba(191, 255, 107, 0.3)',
                }}
              >
                Execute Plan
              </button>
              <button
                onClick={cancelPlan}
                className="px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                style={{
                  background: 'rgba(255, 255, 255, 0.05)',
                  color: 'rgba(255, 255, 255, 0.6)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                }}
              >
                Cancel
              </button>
            </>
          )}
          {currentPlan.status === 'executing' && (
            <button
              onClick={cancelPlan}
              className="flex-1 px-4 py-2 rounded-lg text-sm font-medium transition-colors"
              style={{
                background: 'rgba(239, 68, 68, 0.1)',
                color: 'rgba(239, 68, 68, 0.8)',
                border: '1px solid rgba(239, 68, 68, 0.2)',
              }}
            >
              Cancel Execution
            </button>
          )}
          {(currentPlan.status === 'completed' || currentPlan.status === 'failed') && (
            <button
              onClick={cancelPlan}
              className="flex-1 px-4 py-2 rounded-lg text-sm font-medium transition-colors"
              style={{
                background: 'rgba(255, 255, 255, 0.05)',
                color: 'rgba(255, 255, 255, 0.6)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
              }}
            >
              Close
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
