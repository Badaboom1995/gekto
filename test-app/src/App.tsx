import { useState } from 'react'
import { Routes, Route, Link, useLocation } from 'react-router-dom'
import './App.css'
import AboutPage from './pages/AboutPage'
import ArticleDetailPage from './pages/ArticleDetailPage'
import ArticlesPage from './pages/ArticlesPage'
import BasketPage from './pages/BasketPage'
import BlogPage from './pages/BlogPage'
import ContactsPage from './pages/ContactsPage'
import FAQPage from './pages/FAQPage'
import HomePage from './pages/HomePage'
import ProfilePage from './pages/ProfilePage'
import ProductDetailPage from './pages/ProductDetailPage'
import ShippingPage from './pages/ShippingPage'
import TeamPage from './pages/TeamPage'

interface Product {
  id: number
  name: string
  category: string
  price: number
  rating: number
  reviews: number
  image: string
}

const products: Product[] = [
  { id: 1, name: 'Commodore 64', category: 'Home', price: 299.00, rating: 4.8, reviews: 2400, image: 'https://upload.wikimedia.org/wikipedia/commons/thumb/e/e9/Commodore-64-Computer-FL.jpg/1200px-Commodore-64-Computer-FL.jpg' },
  { id: 2, name: 'Apple II', category: 'Home', price: 449.00, rating: 4.9, reviews: 1800, image: 'https://upload.wikimedia.org/wikipedia/commons/thumb/9/98/Apple_II_typical_configuration_1977.png/1200px-Apple_II_typical_configuration_1977.png' },
  { id: 3, name: 'IBM PC 5150', category: 'Business', price: 599.00, rating: 4.7, reviews: 3200, image: 'https://upload.wikimedia.org/wikipedia/commons/thumb/f/f1/Ibm_pc_5150.jpg/1200px-Ibm_pc_5150.jpg' },
  { id: 4, name: 'Amiga 500', category: 'Home', price: 349.00, rating: 4.9, reviews: 2100, image: 'https://upload.wikimedia.org/wikipedia/commons/thumb/c/c3/Amiga500_system.jpg/1200px-Amiga500_system.jpg' },
  { id: 5, name: 'Atari 800', category: 'Gaming', price: 279.00, rating: 4.6, reviews: 1500, image: 'https://upload.wikimedia.org/wikipedia/commons/thumb/4/43/Atari-800-Computer-FL.jpg/1200px-Atari-800-Computer-FL.jpg' },
  { id: 7, name: 'ZX Spectrum', category: 'Home', price: 199.00, rating: 4.7, reviews: 2800, image: 'https://upload.wikimedia.org/wikipedia/commons/thumb/3/33/ZXSpectrum48k.jpg/1200px-ZXSpectrum48k.jpg' },
  { id: 8, name: 'Macintosh 128K', category: 'Business', price: 799.00, rating: 4.9, reviews: 4100, image: 'https://upload.wikimedia.org/wikipedia/commons/thumb/e/e3/Macintosh_128k_transparency.png/800px-Macintosh_128k_transparency.png' },
  { id: 9, name: 'BBC Micro', category: 'Education', price: 329.00, rating: 4.6, reviews: 1200, image: 'https://upload.wikimedia.org/wikipedia/commons/thumb/3/32/BBC_Micro_Front_Restored.jpg/1200px-BBC_Micro_Front_Restored.jpg' },
]

const recommendations: Product[] = [
  { id: 10, name: 'VIC-20', category: 'Home', price: 149.00, rating: 4.5, reviews: 890, image: 'https://upload.wikimedia.org/wikipedia/commons/thumb/f/f7/Commodore-VIC-20-FL.jpg/1200px-Commodore-VIC-20-FL.jpg' },
  { id: 11, name: 'Apple Lisa', category: 'Business', price: 1299.00, rating: 4.8, reviews: 560, image: 'https://upload.wikimedia.org/wikipedia/commons/thumb/6/69/Apple_Lisa.jpg/1200px-Apple_Lisa.jpg' },
  { id: 12, name: 'NeXT Cube', category: 'Business', price: 999.00, rating: 4.9, reviews: 720, image: 'https://upload.wikimedia.org/wikipedia/commons/thumb/2/2a/NEXT_Cube-IMG_7154.jpg/1200px-NEXT_Cube-IMG_7154.jpg' },
]

const categories = ['All', 'Home', 'Business', 'Gaming', 'Education']

function Header() {
  const location = useLocation()

  return (
    <header className="header">
      <div className="header-content">
        <Link to="/" className="logo">
          <span className="logo-icon">⌨</span>
          <span className="logo-text">RetroPC</span>
        </Link>
        <nav className="nav">
          <Link to="/" className={`nav-link ${location.pathname === '/' ? 'active' : ''}`}>Home</Link>
          <Link to="/blog" className={`nav-link ${location.pathname === '/blog' ? 'active' : ''}`}>Blog</Link>
          <Link to="/shipping" className={`nav-link ${location.pathname === '/shipping' ? 'active' : ''}`}>Shipping</Link>
          <Link to="/faq" className={`nav-link ${location.pathname === '/faq' ? 'active' : ''}`}>FAQ</Link>
        </nav>
        <div className="header-actions">
          <button className="icon-btn">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="11" cy="11" r="8"/>
              <path d="m21 21-4.35-4.35"/>
            </svg>
          </button>
          <Link to="/basket" className="icon-btn cart-btn">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="9" cy="21" r="1"/>
              <circle cx="20" cy="21" r="1"/>
              <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/>
            </svg>
            <span className="cart-badge">3</span>
          </Link>
          <Link to="/profile" className="avatar">
            <img src="https://api.dicebear.com/7.x/avataaars/svg?seed=retro" alt="User" />
          </Link>
        </div>
      </div>
    </header>
  )
}

function HeroBanner() {
  return (
    <div className="hero-banner">
      <div className="hero-overlay">
        <h1 className="hero-title">Peppeeeee</h1>
      </div>
      <div className="hero-search">
        <h2 className="hero-subtitle">Find Your Classic Machine</h2>
        <div className="search-container">
          <input type="text" placeholder="Search on RetroPC" className="search-input" />
          <button className="search-btn">Search</button>
        </div>
      </div>
    </div>
  )
}

interface CategorySidebarProps {
  selectedCategory: string
  onSelectCategory: (category: string) => void
}

function CategorySidebar({ selectedCategory, onSelectCategory }: CategorySidebarProps) {
  return (
    <aside className="sidebar">
      <h3 className="sidebar-title">Category</h3>
      <ul className="category-list">
        {categories.map(category => (
          <li key={category}>
            <button
              className={`category-item ${selectedCategory === category ? 'active' : ''}`}
              onClick={() => onSelectCategory(category)}
            >
              <span className="category-icon">
                {category === 'All' && '📦'}
                {category === 'Home' && '🏠'}
                {category === 'Business' && '💼'}
                {category === 'Gaming' && '🎮'}
                {category === 'Education' && '📚'}
              </span>
              <span>{category}</span>
              {category === 'All' && <span className="category-count">{products.length}</span>}
            </button>
          </li>
        ))}
      </ul>

      <div className="filter-section">
        <h4 className="filter-title">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="11" cy="11" r="8"/>
            <path d="m21 21-4.35-4.35"/>
          </svg>
          New Arrival
        </h4>
      </div>

      <div className="filter-section">
        <h4 className="filter-title">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
          </svg>
          Best Seller
        </h4>
      </div>

      <div className="filter-section">
        <h4 className="filter-title">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10"/>
            <path d="M12 6v6l4 2"/>
          </svg>
          On Discount
        </h4>
      </div>
    </aside>
  )
}

interface ProductCardProps {
  product: Product
  variant?: 'default' | 'recommendation'
}

function ProductCard({ product, variant = 'default' }: ProductCardProps) {
  return (
    <div className={`product-card ${variant === 'recommendation' ? 'recommendation-card' : ''}`}>
      <Link to={`/product/${product.id}`} className="product-image-container">
        <span className="product-category-tag">{product.category}</span>
        <img src={product.image} alt={product.name} className="product-image" />
      </Link>
      <div className="product-info">
        <Link to={`/product/${product.id}`} className="product-name-link">
          <h3 className="product-name">{product.name}</h3>
        </Link>
        <div className="product-meta">
          <span className="product-rating">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="#FFB800" stroke="#FFB800" strokeWidth="2">
              <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
            </svg>
            {product.rating} ({(product.reviews / 1000).toFixed(1)}k Reviews)
          </span>
          <span className="product-price">${product.price.toFixed(2)}</span>
        </div>
        <div className="product-actions">
          <button className="btn btn-outline">Add to Cart</button>
          <Link to={`/product/${product.id}`} className="btn btn-primary">Buy Now</Link>
        </div>
      </div>
    </div>
  )
}

function Pagination() {
  return (
    <div className="pagination">
      <button className="pagination-btn prev">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M15 18l-6-6 6-6"/>
        </svg>
        Previous
      </button>
      <div className="pagination-numbers">
        <button className="pagination-num active">1</button>
        <button className="pagination-num">2</button>
        <button className="pagination-num">3</button>
        <span className="pagination-dots">...</span>
        <button className="pagination-num">8</button>
        <button className="pagination-num">9</button>
        <button className="pagination-num">10</button>
      </div>
      <button className="pagination-btn next">
        Next
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M9 18l6-6-6-6"/>
        </svg>
      </button>
    </div>
  )
}

function Recommendations() {
  return (
    <section className="recommendations">
      <div className="recommendations-header">
        <h2 className="recommendations-title">Explore our recommendations</h2>
        <div className="recommendations-nav">
          <button className="nav-arrow">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M15 18l-6-6 6-6"/>
            </svg>
          </button>
          <button className="nav-arrow">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M9 18l6-6-6-6"/>
            </svg>
          </button>
        </div>
      </div>
      <div className="recommendations-grid">
        {recommendations.map(product => (
          <ProductCard key={product.id} product={product} variant="recommendation" />
        ))}
      </div>
    </section>
  )
}

function Newsletter() {
  return (
    <section className="newsletter">
      <div className="newsletter-content">
        <div className="newsletter-text">
          <h2 className="newsletter-title">Ready to Get<br/>Our New Stuff?</h2>
          <div className="newsletter-form">
            <input type="email" placeholder="Your Email" className="newsletter-input" />
            <button className="btn btn-primary">Send</button>
          </div>
        </div>
        <div className="newsletter-info">
          <h3>RetroPC for Collectors and Enthusiasts</h3>
          <p>We'll listen to your needs, identify the best approach, and then help you find the perfect vintage computer that's right for you.</p>
        </div>
      </div>
    </section>
  )
}

function Footer() {
  return (
    <footer className="footer">
      <div className="footer-content">
        <div className="footer-section">
          <h4>About</h4>
          <ul>
            <li><Link to="/about">About Us</Link></li>
            <li><a href="#">Blog</a></li>
            <li><Link to="/team">Meet The Team</Link></li>
            <li><Link to="/contacts">Contact Us</Link></li>
          </ul>
        </div>
        <div className="footer-section">
          <h4>Support</h4>
          <ul>
            <li><Link to="/contacts">Contact Us</Link></li>
            <li><Link to="/shipping">Shipping</Link></li>
            <li><a href="#">Return</a></li>
            <li><Link to="/faq">FAQ</Link></li>
          </ul>
        </div>
        <div className="footer-section social">
          <h4>Social Media</h4>
          <div className="social-links">
            <a href="#" className="social-link">𝕏</a>
            <a href="#" className="social-link">f</a>
            <a href="#" className="social-link">in</a>
            <a href="#" className="social-link">📷</a>
          </div>
        </div>
      </div>
      <div className="footer-bottom">
        <p>Copyright © 2024 RetroPC. All Rights Reserved.</p>
        <div className="footer-links">
          <a href="#">Terms of Service</a>
          <a href="#">Privacy Policy</a>
        </div>
      </div>
    </footer>
  )
}

function ShopPage() {
  const [selectedCategory, setSelectedCategory] = useState('All')

  const filteredProducts = selectedCategory === 'All'
    ? products
    : products.filter(p => p.category === selectedCategory)

  return (
    <>
      <HeroBanner />
      <main className="main-content">
        <CategorySidebar
          selectedCategory={selectedCategory}
          onSelectCategory={setSelectedCategory}
        />
        <div className="products-section">
          <div className="products-grid">
            {filteredProducts.map(product => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
          <Pagination />
        </div>
      </main>
      <Recommendations />
      <Newsletter />
    </>
  )
}

function App() {
  return (
    <div className="app">
      <Header />
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/shop" element={<ShopPage />} />
        <Route path="/product/:id" element={<ProductDetailPage />} />
        <Route path="/articles" element={<ArticlesPage />} />
        <Route path="/articles/:slug" element={<ArticleDetailPage />} />
        <Route path="/basket" element={<BasketPage />} />
        <Route path="/blog" element={<BlogPage />} />
        <Route path="/team" element={<TeamPage />} />
        <Route path="/about" element={<AboutPage />} />
        <Route path="/shipping" element={<ShippingPage />} />
        <Route path="/contacts" element={<ContactsPage />} />
        <Route path="/faq" element={<FAQPage />} />
        <Route path="/profile" element={<ProfilePage />} />
      </Routes>
      <Footer />
    </div>
  )
}

export default App
