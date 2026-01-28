import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Filters, FiltersState, FiltersConfig } from '../components/Filters';
import './BlogPage.css';

interface BlogPost {
  id: number;
  title: string;
  excerpt: string;
  date: string;
  rawDate: string; // ISO date for filtering
  category: string;
  slug: string;
}

const blogPosts: BlogPost[] = [
  {
    id: 12,
    title: 'The Psychology of Deep Work: Mastering Focus in a Distracted World',
    excerpt: 'In an age of constant notifications and endless distractions, the ability to focus deeply has become both rare and valuable. Learn the cognitive science behind concentration and practical strategies to reclaim your attention.',
    date: 'December 28, 2024',
    rawDate: '2024-12-28',
    category: 'Productivity',
    slug: 'psychology-deep-work'
  },
  {
    id: 11,
    title: 'The Science of Habits: How Small Changes Lead to Remarkable Results',
    excerpt: 'Why understanding how habits work is the key to transforming your life—one small step at a time. Discover the habit loop, the four laws of behavior change, and practical strategies to build better habits.',
    date: 'December 22, 2024',
    rawDate: '2024-12-22',
    category: 'Lifestyle',
    slug: 'science-of-habits'
  },
  {
    id: 1,
    title: 'The Evolution of Modern CPUs',
    excerpt: 'From single-core processors to multi-core giants, explore how modern CPUs have transformed computing power.',
    date: 'December 20, 2024',
    rawDate: '2024-12-20',
    category: 'Hardware',
    slug: 'evolution-modern-cpus'
  },
  {
    id: 2,
    title: 'Building Your First Gaming PC',
    excerpt: 'A complete guide to selecting components and assembling a high-performance gaming computer in 2024.',
    date: 'December 18, 2024',
    rawDate: '2024-12-18',
    category: 'Guides',
    slug: 'building-first-gaming-pc'
  },
  {
    id: 3,
    title: 'The Rise of AI Accelerators',
    excerpt: 'How specialized chips like GPUs and TPUs are revolutionizing artificial intelligence and machine learning.',
    date: 'December 15, 2024',
    rawDate: '2024-12-15',
    category: 'Technology',
    slug: 'rise-ai-accelerators'
  },
  {
    id: 4,
    title: 'Understanding RAM: DDR5 vs DDR4',
    excerpt: 'Deep dive into memory technology and why DDR5 is the future of system performance.',
    date: 'December 12, 2024',
    rawDate: '2024-12-12',
    category: 'Hardware',
    slug: 'understanding-ram-ddr5-vs-ddr4'
  },
  {
    id: 5,
    title: 'SSD vs NVMe: Storage Revolution',
    excerpt: 'Explore how solid-state drives and NVMe technology have eliminated traditional storage bottlenecks.',
    date: 'December 8, 2024',
    rawDate: '2024-12-08',
    category: 'Storage',
    slug: 'ssd-vs-nvme-storage'
  },
  {
    id: 6,
    title: 'The Future of Quantum Computing',
    excerpt: 'Understanding quantum bits, superposition, and how quantum computers will change everything.',
    date: 'December 5, 2024',
    rawDate: '2024-12-05',
    category: 'Future Tech',
    slug: 'future-quantum-computing'
  },
  {
    id: 7,
    title: 'Optimizing Your Development Setup',
    excerpt: 'Essential tools, configurations, and hardware choices for modern software development.',
    date: 'December 1, 2024',
    rawDate: '2024-12-01',
    category: 'Programming',
    slug: 'optimizing-development-setup'
  },
  {
    id: 8,
    title: 'Graphics Cards: RTX 4090 vs RTX 4080',
    excerpt: 'Performance comparison and analysis of NVIDIA\'s flagship graphics cards for gaming and content creation.',
    date: 'November 28, 2024',
    rawDate: '2024-11-28',
    category: 'Graphics',
    slug: 'rtx-4090-vs-4080-comparison'
  },
  {
    id: 9,
    title: 'ARM vs x86: The Architecture War',
    excerpt: 'How ARM processors are challenging Intel and AMD in laptops, servers, and mobile computing.',
    date: 'November 25, 2024',
    rawDate: '2024-11-25',
    category: 'Architecture',
    slug: 'arm-vs-x86-architecture-war'
  },
  {
    id: 10,
    title: 'Cooling Solutions for High-End PCs',
    excerpt: 'From air cooling to custom water loops, find the best thermal management for your system.',
    date: 'November 22, 2024',
    rawDate: '2024-11-22',
    category: 'Hardware',
    slug: 'cooling-solutions-high-end-pcs'
  }
];

// Extract unique categories and count posts per category
const categoryList = blogPosts.reduce((acc, post) => {
  const existing = acc.find(c => c.id === post.category.toLowerCase().replace(/\s+/g, '-'));
  if (existing) {
    existing.count = (existing.count || 0) + 1;
  } else {
    acc.push({
      id: post.category.toLowerCase().replace(/\s+/g, '-'),
      label: post.category,
      count: 1
    });
  }
  return acc;
}, [] as { id: string; label: string; count: number }[]);

// Filter configuration for blog posts
const filtersConfig: FiltersConfig = {
  categories: categoryList.sort((a, b) => a.label.localeCompare(b.label)),
  statuses: [
    { id: 'featured', label: 'Featured', color: '#ff6b6b' },
    { id: 'trending', label: 'Trending', color: '#ffd93d' },
    { id: 'new', label: 'New', color: '#00d4ff' },
  ],
  showDateRange: true,
  dateRangeLabel: 'Published Date',
  categoriesLabel: 'Topics',
  statusesLabel: 'Post Type',
};

function BlogPage() {
  const [activeFilters, setActiveFilters] = useState<FiltersState>({
    categories: [],
    dateRange: { startDate: null, endDate: null },
    statuses: [],
  });
  const [showMobileFilters, setShowMobileFilters] = useState(false);

  // Filter blog posts based on active filters
  const filteredPosts = useMemo(() => {
    return blogPosts.filter(post => {
      // Category filter
      if (activeFilters.categories.length > 0) {
        const postCategoryId = post.category.toLowerCase().replace(/\s+/g, '-');
        if (!activeFilters.categories.includes(postCategoryId)) {
          return false;
        }
      }

      // Date range filter
      if (activeFilters.dateRange.startDate || activeFilters.dateRange.endDate) {
        const postDate = new Date(post.rawDate);
        if (activeFilters.dateRange.startDate) {
          const startDate = new Date(activeFilters.dateRange.startDate);
          if (postDate < startDate) return false;
        }
        if (activeFilters.dateRange.endDate) {
          const endDate = new Date(activeFilters.dateRange.endDate);
          if (postDate > endDate) return false;
        }
      }

      return true;
    });
  }, [activeFilters]);

  const handleApplyFilters = (filters: FiltersState) => {
    setActiveFilters(filters);
    setShowMobileFilters(false);
  };

  const handleClearFilters = () => {
    setActiveFilters({
      categories: [],
      dateRange: { startDate: null, endDate: null },
      statuses: [],
    });
  };

  const hasActiveFilters =
    activeFilters.categories.length > 0 ||
    activeFilters.statuses.length > 0 ||
    activeFilters.dateRange.startDate !== null ||
    activeFilters.dateRange.endDate !== null;

  return (
    <div className="blog-page">
      {/* Hero Section */}
      <section className="blog-hero">
        <div className="blog-hero-overlay">
          <h1 className="blog-hero-title">Blog</h1>
        </div>
        <div className="blog-hero-content">
          <h2 className="blog-hero-heading">
            Modern Computing <span className="highlight">Insights</span>
          </h2>
          <p className="blog-hero-subtitle">
            Explore the cutting-edge world of contemporary technology, performance guides, and future innovations.
          </p>
        </div>
      </section>

      {/* Blog Content with Filters */}
      <section className="blog-content-section">
        {/* Mobile Filter Toggle */}
        <button
          className="blog-filters-toggle"
          onClick={() => setShowMobileFilters(!showMobileFilters)}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"/>
          </svg>
          Filters
          {hasActiveFilters && (
            <span className="filters-badge-mobile">
              {activeFilters.categories.length + activeFilters.statuses.length + (activeFilters.dateRange.startDate ? 1 : 0)}
            </span>
          )}
        </button>

        <div className="blog-layout">
          {/* Sidebar Filters */}
          <aside className={`blog-filters-sidebar ${showMobileFilters ? 'blog-filters-sidebar--open' : ''}`}>
            {showMobileFilters && (
              <button
                className="blog-filters-close"
                onClick={() => setShowMobileFilters(false)}
                aria-label="Close filters"
              >
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M18 6L6 18M6 6l12 12"/>
                </svg>
              </button>
            )}
            <Filters
              config={filtersConfig}
              initialValues={activeFilters}
              onApply={handleApplyFilters}
              onClear={handleClearFilters}
              title="Filter Posts"
            />
          </aside>

          {/* Blog Posts Grid */}
          <div className="blog-posts-container">
            {/* Results Info */}
            <div className="blog-results-info">
              <span className="blog-results-count">
                {filteredPosts.length} {filteredPosts.length === 1 ? 'post' : 'posts'} found
              </span>
              {hasActiveFilters && (
                <button className="blog-clear-filters" onClick={handleClearFilters}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M18 6L6 18M6 6l12 12"/>
                  </svg>
                  Clear all filters
                </button>
              )}
            </div>

            {filteredPosts.length === 0 ? (
              <div className="blog-empty-state">
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"/>
                </svg>
                <h3>No posts found</h3>
                <p>Try adjusting your filters to find more content.</p>
                <button className="btn btn-primary" onClick={handleClearFilters}>
                  Clear Filters
                </button>
              </div>
            ) : (
              <div className="blog-posts-grid">
                {filteredPosts.map((post) => (
                  <article key={post.id} className="blog-card">
                    <div className="blog-card-header">
                      <span className="blog-card-category">{post.category}</span>
                      <span className="blog-card-date">{post.date}</span>
                    </div>
                    <h3 className="blog-card-title">{post.title}</h3>
                    <p className="blog-card-excerpt">{post.excerpt}</p>
                    <Link to={`/blog/${post.slug}`} className="blog-card-link">
                      Read More <span className="arrow">→</span>
                    </Link>
                  </article>
                ))}
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Newsletter CTA */}
      <section className="blog-cta">
        <h2>Stay Updated</h2>
        <p>Subscribe to our newsletter for the latest modern computing articles and technology insights.</p>
        <div className="blog-cta-form">
          <input type="email" placeholder="Enter your email" className="blog-cta-input" />
          <button className="btn btn-primary">Subscribe</button>
        </div>
      </section>
    </div>
  );
}

export default BlogPage;
