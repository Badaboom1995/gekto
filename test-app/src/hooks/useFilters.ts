import { useState, useMemo, useEffect } from 'react'
import { Product } from '../App'
import { FilterState, PRICE_RANGE } from '../types/filters'

const DEFAULT_FILTERS: FilterState = {
  categories: [],
  priceRange: [PRICE_RANGE.min, PRICE_RANGE.max],
  minRating: 0,
  inStockOnly: false,
  eras: [],
  condition: [],
}

export function useFilters(products: Product[], initialFilters?: Partial<FilterState>) {
  const [filters, setFilters] = useState<FilterState>({
    ...DEFAULT_FILTERS,
    ...initialFilters,
  })

  // Load from URL if available
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const urlFilters: Partial<FilterState> = {}

    const categories = params.get('categories')
    if (categories) urlFilters.categories = categories.split(',')

    const priceMin = params.get('priceMin')
    const priceMax = params.get('priceMax')
    if (priceMin && priceMax) {
      urlFilters.priceRange = [parseInt(priceMin), parseInt(priceMax)]
    }

    const minRating = params.get('minRating')
    if (minRating) urlFilters.minRating = parseFloat(minRating)

    const inStockOnly = params.get('inStockOnly')
    if (inStockOnly) urlFilters.inStockOnly = inStockOnly === 'true'

    const eras = params.get('eras')
    if (eras) urlFilters.eras = eras.split(',')

    const condition = params.get('condition')
    if (condition) urlFilters.condition = condition.split(',')

    if (Object.keys(urlFilters).length > 0) {
      setFilters(prev => ({ ...prev, ...urlFilters }))
    }
  }, [])

  const filteredProducts = useMemo(() => {
    return products.filter(product => {
      // Category filter
      if (filters.categories.length > 0 && !filters.categories.includes(product.category)) {
        return false
      }

      // Price range filter
      if (product.price < filters.priceRange[0] || product.price > filters.priceRange[1]) {
        return false
      }

      // Rating filter
      if (product.rating < filters.minRating) {
        return false
      }

      // Stock filter
      if (filters.inStockOnly && !product.inStock) {
        return false
      }

      return true
    })
  }, [products, filters])

  const updateFilter = <K extends keyof FilterState>(key: K, value: FilterState[K]) => {
    setFilters(prev => ({ ...prev, [key]: value }))
    updateURL({ ...filters, [key]: value })
  }

  const updateURL = (newFilters: FilterState) => {
    const params = new URLSearchParams()

    if (newFilters.categories.length > 0) {
      params.set('categories', newFilters.categories.join(','))
    }

    if (newFilters.priceRange[0] !== PRICE_RANGE.min || newFilters.priceRange[1] !== PRICE_RANGE.max) {
      params.set('priceMin', newFilters.priceRange[0].toString())
      params.set('priceMax', newFilters.priceRange[1].toString())
    }

    if (newFilters.minRating > 0) {
      params.set('minRating', newFilters.minRating.toString())
    }

    if (newFilters.inStockOnly) {
      params.set('inStockOnly', 'true')
    }

    if (newFilters.eras.length > 0) {
      params.set('eras', newFilters.eras.join(','))
    }

    if (newFilters.condition.length > 0) {
      params.set('condition', newFilters.condition.join(','))
    }

    const queryString = params.toString()
    const newUrl = queryString ? `${window.location.pathname}?${queryString}` : window.location.pathname
    window.history.replaceState({}, '', newUrl)
  }

  const clearFilters = () => {
    setFilters(DEFAULT_FILTERS)
    window.history.replaceState({}, '', window.location.pathname)
  }

  const hasActiveFilters = (): boolean => {
    return (
      filters.categories.length > 0 ||
      filters.priceRange[0] !== PRICE_RANGE.min ||
      filters.priceRange[1] !== PRICE_RANGE.max ||
      filters.minRating > 0 ||
      filters.inStockOnly ||
      filters.eras.length > 0 ||
      filters.condition.length > 0
    )
  }

  return {
    filters,
    filteredProducts,
    updateFilter,
    clearFilters,
    hasActiveFilters,
  }
}
