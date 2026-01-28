import { FilterState, PRICE_RANGE, RATING_OPTIONS, ERA_OPTIONS, CONDITION_OPTIONS } from '../types/filters'
import './AdvancedFilters.css'

interface AdvancedFiltersProps {
  filters: FilterState
  categories: string[]
  onUpdateFilter: <K extends keyof FilterState>(key: K, value: FilterState[K]) => void
  onClearFilters: () => void
  hasActiveFilters: boolean
}

export function AdvancedFilters({
  filters,
  categories,
  onUpdateFilter,
  onClearFilters,
  hasActiveFilters,
}: AdvancedFiltersProps) {
  const handleCategoryChange = (category: string) => {
    const newCategories = filters.categories.includes(category)
      ? filters.categories.filter(c => c !== category)
      : [...filters.categories, category]
    onUpdateFilter('categories', newCategories)
  }

  const handleConditionChange = (condition: string) => {
    const newConditions = filters.condition.includes(condition)
      ? filters.condition.filter(c => c !== condition)
      : [...filters.condition, condition]
    onUpdateFilter('condition', newConditions)
  }

  const handlePriceChange = (type: 'min' | 'max', value: number) => {
    const newRange: [number, number] = type === 'min' ? [value, filters.priceRange[1]] : [filters.priceRange[0], value]
    onUpdateFilter('priceRange', newRange)
  }

  return (
    <div className="advanced-filters">
      <div className="filters-header">
        <h3 className="filters-title">Filters</h3>
        {hasActiveFilters && (
          <button className="clear-filters-btn" onClick={onClearFilters}>
            Clear All
          </button>
        )}
      </div>

      {/* Categories */}
      <div className="filter-section">
        <h4 className="filter-section-title">Category</h4>
        <div className="filter-options">
          {categories.map(category => (
            <label key={category} className="filter-checkbox">
              <input
                type="checkbox"
                checked={filters.categories.includes(category)}
                onChange={() => handleCategoryChange(category)}
              />
              <span>{category}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Price Range */}
      <div className="filter-section">
        <h4 className="filter-section-title">Price Range</h4>
        <div className="price-range-inputs">
          <div className="price-input">
            <label>Min</label>
            <input
              type="number"
              min={PRICE_RANGE.min}
              max={PRICE_RANGE.max}
              value={filters.priceRange[0]}
              onChange={e => handlePriceChange('min', parseInt(e.target.value))}
              className="price-input-field"
            />
          </div>
          <div className="price-input">
            <label>Max</label>
            <input
              type="number"
              min={PRICE_RANGE.min}
              max={PRICE_RANGE.max}
              value={filters.priceRange[1]}
              onChange={e => handlePriceChange('max', parseInt(e.target.value))}
              className="price-input-field"
            />
          </div>
        </div>
        <input
          type="range"
          min={PRICE_RANGE.min}
          max={PRICE_RANGE.max}
          value={filters.priceRange[0]}
          onChange={e => handlePriceChange('min', parseInt(e.target.value))}
          className="price-slider"
        />
        <input
          type="range"
          min={PRICE_RANGE.min}
          max={PRICE_RANGE.max}
          value={filters.priceRange[1]}
          onChange={e => handlePriceChange('max', parseInt(e.target.value))}
          className="price-slider"
        />
        <div className="price-display">
          ${filters.priceRange[0]} - ${filters.priceRange[1]}
        </div>
      </div>

      {/* Rating */}
      <div className="filter-section">
        <h4 className="filter-section-title">Minimum Rating</h4>
        <div className="filter-options">
          <label className="filter-checkbox">
            <input
              type="radio"
              name="rating"
              checked={filters.minRating === 0}
              onChange={() => onUpdateFilter('minRating', 0)}
            />
            <span>All Ratings</span>
          </label>
          {RATING_OPTIONS.map(rating => (
            <label key={rating} className="filter-checkbox">
              <input
                type="radio"
                name="rating"
                checked={filters.minRating === rating}
                onChange={() => onUpdateFilter('minRating', rating)}
              />
              <span>
                {rating}+ ★
              </span>
            </label>
          ))}
        </div>
      </div>

      {/* Condition */}
      <div className="filter-section">
        <h4 className="filter-section-title">Condition</h4>
        <div className="filter-options">
          {CONDITION_OPTIONS.map(condition => (
            <label key={condition.value} className="filter-checkbox">
              <input
                type="checkbox"
                checked={filters.condition.includes(condition.value)}
                onChange={() => handleConditionChange(condition.value)}
              />
              <span>{condition.label}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Stock */}
      <div className="filter-section">
        <h4 className="filter-section-title">Availability</h4>
        <label className="filter-checkbox">
          <input
            type="checkbox"
            checked={filters.inStockOnly}
            onChange={e => onUpdateFilter('inStockOnly', e.target.checked)}
          />
          <span>In Stock Only</span>
        </label>
      </div>
    </div>
  )
}
