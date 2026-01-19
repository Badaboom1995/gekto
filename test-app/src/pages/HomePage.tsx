import { Link } from 'react-router-dom'
import './HomePage.css'

interface FeaturedProduct {
  id: number
  name: string
  description: string
  image: string
  price: number
  badge?: string
}

interface Category {
  id: number
  name: string
  icon: string
  count: number
}

const featuredProducts: FeaturedProduct[] = [
  {
    id: 1,
    name: 'Commodore 64',
    description: 'The best-selling home computer of all time with legendary SID sound chip.',
    image: 'https://upload.wikimedia.org/wikipedia/commons/thumb/e/e9/Commodore-64-Computer-FL.jpg/1200px-Commodore-64-Computer-FL.jpg',
    price: 299.00,
    badge: 'Best Seller'
  },
  {
    id: 2,
    name: 'Apple Macintosh 128K',
    description: 'The revolutionary machine that brought GUI to the masses in 1984.',
    image: 'https://upload.wikimedia.org/wikipedia/commons/thumb/e/e3/Macintosh_128k_transparency.png/800px-Macintosh_128k_transparency.png',
    price: 799.00,
    badge: 'Iconic'
  },
  {
    id: 3,
    name: 'Amiga 500',
    description: 'Ahead of its time with multitasking, stereo sound, and 4096 colors.',
    image: 'https://upload.wikimedia.org/wikipedia/commons/thumb/c/c3/Amiga500_system.jpg/1200px-Amiga500_system.jpg',
    price: 349.00,
    badge: 'Staff Pick'
  }
]

const categories: Category[] = [
  { id: 1, name: 'Home Computers', icon: '🏠', count: 24 },
  { id: 2, name: 'Business Systems', icon: '💼', count: 18 },
  { id: 3, name: 'Gaming Consoles', icon: '🎮', count: 32 },
  { id: 4, name: 'Accessories', icon: '🕹️', count: 56 },
  { id: 5, name: 'Software', icon: '💾', count: 120 },
  { id: 6, name: 'Restoration Parts', icon: '🔧', count: 89 }
]

const stats = [
  { value: '10K+', label: 'Happy Collectors' },
  { value: '500+', label: 'Vintage Machines' },
  { value: '50+', label: 'Countries Served' },
  { value: '15', label: 'Years Experience' }
]

function HomePage() {
  return (
    <div className="home-page">
      {/* Hero Section */}
      <section className="home-hero">
        <div className="home-hero-content">
          <span className="home-hero-badge">Welcome to RetroPC</span>
          <h1 className="home-hero-title">
            Discover the<br />
            <span className="highlight">Golden Era</span><br />
            of Computing
          </h1>
          <p className="home-hero-subtitle">
            Explore our curated collection of vintage computers, from the iconic Commodore 64
            to the revolutionary Macintosh. Each machine tells a story of innovation.
          </p>
          <div className="home-hero-actions">
            <Link to="/shop" className="btn btn-primary btn-large">
              Peppeeeee
            </Link>
            <Link to="/blog" className="btn btn-outline btn-large">
              Read Our Blog
            </Link>
          </div>
          <div className="home-hero-stats">
            {stats.map((stat, index) => (
              <div key={index} className="stat-item">
                <span className="stat-value">{stat.value}</span>
                <span className="stat-label">{stat.label}</span>
              </div>
            ))}
          </div>
        </div>
        <div className="home-hero-visual">
          <div className="floating-cube">
            <div className="cube">
              <div className="cube-face front">C64</div>
              <div className="cube-face back">AMIGA</div>
              <div className="cube-face right">APPLE</div>
              <div className="cube-face left">IBM</div>
              <div className="cube-face top">ATARI</div>
              <div className="cube-face bottom">BBC</div>
            </div>
          </div>
        </div>
      </section>

      {/* Categories Section */}
      <section className="home-categories">
        <div className="section-header">
          <h2 className="section-title">Browse by Category</h2>
          <p className="section-subtitle">Find exactly what you're looking for</p>
        </div>
        <div className="categories-grid">
          {categories.map((category) => (
            <Link to="/shop" key={category.id} className="category-card">
              <span className="category-card-icon">{category.icon}</span>
              <h3 className="category-card-name">{category.name}</h3>
              <span className="category-card-count">{category.count} items</span>
            </Link>
          ))}
        </div>
      </section>

      {/* Featured Products Section */}
      <section className="home-featured">
        <div className="section-header">
          <h2 className="section-title">Featured Machines</h2>
          <p className="section-subtitle">Hand-picked classics from our collection</p>
        </div>
        <div className="featured-grid">
          {featuredProducts.map((product) => (
            <div key={product.id} className="featured-card">
              {product.badge && (
                <span className="featured-badge">{product.badge}</span>
              )}
              <div className="featured-image">
                <img src={product.image} alt={product.name} />
              </div>
              <div className="featured-content">
                <h3 className="featured-name">{product.name}</h3>
                <p className="featured-description">{product.description}</p>
                <div className="featured-footer">
                  <span className="featured-price">${product.price.toFixed(2)}</span>
                  <Link to="/shop" className="btn btn-primary">View Details</Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Features Section */}
      <section className="home-features">
        <div className="feature-card">
          <div className="feature-icon">🖥️</div>
          <h3>Authentic Hardware</h3>
          <p>Every machine is tested, restored, and certified by our expert technicians.</p>
        </div>
        <div className="feature-card">
          <div className="feature-icon">📦</div>
          <h3>Secure Shipping</h3>
          <p>Carefully packaged and insured delivery to preserve these pieces of history.</p>
        </div>
        <div className="feature-card">
          <div className="feature-icon">🔧</div>
          <h3>Lifetime Support</h3>
          <p>Technical assistance and repair services for all your vintage purchases.</p>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="home-testimonials">
        <div className="section-header">
          <h2 className="section-title">What Collectors Say</h2>
          <p className="section-subtitle">Join our community of vintage computing enthusiasts</p>
        </div>
        <div className="testimonials-grid">
          <div className="testimonial-card">
            <div className="testimonial-content">
              <p>"Found my childhood Commodore 64 in pristine condition. The restoration work was impeccable!"</p>
            </div>
            <div className="testimonial-author">
              <div className="testimonial-avatar">JD</div>
              <div className="testimonial-info">
                <span className="testimonial-name">John Davis</span>
                <span className="testimonial-role">Collector since 2019</span>
              </div>
            </div>
          </div>
          <div className="testimonial-card">
            <div className="testimonial-content">
              <p>"The team's knowledge of retro hardware is unmatched. They helped me find parts for my Apple Lisa."</p>
            </div>
            <div className="testimonial-author">
              <div className="testimonial-avatar">SM</div>
              <div className="testimonial-info">
                <span className="testimonial-name">Sarah Mitchell</span>
                <span className="testimonial-role">Restoration Hobbyist</span>
              </div>
            </div>
          </div>
          <div className="testimonial-card">
            <div className="testimonial-content">
              <p>"Best source for vintage computers. Fast shipping and excellent customer service every time."</p>
            </div>
            <div className="testimonial-author">
              <div className="testimonial-avatar">MR</div>
              <div className="testimonial-info">
                <span className="testimonial-name">Mike Rodriguez</span>
                <span className="testimonial-role">Museum Curator</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="home-cta">
        <div className="cta-content">
          <h2>Ready to own a piece of computing history?</h2>
          <p>Join thousands of collectors and enthusiasts who trust RetroPC for authentic vintage computers.</p>
          <div className="cta-actions">
            <Link to="/shop" className="btn btn-primary btn-large">
              Start Exploring
            </Link>
            <Link to="/blog" className="btn btn-outline btn-large">
              Learn More
            </Link>
          </div>
        </div>
      </section>
    </div>
  )
}

export default HomePage
