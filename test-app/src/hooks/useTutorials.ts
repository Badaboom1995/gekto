import { useState, useMemo } from 'react'
import { Tutorial, TutorialProgress } from '../types/tutorials'

const STORAGE_KEY = 'classicpc_tutorial_progress'

export function useTutorials(tutorials: Tutorial[]) {
  const [progress, setProgress] = useState<Record<number, TutorialProgress>>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      if (stored) {
        return JSON.parse(stored)
      }
    } catch (e) {
      console.error('Failed to load tutorial progress:', e)
    }
    return {}
  })

  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
  const [selectedDifficulty, setSelectedDifficulty] = useState<string | null>(null)
  const [favorites, setFavorites] = useState<number[]>(() => {
    try {
      const stored = localStorage.getItem('classicpc_tutorial_favorites')
      return stored ? JSON.parse(stored) : []
    } catch {
      return []
    }
  })

  // Save progress to localStorage
  const saveProgress = (newProgress: Record<number, TutorialProgress>) => {
    setProgress(newProgress)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(newProgress))
  }

  // Save favorites to localStorage
  const saveFavorites = (newFavorites: number[]) => {
    setFavorites(newFavorites)
    localStorage.setItem('classicpc_tutorial_favorites', JSON.stringify(newFavorites))
  }

  const markStepComplete = (tutorialId: number, stepId: number) => {
    setProgress(prev => {
      const tutorialProgress = prev[tutorialId] || {
        tutorialId,
        completedSteps: [],
        completed: false,
        lastAccessed: new Date(),
      }

      const completedSteps = tutorialProgress.completedSteps.includes(stepId)
        ? tutorialProgress.completedSteps.filter(id => id !== stepId)
        : [...tutorialProgress.completedSteps, stepId]

      const tutorial = tutorials.find(t => t.id === tutorialId)
      const completed = tutorial ? completedSteps.length === tutorial.steps.length : false

      const newProgress = {
        ...prev,
        [tutorialId]: {
          ...tutorialProgress,
          completedSteps,
          completed,
          lastAccessed: new Date(),
        },
      }

      saveProgress(newProgress)
      return newProgress
    })
  }

  const toggleFavorite = (tutorialId: number) => {
    const newFavorites = favorites.includes(tutorialId)
      ? favorites.filter(id => id !== tutorialId)
      : [...favorites, tutorialId]
    saveFavorites(newFavorites)
  }

  const isFavorite = (tutorialId: number) => favorites.includes(tutorialId)

  const getProgressPercentage = (tutorialId: number): number => {
    const tutorialProgress = progress[tutorialId]
    if (!tutorialProgress) return 0
    const tutorial = tutorials.find(t => t.id === tutorialId)
    if (!tutorial) return 0
    return Math.round((tutorialProgress.completedSteps.length / tutorial.steps.length) * 100)
  }

  const filteredTutorials = useMemo(() => {
    return tutorials.filter(tutorial => {
      // Search query filter
      if (searchQuery) {
        const query = searchQuery.toLowerCase()
        const matchesSearch =
          tutorial.title.toLowerCase().includes(query) ||
          tutorial.description.toLowerCase().includes(query) ||
          tutorial.tags.some(tag => tag.toLowerCase().includes(query))
        if (!matchesSearch) return false
      }

      // Category filter
      if (selectedCategory && tutorial.category !== selectedCategory) {
        return false
      }

      // Difficulty filter
      if (selectedDifficulty && tutorial.difficulty !== selectedDifficulty) {
        return false
      }

      return true
    })
  }, [tutorials, searchQuery, selectedCategory, selectedDifficulty])

  const categories = Array.from(new Set(tutorials.map(t => t.category)))
  const difficulties = Array.from(new Set(tutorials.map(t => t.difficulty)))

  return {
    filteredTutorials,
    searchQuery,
    setSearchQuery,
    selectedCategory,
    setSelectedCategory,
    selectedDifficulty,
    setSelectedDifficulty,
    categories,
    difficulties,
    progress,
    markStepComplete,
    toggleFavorite,
    isFavorite,
    getProgressPercentage,
    favorites,
  }
}
