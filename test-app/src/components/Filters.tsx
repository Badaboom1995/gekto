import { useState, useCallback } from 'react'
import './Filters.css'

// Types for the filter configuration
export interface FilterCategory {
  id: string
  label: string
  count?: number
}

export interface FilterStatus {
  id: string
  label: string
  color?: string
}

export interface DateRange {
  startDate: string | null
  endDate: string | null
}

export interface FiltersState {
  categories: string[]
  dateRange: DateRange
  statuses: string[]
}

export interface FiltersConfig {
  categories?: FilterCategory[]
  statuses?: FilterStatus[]
  showDateRange?: boolean
  dateRangeLabel?: string
  categoriesLabel?: string
  statusesLabel?: string
}

export interface FiltersProps {
  config: FiltersConfig
  initialValues?: Partial<FiltersState>
  onApply: (filters: FiltersState) => void
  onClear?: () => void
  isCollapsible?: boolean
  defaultExpanded?: boolean
  title?: string
}

const defaultFiltersState: FiltersState = {
  categories: [],
  dateRange: { startDate: null, endDate: null },
  statuses: [],
}

// Quick date range presets
const DATE_PRESETS = [
  { label: 'Today', getValue: () => {
    const today = new Date().toISOString().split('T')[0]
    return { startDate: today, endDate: today }
  }},
  { label: 'Last 7 days', getValue: () => {
    const end = new Date()
    const start = new Date()
    start.setDate(start.getDate() - 7)
    return {
      startDate: start.toISOString().split('T')[0],
      endDate: end.toISOString().split('T')[0]
    }
  }},
  { label: 'Last 30 days', getValue: () => {
    const end = new Date()
    const start = new Date()
    start.setDate(start.getDate() - 30)
    return {
      startDate: start.toISOString().split('T')[0],
      endDate: end.toISOString().split('T')[0]
    }
  }},
  { label: 'This month', getValue: () => {
    const now = new Date()
    const start = new Date(now.getFullYear(), now.getMonth(), 1)
    const end = new Date(now.getFullYear(), now.getMonth() + 1, 0)
    return {
      startDate: start.toISOString().split('T')[0],
      endDate: end.toISOString().split('T')[0]
    }
  }},
  { label: 'This year', getValue: () => {
    const now = new Date()
    const start = new Date(now.getFullYear(), 0, 1)
    return {
      startDate: start.toISOString().split('T')[0],
      endDate: now.toISOString().split('T')[0]
    }
  }},
]

export function Filters({
  config,
  initialValues,
  onApply,
  onClear,
  isCollapsible = false,
  defaultExpanded = true,
  title = 'Filters',
}: FiltersProps) {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded)
  const [localFilters, setLocalFilters] = useState<FiltersState>({
    ...defaultFiltersState,
    ...initialValues,
  })
  const [activeSection, setActiveSection] = useState<string | null>(null)

  const {
    categories = [],
    statuses = [],
    showDateRange = true,
    dateRangeLabel = 'Date Range',
    categoriesLabel = 'Categories',
    statusesLabel = 'Status',
  } = config

  // Check if any filters are active
  const hasActiveFilters =
    localFilters.categories.length > 0 ||
    localFilters.statuses.length > 0 ||
    localFilters.dateRange.startDate !== null ||
    localFilters.dateRange.endDate !== null

  // Count active filters
  const activeFilterCount =
    localFilters.categories.length +
    localFilters.statuses.length +
    (localFilters.dateRange.startDate || localFilters.dateRange.endDate ? 1 : 0)

  const handleCategoryToggle = useCallback((categoryId: string) => {
    setLocalFilters(prev => ({
      ...prev,
      categories: prev.categories.includes(categoryId)
        ? prev.categories.filter(c => c !== categoryId)
        : [...prev.categories, categoryId],
    }))
  }, [])

  const handleStatusToggle = useCallback((statusId: string) => {
    setLocalFilters(prev => ({
      ...prev,
      statuses: prev.statuses.includes(statusId)
        ? prev.statuses.filter(s => s !== statusId)
        : [...prev.statuses, statusId],
    }))
  }, [])

  const handleDateChange = useCallback((type: 'startDate' | 'endDate', value: string) => {
    setLocalFilters(prev => ({
      ...prev,
      dateRange: {
        ...prev.dateRange,
        [type]: value || null,
      },
    }))
  }, [])

  const handleDatePreset = useCallback((preset: typeof DATE_PRESETS[0]) => {
    const range = preset.getValue()
    setLocalFilters(prev => ({
      ...prev,
      dateRange: range,
    }))
  }, [])

  const handleClearFilters = useCallback(() => {
    setLocalFilters(defaultFiltersState)
    onClear?.()
  }, [onClear])

  const handleApplyFilters = useCallback(() => {
    onApply(localFilters)
  }, [localFilters, onApply])

  const toggleSection = useCallback((section: string) => {
    setActiveSection(prev => prev === section ? null : section)
  }, [])

  return (
    <div className={`filters ${isExpanded ? 'filters--expanded' : 'filters--collapsed'}`}>
      {/* Header */}
      <div className="filters__header">
        <div className="filters__title-row">
          {isCollapsible ? (
            <button
              className="filters__toggle"
              onClick={() => setIsExpanded(!isExpanded)}
              aria-expanded={isExpanded}
            >
              <svg
                className={`filters__toggle-icon ${isExpanded ? 'filters__toggle-icon--rotated' : ''}`}
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path d="M6 9l6 6 6-6"/>
              </svg>
              <span className="filters__title">{title}</span>
              {activeFilterCount > 0 && (
                <span className="filters__badge">{activeFilterCount}</span>
              )}
            </button>
          ) : (
            <div className="filters__title-static">
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"/>
              </svg>
              <span className="filters__title">{title}</span>
              {activeFilterCount > 0 && (
                <span className="filters__badge">{activeFilterCount}</span>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Filter Content */}
      {isExpanded && (
        <div className="filters__content">
          {/* Categories Section */}
          {categories.length > 0 && (
            <div className="filters__section">
              <button
                className="filters__section-header"
                onClick={() => toggleSection('categories')}
                aria-expanded={activeSection === 'categories' || activeSection === null}
              >
                <span className="filters__section-title">{categoriesLabel}</span>
                {localFilters.categories.length > 0 && (
                  <span className="filters__section-count">{localFilters.categories.length}</span>
                )}
                <svg
                  className={`filters__section-icon ${activeSection === 'categories' || activeSection === null ? 'filters__section-icon--rotated' : ''}`}
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <path d="M6 9l6 6 6-6"/>
                </svg>
              </button>
              {(activeSection === 'categories' || activeSection === null) && (
                <div className="filters__section-content">
                  <div className="filters__options">
                    {categories.map(category => (
                      <label key={category.id} className="filters__checkbox">
                        <input
                          type="checkbox"
                          checked={localFilters.categories.includes(category.id)}
                          onChange={() => handleCategoryToggle(category.id)}
                        />
                        <span className="filters__checkbox-custom" />
                        <span className="filters__checkbox-label">{category.label}</span>
                        {category.count !== undefined && (
                          <span className="filters__checkbox-count">({category.count})</span>
                        )}
                      </label>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Date Range Section */}
          {showDateRange && (
            <div className="filters__section">
              <button
                className="filters__section-header"
                onClick={() => toggleSection('dateRange')}
                aria-expanded={activeSection === 'dateRange' || activeSection === null}
              >
                <span className="filters__section-title">{dateRangeLabel}</span>
                {(localFilters.dateRange.startDate || localFilters.dateRange.endDate) && (
                  <span className="filters__section-count">1</span>
                )}
                <svg
                  className={`filters__section-icon ${activeSection === 'dateRange' || activeSection === null ? 'filters__section-icon--rotated' : ''}`}
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <path d="M6 9l6 6 6-6"/>
                </svg>
              </button>
              {(activeSection === 'dateRange' || activeSection === null) && (
                <div className="filters__section-content">
                  <div className="filters__date-presets">
                    {DATE_PRESETS.map(preset => (
                      <button
                        key={preset.label}
                        className="filters__date-preset"
                        onClick={() => handleDatePreset(preset)}
                      >
                        {preset.label}
                      </button>
                    ))}
                  </div>
                  <div className="filters__date-inputs">
                    <div className="filters__date-field">
                      <label className="filters__date-label">From</label>
                      <input
                        type="date"
                        className="filters__date-input"
                        value={localFilters.dateRange.startDate || ''}
                        onChange={e => handleDateChange('startDate', e.target.value)}
                      />
                    </div>
                    <div className="filters__date-separator">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M5 12h14M12 5l7 7-7 7"/>
                      </svg>
                    </div>
                    <div className="filters__date-field">
                      <label className="filters__date-label">To</label>
                      <input
                        type="date"
                        className="filters__date-input"
                        value={localFilters.dateRange.endDate || ''}
                        onChange={e => handleDateChange('endDate', e.target.value)}
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Status Section */}
          {statuses.length > 0 && (
            <div className="filters__section">
              <button
                className="filters__section-header"
                onClick={() => toggleSection('statuses')}
                aria-expanded={activeSection === 'statuses' || activeSection === null}
              >
                <span className="filters__section-title">{statusesLabel}</span>
                {localFilters.statuses.length > 0 && (
                  <span className="filters__section-count">{localFilters.statuses.length}</span>
                )}
                <svg
                  className={`filters__section-icon ${activeSection === 'statuses' || activeSection === null ? 'filters__section-icon--rotated' : ''}`}
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <path d="M6 9l6 6 6-6"/>
                </svg>
              </button>
              {(activeSection === 'statuses' || activeSection === null) && (
                <div className="filters__section-content">
                  <div className="filters__options filters__options--status">
                    {statuses.map(status => (
                      <label key={status.id} className="filters__status-chip">
                        <input
                          type="checkbox"
                          checked={localFilters.statuses.includes(status.id)}
                          onChange={() => handleStatusToggle(status.id)}
                        />
                        <span
                          className="filters__status-chip-inner"
                          style={status.color ? { '--status-color': status.color } as React.CSSProperties : undefined}
                        >
                          <span
                            className="filters__status-dot"
                            style={status.color ? { backgroundColor: status.color } : undefined}
                          />
                          {status.label}
                        </span>
                      </label>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Action Buttons */}
          <div className="filters__actions">
            <button
              className="filters__btn filters__btn--clear"
              onClick={handleClearFilters}
              disabled={!hasActiveFilters}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M18 6L6 18M6 6l12 12"/>
              </svg>
              Clear All
            </button>
            <button
              className="filters__btn filters__btn--apply"
              onClick={handleApplyFilters}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M20 6L9 17l-5-5"/>
              </svg>
              Apply Filters
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

export default Filters
