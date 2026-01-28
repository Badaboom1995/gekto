import { useState, useMemo } from 'react'
import { Link } from 'react-router-dom'
import RecommendationBlock, { RecommendationItem } from '../components/RecommendationBlock'
import SearchBar from '../components/SearchBar'
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

const recommendedItems: RecommendationItem[] = [
  {
    id: 1,
    title: 'ZX Spectrum 48K',
    description: 'The British home computer that revolutionized gaming. Features rubber keys and iconic rainbow stripe.',
    image: 'https://upload.wikimedia.org/wikipedia/commons/3/33/ZXSpectrum48k.jpg',
    price: 199.00,
    rating: 4.8,
    badge: 'Popular',
    category: 'Home Computer',
    link: '/shop/zx-spectrum'
  },
  {
    id: 2,
    title: 'IBM PC 5150',
    description: 'The original IBM Personal Computer that defined the industry standard for decades.',
    image: 'https://upload.wikimedia.org/wikipedia/commons/f/f1/Ibm_pc_5150.jpg',
    price: 549.00,
    rating: 4.9,
    badge: 'Rare Find',
    category: 'Business',
    link: '/shop/ibm-pc-5150'
  },
  {
    id: 3,
    title: 'Atari 800XL',
    description: 'Advanced 8-bit home computer with excellent graphics and sound capabilities.',
    image: 'https://upload.wikimedia.org/wikipedia/commons/0/00/Atari_800XL.jpg',
    price: 279.00,
    rating: 4.7,
    category: 'Home Computer',
    link: '/shop/atari-800xl'
  },
  {
    id: 4,
    title: 'BBC Micro Model B',
    description: 'Educational computer that taught a generation to code. Built like a tank.',
    image: 'https://upload.wikimedia.org/wikipedia/commons/3/32/BBC_Micro_Front_Restored.jpg',
    price: 329.00,
    rating: 4.6,
    badge: 'Staff Pick',
    category: 'Educational',
    link: '/shop/bbc-micro'
  }
]

const trendingItems: RecommendationItem[] = [
  {
    id: 5,
    title: 'Original Joystick Collection',
    description: 'Authentic vintage joysticks for C64, Amiga, and Atari. Fully refurbished.',
    price: 49.00,
    rating: 4.5,
    category: 'Accessories',
    link: '/shop/joysticks'
  },
  {
    id: 6,
    title: 'Floppy Disk Archive',
    description: '100+ classic games and software on original 5.25" disks. Tested and working.',
    price: 89.00,
    rating: 4.8,
    badge: 'Bundle',
    category: 'Software',
    link: '/shop/floppy-archive'
  },
  {
    id: 7,
    title: 'CRT Monitor - Restored',
    description: 'Period-correct display for authentic retro computing experience.',
    price: 149.00,
    rating: 4.4,
    category: 'Display',
    link: '/shop/crt-monitor'
  }
]

function HomePage() {
  const [searchQuery, setSearchQuery] = useState('')
  const [isSearching, setIsSearching] = useState(false)

  // Combine all searchable items
  const allItems = useMemo(() => [
    ...featuredProducts.map(p => ({ ...p, type: 'product' as const })),
    ...categories.map(c => ({ ...c, type: 'category' as const })),
    ...recommendedItems.map(r => ({ ...r, name: r.title, type: 'recommended' as const })),
    ...trendingItems.map(t => ({ ...t, name: t.title, type: 'trending' as const })),
  ], [])

  // Filter items based on search query
  const searchResults = useMemo(() => {
    if (!searchQuery.trim()) return null

    const query = searchQuery.toLowerCase()
    return allItems.filter(item => {
      const name = item.name.toLowerCase()
      const description = 'description' in item ? item.description?.toLowerCase() || '' : ''
      const category = 'category' in item ? item.category?.toLowerCase() || '' : ''
      return name.includes(query) || description.includes(query) || category.includes(query)
    })
  }, [searchQuery, allItems])

  const handleSearch = (value: string) => {
    setIsSearching(true)
    setSearchQuery(value)
    // Simulate a brief loading state for better UX
    setTimeout(() => setIsSearching(false), 200)
  }

  return (
    <div className="home-page">
      {/* Hero Section */}
      <section className="home-hero">
        <div className="home-hero-content">
          <span className="home-hero-badge">Welcome to ClassicPC</span>
          <h1 className="home-hero-title">
            Discover the<br />
            <span className="highlight">Golden Era</span><br />
            of Computing
          </h1>
          <p className="home-hero-subtitle">
            Explore our curated collection of vintage computers, from the iconic Commodore 64
            to the revolutionary Macintosh. Each machine tells a story of innovation.
          </p>

          {/* Search Bar */}
          <div className="home-hero-search">
            <SearchBar
              placeholder="Search vintage computers, accessories, software..."
              onSearch={handleSearch}
              debounceDelay={300}
              size="large"
              isLoading={isSearching}
            />
            {searchResults && searchResults.length > 0 && (
              <div className="search-results-dropdown">
                <div className="search-results-header">
                  Found {searchResults.length} result{searchResults.length !== 1 ? 's' : ''}
                </div>
                <div className="search-results-list">
                  {searchResults.slice(0, 5).map((item, index) => (
                    <Link
                      key={`${item.type}-${index}`}
                      to={item.type === 'category' ? '/shop' : ('link' in item ? item.link || '/shop' : '/shop')}
                      className="search-result-item"
                    >
                      {'image' in item && item.image && (
                        <img src={item.image} alt={item.name} className="search-result-image" />
                      )}
                      {'icon' in item && (
                        <span className="search-result-icon">{item.icon}</span>
                      )}
                      <div className="search-result-info">
                        <span className="search-result-name">{item.name}</span>
                        <span className="search-result-type">
                          {item.type === 'product' ? 'Featured' :
                           item.type === 'category' ? 'Category' :
                           item.type === 'recommended' ? 'Recommended' : 'Trending'}
                        </span>
                      </div>
                      {'price' in item && item.price && (
                        <span className="search-result-price">${item.price.toFixed(2)}</span>
                      )}
                    </Link>
                  ))}
                </div>
                {searchResults.length > 5 && (
                  <Link to="/shop" className="search-results-more">
                    View all {searchResults.length} results
                  </Link>
                )}
              </div>
            )}
            {searchResults && searchResults.length === 0 && searchQuery.trim() && (
              <div className="search-results-dropdown">
                <div className="search-no-results">
                  <span className="search-no-results-icon">🔍</span>
                  <p>No results found for "{searchQuery}"</p>
                  <Link to="/shop" className="btn btn-outline btn-small">Browse All Products</Link>
                </div>
              </div>
            )}
          </div>

          <div className="home-hero-actions">
            <Link to="/shop" className="btn btn-primary btn-large">
              Shop Now
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
          <div className="floating-chip">
            <div className="chip">
              <div className="chip-content">
                <div className="chip-item">C64</div>
                <div className="chip-item">AMIGA</div>
                <div className="chip-item">APPLE</div>
                <div className="chip-item">IBM</div>
                <div className="chip-item">ATARI</div>
                <div className="chip-item">BBC</div>
              </div>
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

      {/* Recommendations Section */}
      <RecommendationBlock
        title="Recommended For You"
        subtitle="Hand-picked selections based on collector favorites and recent arrivals"
        items={recommendedItems}
        variant="default"
        columns={4}
        viewAllLink="/shop"
        viewAllText="Browse All Machines"
      />

      {/* Trending Now Section */}
      <RecommendationBlock
        title="Trending Now"
        subtitle="What collectors are loving this month"
        items={trendingItems}
        variant="compact"
        columns={3}
        viewAllLink="/shop"
        viewAllText="See More"
      />

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
          <p>Join thousands of collectors and enthusiasts who trust ClassicPC for authentic vintage computers.</p>
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
