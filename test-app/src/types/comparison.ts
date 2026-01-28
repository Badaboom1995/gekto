import { Product } from '../App'

export interface ComparisonItem {
  product: Product
  addedAt: Date
}

export interface ComparisonContextType {
  items: ComparisonItem[]
  addProduct: (product: Product) => void
  removeProduct: (productId: number) => void
  clearComparison: () => void
  isComparing: boolean
}
