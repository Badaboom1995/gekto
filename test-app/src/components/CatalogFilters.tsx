import { useState, useCallback, useEffect } from 'react'
import './CatalogFilters.css'

// Types for catalog filters
export interface PriceRange {
  min: number
  max: number
}

export interface CatalogFiltersState {
  categories: string[]
  priceRange: PriceRange
  ratings: number[]
  manufacturers: string[]
  decades: string[]
  conditions: string[]
  availability: string[]
}

export interface CatalogFiltersProps {
  onFiltersChange: (filters: CatalogFiltersState) => void
  initialFilters?: Partial<CatalogFiltersState>
  productCount?: number
}

// Default filter state
const defaultFiltersState: CatalogFiltersState = {
  categories: [],
  priceRange: { min: 0, max: 1000 },
  ratings: [],
  manufacturers: [],
  decades: [],
  conditions: [],
  availability: [],
}

// Filter options based on vintage computers
const CATEGORIES = [
  { id: 'Home', label: 'Home Computers', count: 24 },
  { id: 'Business', label: 'Business Systems', count: 18 },
  { id: 'Education', label: 'Educational', count: 12 },
  { id: 'Gaming', label: 'Gaming Consoles', count: 32 },
  { id: 'Portable', label: 'Portable', count: 8 },
  { id: 'Accessories', label: 'Accessories', count: 56 },
]

const MANUFACTURERS = [
  { id: 'Commodore', label: 'Commodore' },
  { id: 'Apple', label: 'Apple' },
  { id: 'IBM', label: 'IBM' },
  { id: 'Atari', label: 'Atari' },
  { id: 'Sinclair', label: 'Sinclair' },
  { id: 'Amiga', label: 'Amiga' },
  { id: 'BBC', label: 'BBC Micro' },
  { id: 'Tandy', label: 'Tandy' },
]

const DECADES = [
  { id: '1970s', label: '1970s' },
  { id: '1980s', label: '1980s' },
  { id: '1990s', label: '1990s' },
]

const CONDITIONS = [
  { id: 'Mint', label: 'Mint', color: '#4ade80' },
  { id: 'Restored', label: 'Restored', color: '#60a5fa' },
  { id: 'Good', label: 'Good', color: '#fbbf24' },
  { id: 'Fair', label: 'Fair', color: '#f97316' },
  { id: 'For Parts', label: 'For Parts', color: '#ef4444' },
]

const AVAILABILITY = [
  { id: 'In Stock', label: 'In Stock', color: '#4ade80' },
  { id: 'Low Stock', label: 'Low Stock', color: '#fbbf24' },
  { id: 'Pre-order', label: 'Pre-order', color: '#60a5fa' },
]

const RATINGS = [5, 4, 3, 2, 1]

const PRICE_PRESETS = [
  { label: 'Under $100', min: 0, max: 100 },
  { label: '$100 - $300', min: 100, max: 300 },
  { label: '$300 - $500', min: 300, max: 500 },
  { label: '$500 - $800', min: 500, max: 800 },
  { label: 'Over $800', min: 800, max: 10000 },
]

export function CatalogFilters({
  onFiltersChange,
  initialFilters,
  productCount,
}: CatalogFiltersProps) {
  const [filters, setFilters] = useState<CatalogFiltersState>({
    ...defaultFiltersState,
    ...initialFilters,
  })

  // Mobile state
  const [isMobileOpen, setIsMobileOpen] = useState(false)

  // Collapsible sections state
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    categories: true,
    price: true,
    ratings: false,
    manufacturers: false,
    decades: false,
    conditions: false,
    availability: false,
  })

  // Count active filters
  const activeFilterCount =
    filters.categories.length +
    filters.ratings.length +
    filters.manufacturers.length +
    filters.decades.length +
    filters.conditions.length +
    filters.availability.length +
    (filters.priceRange.min > 0 || filters.priceRange.max < 1000 ? 1 : 0)

  // Toggle section
  const toggleSection = useCallback((section: string) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section],
    }))
  }, [])

  // Handle checkbox toggle
  const handleCheckboxToggle = useCallback((
    filterType: keyof Pick<CatalogFiltersState, 'categories' | 'manufacturers' | 'decades' | 'conditions' | 'availability'>,
    value: string
  ) => {
    setFilters(prev => ({
      ...prev,
      [filterType]: prev[filterType].includes(value)
        ? prev[filterType].filter(v => v !== value)
        : [...prev[filterType], value],
    }))
  }, [])

  // Handle rating toggle
  const handleRatingToggle = useCallback((rating: number) => {
    setFilters(prev => ({
      ...prev,
      ratings: prev.ratings.includes(rating)
        ? prev.ratings.filter(r => r !== rating)
        : [...prev.ratings, rating],
    }))
  }, [])

  // Handle price range change
  const handlePriceChange = useCallback((type: 'min' | 'max', value: number) => {
    setFilters(prev => ({
      ...prev,
      priceRange: {
        ...prev.priceRange,
        [type]: value,
      },
    }))
  }, [])

  // Handle price preset
  const handlePricePreset = useCallback((preset: typeof PRICE_PRESETS[0]) => {
    setFilters(prev => ({
      ...prev,
      priceRange: { min: preset.min, max: preset.max },
    }))
  }, [])

  // Clear all filters
  const handleClearAll = useCallback(() => {
    setFilters(defaultFiltersState)
  }, [])

  // Apply filters
  const handleApply = useCallback(() => {
    onFiltersChange(filters)
    setIsMobileOpen(false)
  }, [filters, onFiltersChange])

  // Auto-apply filters on change (with debounce effect)
  useEffect(() => {
    const timeout = setTimeout(() => {
      onFiltersChange(filters)
    }, 300)
    return () => clearTimeout(timeout)
  }, [filters, onFiltersChange])

  // Render star rating
  const renderStars = (rating: number) => {
    return (
      <div className="catalog-filters__stars">
        {[...Array(5)].map((_, i) => (
          <svg
            key={i}
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill={i < rating ? '#FFB800' : 'none'}
            stroke={i < rating ? '#FFB800' : '#444'}
            strokeWidth="2"
          >
            <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
          </svg>
        ))}
        <span className="catalog-filters__rating-text">& up</span>
      </div>
    )
  }

  // Section header component
  const SectionHeader = ({
    id,
    title,
    count
  }: {
    id: string
    title: string
    count?: number
  }) => (
    <button
      className="catalog-filters__section-header"
      onClick={() => toggleSection(id)}
      aria-expanded={expandedSections[id]}
    >
      <span className="catalog-filters__section-title">{title}</span>
      {count !== undefined && count > 0 && (
        <span className="catalog-filters__section-badge">{count}</span>
      )}
      <svg
        className={`catalog-filters__section-chevron ${expandedSections[id] ? 'catalog-filters__section-chevron--open' : ''}`}
        width="16"
        height="16"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
      >
        <path d="M6 9l6 6 6-6" />
      </svg>
    </button>
  )

  const filtersContent = (
    <div className="catalog-filters__content">
      {/* Categories Section */}
      <div className="catalog-filters__section">
        <SectionHeader
          id="categories"
          title="Categories"
          count={filters.categories.length}
        />
        {expandedSections.categories && (
          <div className="catalog-filters__section-body">
            {CATEGORIES.map(category => (
              <label key={category.id} className="catalog-filters__checkbox">
                <input
                  type="checkbox"
                  checked={filters.categories.includes(category.id)}
                  onChange={() => handleCheckboxToggle('categories', category.id)}
                />
                <span className="catalog-filters__checkbox-mark" />
                <span className="catalog-filters__checkbox-label">{category.label}</span>
                <span className="catalog-filters__checkbox-count">({category.count})</span>
              </label>
            ))}
          </div>
        )}
      </div>

      {/* Price Range Section */}
      <div className="catalog-filters__section">
        <SectionHeader
          id="price"
          title="Price Range"
          count={filters.priceRange.min > 0 || filters.priceRange.max < 1000 ? 1 : 0}
        />
        {expandedSections.price && (
          <div className="catalog-filters__section-body">
            <div className="catalog-filters__price-presets">
              {PRICE_PRESETS.map(preset => (
                <button
                  key={preset.label}
                  className={`catalog-filters__price-preset ${
                    filters.priceRange.min === preset.min && filters.priceRange.max === preset.max
                      ? 'catalog-filters__price-preset--active'
                      : ''
                  }`}
                  onClick={() => handlePricePreset(preset)}
                >
                  {preset.label}
                </button>
              ))}
            </div>
            <div className="catalog-filters__price-inputs">
              <div className="catalog-filters__price-field">
                <label>Min</label>
                <div className="catalog-filters__price-input-wrapper">
                  <span className="catalog-filters__price-symbol">$</span>
                  <input
                    type="number"
                    min="0"
                    max={filters.priceRange.max}
                    value={filters.priceRange.min}
                    onChange={e => handlePriceChange('min', Number(e.target.value))}
                  />
                </div>
              </div>
              <span className="catalog-filters__price-separator">-</span>
              <div className="catalog-filters__price-field">
                <label>Max</label>
                <div className="catalog-filters__price-input-wrapper">
                  <span className="catalog-filters__price-symbol">$</span>
                  <input
                    type="number"
                    min={filters.priceRange.min}
                    value={filters.priceRange.max}
                    onChange={e => handlePriceChange('max', Number(e.target.value))}
                  />
                </div>
              </div>
            </div>
            {/* Price Range Slider */}
            <div className="catalog-filters__price-slider">
              <input
                type="range"
                min="0"
                max="1000"
                value={filters.priceRange.min}
                onChange={e => handlePriceChange('min', Number(e.target.value))}
                className="catalog-filters__range catalog-filters__range--min"
              />
              <input
                type="range"
                min="0"
                max="1000"
                value={filters.priceRange.max}
                onChange={e => handlePriceChange('max', Number(e.target.value))}
                className="catalog-filters__range catalog-filters__range--max"
              />
              <div
                className="catalog-filters__range-track"
                style={{
                  left: `${(filters.priceRange.min / 1000) * 100}%`,
                  right: `${100 - (filters.priceRange.max / 1000) * 100}%`,
                }}
              />
            </div>
          </div>
        )}
      </div>

      {/* Ratings Section */}
      <div className="catalog-filters__section">
        <SectionHeader
          id="ratings"
          title="Ratings"
          count={filters.ratings.length}
        />
        {expandedSections.ratings && (
          <div className="catalog-filters__section-body">
            {RATINGS.map(rating => (
              <label key={rating} className="catalog-filters__checkbox catalog-filters__checkbox--rating">
                <input
                  type="checkbox"
                  checked={filters.ratings.includes(rating)}
                  onChange={() => handleRatingToggle(rating)}
                />
                <span className="catalog-filters__checkbox-mark" />
                {renderStars(rating)}
              </label>
            ))}
          </div>
        )}
      </div>

      {/* Manufacturers Section */}
      <div className="catalog-filters__section">
        <SectionHeader
          id="manufacturers"
          title="Manufacturer"
          count={filters.manufacturers.length}
        />
        {expandedSections.manufacturers && (
          <div className="catalog-filters__section-body">
            {MANUFACTURERS.map(manufacturer => (
              <label key={manufacturer.id} className="catalog-filters__checkbox">
                <input
                  type="checkbox"
                  checked={filters.manufacturers.includes(manufacturer.id)}
                  onChange={() => handleCheckboxToggle('manufacturers', manufacturer.id)}
                />
                <span className="catalog-filters__checkbox-mark" />
                <span className="catalog-filters__checkbox-label">{manufacturer.label}</span>
              </label>
            ))}
          </div>
        )}
      </div>

      {/* Decades Section */}
      <div className="catalog-filters__section">
        <SectionHeader
          id="decades"
          title="Era"
          count={filters.decades.length}
        />
        {expandedSections.decades && (
          <div className="catalog-filters__section-body catalog-filters__section-body--chips">
            {DECADES.map(decade => (
              <button
                key={decade.id}
                className={`catalog-filters__chip ${
                  filters.decades.includes(decade.id) ? 'catalog-filters__chip--active' : ''
                }`}
                onClick={() => handleCheckboxToggle('decades', decade.id)}
              >
                {decade.label}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Condition Section */}
      <div className="catalog-filters__section">
        <SectionHeader
          id="conditions"
          title="Condition"
          count={filters.conditions.length}
        />
        {expandedSections.conditions && (
          <div className="catalog-filters__section-body catalog-filters__section-body--chips">
            {CONDITIONS.map(condition => (
              <button
                key={condition.id}
                className={`catalog-filters__chip catalog-filters__chip--status ${
                  filters.conditions.includes(condition.id) ? 'catalog-filters__chip--active' : ''
                }`}
                onClick={() => handleCheckboxToggle('conditions', condition.id)}
                style={{ '--status-color': condition.color } as React.CSSProperties}
              >
                <span
                  className="catalog-filters__chip-dot"
                  style={{ backgroundColor: condition.color }}
                />
                {condition.label}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Availability Section */}
      <div className="catalog-filters__section">
        <SectionHeader
          id="availability"
          title="Availability"
          count={filters.availability.length}
        />
        {expandedSections.availability && (
          <div className="catalog-filters__section-body catalog-filters__section-body--chips">
            {AVAILABILITY.map(item => (
              <button
                key={item.id}
                className={`catalog-filters__chip catalog-filters__chip--status ${
                  filters.availability.includes(item.id) ? 'catalog-filters__chip--active' : ''
                }`}
                onClick={() => handleCheckboxToggle('availability', item.id)}
                style={{ '--status-color': item.color } as React.CSSProperties}
              >
                <span
                  className="catalog-filters__chip-dot"
                  style={{ backgroundColor: item.color }}
                />
                {item.label}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Action Buttons */}
      <div className="catalog-filters__actions">
        <button
          className="catalog-filters__btn catalog-filters__btn--clear"
          onClick={handleClearAll}
          disabled={activeFilterCount === 0}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M18 6L6 18M6 6l12 12" />
          </svg>
          Clear All
        </button>
        <button
          className="catalog-filters__btn catalog-filters__btn--apply"
          onClick={handleApply}
        >
          Apply Filters
          {activeFilterCount > 0 && (
            <span className="catalog-filters__btn-badge">{activeFilterCount}</span>
          )}
        </button>
      </div>
    </div>
  )

  return (
    <>
      {/* Mobile Toggle Button */}
      <button
        className="catalog-filters__mobile-toggle"
        onClick={() => setIsMobileOpen(true)}
        aria-label="Open filters"
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" />
        </svg>
        <span>Filters</span>
        {activeFilterCount > 0 && (
          <span className="catalog-filters__mobile-badge">{activeFilterCount}</span>
        )}
      </button>

      {/* Desktop Sidebar */}
      <aside className="catalog-filters catalog-filters--desktop">
        <div className="catalog-filters__header">
          <div className="catalog-filters__header-title">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" />
            </svg>
            <span>Filters</span>
            {activeFilterCount > 0 && (
              <span className="catalog-filters__header-badge">{activeFilterCount}</span>
            )}
          </div>
          {productCount !== undefined && (
            <span className="catalog-filters__product-count">{productCount} products</span>
          )}
        </div>
        {filtersContent}
      </aside>

      {/* Mobile Drawer */}
      <div className={`catalog-filters__overlay ${isMobileOpen ? 'catalog-filters__overlay--visible' : ''}`}>
        <div
          className="catalog-filters__overlay-backdrop"
          onClick={() => setIsMobileOpen(false)}
        />
        <aside className={`catalog-filters catalog-filters--mobile ${isMobileOpen ? 'catalog-filters--mobile-open' : ''}`}>
          <div className="catalog-filters__header">
            <div className="catalog-filters__header-title">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" />
              </svg>
              <span>Filters</span>
              {activeFilterCount > 0 && (
                <span className="catalog-filters__header-badge">{activeFilterCount}</span>
              )}
            </div>
            <button
              className="catalog-filters__close"
              onClick={() => setIsMobileOpen(false)}
              aria-label="Close filters"
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M18 6L6 18M6 6l12 12" />
              </svg>
            </button>
          </div>
          {filtersContent}
        </aside>
      </div>
    </>
  )
}

export default CatalogFilters
