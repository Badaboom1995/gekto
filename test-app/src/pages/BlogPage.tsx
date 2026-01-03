import { Link } from 'react-router-dom';
import './BlogPage.css';

interface BlogPost {
  id: number;
  title: string;
  excerpt: string;
  date: string;
  category: string;
  slug: string;
}

const blogPosts: BlogPost[] = [
  {
    id: 1,
    title: 'The History of the Commodore 64',
    excerpt: 'Explore the legendary home computer that sold over 17 million units and defined a generation of computing enthusiasts.',
    date: 'December 15, 2024',
    category: 'History',
    slug: 'history-commodore-64'
  },
  {
    id: 2,
    title: 'Restoring Vintage Computers',
    excerpt: 'A comprehensive guide to bringing old machines back to life, from capacitor replacement to retrobright techniques.',
    date: 'December 10, 2024',
    category: 'Restoration',
    slug: 'restoring-vintage-computers'
  },
  {
    id: 3,
    title: 'Why the Amiga Was Ahead of Its Time',
    excerpt: 'The Amiga introduced multitasking, advanced graphics, and digital audio years before the competition caught up.',
    date: 'December 5, 2024',
    category: 'History',
    slug: 'amiga-ahead-of-time'
  },
  {
    id: 4,
    title: 'Building a Retro Gaming Setup',
    excerpt: 'Everything you need to create the ultimate vintage gaming station with authentic hardware and modern conveniences.',
    date: 'November 28, 2024',
    category: 'Guides',
    slug: 'retro-gaming-setup'
  },
  {
    id: 5,
    title: 'The Rise and Fall of Atari',
    excerpt: 'From arcade dominance to the video game crash of 1983, trace the dramatic history of this pioneering company.',
    date: 'November 20, 2024',
    category: 'History',
    slug: 'rise-fall-atari'
  },
  {
    id: 6,
    title: 'Mechanical Keyboards: A Retro Revival',
    excerpt: 'Why modern enthusiasts are returning to the tactile feel of vintage mechanical switches and keycaps.',
    date: 'November 15, 2024',
    category: 'Hardware',
    slug: 'mechanical-keyboards-retro'
  },
  {
    id: 7,
    title: 'Programming on 8-Bit Machines',
    excerpt: 'Learn the constraints and creativity required to code on systems with just 64KB of RAM.',
    date: 'November 8, 2024',
    category: 'Programming',
    slug: 'programming-8bit-machines'
  },
  {
    id: 8,
    title: 'The Art of Pixel Graphics',
    excerpt: 'Discover the techniques artists used to create stunning visuals within severe technical limitations.',
    date: 'November 1, 2024',
    category: 'Design',
    slug: 'art-pixel-graphics'
  }
];

function BlogPage() {
  return (
    <div className="blog-page">
      {/* Hero Section */}
      <section className="blog-hero">
        <div className="blog-hero-overlay">
          <h1 className="blog-hero-title">Blog</h1>
        </div>
        <div className="blog-hero-content">
          <h2 className="blog-hero-heading">
            Retro Computing <span className="highlight">Stories</span>
          </h2>
          <p className="blog-hero-subtitle">
            Dive into the fascinating world of vintage technology, restoration guides, and computing history.
          </p>
        </div>
      </section>

      {/* Blog Posts Grid */}
      <section className="blog-posts-section">
        <div className="blog-posts-grid">
          {blogPosts.map((post) => (
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
      </section>

      {/* Newsletter CTA */}
      <section className="blog-cta">
        <h2>Stay Updated</h2>
        <p>Subscribe to our newsletter for the latest retro computing articles and restoration tips.</p>
        <div className="blog-cta-form">
          <input type="email" placeholder="Enter your email" className="blog-cta-input" />
          <button className="btn btn-primary">Subscribe</button>
        </div>
      </section>
    </div>
  );
}

export default BlogPage;
