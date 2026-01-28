import { useState } from 'react'
import { TutorialCard } from '../components/TutorialCard'
import { useTutorials } from '../hooks/useTutorials'
import { Tutorial, TutorialStep } from '../types/tutorials'
import './TutorialsPage.css'

// Sample tutorials data
const SAMPLE_TUTORIALS: Tutorial[] = [
  {
    id: 1,
    title: 'Setting Up Your Commodore 64',
    description: 'A comprehensive guide to unboxing, connecting, and powering on your vintage Commodore 64.',
    category: 'Setup',
    difficulty: 'beginner',
    duration: 15,
    tags: ['c64', 'setup', 'beginner', 'video'],
    featured: true,
    steps: [
      {
        id: 1,
        title: 'Unboxing and Inspection',
        description: 'Carefully unbox your C64 and inspect all components for any damage during shipping.',
        warningText: 'Do not force any connectors. If they seem stuck, try gentle rocking motions.',
        tipText: 'Take photos of the original packaging for future reference.',
      },
      {
        id: 2,
        title: 'Connect the Power Supply',
        description: 'Locate the power supply and connect it to the appropriate port on the rear of the unit.',
        warningText: 'Ensure the voltage selector matches your country (110V or 220V).',
        tipText: 'The power jack is keyed to prevent incorrect insertion.',
      },
      {
        id: 3,
        title: 'Connect the Monitor',
        description: 'Use an RF cable or composite video cable to connect your C64 to a display.',
        tipText: 'Composite cables provide better video quality than RF cables.',
      },
      {
        id: 4,
        title: 'First Boot',
        description: 'Switch on the power supply and the C64. You should see the BASIC prompt on screen.',
        tipText: 'If nothing appears, check all connections and try adjusting the TV tuner.',
      },
    ],
    relatedProductIds: [1],
  },
  {
    id: 2,
    title: 'Capacitor Replacement Guide',
    description: 'Learn how to replace aging capacitors in your vintage computer to prevent damage.',
    category: 'Restoration',
    difficulty: 'advanced',
    duration: 45,
    tags: ['restoration', 'capacitors', 'soldering', 'advanced'],
    featured: true,
    steps: [
      {
        id: 1,
        title: 'Gather Materials',
        description: 'Collect replacement capacitors, soldering iron, solder, and desoldering equipment.',
        tipText: 'Use electrolytic capacitors with matching voltage and microfarad ratings.',
      },
      {
        id: 2,
        title: 'Power Down and Discharge',
        description: 'Completely power off the device and discharge any remaining electrical charge.',
        warningText: 'Always discharge the power supply capacitor before working on the board!',
      },
      {
        id: 3,
        title: 'Remove Old Capacitors',
        description: 'Desolder and carefully remove the old capacitors from the circuit board.',
        tipText: 'Mark capacitor positions with photos to ensure correct reinstallation.',
      },
      {
        id: 4,
        title: 'Install New Capacitors',
        description: 'Solder the new capacitors in place, ensuring correct polarity.',
        warningText: 'Electrolytic capacitors have polarity! Negative leg goes to ground.',
      },
    ],
  },
  {
    id: 3,
    title: 'Retrobright Yellowing Treatment',
    description: 'Restore faded yellow plastic using the retrobright chemical treatment method.',
    category: 'Restoration',
    difficulty: 'intermediate',
    duration: 30,
    tags: ['restoration', 'plastic', 'cleaning', 'cosmetic'],
    steps: [
      {
        id: 1,
        title: 'Prepare Materials',
        description: 'Gather hydrogen peroxide, OxiClean, UV light source, and protective gear.',
        warningText: 'Hydrogen peroxide can cause chemical burns. Wear gloves and eye protection.',
        tipText: '3% hydrogen peroxide is safer than higher concentrations.',
      },
      {
        id: 2,
        title: 'Mix the Solution',
        description: 'Combine hydrogen peroxide with OxiClean according to standard retrobright recipes.',
      },
      {
        id: 3,
        title: 'Apply and Expose to UV',
        description: 'Apply the solution and expose the plastic to UV light for several hours.',
        tipText: 'Monitor progress regularly. The process typically takes 4-8 hours.',
      },
      {
        id: 4,
        title: 'Rinse and Dry',
        description: 'Thoroughly rinse off the solution and allow the plastic to dry completely.',
      },
    ],
  },
  {
    id: 4,
    title: 'Connecting Vintage Peripherals',
    description: 'Learn how to connect disk drives, printers, and other accessories to your retro computer.',
    category: 'Setup',
    difficulty: 'beginner',
    duration: 20,
    tags: ['peripherals', 'setup', 'hardware'],
    steps: [
      {
        id: 1,
        title: 'Identify Your Ports',
        description: 'Learn about the various connector types on vintage computers.',
        tipText: 'Common ports include IEC (Commodore), DB-25 (Parallel), and DB-9 (Serial).',
      },
      {
        id: 2,
        title: 'Prepare the Peripheral',
        description: 'Check that your peripheral is compatible and in working condition.',
      },
      {
        id: 3,
        title: 'Make Connections',
        description: 'Connect your peripheral using the appropriate cable.',
        warningText: 'Always power off devices before connecting or disconnecting cables.',
      },
      {
        id: 4,
        title: 'Test and Configure',
        description: 'Power on the system and test the peripheral functionality.',
      },
    ],
  },
  {
    id: 5,
    title: 'Retro Gaming Setup Guide',
    description: 'Create the ultimate vintage gaming station with authentic hardware and peripherals.',
    category: 'Gaming',
    difficulty: 'intermediate',
    duration: 40,
    tags: ['gaming', 'setup', 'peripherals', 'guide'],
    featured: true,
    steps: [
      {
        id: 1,
        title: 'Choose Your System',
        description: 'Select which vintage gaming system you want to set up.',
      },
      {
        id: 2,
        title: 'Gather Compatible Peripherals',
        description: 'Collect controllers, disk drives, and other necessary equipment.',
      },
      {
        id: 3,
        title: 'Setup Display',
        description: 'Connect your monitor or TV with proper A/V cables.',
      },
      {
        id: 4,
        title: 'Install Games',
        description: 'Load games from original media or modern flash cartridges.',
      },
    ],
  },
  {
    id: 6,
    title: 'Programming BASIC on 8-bit Systems',
    description: 'Learn the fundamentals of BASIC programming on vintage 8-bit computers.',
    category: 'Programming',
    difficulty: 'intermediate',
    duration: 50,
    tags: ['programming', 'basic', 'coding', 'educational'],
    steps: [
      {
        id: 1,
        title: 'Understanding BASIC Syntax',
        description: 'Learn the basic syntax and structure of BASIC language.',
      },
      {
        id: 2,
        title: 'Variables and Data Types',
        description: 'Understand how to declare and use variables in BASIC.',
      },
      {
        id: 3,
        title: 'Control Flow',
        description: 'Learn about loops, conditionals, and program flow control.',
      },
      {
        id: 4,
        title: 'Input and Output',
        description: 'Master reading input and displaying output on the screen.',
      },
    ],
  },
]

interface TutorialDetailModalProps {
  tutorial: Tutorial
  progress: number
  onClose: () => void
  onStepToggle: (stepId: number) => void
}

function TutorialDetailModal({ tutorial, progress, onClose, onStepToggle }: TutorialDetailModalProps) {
  const [expandedSteps, setExpandedSteps] = useState<number[]>([])

  const toggleStep = (stepId: number) => {
    setExpandedSteps(prev =>
      prev.includes(stepId) ? prev.filter(id => id !== stepId) : [...prev, stepId]
    )
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()}>
        <button className="modal-close" onClick={onClose}>✕</button>

        <div className="modal-header">
          <h2>{tutorial.title}</h2>
          <p>{tutorial.description}</p>
          <div className="modal-meta">
            <span>⏱ {tutorial.duration} minutes</span>
            <span>📋 {tutorial.steps.length} steps</span>
          </div>
        </div>

        <div className="progress-section">
          <div className="progress-label">
            <span>Progress</span>
            <span className="progress-percent">{progress}%</span>
          </div>
          <div className="progress-bar">
            <div className="progress-fill" style={{ width: `${progress}%` }} />
          </div>
        </div>

        <div className="steps-container">
          {tutorial.steps.map(step => (
            <div key={step.id} className="step-item">
              <div
                className="step-header"
                onClick={() => {
                  toggleStep(step.id)
                  onStepToggle(step.id)
                }}
              >
                <input
                  type="checkbox"
                  className="step-checkbox"
                  onChange={() => {}}
                />
                <div className="step-title-section">
                  <h4>Step {step.id}: {step.title}</h4>
                </div>
                <svg
                  className={`expand-icon ${expandedSteps.includes(step.id) ? 'expanded' : ''}`}
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <path d="M6 9l6 6 6-6"/>
                </svg>
              </div>

              {expandedSteps.includes(step.id) && (
                <div className="step-content">
                  <p>{step.description}</p>

                  {step.imageUrl && (
                    <img src={step.imageUrl} alt={step.title} className="step-image" />
                  )}

                  {step.tipText && (
                    <div className="step-tip">
                      <span className="tip-icon">💡</span>
                      <p>{step.tipText}</p>
                    </div>
                  )}

                  {step.warningText && (
                    <div className="step-warning">
                      <span className="warning-icon">⚠️</span>
                      <p>{step.warningText}</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export default function TutorialsPage() {
  const [selectedTutorial, setSelectedTutorial] = useState<Tutorial | null>(null)

  const {
    filteredTutorials,
    searchQuery,
    setSearchQuery,
    selectedCategory,
    setSelectedCategory,
    selectedDifficulty,
    setSelectedDifficulty,
    categories,
    difficulties,
    getProgressPercentage,
    markStepComplete,
    toggleFavorite,
    isFavorite,
  } = useTutorials(SAMPLE_TUTORIALS)

  return (
    <div className="tutorials-page">
      <section className="tutorials-hero">
        <div className="hero-content">
          <h1>Learning Center</h1>
          <p>Master vintage computing with our comprehensive tutorials and guides</p>
        </div>
      </section>

      <main className="tutorials-main">
        <aside className="tutorials-sidebar">
          <div className="search-section">
            <input
              type="text"
              placeholder="Search tutorials..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="search-input"
            />
          </div>

          <div className="filter-section">
            <h4>Category</h4>
            <div className="filter-options">
              <button
                className={`filter-option ${selectedCategory === null ? 'active' : ''}`}
                onClick={() => setSelectedCategory(null)}
              >
                All Categories
              </button>
              {categories.map(cat => (
                <button
                  key={cat}
                  className={`filter-option ${selectedCategory === cat ? 'active' : ''}`}
                  onClick={() => setSelectedCategory(cat)}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          <div className="filter-section">
            <h4>Difficulty</h4>
            <div className="filter-options">
              <button
                className={`filter-option ${selectedDifficulty === null ? 'active' : ''}`}
                onClick={() => setSelectedDifficulty(null)}
              >
                All Levels
              </button>
              {difficulties.map(diff => (
                <button
                  key={diff}
                  className={`filter-option ${selectedDifficulty === diff ? 'active' : ''}`}
                  onClick={() => setSelectedDifficulty(diff)}
                >
                  {diff.charAt(0).toUpperCase() + diff.slice(1)}
                </button>
              ))}
            </div>
          </div>
        </aside>

        <section className="tutorials-grid">
          {filteredTutorials.length > 0 ? (
            <div className="grid">
              {filteredTutorials.map(tutorial => (
                <TutorialCard
                  key={tutorial.id}
                  tutorial={tutorial}
                  progress={getProgressPercentage(tutorial.id)}
                  isFavorite={isFavorite(tutorial.id)}
                  onFavoriteToggle={toggleFavorite}
                  onClick={setSelectedTutorial}
                />
              ))}
            </div>
          ) : (
            <div className="no-results">
              <p>No tutorials found matching your filters.</p>
            </div>
          )}
        </section>
      </main>

      {selectedTutorial && (
        <TutorialDetailModal
          tutorial={selectedTutorial}
          progress={getProgressPercentage(selectedTutorial.id)}
          onClose={() => setSelectedTutorial(null)}
          onStepToggle={(stepId: number) => markStepComplete(selectedTutorial.id, stepId)}
        />
      )}
    </div>
  )
}
