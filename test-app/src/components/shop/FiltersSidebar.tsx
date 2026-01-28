import { useState, useCallback, useEffect } from 'react'

export interface Category {
  id: string
  label: string
  count?: number
}

export interface PriceRange {
  min: number
  max: number
}

export type RatingFilter = 4 | 3 | 2 | null

export interface FiltersState {
  categories: string[]
  priceRange: PriceRange
  rating: RatingFilter
}

export interface FiltersSidebarProps {
  filters: FiltersState
  onFilterChange: (filters: FiltersState) => void
  categories: Category[]
  maxPrice?: number
  title?: string
}

const DEFAULT_CATEGORIES: Category[] = [
  { id: 'desktop', label: 'Desktop' },
  { id: 'laptop', label: 'Laptop' },
  { id: 'workstation', label: 'Workstation' },
  { id: 'gaming', label: 'Gaming' },
  { id: 'portable', label: 'Portable' },
]

const RATING_OPTIONS: { value: RatingFilter; label: string }[] = [
  { value: null, label: 'All' },
  { value: 4, label: '4+ stars' },
  { value: 3, label: '3+ stars' },
  { value: 2, label: '2+ stars' },
]

export function FiltersSidebar({
  filters,
  onFilterChange,
  categories = DEFAULT_CATEGORIES,
  maxPrice = 5000,
  title = 'Filters',
}: FiltersSidebarProps) {
  const [localPriceMin, setLocalPriceMin] = useState(filters.priceRange.min.toString())
  const [localPriceMax, setLocalPriceMax] = useState(filters.priceRange.max.toString())

  useEffect(() => {
    setLocalPriceMin(filters.priceRange.min.toString())
    setLocalPriceMax(filters.priceRange.max.toString())
  }, [filters.priceRange.min, filters.priceRange.max])

  const activeFilterCount =
    filters.categories.length +
    (filters.priceRange.min > 0 || filters.priceRange.max < maxPrice ? 1 : 0) +
    (filters.rating !== null ? 1 : 0)

  const handleCategoryToggle = useCallback(
    (categoryId: string) => {
      const newCategories = filters.categories.includes(categoryId)
        ? filters.categories.filter((id) => id !== categoryId)
        : [...filters.categories, categoryId]
      onFilterChange({ ...filters, categories: newCategories })
    },
    [filters, onFilterChange]
  )

  const handlePriceBlur = useCallback(() => {
    const min = Math.max(0, parseInt(localPriceMin) || 0)
    const max = Math.min(maxPrice, parseInt(localPriceMax) || maxPrice)
    onFilterChange({
      ...filters,
      priceRange: {
        min: Math.min(min, max),
        max: Math.max(min, max),
      },
    })
  }, [localPriceMin, localPriceMax, maxPrice, filters, onFilterChange])

  const handleRatingChange = useCallback(
    (rating: RatingFilter) => {
      onFilterChange({ ...filters, rating })
    },
    [filters, onFilterChange]
  )

  const handleClearAll = useCallback(() => {
    onFilterChange({
      categories: [],
      priceRange: { min: 0, max: maxPrice },
      rating: null,
    })
  }, [maxPrice, onFilterChange])

  const renderStars = (count: number) => (
    <div style={{ display: 'flex', alignItems: 'center', gap: 2 }}>
      {[...Array(5)].map((_, i) => (
        <svg
          key={i}
          style={{ width: 14, height: 14 }}
          viewBox="0 0 24 24"
          fill={i < count ? '#FFB800' : 'none'}
          stroke={i < count ? '#FFB800' : '#444'}
          strokeWidth="2"
        >
          <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
        </svg>
      ))}
    </div>
  )

  return (
    <aside style={{
      width: 280,
      backgroundColor: '#111',
      border: '1px solid #222',
      borderRadius: 12,
      position: 'sticky',
      top: 16,
      maxHeight: 'calc(100vh - 2rem)',
      overflowY: 'auto',
      flexShrink: 0,
    }}>
      {/* Header */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: 16,
        borderBottom: '1px solid #222',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'white', fontWeight: 600 }}>
          <svg style={{ width: 20, height: 20 }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" />
          </svg>
          <span>{title}</span>
        </div>
        {activeFilterCount > 0 && (
          <span style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            minWidth: 24,
            height: 24,
            padding: '0 8px',
            backgroundColor: 'white',
            color: 'black',
            fontSize: 12,
            fontWeight: 700,
            borderRadius: 12,
          }}>
            {activeFilterCount}
          </span>
        )}
      </div>

      {/* Content */}
      <div style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 24 }}>
        {/* Categories */}
        <div>
          <h3 style={{ fontSize: 12, fontWeight: 600, color: 'white', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 12 }}>
            Categories
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {categories.map((category) => (
              <label
                key={category.id}
                style={{ display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer' }}
              >
                <div
                  onClick={() => handleCategoryToggle(category.id)}
                  style={{
                    width: 20,
                    height: 20,
                    borderRadius: 4,
                    border: filters.categories.includes(category.id) ? '2px solid white' : '2px solid #444',
                    backgroundColor: filters.categories.includes(category.id) ? 'white' : 'transparent',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                  }}
                >
                  {filters.categories.includes(category.id) && (
                    <svg style={{ width: 12, height: 12 }} viewBox="0 0 24 24" fill="none" stroke="black" strokeWidth="3">
                      <path d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                </div>
                <span style={{ color: '#d1d5db', flex: 1 }}>{category.label}</span>
                {category.count !== undefined && (
                  <span style={{ color: '#6b7280', fontSize: 14 }}>({category.count})</span>
                )}
              </label>
            ))}
          </div>
        </div>

        {/* Price Range */}
        <div>
          <h3 style={{ fontSize: 12, fontWeight: 600, color: 'white', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 12 }}>
            Price Range
          </h3>
          <div style={{ color: 'white', fontSize: 14, marginBottom: 12 }}>
            ${filters.priceRange.min.toLocaleString()} - ${filters.priceRange.max.toLocaleString()}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ flex: 1 }}>
              <label style={{ fontSize: 12, color: '#6b7280', display: 'block', marginBottom: 4 }}>Min</label>
              <div style={{ position: 'relative' }}>
                <span style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#6b7280' }}>$</span>
                <input
                  type="number"
                  min="0"
                  max={maxPrice}
                  value={localPriceMin}
                  onChange={(e) => setLocalPriceMin(e.target.value)}
                  onBlur={handlePriceBlur}
                  style={{
                    width: '100%',
                    backgroundColor: '#222',
                    border: '1px solid #333',
                    borderRadius: 8,
                    padding: '8px 12px 8px 28px',
                    color: 'white',
                    fontSize: 14,
                    outline: 'none',
                  }}
                />
              </div>
            </div>
            <span style={{ color: '#6b7280', marginTop: 20 }}>-</span>
            <div style={{ flex: 1 }}>
              <label style={{ fontSize: 12, color: '#6b7280', display: 'block', marginBottom: 4 }}>Max</label>
              <div style={{ position: 'relative' }}>
                <span style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#6b7280' }}>$</span>
                <input
                  type="number"
                  min="0"
                  max={maxPrice}
                  value={localPriceMax}
                  onChange={(e) => setLocalPriceMax(e.target.value)}
                  onBlur={handlePriceBlur}
                  style={{
                    width: '100%',
                    backgroundColor: '#222',
                    border: '1px solid #333',
                    borderRadius: 8,
                    padding: '8px 12px 8px 28px',
                    color: 'white',
                    fontSize: 14,
                    outline: 'none',
                  }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Rating */}
        <div>
          <h3 style={{ fontSize: 12, fontWeight: 600, color: 'white', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 12 }}>
            Rating
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {RATING_OPTIONS.map((option) => (
              <label
                key={option.label}
                style={{ display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer' }}
                onClick={() => handleRatingChange(option.value)}
              >
                <div
                  style={{
                    width: 20,
                    height: 20,
                    borderRadius: '50%',
                    border: filters.rating === option.value ? '2px solid white' : '2px solid #444',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                  }}
                >
                  {filters.rating === option.value && (
                    <div style={{ width: 10, height: 10, borderRadius: '50%', backgroundColor: 'white' }} />
                  )}
                </div>
                <span style={{ color: '#d1d5db', display: 'flex', alignItems: 'center', gap: 8 }}>
                  {option.value !== null ? (
                    <>
                      {renderStars(option.value)}
                      <span style={{ color: '#9ca3af' }}>& up</span>
                    </>
                  ) : (
                    option.label
                  )}
                </span>
              </label>
            ))}
          </div>
        </div>

        {/* Clear All */}
        <button
          onClick={handleClearAll}
          disabled={activeFilterCount === 0}
          style={{
            width: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 8,
            padding: '12px 16px',
            borderRadius: 8,
            border: '1px solid #333',
            backgroundColor: 'transparent',
            color: activeFilterCount === 0 ? '#4b5563' : '#9ca3af',
            cursor: activeFilterCount === 0 ? 'not-allowed' : 'pointer',
            opacity: activeFilterCount === 0 ? 0.5 : 1,
            transition: 'all 0.2s',
          }}
        >
          <svg style={{ width: 16, height: 16 }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M18 6L6 18M6 6l12 12" />
          </svg>
          Clear All Filters
        </button>
      </div>
    </aside>
  )
}

export default FiltersSidebar
