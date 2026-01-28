import React, { createContext, useContext, useState, useEffect } from 'react'
import { Product } from '../App'
import { WatchlistContextType, WatchlistItem, PriceAlertConfig, AvailabilityAlertConfig } from '../types/watchlist'

const WatchlistContext = createContext<WatchlistContextType | undefined>(undefined)

const STORAGE_KEY = 'classicpc_watchlist'

export function WatchlistProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<WatchlistItem[]>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      if (stored) {
        const parsed = JSON.parse(stored)
        return Array.isArray(parsed) ? parsed : []
      }
    } catch (e) {
      console.error('Failed to load watchlist items:', e)
    }
    return []
  })

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items))
  }, [items])

  const addItem = (product: Product, priceAlertTarget?: number, availabilityAlert?: boolean) => {
    setItems(prev => {
      const exists = prev.find(item => item.productId === product.id)
      if (exists) return prev

      const priceAlert: PriceAlertConfig | undefined = priceAlertTarget
        ? { enabled: true, targetPrice: priceAlertTarget, notified: false }
        : undefined

      const availAlert: AvailabilityAlertConfig | undefined = availabilityAlert
        ? { enabled: true, notified: false }
        : undefined

      return [
        ...prev,
        {
          id: `${product.id}-${Date.now()}`,
          productId: product.id,
          product,
          addedAt: new Date(),
          priceAlert,
          availabilityAlert: availAlert,
          priceHistory: [{ date: new Date(), price: product.price }],
          lastPrice: product.price,
        },
      ]
    })
  }

  const removeItem = (productId: number) => {
    setItems(prev => prev.filter(item => item.productId !== productId))
  }

  const clearWatchlist = () => {
    setItems([])
  }

  const updatePriceAlert = (productId: number, targetPrice: number) => {
    setItems(prev =>
      prev.map(item =>
        item.productId === productId
          ? {
              ...item,
              priceAlert: {
                enabled: true,
                targetPrice,
                notified: item.product.price <= targetPrice,
              },
            }
          : item
      )
    )
  }

  const updateAvailabilityAlert = (productId: number, enabled: boolean) => {
    setItems(prev =>
      prev.map(item =>
        item.productId === productId
          ? {
              ...item,
              availabilityAlert: {
                enabled,
                notified: false,
              },
            }
          : item
      )
    )
  }

  const isWatching = (productId: number) => {
    return items.some(item => item.productId === productId)
  }

  const value: WatchlistContextType = {
    items,
    addItem,
    removeItem,
    clearWatchlist,
    updatePriceAlert,
    updateAvailabilityAlert,
    isWatching,
  }

  return (
    <WatchlistContext.Provider value={value}>
      {children}
    </WatchlistContext.Provider>
  )
}

export function useWatchlist() {
  const context = useContext(WatchlistContext)
  if (!context) {
    throw new Error('useWatchlist must be used within WatchlistProvider')
  }
  return context
}
