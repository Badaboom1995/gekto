import { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import './RecommendationBlock.css'

export interface RecommendationItem {
  id: string | number
  title: string
  description: string
  image?: string
  icon?: ReactNode
  link?: string
  badge?: string
  category?: string
  rating?: number
  price?: number
  originalPrice?: number // For showing discounts
  inStock?: boolean
}

interface RecommendationBlockProps {
  title?: string
  subtitle?: string
  items: RecommendationItem[]
  variant?: 'default' | 'compact' | 'featured' | 'horizontal'
  columns?: 2 | 3 | 4
  showNavigation?: boolean
  showQuickActions?: boolean
  onItemClick?: (item: RecommendationItem) => void
  onAddToCart?: (item: RecommendationItem) => void
  onQuickView?: (item: RecommendationItem) => void
  onAddToWishlist?: (item: RecommendationItem) => void
  viewAllLink?: string
  viewAllText?: string
}

// Default icon when no image or icon is provided
function DefaultIcon() {
  return (
    <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
    </svg>
  )
}

function StarIcon({ filled = true }: { filled?: boolean }) {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill={filled ? "#FFB800" : "none"}
      stroke="#FFB800"
      strokeWidth="2"
    >
      <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
    </svg>
  )
}

// Icon components for quick actions
function CartIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="9" cy="21" r="1"/>
      <circle cx="20" cy="21" r="1"/>
      <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/>
    </svg>
  )
}

function EyeIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
      <circle cx="12" cy="12" r="3"/>
    </svg>
  )
}

function HeartIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
    </svg>
  )
}

function RecommendationCard({
  item,
  variant,
  showQuickActions = true,
  onClick,
  onAddToCart,
  onQuickView,
  onAddToWishlist
}: {
  item: RecommendationItem
  variant: string
  showQuickActions?: boolean
  onClick?: (item: RecommendationItem) => void
  onAddToCart?: (item: RecommendationItem) => void
  onQuickView?: (item: RecommendationItem) => void
  onAddToWishlist?: (item: RecommendationItem) => void
}) {
  const handleClick = () => {
    onClick?.(item)
  }

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    onAddToCart?.(item)
  }

  const handleQuickView = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    onQuickView?.(item)
  }

  const handleAddToWishlist = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    onAddToWishlist?.(item)
  }

  const inStock = item.inStock !== false // Default to true if not specified

  const content = (
    <div
      className={`recommendation-card recommendation-card--${variant}`}
      onClick={!item.link ? handleClick : undefined}
      role={onClick && !item.link ? 'button' : undefined}
      tabIndex={onClick && !item.link ? 0 : undefined}
    >
      {/* Image/Icon Section */}
      <div className="recommendation-card__media">
        {item.badge && (
          <span className="recommendation-card__badge">{item.badge}</span>
        )}
        {item.category && (
          <span className="recommendation-card__category">{item.category}</span>
        )}
        {item.image ? (
          <img
            src={item.image}
            alt={item.title}
            className="recommendation-card__image"
            loading="lazy"
          />
        ) : (
          <div className="recommendation-card__icon">
            {item.icon || <DefaultIcon />}
          </div>
        )}
        <div className="recommendation-card__media-overlay" />

        {/* Quick Action Buttons on Hover */}
        {showQuickActions && (
          <div className="recommendation-card__quick-actions">
            <button
              className="recommendation-card__quick-btn"
              onClick={handleQuickView}
              title="Quick View"
              aria-label="Quick View"
            >
              <EyeIcon />
            </button>
            <button
              className="recommendation-card__quick-btn"
              onClick={handleAddToWishlist}
              title="Add to Wishlist"
              aria-label="Add to Wishlist"
            >
              <HeartIcon />
            </button>
          </div>
        )}
      </div>

      {/* Content Section */}
      <div className="recommendation-card__content">
        <h3 className="recommendation-card__title">{item.title}</h3>
        <p className="recommendation-card__description">{item.description}</p>

        {/* Meta Information */}
        <div className="recommendation-card__meta">
          {item.rating !== undefined && (
            <div className="recommendation-card__rating">
              <StarIcon />
              <span>{item.rating.toFixed(1)}</span>
            </div>
          )}
          <div className="recommendation-card__pricing">
            {item.originalPrice !== undefined && item.originalPrice > (item.price || 0) && (
              <span className="recommendation-card__original-price">
                ${item.originalPrice.toFixed(2)}
              </span>
            )}
            {item.price !== undefined && (
              <span className="recommendation-card__price">
                ${item.price.toFixed(2)}
              </span>
            )}
          </div>
        </div>

        {/* Stock Status */}
        {!inStock && (
          <div className="recommendation-card__stock recommendation-card__stock--out">
            Out of Stock
          </div>
        )}

        {/* Quick Actions / CTA */}
        {showQuickActions ? (
          <div className="recommendation-card__actions">
            <button
              className={`recommendation-card__add-to-cart ${!inStock ? 'recommendation-card__add-to-cart--disabled' : ''}`}
              onClick={handleAddToCart}
              disabled={!inStock}
            >
              <CartIcon />
              <span>{inStock ? 'Add to Cart' : 'Unavailable'}</span>
            </button>
          </div>
        ) : (
          <div className="recommendation-card__cta">
            <span className="recommendation-card__cta-text">
              Learn More
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M5 12h14M12 5l7 7-7 7"/>
              </svg>
            </span>
          </div>
        )}
      </div>

      {/* Hover Glow Effect */}
      <div className="recommendation-card__glow" />
    </div>
  )

  if (item.link) {
    return (
      <Link to={item.link} className="recommendation-card__link" onClick={handleClick}>
        {content}
      </Link>
    )
  }

  return content
}

export function RecommendationBlock({
  title = "Recommended for You",
  subtitle,
  items,
  variant = 'default',
  columns = 3,
  showNavigation = true,
  showQuickActions = true,
  onItemClick,
  onAddToCart,
  onQuickView,
  onAddToWishlist,
  viewAllLink,
  viewAllText = "View All",
}: RecommendationBlockProps) {
  return (
    <section className={`recommendation-block recommendation-block--${variant}`}>
      {/* Header */}
      <div className="recommendation-block__header">
        <div className="recommendation-block__header-text">
          <h2 className="recommendation-block__title">{title}</h2>
          {subtitle && (
            <p className="recommendation-block__subtitle">{subtitle}</p>
          )}
        </div>

        <div className="recommendation-block__header-actions">
          {viewAllLink && (
            <Link to={viewAllLink} className="recommendation-block__view-all">
              {viewAllText}
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M5 12h14M12 5l7 7-7 7"/>
              </svg>
            </Link>
          )}

          {showNavigation && items.length > columns && (
            <div className="recommendation-block__nav">
              <button
                className="recommendation-block__nav-btn"
                aria-label="Previous"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M15 18l-6-6 6-6"/>
                </svg>
              </button>
              <button
                className="recommendation-block__nav-btn"
                aria-label="Next"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M9 18l6-6-6-6"/>
                </svg>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Grid */}
      <div
        className="recommendation-block__grid"
        style={{ '--columns': columns } as React.CSSProperties}
      >
        {items.map((item) => (
          <RecommendationCard
            key={item.id}
            item={item}
            variant={variant}
            showQuickActions={showQuickActions}
            onClick={onItemClick}
            onAddToCart={onAddToCart}
            onQuickView={onQuickView}
            onAddToWishlist={onAddToWishlist}
          />
        ))}
      </div>

      {/* Empty State */}
      {items.length === 0 && (
        <div className="recommendation-block__empty">
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
            <circle cx="8.5" cy="8.5" r="1.5"/>
            <polyline points="21 15 16 10 5 21"/>
          </svg>
          <p>No recommendations available</p>
        </div>
      )}
    </section>
  )
}

export default RecommendationBlock
