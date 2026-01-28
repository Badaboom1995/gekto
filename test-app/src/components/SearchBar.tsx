import { useState, useCallback, useRef } from 'react'

export interface SearchBarProps {
  /** Callback fired when search value changes */
  onSearch: (query: string) => void
  /** Number of results to display */
  resultCount: number
  /** Current search query (for display in result count) */
  searchQuery: string
  /** Placeholder text for the input */
  placeholder?: string
  /** Whether the search bar is disabled */
  disabled?: boolean
  /** Whether to auto-focus the input on mount */
  autoFocus?: boolean
}

// Inline styles with dark theme
const styles = {
  container: {
    backgroundColor: '#0a0a0a',
    padding: '16px',
    borderRadius: '12px',
  } as React.CSSProperties,
  searchWrapper: {
    position: 'relative' as const,
    display: 'flex',
    alignItems: 'center',
    width: '100%',
    backgroundColor: '#111',
    border: '1px solid #222',
    borderRadius: '8px',
    transition: 'border-color 0.2s ease',
  } as React.CSSProperties,
  searchWrapperFocused: {
    borderColor: '#444',
  } as React.CSSProperties,
  searchWrapperDisabled: {
    opacity: 0.5,
    cursor: 'not-allowed',
  } as React.CSSProperties,
  iconWrapper: {
    position: 'absolute' as const,
    left: '12px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: '#888',
    pointerEvents: 'none' as const,
  } as React.CSSProperties,
  input: {
    width: '100%',
    padding: '12px 40px 12px 44px',
    backgroundColor: 'transparent',
    color: 'white',
    fontSize: '16px',
    border: 'none',
    outline: 'none',
    borderRadius: '8px',
  } as React.CSSProperties,
  clearButton: {
    position: 'absolute' as const,
    right: '8px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '6px',
    backgroundColor: 'transparent',
    border: 'none',
    borderRadius: '4px',
    color: '#888',
    cursor: 'pointer',
    transition: 'color 0.15s ease, background-color 0.15s ease',
  } as React.CSSProperties,
  clearButtonHover: {
    color: 'white',
    backgroundColor: '#333',
  } as React.CSSProperties,
  resultCount: {
    marginTop: '12px',
    fontSize: '14px',
    color: '#888',
  } as React.CSSProperties,
  resultCountHighlight: {
    color: 'white',
    fontWeight: 500,
  } as React.CSSProperties,
  query: {
    color: '#888',
    fontStyle: 'italic' as const,
  } as React.CSSProperties,
}

export function SearchBar({
  onSearch,
  resultCount,
  searchQuery,
  placeholder = 'Search by name, description, category, or tags...',
  disabled = false,
  autoFocus = false,
}: SearchBarProps) {
  const [inputValue, setInputValue] = useState('')
  const [isFocused, setIsFocused] = useState(false)
  const [isClearHovered, setIsClearHovered] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  // Handle input change
  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const newValue = e.target.value
      setInputValue(newValue)
      onSearch(newValue)
    },
    [onSearch]
  )

  // Handle clear button click
  const handleClear = useCallback(() => {
    setInputValue('')
    onSearch('')
    inputRef.current?.focus()
  }, [onSearch])

  // Handle key down events
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === 'Escape') {
        handleClear()
      }
    },
    [handleClear]
  )

  const showClearButton = inputValue.length > 0 && !disabled

  return (
    <div style={styles.container}>
      <div
        style={{
          ...styles.searchWrapper,
          ...(isFocused ? styles.searchWrapperFocused : {}),
          ...(disabled ? styles.searchWrapperDisabled : {}),
        }}
      >
        {/* Search Icon */}
        <div style={styles.iconWrapper}>
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
          onKeyDown={handleKeyDown}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          disabled={disabled}
          autoFocus={autoFocus}
          aria-label="Search products by name, description, category, or tags"
        />

        {/* Clear Button */}
        {showClearButton && (
          <button
            type="button"
            style={{
              ...styles.clearButton,
              ...(isClearHovered ? styles.clearButtonHover : {}),
            }}
            onClick={handleClear}
            onMouseEnter={() => setIsClearHovered(true)}
            onMouseLeave={() => setIsClearHovered(false)}
            aria-label="Clear search"
            tabIndex={-1}
          >
            <svg
              width="18"
              height="18"
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

      {/* Result Count */}
      <div style={styles.resultCount}>
        <span style={styles.resultCountHighlight}>
          Showing {resultCount} product{resultCount !== 1 ? 's' : ''}
        </span>
        {searchQuery.trim() && (
          <span style={styles.query}> for "{searchQuery.trim()}"</span>
        )}
      </div>
    </div>
  )
}

export default SearchBar
