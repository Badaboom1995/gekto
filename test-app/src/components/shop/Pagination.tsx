import { useMemo, CSSProperties } from 'react'

export interface PaginationProps {
  currentPage: number
  totalPages: number
  onPageChange: (page: number) => void
  itemsPerPage?: number
  itemsPerPageOptions?: number[]
  onItemsPerPageChange?: (itemsPerPage: number) => void
  showItemsPerPage?: boolean
  siblingCount?: number
  accentColor?: string
}

// Dark theme colors
const colors = {
  background: '#0a0a0a',
  buttonBg: '#111',
  border: '#222',
  text: '#fff',
  textMuted: '#888',
  accent: '#3b82f6', // Default accent color (blue)
}

// Inline styles
const styles: Record<string, CSSProperties> = {
  container: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '16px',
    padding: '16px',
    backgroundColor: colors.background,
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
  },
  controls: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  },
  button: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '6px',
    padding: '8px 12px',
    backgroundColor: colors.buttonBg,
    border: `1px solid ${colors.border}`,
    borderRadius: '6px',
    color: colors.text,
    fontSize: '14px',
    fontWeight: 500,
    cursor: 'pointer',
    transition: 'all 0.15s ease',
    outline: 'none',
  },
  buttonDisabled: {
    opacity: 0.4,
    cursor: 'not-allowed',
  },
  pageButton: {
    minWidth: '36px',
    height: '36px',
    padding: '0 10px',
  },
  pages: {
    display: 'flex',
    alignItems: 'center',
    gap: '4px',
  },
  ellipsis: {
    padding: '0 8px',
    color: colors.textMuted,
    fontSize: '14px',
    userSelect: 'none',
  },
  perPageContainer: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  },
  perPageLabel: {
    color: colors.textMuted,
    fontSize: '14px',
  },
  perPageSelect: {
    padding: '6px 10px',
    backgroundColor: colors.buttonBg,
    border: `1px solid ${colors.border}`,
    borderRadius: '6px',
    color: colors.text,
    fontSize: '14px',
    cursor: 'pointer',
    outline: 'none',
  },
}

// Generate page numbers with ellipsis
function generatePageNumbers(
  currentPage: number,
  totalPages: number,
  siblingCount: number = 1
): (number | 'ellipsis-start' | 'ellipsis-end')[] {
  const pages: (number | 'ellipsis-start' | 'ellipsis-end')[] = []

  if (totalPages <= 7) {
    for (let i = 1; i <= totalPages; i++) {
      pages.push(i)
    }
    return pages
  }

  pages.push(1)

  const leftSibling = Math.max(currentPage - siblingCount, 2)
  const rightSibling = Math.min(currentPage + siblingCount, totalPages - 1)

  if (leftSibling > 2) {
    pages.push('ellipsis-start')
  } else if (leftSibling === 2) {
    pages.push(2)
  }

  for (let i = leftSibling; i <= rightSibling; i++) {
    if (i !== 1 && i !== totalPages && !pages.includes(i)) {
      pages.push(i)
    }
  }

  if (rightSibling < totalPages - 1) {
    pages.push('ellipsis-end')
  } else if (rightSibling === totalPages - 1) {
    if (!pages.includes(totalPages - 1)) {
      pages.push(totalPages - 1)
    }
  }

  pages.push(totalPages)

  return pages
}

export function Pagination({
  currentPage,
  totalPages,
  onPageChange,
  itemsPerPage = 12,
  itemsPerPageOptions = [6, 12, 24, 48],
  onItemsPerPageChange,
  showItemsPerPage = true,
  siblingCount = 1,
  accentColor = colors.accent,
}: PaginationProps) {
  const pageNumbers = useMemo(
    () => generatePageNumbers(currentPage, totalPages, siblingCount),
    [currentPage, totalPages, siblingCount]
  )

  const isFirstPage = currentPage === 1
  const isLastPage = currentPage === totalPages

  const handlePrevious = () => {
    if (!isFirstPage) {
      onPageChange(currentPage - 1)
    }
  }

  const handleNext = () => {
    if (!isLastPage) {
      onPageChange(currentPage + 1)
    }
  }

  const handlePageClick = (page: number) => {
    if (page !== currentPage) {
      onPageChange(page)
    }
  }

  const handleItemsPerPageChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newValue = parseInt(e.target.value, 10)
    onItemsPerPageChange?.(newValue)
  }

  const getButtonStyle = (isActive = false, isDisabled = false): CSSProperties => ({
    ...styles.button,
    ...styles.pageButton,
    ...(isActive && {
      backgroundColor: accentColor,
      borderColor: accentColor,
      color: '#fff',
    }),
    ...(isDisabled && styles.buttonDisabled),
  })

  const getNavButtonStyle = (isDisabled: boolean): CSSProperties => ({
    ...styles.button,
    ...(isDisabled && styles.buttonDisabled),
  })

  return (
    <div style={styles.container}>
      <div style={styles.controls}>
        {/* Previous Button */}
        <button
          style={getNavButtonStyle(isFirstPage)}
          onClick={handlePrevious}
          disabled={isFirstPage}
          aria-label="Previous page"
          onMouseEnter={(e) => {
            if (!isFirstPage) {
              e.currentTarget.style.backgroundColor = colors.border
            }
          }}
          onMouseLeave={(e) => {
            if (!isFirstPage) {
              e.currentTarget.style.backgroundColor = colors.buttonBg
            }
          }}
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
            <path d="M15 18l-6-6 6-6" />
          </svg>
          <span>Previous</span>
        </button>

        {/* Page Numbers */}
        <div style={styles.pages}>
          {pageNumbers.map((page, index) => {
            if (page === 'ellipsis-start' || page === 'ellipsis-end') {
              return (
                <span key={page} style={styles.ellipsis}>
                  ...
                </span>
              )
            }

            const isActive = page === currentPage

            return (
              <button
                key={index}
                style={getButtonStyle(isActive)}
                onClick={() => handlePageClick(page)}
                aria-label={`Page ${page}`}
                aria-current={isActive ? 'page' : undefined}
                onMouseEnter={(e) => {
                  if (!isActive) {
                    e.currentTarget.style.backgroundColor = colors.border
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isActive) {
                    e.currentTarget.style.backgroundColor = colors.buttonBg
                  }
                }}
              >
                {page}
              </button>
            )
          })}
        </div>

        {/* Next Button */}
        <button
          style={getNavButtonStyle(isLastPage)}
          onClick={handleNext}
          disabled={isLastPage}
          aria-label="Next page"
          onMouseEnter={(e) => {
            if (!isLastPage) {
              e.currentTarget.style.backgroundColor = colors.border
            }
          }}
          onMouseLeave={(e) => {
            if (!isLastPage) {
              e.currentTarget.style.backgroundColor = colors.buttonBg
            }
          }}
        >
          <span>Next</span>
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
            <path d="M9 18l6-6-6-6" />
          </svg>
        </button>
      </div>

      {/* Items Per Page Selector */}
      {showItemsPerPage && onItemsPerPageChange && (
        <div style={styles.perPageContainer}>
          <label style={styles.perPageLabel} htmlFor="items-per-page">
            Items per page:
          </label>
          <select
            id="items-per-page"
            style={styles.perPageSelect}
            value={itemsPerPage}
            onChange={handleItemsPerPageChange}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = colors.border
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = colors.buttonBg
            }}
          >
            {itemsPerPageOptions.map(option => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </div>
      )}
    </div>
  )
}

export default Pagination
