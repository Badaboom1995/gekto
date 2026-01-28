import { useState, useCallback, useEffect, CSSProperties } from 'react'

// Types
export interface Category {
  id: string
  label: string
  count?: number
}

export interface PriceRange {
  min: number
  max: number
}

export type RatingFilter = 4 | 3 | 2 | 1 | null

export interface ActiveFilters {
  categories: string[]
  priceRange: PriceRange
  rating: RatingFilter
}

export interface FiltersSidebarProps {
  categories: Category[]
  onFilterChange: (filters: ActiveFilters) => void
  activeFilters: ActiveFilters
  maxPrice?: number
  title?: string
}

const RATING_OPTIONS: { value: RatingFilter; label: string; stars: number }[] = [
  { value: 4, label: '4+ Stars', stars: 4 },
  { value: 3, label: '3+ Stars', stars: 3 },
  { value: 2, label: '2+ Stars', stars: 2 },
  { value: 1, label: '1+ Star', stars: 1 },
]

// Dark theme colors
const colors = {
  background: '#0a0a0a',
  card: '#111',
  border: '#222',
  text: '#fff',
  textSecondary: '#888',
  accent: '#3b82f6',
  accentHover: '#2563eb',
  star: '#FFB800',
  starEmpty: '#444',
}

// Inline styles
const styles: Record<string, CSSProperties> = {
  // Sidebar container
  sidebar: {
    backgroundColor: colors.card,
    border: `1px solid ${colors.border}`,
    borderRadius: '12px',
    padding: '20px',
    width: '280px',
    color: colors.text,
    fontFamily: 'system-ui, -apple-system, sans-serif',
  },
  sidebarMobile: {
    position: 'fixed',
    top: 0,
    left: 0,
    height: '100vh',
    width: '300px',
    maxWidth: '85vw',
    zIndex: 1001,
    borderRadius: 0,
    overflowY: 'auto',
    transform: 'translateX(-100%)',
    transition: 'transform 0.3s ease',
  },
  sidebarMobileOpen: {
    transform: 'translateX(0)',
  },
  // Header
  header: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: '20px',
    paddingBottom: '16px',
    borderBottom: `1px solid ${colors.border}`,
  },
  headerTitle: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    fontSize: '18px',
    fontWeight: 600,
    margin: 0,
  },
  badge: {
    backgroundColor: colors.accent,
    color: colors.text,
    fontSize: '12px',
    fontWeight: 600,
    padding: '2px 8px',
    borderRadius: '12px',
    minWidth: '20px',
    textAlign: 'center' as const,
  },
  closeBtn: {
    background: 'none',
    border: 'none',
    color: colors.text,
    cursor: 'pointer',
    padding: '4px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  // Section
  section: {
    marginBottom: '24px',
  },
  sectionTitle: {
    fontSize: '14px',
    fontWeight: 600,
    color: colors.text,
    marginBottom: '12px',
    textTransform: 'uppercase' as const,
    letterSpacing: '0.5px',
  },
  // Checkbox/Radio options
  options: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '10px',
  },
  checkboxLabel: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    cursor: 'pointer',
    padding: '8px 12px',
    borderRadius: '8px',
    backgroundColor: colors.background,
    border: `1px solid ${colors.border}`,
    transition: 'border-color 0.2s, background-color 0.2s',
  },
  checkboxLabelHover: {
    borderColor: colors.accent,
  },
  hiddenInput: {
    position: 'absolute' as const,
    opacity: 0,
    width: 0,
    height: 0,
  },
  checkboxMark: {
    width: '18px',
    height: '18px',
    borderRadius: '4px',
    border: `2px solid ${colors.border}`,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
    transition: 'background-color 0.2s, border-color 0.2s',
  },
  checkboxMarkChecked: {
    backgroundColor: colors.accent,
    borderColor: colors.accent,
  },
  radioMark: {
    width: '18px',
    height: '18px',
    borderRadius: '50%',
    border: `2px solid ${colors.border}`,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
    transition: 'border-color 0.2s',
  },
  radioMarkChecked: {
    borderColor: colors.accent,
  },
  radioInner: {
    width: '10px',
    height: '10px',
    borderRadius: '50%',
    backgroundColor: colors.accent,
  },
  labelText: {
    flex: 1,
    fontSize: '14px',
  },
  count: {
    color: colors.textSecondary,
    fontSize: '12px',
  },
  // Price range
  priceInputs: {
    display: 'flex',
    alignItems: 'flex-end',
    gap: '12px',
    marginBottom: '16px',
  },
  priceField: {
    flex: 1,
  },
  priceLabel: {
    display: 'block',
    fontSize: '12px',
    color: colors.textSecondary,
    marginBottom: '6px',
  },
  priceInputWrapper: {
    display: 'flex',
    alignItems: 'center',
    backgroundColor: colors.background,
    border: `1px solid ${colors.border}`,
    borderRadius: '8px',
    padding: '0 12px',
  },
  priceSymbol: {
    color: colors.textSecondary,
    fontSize: '14px',
    marginRight: '4px',
  },
  priceInput: {
    width: '100%',
    padding: '10px 0',
    backgroundColor: 'transparent',
    border: 'none',
    color: colors.text,
    fontSize: '14px',
    outline: 'none',
  },
  priceSeparator: {
    color: colors.textSecondary,
    fontSize: '14px',
    paddingBottom: '10px',
  },
  // Range slider
  sliderContainer: {
    position: 'relative' as const,
    height: '20px',
    marginTop: '8px',
  },
  sliderTrack: {
    position: 'absolute' as const,
    top: '50%',
    left: 0,
    right: 0,
    height: '4px',
    backgroundColor: colors.border,
    borderRadius: '2px',
    transform: 'translateY(-50%)',
  },
  sliderProgress: {
    position: 'absolute' as const,
    top: '50%',
    height: '4px',
    backgroundColor: colors.accent,
    borderRadius: '2px',
    transform: 'translateY(-50%)',
  },
  rangeInput: {
    position: 'absolute' as const,
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    WebkitAppearance: 'none',
    appearance: 'none',
    background: 'transparent',
    pointerEvents: 'none',
    cursor: 'pointer',
  },
  // Stars
  stars: {
    display: 'flex',
    gap: '2px',
  },
  radioContent: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
  },
  // Clear button
  clearBtn: {
    width: '100%',
    padding: '12px 16px',
    backgroundColor: 'transparent',
    border: `1px solid ${colors.border}`,
    borderRadius: '8px',
    color: colors.text,
    fontSize: '14px',
    fontWeight: 500,
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
    transition: 'background-color 0.2s, border-color 0.2s',
  },
  clearBtnDisabled: {
    opacity: 0.5,
    cursor: 'not-allowed',
  },
  // Mobile toggle
  mobileToggle: {
    display: 'none',
    alignItems: 'center',
    gap: '8px',
    padding: '12px 16px',
    backgroundColor: colors.card,
    border: `1px solid ${colors.border}`,
    borderRadius: '8px',
    color: colors.text,
    fontSize: '14px',
    fontWeight: 500,
    cursor: 'pointer',
  },
  mobileBadge: {
    backgroundColor: colors.accent,
    color: colors.text,
    fontSize: '11px',
    fontWeight: 600,
    padding: '2px 6px',
    borderRadius: '10px',
    marginLeft: 'auto',
  },
  // Overlay
  overlay: {
    position: 'fixed' as const,
    inset: 0,
    zIndex: 1000,
    visibility: 'hidden' as const,
    opacity: 0,
    transition: 'opacity 0.3s, visibility 0.3s',
  },
  overlayVisible: {
    visibility: 'visible' as const,
    opacity: 1,
  },
  backdrop: {
    position: 'absolute' as const,
    inset: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
  },
  desktopSidebar: {
    position: 'sticky' as const,
    top: '20px',
  },
}

// CSS for range input styling (injected into document)
const rangeInputCSS = `
  .filters-range-input::-webkit-slider-thumb {
    -webkit-appearance: none;
    appearance: none;
    width: 16px;
    height: 16px;
    border-radius: 50%;
    background: ${colors.accent};
    cursor: pointer;
    pointer-events: auto;
    border: 2px solid ${colors.card};
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
  }
  .filters-range-input::-moz-range-thumb {
    width: 16px;
    height: 16px;
    border-radius: 50%;
    background: ${colors.accent};
    cursor: pointer;
    pointer-events: auto;
    border: 2px solid ${colors.card};
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
  }
  .filters-price-input::-webkit-outer-spin-button,
  .filters-price-input::-webkit-inner-spin-button {
    -webkit-appearance: none;
    margin: 0;
  }
  .filters-price-input[type=number] {
    -moz-appearance: textfield;
  }
  @media (max-width: 768px) {
    .filters-mobile-toggle {
      display: flex !important;
    }
    .filters-desktop-sidebar {
      display: none !important;
    }
  }
`

export function FiltersSidebar({
  categories,
  onFilterChange,
  activeFilters,
  maxPrice = 1000,
  title = 'Filters',
}: FiltersSidebarProps) {
  const [isMobileOpen, setIsMobileOpen] = useState(false)
  const [localPriceMin, setLocalPriceMin] = useState(activeFilters.priceRange.min.toString())
  const [localPriceMax, setLocalPriceMax] = useState(activeFilters.priceRange.max.toString())
  const [hoveredCategory, setHoveredCategory] = useState<string | null>(null)
  const [hoveredRating, setHoveredRating] = useState<RatingFilter | 'none'>('none')
  const [clearBtnHover, setClearBtnHover] = useState(false)

  // Inject CSS for range inputs
  useEffect(() => {
    const styleId = 'filters-sidebar-styles'
    if (!document.getElementById(styleId)) {
      const styleEl = document.createElement('style')
      styleEl.id = styleId
      styleEl.textContent = rangeInputCSS
      document.head.appendChild(styleEl)
    }
  }, [])

  // Sync local price state with props
  useEffect(() => {
    setLocalPriceMin(activeFilters.priceRange.min.toString())
    setLocalPriceMax(activeFilters.priceRange.max.toString())
  }, [activeFilters.priceRange.min, activeFilters.priceRange.max])

  // Count active filters
  const activeFilterCount =
    activeFilters.categories.length +
    (activeFilters.priceRange.min > 0 || activeFilters.priceRange.max < maxPrice ? 1 : 0) +
    (activeFilters.rating !== null ? 1 : 0)

  // Handle category toggle
  const handleCategoryToggle = useCallback(
    (categoryId: string) => {
      const newCategories = activeFilters.categories.includes(categoryId)
        ? activeFilters.categories.filter((id) => id !== categoryId)
        : [...activeFilters.categories, categoryId]
      onFilterChange({ ...activeFilters, categories: newCategories })
    },
    [activeFilters, onFilterChange]
  )

  // Handle price input blur (commit changes)
  const handlePriceBlur = useCallback(() => {
    const min = Math.max(0, parseInt(localPriceMin) || 0)
    const max = Math.min(maxPrice, parseInt(localPriceMax) || maxPrice)
    onFilterChange({
      ...activeFilters,
      priceRange: {
        min: Math.min(min, max),
        max: Math.max(min, max),
      },
    })
  }, [localPriceMin, localPriceMax, maxPrice, activeFilters, onFilterChange])

  // Handle slider change
  const handleSliderChange = useCallback(
    (type: 'min' | 'max', value: number) => {
      if (type === 'min') {
        const newMin = Math.min(value, activeFilters.priceRange.max)
        onFilterChange({ ...activeFilters, priceRange: { ...activeFilters.priceRange, min: newMin } })
      } else {
        const newMax = Math.max(value, activeFilters.priceRange.min)
        onFilterChange({ ...activeFilters, priceRange: { ...activeFilters.priceRange, max: newMax } })
      }
    },
    [activeFilters, onFilterChange]
  )

  // Handle rating change
  const handleRatingChange = useCallback(
    (rating: RatingFilter) => {
      onFilterChange({ ...activeFilters, rating })
    },
    [activeFilters, onFilterChange]
  )

  // Handle clear all
  const handleClearAll = useCallback(() => {
    onFilterChange({
      categories: [],
      priceRange: { min: 0, max: maxPrice },
      rating: null,
    })
    setIsMobileOpen(false)
  }, [maxPrice, onFilterChange])

  // Close mobile on escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isMobileOpen) {
        setIsMobileOpen(false)
      }
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [isMobileOpen])

  // Lock body scroll when mobile drawer is open
  useEffect(() => {
    if (isMobileOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => {
      document.body.style.overflow = ''
    }
  }, [isMobileOpen])

  // Render star icons
  const renderStars = (count: number) => (
    <div style={styles.stars}>
      {[...Array(5)].map((_, i) => (
        <svg
          key={i}
          width="14"
          height="14"
          viewBox="0 0 24 24"
          fill={i < count ? colors.star : 'none'}
          stroke={i < count ? colors.star : colors.starEmpty}
          strokeWidth="2"
        >
          <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
        </svg>
      ))}
    </div>
  )

  // Calculate slider progress position
  const sliderLeft = (activeFilters.priceRange.min / maxPrice) * 100
  const sliderRight = 100 - (activeFilters.priceRange.max / maxPrice) * 100

  const filtersContent = (
    <div>
      {/* Categories Section */}
      <div style={styles.section}>
        <h3 style={styles.sectionTitle}>Categories</h3>
        <div style={styles.options}>
          {categories.map((category) => {
            const isChecked = activeFilters.categories.includes(category.id)
            const isHovered = hoveredCategory === category.id
            return (
              <label
                key={category.id}
                style={{
                  ...styles.checkboxLabel,
                  ...(isHovered ? styles.checkboxLabelHover : {}),
                }}
                onMouseEnter={() => setHoveredCategory(category.id)}
                onMouseLeave={() => setHoveredCategory(null)}
              >
                <input
                  type="checkbox"
                  style={styles.hiddenInput}
                  checked={isChecked}
                  onChange={() => handleCategoryToggle(category.id)}
                />
                <span
                  style={{
                    ...styles.checkboxMark,
                    ...(isChecked ? styles.checkboxMarkChecked : {}),
                  }}
                >
                  {isChecked && (
                    <svg
                      width="12"
                      height="12"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="white"
                      strokeWidth="3"
                    >
                      <path d="M20 6L9 17l-5-5" />
                    </svg>
                  )}
                </span>
                <span style={styles.labelText}>{category.label}</span>
                {category.count !== undefined && (
                  <span style={styles.count}>({category.count})</span>
                )}
              </label>
            )
          })}
        </div>
      </div>

      {/* Price Range Section */}
      <div style={styles.section}>
        <h3 style={styles.sectionTitle}>Price Range</h3>
        <div style={styles.priceInputs}>
          <div style={styles.priceField}>
            <label style={styles.priceLabel}>Min</label>
            <div style={styles.priceInputWrapper}>
              <span style={styles.priceSymbol}>$</span>
              <input
                type="number"
                className="filters-price-input"
                min="0"
                max={maxPrice}
                value={localPriceMin}
                onChange={(e) => setLocalPriceMin(e.target.value)}
                onBlur={handlePriceBlur}
                onKeyDown={(e) => e.key === 'Enter' && handlePriceBlur()}
                style={styles.priceInput}
              />
            </div>
          </div>
          <span style={styles.priceSeparator}>-</span>
          <div style={styles.priceField}>
            <label style={styles.priceLabel}>Max</label>
            <div style={styles.priceInputWrapper}>
              <span style={styles.priceSymbol}>$</span>
              <input
                type="number"
                className="filters-price-input"
                min="0"
                max={maxPrice}
                value={localPriceMax}
                onChange={(e) => setLocalPriceMax(e.target.value)}
                onBlur={handlePriceBlur}
                onKeyDown={(e) => e.key === 'Enter' && handlePriceBlur()}
                style={styles.priceInput}
              />
            </div>
          </div>
        </div>
        {/* Price Range Slider */}
        <div style={styles.sliderContainer}>
          <div style={styles.sliderTrack} />
          <div
            style={{
              ...styles.sliderProgress,
              left: `${sliderLeft}%`,
              right: `${sliderRight}%`,
            }}
          />
          <input
            type="range"
            className="filters-range-input"
            min="0"
            max={maxPrice}
            value={activeFilters.priceRange.min}
            onChange={(e) => handleSliderChange('min', Number(e.target.value))}
            style={styles.rangeInput}
          />
          <input
            type="range"
            className="filters-range-input"
            min="0"
            max={maxPrice}
            value={activeFilters.priceRange.max}
            onChange={(e) => handleSliderChange('max', Number(e.target.value))}
            style={styles.rangeInput}
          />
        </div>
      </div>

      {/* Rating Section */}
      <div style={styles.section}>
        <h3 style={styles.sectionTitle}>Rating</h3>
        <div style={styles.options}>
          {RATING_OPTIONS.map((option) => {
            const isChecked = activeFilters.rating === option.value
            const isHovered = hoveredRating === option.value
            return (
              <label
                key={option.label}
                style={{
                  ...styles.checkboxLabel,
                  ...(isHovered ? styles.checkboxLabelHover : {}),
                }}
                onMouseEnter={() => setHoveredRating(option.value)}
                onMouseLeave={() => setHoveredRating('none')}
              >
                <input
                  type="radio"
                  name="rating"
                  style={styles.hiddenInput}
                  checked={isChecked}
                  onChange={() => handleRatingChange(option.value)}
                />
                <span
                  style={{
                    ...styles.radioMark,
                    ...(isChecked ? styles.radioMarkChecked : {}),
                  }}
                >
                  {isChecked && <span style={styles.radioInner} />}
                </span>
                <span style={styles.radioContent}>
                  {renderStars(option.stars)}
                  <span style={{ fontSize: '14px' }}>& up</span>
                </span>
              </label>
            )
          })}
        </div>
      </div>

      {/* Clear All Button */}
      <button
        style={{
          ...styles.clearBtn,
          ...(activeFilterCount === 0 ? styles.clearBtnDisabled : {}),
          ...(clearBtnHover && activeFilterCount > 0
            ? { backgroundColor: colors.border }
            : {}),
        }}
        onClick={handleClearAll}
        disabled={activeFilterCount === 0}
        onMouseEnter={() => setClearBtnHover(true)}
        onMouseLeave={() => setClearBtnHover(false)}
      >
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        >
          <path d="M18 6L6 18M6 6l12 12" />
        </svg>
        Clear All Filters
      </button>
    </div>
  )

  return (
    <>
      {/* Mobile Toggle Button */}
      <button
        className="filters-mobile-toggle"
        style={styles.mobileToggle}
        onClick={() => setIsMobileOpen(true)}
        aria-label="Open filters"
      >
        <svg
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        >
          <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" />
        </svg>
        <span>Filters</span>
        {activeFilterCount > 0 && (
          <span style={styles.mobileBadge}>{activeFilterCount}</span>
        )}
      </button>

      {/* Desktop Sidebar */}
      <aside
        className="filters-desktop-sidebar"
        style={{ ...styles.sidebar, ...styles.desktopSidebar }}
      >
        <div style={styles.header}>
          <h2 style={styles.headerTitle}>
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" />
            </svg>
            <span>{title}</span>
            {activeFilterCount > 0 && (
              <span style={styles.badge}>{activeFilterCount}</span>
            )}
          </h2>
        </div>
        {filtersContent}
      </aside>

      {/* Mobile Overlay & Drawer */}
      <div
        style={{
          ...styles.overlay,
          ...(isMobileOpen ? styles.overlayVisible : {}),
        }}
      >
        <div
          style={styles.backdrop}
          onClick={() => setIsMobileOpen(false)}
          aria-hidden="true"
        />
        <aside
          style={{
            ...styles.sidebar,
            ...styles.sidebarMobile,
            ...(isMobileOpen ? styles.sidebarMobileOpen : {}),
          }}
        >
          <div style={styles.header}>
            <h2 style={styles.headerTitle}>
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" />
              </svg>
              <span>{title}</span>
              {activeFilterCount > 0 && (
                <span style={styles.badge}>{activeFilterCount}</span>
              )}
            </h2>
            <button
              style={styles.closeBtn}
              onClick={() => setIsMobileOpen(false)}
              aria-label="Close filters"
            >
              <svg
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
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

export default FiltersSidebar
