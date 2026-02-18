import { useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import './ProductDetailPage.css'

// Extended product interface for detail page
export interface ProductDetail {
  id: number
  name: string
  category: string
  price: number
  originalPrice?: number
  rating: number
  reviews: number
  image: string
  images: string[]
  description: string
  specifications: { label: string; value: string }[]
  features: string[]
  inStock: boolean
  stockCount?: number
}

export interface Review {
  id: number
  author: string
  avatar: string
  rating: number
  date: string
  title: string
  content: string
  helpful: number
  verified: boolean
}

// Sample product data - this would typically come from an API
const productDetails: Record<number, ProductDetail> = {
  1: {
    id: 1,
    name: 'Commodore 64',
    category: 'Home',
    price: 299.00,
    originalPrice: 349.00,
    rating: 4.8,
    reviews: 2400,
    image: 'https://upload.wikimedia.org/wikipedia/commons/thumb/e/e9/Commodore-64-Computer-FL.jpg/1200px-Commodore-64-Computer-FL.jpg',
    images: [
      'https://upload.wikimedia.org/wikipedia/commons/thumb/e/e9/Commodore-64-Computer-FL.jpg/1200px-Commodore-64-Computer-FL.jpg',
      'https://upload.wikimedia.org/wikipedia/commons/thumb/3/3f/Commodore_64_with_1541_and_1084S.jpg/1200px-Commodore_64_with_1541_and_1084S.jpg',
      'https://upload.wikimedia.org/wikipedia/commons/thumb/1/1a/C64c_system.jpg/1200px-C64c_system.jpg',
    ],
    description: 'The Commodore 64, also known as the C64, is an 8-bit home computer introduced in January 1982 by Commodore International. It is listed in the Guinness World Records as the highest-selling single computer model of all time, with independent estimates placing the number sold between 12.5 and 17 million units.',
    specifications: [
      { label: 'CPU', value: 'MOS Technology 6510 @ 1.023 MHz' },
      { label: 'RAM', value: '64 KB' },
      { label: 'ROM', value: '20 KB' },
      { label: 'Graphics', value: 'VIC-II (320×200, 16 colors)' },
      { label: 'Sound', value: 'SID 6581 (3-channel synthesizer)' },
      { label: 'Storage', value: 'Cassette, 5.25" floppy disk' },
      { label: 'Year Released', value: '1982' },
      { label: 'Condition', value: 'Fully Restored' },
    ],
    features: [
      'Fully tested and restored to working condition',
      'Original keyboard with all keys functional',
      'Includes power supply and video cables',
      'Clean, yellowing-free case',
      '90-day warranty included',
    ],
    inStock: true,
    stockCount: 3,
  },
  2: {
    id: 2,
    name: 'Apple II',
    category: 'Home',
    price: 449.00,
    rating: 4.9,
    reviews: 1800,
    image: 'https://upload.wikimedia.org/wikipedia/commons/thumb/9/98/Apple_II_typical_configuration_1977.png/1200px-Apple_II_typical_configuration_1977.png',
    images: [
      'https://upload.wikimedia.org/wikipedia/commons/thumb/9/98/Apple_II_typical_configuration_1977.png/1200px-Apple_II_typical_configuration_1977.png',
    ],
    description: 'The Apple II is an 8-bit home computer and one of the first highly successful mass-produced microcomputer products, designed primarily by Steve Wozniak. It was introduced by Jobs and Wozniak at the 1977 West Coast Computer Faire.',
    specifications: [
      { label: 'CPU', value: 'MOS Technology 6502 @ 1 MHz' },
      { label: 'RAM', value: '4-48 KB (expandable)' },
      { label: 'ROM', value: '12 KB' },
      { label: 'Graphics', value: '280×192, 6 colors' },
      { label: 'Sound', value: '1-bit speaker' },
      { label: 'Year Released', value: '1977' },
      { label: 'Condition', value: 'Excellent' },
    ],
    features: [
      'Original Apple II with Integer BASIC',
      'Fully functional disk drive',
      'Includes original documentation',
      'Cleaned and tested',
    ],
    inStock: true,
    stockCount: 1,
  },
}

// Sample reviews data
const sampleReviews: Review[] = [
  {
    id: 1,
    author: 'RetroEnthusiast',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=retro1',
    rating: 5,
    date: '2024-01-15',
    title: 'Perfect restoration!',
    content: 'Received my C64 in perfect condition. The restoration work is top-notch - every key works, the case is pristine, and it boots up just like I remember from my childhood. The seller even included some classic games on a floppy disk!',
    helpful: 24,
    verified: true,
  },
  {
    id: 2,
    author: 'VintageCollector',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=retro2',
    rating: 5,
    date: '2024-01-10',
    title: 'A trip down memory lane',
    content: 'Excellent quality and fast shipping. The computer was packaged very securely. Already spent hours playing old games and teaching my kids about computing history.',
    helpful: 18,
    verified: true,
  },
  {
    id: 3,
    author: 'TechHistorian',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=retro3',
    rating: 4,
    date: '2024-01-05',
    title: 'Great computer, minor cosmetic issue',
    content: 'The computer works perfectly and I\'m very happy with the purchase. Only giving 4 stars because there was a small scratch on the case that wasn\'t mentioned in the listing. Otherwise, fantastic!',
    helpful: 12,
    verified: true,
  },
  {
    id: 4,
    author: 'C64Fan',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=retro4',
    rating: 5,
    date: '2023-12-28',
    title: 'Better than expected',
    content: 'This is my third purchase from ClassicPC and they never disappoint. The SID chip sounds amazing and brings back so many memories. The warranty gives peace of mind too.',
    helpful: 31,
    verified: true,
  },
]

// Default product for fallback
const defaultProduct: ProductDetail = {
  id: 0,
  name: 'Classic Computer',
  category: 'Vintage',
  price: 299.00,
  rating: 4.5,
  reviews: 100,
  image: 'https://upload.wikimedia.org/wikipedia/commons/thumb/e/e9/Commodore-64-Computer-FL.jpg/1200px-Commodore-64-Computer-FL.jpg',
  images: ['https://upload.wikimedia.org/wikipedia/commons/thumb/e/e9/Commodore-64-Computer-FL.jpg/1200px-Commodore-64-Computer-FL.jpg'],
  description: 'A classic vintage computer in restored condition.',
  specifications: [],
  features: [],
  inStock: true,
}

function StarRating({ rating, size = 16 }: { rating: number; size?: number }) {
  const fullStars = Math.floor(rating)
  const hasHalfStar = rating % 1 >= 0.5
  const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0)

  return (
    <div className="star-rating">
      {[...Array(fullStars)].map((_, i) => (
        <svg key={`full-${i}`} width={size} height={size} viewBox="0 0 24 24" fill="#FFB800" stroke="#FFB800" strokeWidth="2">
          <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
        </svg>
      ))}
      {hasHalfStar && (
        <svg width={size} height={size} viewBox="0 0 24 24" strokeWidth="2">
          <defs>
            <linearGradient id="half-star">
              <stop offset="50%" stopColor="#FFB800"/>
              <stop offset="50%" stopColor="transparent"/>
            </linearGradient>
          </defs>
          <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" fill="url(#half-star)" stroke="#FFB800"/>
        </svg>
      )}
      {[...Array(emptyStars)].map((_, i) => (
        <svg key={`empty-${i}`} width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="#555" strokeWidth="2">
          <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
        </svg>
      ))}
    </div>
  )
}

function ImageGallery({ images, productName }: { images: string[]; productName: string }) {
  const [selectedImage, setSelectedImage] = useState(0)

  return (
    <div className="image-gallery">
      <div className="main-image-container">
        <img
          src={images[selectedImage]}
          alt={`${productName} - Image ${selectedImage + 1}`}
          className="main-image"
        />
        {images.length > 1 && (
          <>
            <button
              className="gallery-nav prev"
              onClick={() => setSelectedImage((prev) => (prev === 0 ? images.length - 1 : prev - 1))}
              aria-label="Previous image"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M15 18l-6-6 6-6"/>
              </svg>
            </button>
            <button
              className="gallery-nav next"
              onClick={() => setSelectedImage((prev) => (prev === images.length - 1 ? 0 : prev + 1))}
              aria-label="Next image"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M9 18l6-6-6-6"/>
              </svg>
            </button>
          </>
        )}
      </div>
      {images.length > 1 && (
        <div className="thumbnail-strip">
          {images.map((img, index) => (
            <button
              key={index}
              className={`thumbnail ${selectedImage === index ? 'active' : ''}`}
              onClick={() => setSelectedImage(index)}
            >
              <img src={img} alt={`${productName} thumbnail ${index + 1}`} />
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

function ReviewCard({ review }: { review: Review }) {
  const [helpfulCount, setHelpfulCount] = useState(review.helpful)
  const [hasVoted, setHasVoted] = useState(false)

  const handleHelpful = () => {
    if (!hasVoted) {
      setHelpfulCount((prev) => prev + 1)
      setHasVoted(true)
    }
  }

  return (
    <div className="review-card">
      <div className="review-header">
        <div className="review-author">
          <img src={review.avatar} alt={review.author} className="review-avatar" />
          <div className="review-author-info">
            <span className="review-author-name">
              {review.author}
              {review.verified && (
                <span className="verified-badge">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="#22c55e" stroke="#22c55e" strokeWidth="2">
                    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
                    <polyline points="22 4 12 14.01 9 11.01"/>
                  </svg>
                  Verified Purchase
                </span>
              )}
            </span>
            <span className="review-date">{new Date(review.date).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</span>
          </div>
        </div>
        <StarRating rating={review.rating} size={14} />
      </div>
      <h4 className="review-title">{review.title}</h4>
      <p className="review-content">{review.content}</p>
      <div className="review-footer">
        <button
          className={`helpful-btn ${hasVoted ? 'voted' : ''}`}
          onClick={handleHelpful}
          disabled={hasVoted}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3zM7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3"/>
          </svg>
          Helpful ({helpfulCount})
        </button>
      </div>
    </div>
  )
}

function QuantitySelector({ quantity, onChange, max = 10 }: { quantity: number; onChange: (q: number) => void; max?: number }) {
  return (
    <div className="quantity-selector">
      <button
        className="quantity-btn"
        onClick={() => onChange(Math.max(1, quantity - 1))}
        disabled={quantity <= 1}
      >
        −
      </button>
      <span className="quantity-value">{quantity}</span>
      <button
        className="quantity-btn"
        onClick={() => onChange(Math.min(max, quantity + 1))}
        disabled={quantity >= max}
      >
        +
      </button>
    </div>
  )
}

export default function ProductDetailPage() {
  const { id } = useParams<{ id: string }>()
  const productId = parseInt(id || '1', 10)
  const product = productDetails[productId] || defaultProduct

  const [quantity, setQuantity] = useState(1)
  const [activeTab, setActiveTab] = useState<'description' | 'specifications' | 'reviews'>('description')
  const [addedToCart, setAddedToCart] = useState(false)

  const handleAddToCart = () => {
    // In a real app, this would dispatch to a cart context/store
    setAddedToCart(true)
    setTimeout(() => setAddedToCart(false), 2000)
    console.log(`Added ${quantity}x ${product.name} to cart`)
  }

  const handleBuyNow = () => {
    handleAddToCart()
    // In a real app, this would navigate to checkout
    console.log('Proceeding to checkout...')
  }

  const discount = product.originalPrice
    ? Math.round((1 - product.price / product.originalPrice) * 100)
    : 0

  return (
    <div className="product-detail-page">
      {/* Breadcrumb */}
      <nav className="breadcrumb">
        <Link to="/">Catalog</Link>
        <span className="breadcrumb-separator">/</span>
        <span>{product.category}</span>
        <span className="breadcrumb-separator">/</span>
        <span className="breadcrumb-current">{product.name}</span>
      </nav>

      {/* Main Product Section */}
      <div className="product-detail-main">
        <ImageGallery images={product.images} productName={product.name} />

        <div className="product-detail-info">
          <div className="product-detail-header">
            <span className="product-detail-category">{product.category}</span>
            {product.inStock ? (
              <span className="stock-badge in-stock">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polyline points="20 6 9 17 4 12"/>
                </svg>
                In Stock {product.stockCount && `(${product.stockCount} left)`}
              </span>
            ) : (
              <span className="stock-badge out-of-stock">Out of Stock</span>
            )}
          </div>

          <h1 className="product-detail-name">{product.name}</h1>

          <div className="product-detail-rating">
            <StarRating rating={product.rating} size={18} />
            <span className="rating-text">
              {product.rating} ({(product.reviews / 1000).toFixed(1)}k reviews)
            </span>
          </div>

          <div className="product-detail-price">
            <span className="current-price">${product.price.toFixed(2)}</span>
            {product.originalPrice && (
              <>
                <span className="original-price">${product.originalPrice.toFixed(2)}</span>
                <span className="discount-badge">-{discount}%</span>
              </>
            )}
          </div>

          <p className="product-detail-description">{product.description}</p>

          {product.features.length > 0 && (
            <ul className="product-features">
              {product.features.map((feature, index) => (
                <li key={index}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="2">
                    <polyline points="20 6 9 17 4 12"/>
                  </svg>
                  {feature}
                </li>
              ))}
            </ul>
          )}

          <div className="product-detail-actions">
            <div className="quantity-wrapper">
              <label className="quantity-label">Quantity</label>
              <QuantitySelector
                quantity={quantity}
                onChange={setQuantity}
                max={product.stockCount || 10}
              />
            </div>

            <div className="action-buttons">
              <button
                className={`btn btn-outline add-to-cart-btn ${addedToCart ? 'added' : ''}`}
                onClick={handleAddToCart}
                disabled={!product.inStock}
              >
                {addedToCart ? (
                  <>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <polyline points="20 6 9 17 4 12"/>
                    </svg>
                    Added!
                  </>
                ) : (
                  <>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <circle cx="9" cy="21" r="1"/>
                      <circle cx="20" cy="21" r="1"/>
                      <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/>
                    </svg>
                    Add to Cart
                  </>
                )}
              </button>
              <button
                className="btn btn-primary buy-now-btn"
                onClick={handleBuyNow}
                disabled={!product.inStock}
              >
                Buy Now
              </button>
            </div>
          </div>

          <div className="product-guarantees">
            <div className="guarantee">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="1" y="3" width="15" height="13"/>
                <polygon points="16 8 20 8 23 11 23 16 16 16 16 8"/>
                <circle cx="5.5" cy="18.5" r="2.5"/>
                <circle cx="18.5" cy="18.5" r="2.5"/>
              </svg>
              <span>Free Shipping</span>
            </div>
            <div className="guarantee">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
              </svg>
              <span>90-Day Warranty</span>
            </div>
            <div className="guarantee">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="23 4 23 10 17 10"/>
                <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/>
              </svg>
              <span>30-Day Returns</span>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs Section */}
      <div className="product-tabs">
        <div className="tabs-header">
          <button
            className={`tab-btn ${activeTab === 'description' ? 'active' : ''}`}
            onClick={() => setActiveTab('description')}
          >
            Description
          </button>
          <button
            className={`tab-btn ${activeTab === 'specifications' ? 'active' : ''}`}
            onClick={() => setActiveTab('specifications')}
          >
            Specifications
          </button>
          <button
            className={`tab-btn ${activeTab === 'reviews' ? 'active' : ''}`}
            onClick={() => setActiveTab('reviews')}
          >
            Reviews ({product.reviews.toLocaleString()})
          </button>
        </div>

        <div className="tabs-content">
          {activeTab === 'description' && (
            <div className="tab-panel description-panel">
              <h3>About this product</h3>
              <p>{product.description}</p>
              {product.features.length > 0 && (
                <>
                  <h4>Key Features</h4>
                  <ul>
                    {product.features.map((feature, index) => (
                      <li key={index}>{feature}</li>
                    ))}
                  </ul>
                </>
              )}
            </div>
          )}

          {activeTab === 'specifications' && (
            <div className="tab-panel specifications-panel">
              <h3>Technical Specifications</h3>
              {product.specifications.length > 0 ? (
                <table className="specs-table">
                  <tbody>
                    {product.specifications.map((spec, index) => (
                      <tr key={index}>
                        <th>{spec.label}</th>
                        <td>{spec.value}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <p className="no-specs">No specifications available for this product.</p>
              )}
            </div>
          )}

          {activeTab === 'reviews' && (
            <div className="tab-panel reviews-panel">
              <div className="reviews-summary">
                <div className="reviews-overall">
                  <span className="overall-rating">{product.rating}</span>
                  <StarRating rating={product.rating} size={24} />
                  <span className="total-reviews">Based on {product.reviews.toLocaleString()} reviews</span>
                </div>
                <button className="btn btn-outline write-review-btn">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                  </svg>
                  Write a Review
                </button>
              </div>

              <div className="reviews-list">
                {sampleReviews.map((review) => (
                  <ReviewCard key={review.id} review={review} />
                ))}
              </div>

              <button className="btn btn-outline load-more-btn">
                Load More Reviews
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
