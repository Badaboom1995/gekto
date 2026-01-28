export interface Product {
  id: number
  name: string
  category: string
  price: number
  currency?: string
  rating: number
  reviews: number
  image: string
  // New advanced filtering properties
  manufacturer: string
  releaseYear: number
  decade: string
  cpu: string
  memory: string
  condition: 'Mint' | 'Restored' | 'Good' | 'Fair' | 'For Parts'
  availability: 'In Stock' | 'Low Stock' | 'Out of Stock' | 'Pre-order'
  stockCount?: number
  description: string
  specifications: {
    cpu: string
    memory: string
    storage?: string
    display?: string
    sound?: string
    ports?: string[]
    os?: string
  }
  features: string[]
  historicalSignificance?: string
  tags?: string[]
}

export interface ProductFilters {
  category: string
  manufacturer: string[]
  decade: string[]
  condition: string[]
  availability: string[]
  priceRange: [number, number]
  searchQuery: string
  sortBy: 'name' | 'price-asc' | 'price-desc' | 'year-asc' | 'year-desc' | 'rating'
}

export interface ProductComparison {
  products: Product[]
  comparisonFields: string[]
}