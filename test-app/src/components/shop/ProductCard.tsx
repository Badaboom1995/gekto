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
}

export interface ProductCardProps {
  product: Product
  onAddToCart?: (product: Product) => void
  onBuyNow?: (product: Product) => void
}

function getPlaceholderImage(productId: string | number): string {
  return `https://picsum.photos/seed/${productId}/400/300`
}

function StarRating({ rating, reviews }: { rating: number; reviews: number }) {
  const stars = []
  const fullStars = Math.floor(rating)

  for (let i = 0; i < 5; i++) {
    stars.push(
      <svg
        key={i}
        style={{ width: 16, height: 16 }}
        viewBox="0 0 20 20"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"
          fill={i < fullStars ? '#facc15' : 'none'}
          stroke={i < fullStars ? '#facc15' : '#4b5563'}
          strokeWidth="1"
        />
      </svg>
    )
  }

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
      <div style={{ display: 'flex' }}>{stars}</div>
      <span style={{ color: '#9ca3af', fontSize: 14, marginLeft: 4 }}>({reviews})</span>
    </div>
  )
}

function formatPrice(price: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(price)
}

export function ProductCard({ product, onAddToCart, onBuyNow }: ProductCardProps) {
  const [imgError, setImgError] = useState(false)
  const [isHovered, setIsHovered] = useState(false)

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

  const imageSrc = imgError ? getPlaceholderImage(product.id) : product.image

  return (
    <div
      style={{
        backgroundColor: '#111',
        border: isHovered ? '1px solid rgba(255, 255, 255, 0.5)' : '1px solid #222',
        borderRadius: 8,
        overflow: 'hidden',
        transition: 'all 0.3s',
        boxShadow: isHovered ? '0 0 20px rgba(255, 255, 255, 0.1)' : 'none',
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div style={{ position: 'relative', overflow: 'hidden', backgroundColor: '#1a1a1a', aspectRatio: '4/3' }}>
        <img
          src={imageSrc}
          alt={product.name}
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            transition: 'transform 0.3s',
            transform: isHovered ? 'scale(1.05)' : 'scale(1)',
          }}
          loading="lazy"
          onError={() => setImgError(true)}
        />
      </div>

      <div style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 12 }}>
        <Link
          to={`/product/${product.id}`}
          style={{ color: 'white', textDecoration: 'none' }}
        >
          <h3 style={{
            fontSize: 16,
            fontWeight: 600,
            margin: 0,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
          }}>
            {product.name}
          </h3>
        </Link>

        <StarRating rating={product.rating} reviews={product.reviews} />

        <div style={{ color: 'white', fontSize: 18, fontWeight: 700 }}>
          {formatPrice(product.price)}
        </div>

        <div style={{ display: 'flex', gap: 8, paddingTop: 4 }}>
          <button
            type="button"
            onClick={handleAddToCart}
            style={{
              flex: 1,
              padding: '8px 12px',
              borderRadius: 6,
              border: '1px solid white',
              backgroundColor: 'transparent',
              color: 'white',
              fontSize: 14,
              fontWeight: 500,
              cursor: 'pointer',
              transition: 'background-color 0.2s',
            }}
            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.1)'}
            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
          >
            Add to Cart
          </button>
          <button
            type="button"
            onClick={handleBuyNow}
            style={{
              flex: 1,
              padding: '8px 12px',
              borderRadius: 6,
              border: 'none',
              backgroundColor: 'white',
              color: 'black',
              fontSize: 14,
              fontWeight: 500,
              cursor: 'pointer',
              transition: 'background-color 0.2s',
            }}
            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#e5e5e5'}
            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'white'}
          >
            Buy Now
          </button>
        </div>
      </div>
    </div>
  )
}

export default ProductCard
