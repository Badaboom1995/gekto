import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import './ArticlesPage.css';

interface Article {
  id: number;
  title: string;
  excerpt: string;
  author: string;
  date: string;
  readingTime: string;
  category: string;
  slug: string;
}

const articles: Article[] = [
  {
    id: 1,
    title: 'The History of the Commodore 64',
    excerpt: 'Explore the legendary home computer that sold over 17 million units and defined a generation of computing enthusiasts.',
    author: 'John Smith',
    date: 'December 15, 2024',
    readingTime: '8 min read',
    category: 'History',
    slug: 'history-commodore-64'
  },
  {
    id: 2,
    title: 'Restoring Vintage Computers',
    excerpt: 'A comprehensive guide to bringing old machines back to life, from capacitor replacement to retrobright techniques.',
    author: 'Sarah Johnson',
    date: 'December 10, 2024',
    readingTime: '12 min read',
    category: 'Restoration',
    slug: 'restoring-vintage-computers'
  },
  {
    id: 3,
    title: 'Why the Amiga Was Ahead of Its Time',
    excerpt: 'The Amiga introduced multitasking, advanced graphics, and digital audio years before the competition caught up.',
    author: 'Mike Chen',
    date: 'December 5, 2024',
    readingTime: '10 min read',
    category: 'History',
    slug: 'amiga-ahead-of-time'
  },
  {
    id: 4,
    title: 'Building a Retro Gaming Setup',
    excerpt: 'Everything you need to create the ultimate vintage gaming station with authentic hardware and modern conveniences.',
    author: 'Emily Davis',
    date: 'November 28, 2024',
    readingTime: '15 min read',
    category: 'Guides',
    slug: 'retro-gaming-setup'
  },
  {
    id: 5,
    title: 'The Rise and Fall of Atari',
    excerpt: 'From arcade dominance to the video game crash of 1983, trace the dramatic history of this pioneering company.',
    author: 'David Wilson',
    date: 'November 20, 2024',
    readingTime: '11 min read',
    category: 'History',
    slug: 'rise-fall-atari'
  },
  {
    id: 6,
    title: 'Mechanical Keyboards: A Retro Revival',
    excerpt: 'Why modern enthusiasts are returning to the tactile feel of vintage mechanical switches and keycaps.',
    author: 'Lisa Anderson',
    date: 'November 15, 2024',
    readingTime: '7 min read',
    category: 'Hardware',
    slug: 'mechanical-keyboards-retro'
  },
  {
    id: 7,
    title: 'Programming on 8-Bit Machines',
    excerpt: 'Learn the constraints and creativity required to code on systems with just 64KB of RAM.',
    author: 'Robert Taylor',
    date: 'November 8, 2024',
    readingTime: '14 min read',
    category: 'Programming',
    slug: 'programming-8bit-machines'
  },
  {
    id: 8,
    title: 'The Art of Pixel Graphics',
    excerpt: 'Discover the techniques artists used to create stunning visuals within severe technical limitations.',
    author: 'Amanda White',
    date: 'November 1, 2024',
    readingTime: '9 min read',
    category: 'Design',
    slug: 'art-pixel-graphics'
  },
  {
    id: 9,
    title: 'Collecting Vintage Software',
    excerpt: 'Tips and tricks for building your retro software library, from flea markets to online auctions.',
    author: 'Chris Martinez',
    date: 'October 25, 2024',
    readingTime: '6 min read',
    category: 'Collecting',
    slug: 'collecting-vintage-software'
  },
  {
    id: 10,
    title: 'The ZX Spectrum Legacy',
    excerpt: 'How a British home computer sparked a revolution in gaming and computing across Europe.',
    author: 'James Brown',
    date: 'October 18, 2024',
    readingTime: '10 min read',
    category: 'History',
    slug: 'zx-spectrum-legacy'
  },
  {
    id: 11,
    title: 'Emulation vs Original Hardware',
    excerpt: 'The pros and cons of experiencing retro computing through emulation versus authentic machines.',
    author: 'Jennifer Lee',
    date: 'October 11, 2024',
    readingTime: '8 min read',
    category: 'Guides',
    slug: 'emulation-vs-hardware'
  },
  {
    id: 12,
    title: 'The Sound of the 80s: Chiptune Music',
    excerpt: 'Exploring the unique soundscapes created by vintage sound chips and their modern revival.',
    author: 'Kevin Moore',
    date: 'October 4, 2024',
    readingTime: '11 min read',
    category: 'Music',
    slug: 'chiptune-music'
  }
];

const ARTICLES_PER_PAGE = 6;

function ArticlesPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);

  const filteredArticles = useMemo(() => {
    if (!searchQuery.trim()) return articles;
    const query = searchQuery.toLowerCase();
    return articles.filter(
      (article) =>
        article.title.toLowerCase().includes(query) ||
        article.excerpt.toLowerCase().includes(query) ||
        article.author.toLowerCase().includes(query) ||
        article.category.toLowerCase().includes(query)
    );
  }, [searchQuery]);

  const totalPages = Math.ceil(filteredArticles.length / ARTICLES_PER_PAGE);
  const startIndex = (currentPage - 1) * ARTICLES_PER_PAGE;
  const paginatedArticles = filteredArticles.slice(startIndex, startIndex + ARTICLES_PER_PAGE);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
    setCurrentPage(1);
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="articles-page">
      {/* Hero Section */}
      <section className="articles-hero">
        <div className="articles-hero-overlay">
          <h1 className="articles-hero-title">anythong</h1>
        </div>
        <div className="articles-hero-content">
          <h2 className="articles-hero-heading">
            Explore Our <span className="highlight">Articles</span>
          </h2>
          <p className="articles-hero-subtitle">
            Discover in-depth guides, tutorials, and stories about vintage computing, restoration, and retro technology.
          </p>

          {/* Search Bar */}
          <div className="articles-search">
            <div className="search-input-wrapper">
              <svg className="search-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="11" cy="11" r="8"/>
                <path d="M21 21l-4.35-4.35"/>
              </svg>
              <input
                type="text"
                placeholder="Search articles..."
                value={searchQuery}
                onChange={handleSearchChange}
                className="articles-search-input"
              />
              {searchQuery && (
                <button
                  className="search-clear-btn"
                  onClick={() => {
                    setSearchQuery('');
                    setCurrentPage(1);
                  }}
                  aria-label="Clear search"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M18 6L6 18M6 6l12 12"/>
                  </svg>
                </button>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Articles Grid */}
      <section className="articles-section">
        {filteredArticles.length === 0 ? (
          <div className="articles-empty">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <circle cx="11" cy="11" r="8"/>
              <path d="M21 21l-4.35-4.35"/>
            </svg>
            <h3>No articles found</h3>
            <p>Try adjusting your search query to find what you're looking for.</p>
          </div>
        ) : (
          <>
            <div className="articles-grid">
              {paginatedArticles.map((article) => (
                <article key={article.id} className="article-card">
                  <div className="article-card-header">
                    <span className="article-card-category">{article.category}</span>
                    <span className="article-card-reading-time">{article.readingTime}</span>
                  </div>
                  <h3 className="article-card-title">{article.title}</h3>
                  <p className="article-card-excerpt">{article.excerpt}</p>
                  <div className="article-card-meta">
                    <div className="article-card-author">
                      <div className="author-avatar">
                        {article.author.charAt(0)}
                      </div>
                      <span className="author-name">{article.author}</span>
                    </div>
                    <span className="article-card-date">{article.date}</span>
                  </div>
                  <Link to={`/articles/${article.slug}`} className="article-card-link">
                    Read More <span className="arrow">→</span>
                  </Link>
                </article>
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="articles-pagination">
                <button
                  className="pagination-btn pagination-prev"
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M15 18l-6-6 6-6"/>
                  </svg>
                  Previous
                </button>

                <div className="pagination-pages">
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                    <button
                      key={page}
                      className={`pagination-page ${currentPage === page ? 'active' : ''}`}
                      onClick={() => handlePageChange(page)}
                    >
                      {page}
                    </button>
                  ))}
                </div>

                <button
                  className="pagination-btn pagination-next"
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage === totalPages}
                >
                  Next
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M9 18l6-6-6-6"/>
                  </svg>
                </button>
              </div>
            )}

            <div className="articles-results-info">
              Showing {startIndex + 1}-{Math.min(startIndex + ARTICLES_PER_PAGE, filteredArticles.length)} of {filteredArticles.length} articles
            </div>
          </>
        )}
      </section>
    </div>
  );
}

export default ArticlesPage;
