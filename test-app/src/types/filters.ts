export interface FilterState {
  categories: string[]
  priceRange: [number, number]
  minRating: number
  inStockOnly: boolean
  eras: string[]
  condition: string[]
}

export interface FilterOption {
  label: string
  value: string
  count?: number
}

export const PRICE_RANGE = { min: 0, max: 2000 } as const
export const RATING_OPTIONS = [4.0, 4.5, 5.0] as const
export const ERA_OPTIONS: FilterOption[] = [
  { label: '1970s', value: '1970s' },
  { label: '1980s', value: '1980s' },
  { label: '1990s', value: '1990s' },
  { label: '2000s', value: '2000s' },
]
export const CONDITION_OPTIONS: FilterOption[] = [
  { label: 'New', value: 'new' },
  { label: 'Restored', value: 'restored' },
  { label: 'As-is', value: 'as-is' },
]
