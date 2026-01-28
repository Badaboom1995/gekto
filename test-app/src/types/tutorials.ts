export type TutorialDifficulty = 'beginner' | 'intermediate' | 'advanced'

export interface TutorialStep {
  id: number
  title: string
  description: string
  imageUrl?: string
  warningText?: string
  tipText?: string
}

export interface Tutorial {
  id: number
  title: string
  category: string
  difficulty: TutorialDifficulty
  duration: number // minutes
  description: string
  steps: TutorialStep[]
  tags: string[]
  videoUrl?: string
  relatedProductIds?: number[]
  featured?: boolean
}

export interface TutorialProgress {
  tutorialId: number
  completedSteps: number[]
  completed: boolean
  lastAccessed: Date
}
