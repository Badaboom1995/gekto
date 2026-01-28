import { Tutorial } from '../types/tutorials'
import './TutorialCard.css'

interface TutorialCardProps {
  tutorial: Tutorial
  progress?: number
  isFavorite?: boolean
  onFavoriteToggle?: (tutorialId: number) => void
  onClick?: (tutorial: Tutorial) => void
}

const DIFFICULTY_COLORS = {
  beginner: '#4caf50',
  intermediate: '#ff9800',
  advanced: '#f44336',
}

export function TutorialCard({
  tutorial,
  progress = 0,
  isFavorite = false,
  onFavoriteToggle,
  onClick,
}: TutorialCardProps) {
  return (
    <div className="tutorial-card" onClick={() => onClick?.(tutorial)}>
      <div className="tutorial-header">
        <div className="tutorial-category-badge">{tutorial.category}</div>
        <button
          className={`favorite-btn ${isFavorite ? 'active' : ''}`}
          onClick={e => {
            e.stopPropagation()
            onFavoriteToggle?.(tutorial.id)
          }}
          title={isFavorite ? 'Remove from favorites' : 'Add to favorites'}
        >
          ♥
        </button>
      </div>

      <h3 className="tutorial-title">{tutorial.title}</h3>
      <p className="tutorial-description">{tutorial.description}</p>

      <div className="tutorial-meta">
        <div className="meta-item">
          <span className="meta-label">Difficulty</span>
          <span
            className="meta-value difficulty"
            style={{ color: DIFFICULTY_COLORS[tutorial.difficulty] }}
          >
            {tutorial.difficulty.charAt(0).toUpperCase() + tutorial.difficulty.slice(1)}
          </span>
        </div>
        <div className="meta-item">
          <span className="meta-label">Duration</span>
          <span className="meta-value">{tutorial.duration} min</span>
        </div>
        <div className="meta-item">
          <span className="meta-label">Steps</span>
          <span className="meta-value">{tutorial.steps.length}</span>
        </div>
      </div>

      {tutorial.tags.length > 0 && (
        <div className="tutorial-tags">
          {tutorial.tags.slice(0, 3).map((tag, idx) => (
            <span key={idx} className="tag">
              {tag}
            </span>
          ))}
        </div>
      )}

      {progress > 0 && (
        <div className="progress-section">
          <div className="progress-label">
            <span>Progress</span>
            <span className="progress-percent">{progress}%</span>
          </div>
          <div className="progress-bar">
            <div className="progress-fill" style={{ width: `${progress}%` }} />
          </div>
        </div>
      )}

      <div className="tutorial-footer">
        <span className="cta">View Tutorial →</span>
      </div>
    </div>
  )
}
