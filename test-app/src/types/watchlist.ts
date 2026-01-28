import { Product } from '../App'

export interface PriceHistoryEntry {
  date: Date
  price: number
}

export interface PriceAlertConfig {
  enabled: boolean
  targetPrice: number
  notified: boolean
}

export interface AvailabilityAlertConfig {
  enabled: boolean
  notified: boolean
}

export interface WatchlistItem {
  id: string
  productId: number
  product: Product
  addedAt: Date
  priceAlert?: PriceAlertConfig
  availabilityAlert?: AvailabilityAlertConfig
  priceHistory: PriceHistoryEntry[]
  lastPrice: number
  notes?: string
}

export interface WatchlistContextType {
  items: WatchlistItem[]
  addItem: (product: Product, priceAlert?: number, availabilityAlert?: boolean) => void
  removeItem: (productId: number) => void
  clearWatchlist: () => void
  updatePriceAlert: (productId: number, targetPrice: number) => void
  updateAvailabilityAlert: (productId: number, enabled: boolean) => void
  isWatching: (productId: number) => boolean
}
