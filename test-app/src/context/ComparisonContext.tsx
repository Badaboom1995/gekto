import React, { createContext, useContext, useState, useEffect } from 'react'
import { Product } from '../App'
import { ComparisonContextType, ComparisonItem } from '../types/comparison'

const ComparisonContext = createContext<ComparisonContextType | undefined>(undefined)

const MAX_COMPARISONS = 5
const STORAGE_KEY = 'classicpc_comparison'

export function ComparisonProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<ComparisonItem[]>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      if (stored) {
        const parsed = JSON.parse(stored)
        // Validate stored data still has valid products
        return Array.isArray(parsed) ? parsed : []
      }
    } catch (e) {
      console.error('Failed to load comparison items:', e)
    }
    return []
  })

  // Save to localStorage whenever items change
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items))
  }, [items])

  const addProduct = (product: Product) => {
    setItems(prev => {
      const exists = prev.some(item => item.product.id === product.id)
      if (exists) return prev
      if (prev.length >= MAX_COMPARISONS) return prev
      return [...prev, { product, addedAt: new Date() }]
    })
  }

  const removeProduct = (productId: number) => {
    setItems(prev => prev.filter(item => item.product.id !== productId))
  }

  const clearComparison = () => {
    setItems([])
  }

  const value: ComparisonContextType = {
    items,
    addProduct,
    removeProduct,
    clearComparison,
    isComparing: items.length > 0,
  }

  return (
    <ComparisonContext.Provider value={value}>
      {children}
    </ComparisonContext.Provider>
  )
}

export function useComparison() {
  const context = useContext(ComparisonContext)
  if (!context) {
    throw new Error('useComparison must be used within ComparisonProvider')
  }
  return context
}
