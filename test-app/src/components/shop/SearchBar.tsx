import { useState, useEffect, useRef, useMemo } from 'react'

/** Product interface for search filtering */
export interface Product {
  id: string | number
  name: string
  category: string
  description: string
  tags?: string[]
}

export interface SearchBarProps {
  /** Callback fired when the debounced search value changes */
  onSearch: (query: string) => void
  /** Array of products to search through */
  products?: Product[]
  /** Placeholder text for the input */
  placeholder?: string
  /** Debounce delay in milliseconds (default: 300) */
  debounceMs?: number
}

// Inline styles with dark theme
const styles = {
  container: {
    backgroundColor: '#0a0a0a',
    padding: '16px',
    borderRadius: '8px',
  },
  inputWrapper: {
    position: 'relative' as const,
    display: 'flex',
    alignItems: 'center',
    width: '100%',
    backgroundColor: '#111',
    border: '1px solid #222',
    borderRadius: '8px',
    transition: 'border-color 0.2s ease',
  },
  inputWrapperFocused: {
    borderColor: '#444',
  },
  searchIcon: {
    position: 'absolute' as const,
    left: '12px',
    color: '#888',
    pointerEvents: 'none' as const,
    display: 'flex',
    alignItems: 'center',
  },
  input: {
    width: '100%',
    padding: '12px 40px 12px 40px',
    backgroundColor: 'transparent',
    color: 'white',
    border: 'none',
    outline: 'none',
    fontSize: '16px',
    borderRadius: '8px',
  },
  clearButton: {
    position: 'absolute' as const,
    right: '12px',
    color: '#888',
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    padding: '4px',
    borderRadius: '4px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'color 0.15s ease',
  },
  resultCount: {
    marginTop: '12px',
    color: '#888',
    fontSize: '14px',
  },
  queryHighlight: {
    color: 'white',
    fontWeight: 500 as const,
  },
}

/**
 * Filters products based on a search query
 * Searches across name, description, category, and tags
 */
function filterProducts(products: Product[], query: string): Product[] {
  if (!query.trim()) {
    return products
  }

  const lowercaseQuery = query.toLowerCase().trim()

  return products.filter((product) => {
    // Search in name
    if (product.name.toLowerCase().includes(lowercaseQuery)) {
      return true
    }

    // Search in description
    if (product.description.toLowerCase().includes(lowercaseQuery)) {
      return true
    }

    // Search in category
    if (product.category.toLowerCase().includes(lowercaseQuery)) {
      return true
    }

    // Search in tags
    if (product.tags && product.tags.some((tag) => tag.toLowerCase().includes(lowercaseQuery))) {
      return true
    }

    return false
  })
}

export function SearchBar({
  onSearch,
  products = [],
  placeholder = 'Search products...',
  debounceMs = 300,
}: SearchBarProps) {
  const [inputValue, setInputValue] = useState('')
  const [debouncedQuery, setDebouncedQuery] = useState('')
  const [isFocused, setIsFocused] = useState(false)
  const [isHoveringClear, setIsHoveringClear] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  // Debounced search with configurable delay
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      setDebouncedQuery(inputValue)
      onSearch(inputValue)
    }, debounceMs)

    return () => {
      clearTimeout(timeoutId)
    }
  }, [inputValue, onSearch, debounceMs])

  // Compute filtered products for result count display
  const filteredProducts = useMemo(() => {
    return filterProducts(products, debouncedQuery)
  }, [products, debouncedQuery])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputValue(e.target.value)
  }

  const handleClear = () => {
    setInputValue('')
    inputRef.current?.focus()
  }

  const showClearButton = inputValue.length > 0
  const showResultCount = debouncedQuery.trim().length > 0 && products.length > 0

  return (
    <div style={styles.container}>
      {/* Search Input Wrapper */}
      <div
        style={{
          ...styles.inputWrapper,
          ...(isFocused ? styles.inputWrapperFocused : {}),
        }}
      >
        {/* Search Icon (Magnifying Glass) */}
        <div style={styles.searchIcon}>
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <circle cx="11" cy="11" r="8" />
            <path d="m21 21-4.35-4.35" />
          </svg>
        </div>

        {/* Input Field */}
        <input
          ref={inputRef}
          type="text"
          style={styles.input}
          placeholder={placeholder}
          value={inputValue}
          onChange={handleChange}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          aria-label="Search products"
        />

        {/* Clear Button (X) */}
        {showClearButton && (
          <button
            type="button"
            style={{
              ...styles.clearButton,
              color: isHoveringClear ? 'white' : '#888',
            }}
            onClick={handleClear}
            onMouseEnter={() => setIsHoveringClear(true)}
            onMouseLeave={() => setIsHoveringClear(false)}
            aria-label="Clear search"
          >
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        )}
      </div>

      {/* Result Count Message */}
      {showResultCount && (
        <div style={styles.resultCount}>
          Showing{' '}
          <span style={styles.queryHighlight}>{filteredProducts.length}</span>{' '}
          {filteredProducts.length === 1 ? 'product' : 'products'} for{' '}
          <span style={styles.queryHighlight}>"{debouncedQuery}"</span>
        </div>
      )}
    </div>
  )
}

export default SearchBar
