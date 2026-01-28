import { useState } from 'react'
import { Link } from 'react-router-dom'

export interface Product {
  id: string | number
  name: string
  category: string
  price: number
  rating: number
  reviews: number
  image: string
  description: string
  tags?: string[]
}

export interface ProductCardProps {
  product: Product
  onAddToCart?: (product: Product) => void
  onBuyNow?: (product: Product) => void
}

const CATEGORY_COLORS: Record<string, string> = {
  computers: '#00d4ff',
  monitors: '#9c27b0',
  keyboards: '#4caf50',
  storage: '#ff9800',
  peripherals: '#e91e63',
  software: '#3f51b5',
  default: '#00d4ff',
}

function StarRating({ rating, reviews }: { rating: number; reviews: number }) {
  const stars = []
  const fullStars = Math.floor(rating)
  const hasHalfStar = rating % 1 >= 0.5

  const starStyle: React.CSSProperties = {
    fontSize: '14px',
    marginRight: '2px',
  }

  const filledStarStyle: React.CSSProperties = {
    ...starStyle,
    color: '#ffc107',
  }

  const emptyStarStyle: React.CSSProperties = {
    ...starStyle,
    color: '#444',
  }

  for (let i = 0; i < 5; i++) {
    if (i < fullStars) {
      stars.push(
        <span key={i} style={filledStarStyle}>
          ★
        </span>
      )
    } else if (i === fullStars && hasHalfStar) {
      stars.push(
        <span key={i} style={filledStarStyle}>
          ★
        </span>
      )
    } else {
      stars.push(
        <span key={i} style={emptyStarStyle}>
          ☆
        </span>
      )
    }
  }

  const containerStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    marginBottom: '12px',
  }

  const reviewCountStyle: React.CSSProperties = {
    color: '#888',
    fontSize: '12px',
  }

  return (
    <div style={containerStyle}>
      <div style={{ display: 'flex' }}>{stars}</div>
      <span style={reviewCountStyle}>({reviews} reviews)</span>
    </div>
  )
}

function formatPrice(price: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(price)
}

export function ProductCard({
  product,
  onAddToCart,
  onBuyNow,
}: ProductCardProps) {
  const { id, name, category, price, rating, reviews, image, description } = product
  const [isHovered, setIsHovered] = useState(false)
  const [isImageHovered, setIsImageHovered] = useState(false)
  const [isAddToCartHovered, setIsAddToCartHovered] = useState(false)
  const [isBuyNowHovered, setIsBuyNowHovered] = useState(false)

  const categoryColor = CATEGORY_COLORS[category.toLowerCase()] || CATEGORY_COLORS.default

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    onAddToCart?.(product)
  }

  const handleBuyNow = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    onBuyNow?.(product)
  }

  const cardStyle: React.CSSProperties = {
    backgroundColor: '#111',
    borderRadius: '12px',
    border: '1px solid #222',
    overflow: 'hidden',
    transition: 'transform 0.3s ease, box-shadow 0.3s ease, border-color 0.3s ease',
    transform: isHovered ? 'translateY(-4px)' : 'translateY(0)',
    boxShadow: isHovered
      ? '0 12px 40px rgba(0, 0, 0, 0.4)'
      : '0 4px 12px rgba(0, 0, 0, 0.2)',
    borderColor: isHovered ? '#333' : '#222',
    cursor: 'pointer',
  }

  const imageContainerStyle: React.CSSProperties = {
    position: 'relative',
    width: '100%',
    height: '200px',
    overflow: 'hidden',
    backgroundColor: '#0a0a0a',
  }

  const imageStyle: React.CSSProperties = {
    width: '100%',
    height: '100%',
    objectFit: 'cover',
    transition: 'transform 0.3s ease',
    transform: isImageHovered ? 'scale(1.1)' : 'scale(1)',
  }

  const categoryBadgeStyle: React.CSSProperties = {
    position: 'absolute',
    top: '12px',
    left: '12px',
    padding: '6px 12px',
    borderRadius: '20px',
    fontSize: '11px',
    fontWeight: 600,
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
    backgroundColor: `${categoryColor}20`,
    color: categoryColor,
    backdropFilter: 'blur(8px)',
  }

  const contentStyle: React.CSSProperties = {
    padding: '20px',
  }

  const productNameLinkStyle: React.CSSProperties = {
    textDecoration: 'none',
    color: 'inherit',
  }

  const productNameStyle: React.CSSProperties = {
    color: '#fff',
    fontSize: '16px',
    fontWeight: 600,
    margin: '0 0 8px 0',
    lineHeight: 1.4,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    display: '-webkit-box',
    WebkitLineClamp: 2,
    WebkitBoxOrient: 'vertical',
    transition: 'color 0.2s ease',
  }

  const descriptionStyle: React.CSSProperties = {
    color: '#888',
    fontSize: '13px',
    lineHeight: 1.5,
    margin: '0 0 12px 0',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    display: '-webkit-box',
    WebkitLineClamp: 2,
    WebkitBoxOrient: 'vertical',
  }

  const priceStyle: React.CSSProperties = {
    color: '#fff',
    fontSize: '24px',
    fontWeight: 700,
    marginBottom: '16px',
  }

  const actionsStyle: React.CSSProperties = {
    display: 'flex',
    gap: '10px',
  }

  const baseButtonStyle: React.CSSProperties = {
    flex: 1,
    padding: '12px 16px',
    borderRadius: '8px',
    fontSize: '13px',
    fontWeight: 600,
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    border: 'none',
  }

  const addToCartButtonStyle: React.CSSProperties = {
    ...baseButtonStyle,
    backgroundColor: isAddToCartHovered ? '#333' : '#222',
    color: '#fff',
    border: '1px solid #333',
  }

  const buyNowButtonStyle: React.CSSProperties = {
    ...baseButtonStyle,
    backgroundColor: isBuyNowHovered ? '#00b8d9' : '#00d4ff',
    color: '#000',
    transform: isBuyNowHovered ? 'scale(1.02)' : 'scale(1)',
  }

  return (
    <div
      style={cardStyle}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div
        style={imageContainerStyle}
        onMouseEnter={() => setIsImageHovered(true)}
        onMouseLeave={() => setIsImageHovered(false)}
      >
        <img
          src={image}
          alt={name}
          style={imageStyle}
          loading="lazy"
        />
        <span style={categoryBadgeStyle}>
          {category}
        </span>
      </div>

      <div style={contentStyle}>
        <Link to={`/product/${id}`} style={productNameLinkStyle}>
          <h3 style={productNameStyle}>{name}</h3>
        </Link>

        <p style={descriptionStyle}>{description}</p>

        <StarRating rating={rating} reviews={reviews} />

        <div style={priceStyle}>{formatPrice(price)}</div>

        <div style={actionsStyle}>
          <button
            style={addToCartButtonStyle}
            onClick={handleAddToCart}
            onMouseEnter={() => setIsAddToCartHovered(true)}
            onMouseLeave={() => setIsAddToCartHovered(false)}
            type="button"
          >
            Add to Cart
          </button>
          <button
            style={buyNowButtonStyle}
            onClick={handleBuyNow}
            onMouseEnter={() => setIsBuyNowHovered(true)}
            onMouseLeave={() => setIsBuyNowHovered(false)}
            type="button"
          >
            Buy Now
          </button>
        </div>
      </div>
    </div>
  )
}

export default ProductCard
