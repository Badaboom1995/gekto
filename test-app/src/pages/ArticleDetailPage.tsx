import { useParams, Link } from 'react-router-dom';
import './ArticleDetailPage.css';

interface Article {
  id: number;
  title: string;
  excerpt: string;
  content: string;
  author: string;
  authorBio: string;
  date: string;
  readingTime: string;
  category: string;
  slug: string;
}

const articles: Record<string, Article> = {
  'history-commodore-64': {
    id: 1,
    title: 'The History of the Commodore 64',
    excerpt: 'Explore the legendary home computer that sold over 17 million units and defined a generation of computing enthusiasts.',
    content: `The Commodore 64, also known as the C64, is an 8-bit home computer introduced in January 1982 by Commodore International. It is listed in the Guinness World Records as the highest-selling single computer model of all time, with independent estimates placing the number sold between 12.5 and 17 million units.

## The Birth of a Legend

The C64 was conceived by Commodore engineer Robert "Bob" Yannes, who also designed the legendary SID sound chip. The machine was designed to be a low-cost computer that could compete with the Atari 800 and Apple II while being sold through retail stores rather than just computer shops.

## Technical Specifications

The Commodore 64 featured impressive specifications for its time:

- **CPU**: MOS Technology 6510 running at 1.023 MHz
- **RAM**: 64 KB (hence the name)
- **ROM**: 20 KB
- **Graphics**: VIC-II chip capable of 320×200 resolution with 16 colors
- **Sound**: SID 6581, a revolutionary 3-channel synthesizer chip

## The Golden Age of Gaming

The C64 became synonymous with gaming in the 1980s. Its powerful (for the time) graphics and sound capabilities made it the platform of choice for game developers. Classics like "The Last Ninja," "Impossible Mission," "Maniac Mansion," and "Boulder Dash" helped define an entire generation of gamers.

## The Demo Scene

Perhaps no other computer inspired as much creative programming as the C64. The demo scene, where programmers pushed the hardware beyond its documented limits, flourished on this platform. Techniques like "raster interrupts" and "sprite multiplexing" allowed developers to create effects that seemed impossible on the hardware.

## Legacy

The Commodore 64's influence extends far beyond its production years. Many of today's game developers, musicians, and programmers got their start on this machine. The SID chip's unique sound has inspired entire music genres, and the C64 remains popular among retro computing enthusiasts who continue to develop new software and hardware for the platform.

Today, a thriving community keeps the C64 alive through emulators, new game releases, and hardware modifications. The machine that Jack Tramiel envisioned as "a computer for the masses, not the classes" truly achieved that goal and more.`,
    author: 'John Smith',
    authorBio: 'Retro computing historian and collector with over 20 years of experience.',
    date: 'December 15, 2024',
    readingTime: '8 min read',
    category: 'History',
    slug: 'history-commodore-64'
  },
  'restoring-vintage-computers': {
    id: 2,
    title: 'Restoring Vintage Computers',
    excerpt: 'A comprehensive guide to bringing old machines back to life, from capacitor replacement to retrobright techniques.',
    content: `Restoring vintage computers is both an art and a science. Whether you've found a dusty Commodore 64 in your attic or scored an Apple II at a flea market, bringing these classic machines back to life requires patience, knowledge, and the right tools.

## Initial Assessment

Before diving into any restoration, thoroughly assess the condition of your machine:

1. **Visual Inspection**: Look for obvious damage, corrosion, or missing parts
2. **Smell Test**: A burnt smell often indicates damaged components
3. **Battery Check**: Remove any old batteries immediately to prevent further corrosion

## Cleaning

Proper cleaning is essential for any restoration project:

### External Cleaning
- Use mild soap and water for plastic cases
- Isopropyl alcohol (90% or higher) works well for removing grime
- Avoid abrasive cleaners that can scratch surfaces

### Internal Cleaning
- Use compressed air to remove dust
- Clean circuit boards with isopropyl alcohol and soft brushes
- Be gentle around sensitive components

## Retrobright: Restoring Yellowed Plastics

Many vintage computers suffer from yellowing due to UV exposure and bromine in the plastic. The Retrobright process can reverse this:

1. Mix hydrogen peroxide cream (salon grade, 12%)
2. Apply evenly to yellowed surfaces
3. Expose to UV light for several hours
4. Rinse thoroughly and repeat if necessary

**Warning**: This process can be uneven if not applied carefully, and results may not be permanent.

## Capacitor Replacement

Electrolytic capacitors are often the first components to fail in vintage electronics. Signs of bad capacitors include:

- Bulging tops
- Leaking electrolyte
- System instability

Replacing capacitors requires soldering skills and the right replacement parts. Always use capacitors rated for the same or higher voltage and capacitance.

## Testing and Troubleshooting

After cleaning and any necessary repairs:

1. **Visual check**: Ensure all connections are secure
2. **Power supply test**: Verify correct voltages before connecting
3. **Gradual power-up**: Consider using a variac for initial testing
4. **Diagnostic software**: Run built-in tests or diagnostic programs

## Preservation vs. Restoration

Consider your goals before starting:

- **Preservation**: Maintain original condition, minimal intervention
- **Restoration**: Return to working condition, may involve part replacement
- **Modification**: Enhance with modern conveniences (use caution!)

Remember, these machines are pieces of computing history. Whatever approach you choose, document your work and respect the original engineering.`,
    author: 'Sarah Johnson',
    authorBio: 'Electronics engineer specializing in vintage computer restoration.',
    date: 'December 10, 2024',
    readingTime: '12 min read',
    category: 'Restoration',
    slug: 'restoring-vintage-computers'
  },
  'amiga-ahead-of-time': {
    id: 3,
    title: 'Why the Amiga Was Ahead of Its Time',
    excerpt: 'The Amiga introduced multitasking, advanced graphics, and digital audio years before the competition caught up.',
    content: `When Commodore released the Amiga 1000 in 1985, it introduced technologies that wouldn't become mainstream for nearly a decade. This revolutionary computer was truly ahead of its time.

## Preemptive Multitasking

While other personal computers of the era could barely run one program at a time, the Amiga featured true preemptive multitasking. Users could run multiple applications simultaneously, with the operating system intelligently managing CPU time between tasks.

## Custom Chipset

The Amiga's secret weapon was its custom chipset, designed by Jay Miner and his team:

### Agnus
The blitter and copper coprocessor handled graphics operations, freeing the CPU for other tasks. The copper could change display parameters mid-screen, enabling effects impossible on other systems.

### Denise
The graphics chip supported multiple display modes, including the revolutionary HAM (Hold-And-Modify) mode that could display 4,096 colors simultaneously.

### Paula
Four-channel 8-bit PCM audio with hardware mixing gave the Amiga sound capabilities that rivaled dedicated music equipment.

## Graphics Capabilities

The Amiga could display:
- Up to 4,096 colors (in HAM mode)
- Hardware sprites and scrolling
- Multiple playfields with transparency
- Genlock capability for video production

These features made the Amiga the go-to platform for video production and graphic design throughout the late 1980s and early 1990s.

## Impact on Creative Industries

The Amiga transformed several industries:

### Television Production
Shows like "Babylon 5" used Amigas for CGI effects. The Video Toaster, an add-on card for the Amiga, brought broadcast-quality video editing to desktop computers for the first time.

### Music Production
The Amiga pioneered tracker music software, leading to the MOD format that influenced digital music distribution and creation.

### Gaming
Games like "Shadow of the Beast," "Lemmings," and "Another World" showcased the platform's capabilities and influenced game design for years to come.

## Why Did It Fail?

Despite its technical superiority, the Amiga ultimately lost the market war due to:

- Commodore's poor marketing
- High prices for professional models
- The rise of IBM PC compatibles
- Internal corporate mismanagement

## Legacy

The Amiga's influence lives on in modern computing. Its concepts of preemptive multitasking, dedicated graphics hardware, and multimedia integration are now standard features. The platform maintains a devoted following, with new hardware and software still being developed today.`,
    author: 'Mike Chen',
    authorBio: 'Software developer and Amiga enthusiast since 1987.',
    date: 'December 5, 2024',
    readingTime: '10 min read',
    category: 'History',
    slug: 'amiga-ahead-of-time'
  }
};

// Default article for unknown slugs
const defaultArticle: Article = {
  id: 0,
  title: 'Article Not Found',
  excerpt: 'The requested article could not be found.',
  content: 'The article you are looking for does not exist or has been moved. Please check the URL or browse our other articles.',
  author: 'RetroPC Team',
  authorBio: '',
  date: '',
  readingTime: '',
  category: '',
  slug: ''
};

function ArticleDetailPage() {
  const { slug } = useParams<{ slug: string }>();
  const article = slug ? articles[slug] || defaultArticle : defaultArticle;
  const isNotFound = article === defaultArticle;

  // Simple markdown-like rendering for headers and paragraphs
  const renderContent = (content: string) => {
    return content.split('\n\n').map((paragraph, index) => {
      // H2 headers
      if (paragraph.startsWith('## ')) {
        return <h2 key={index} className="article-h2">{paragraph.slice(3)}</h2>;
      }
      // H3 headers
      if (paragraph.startsWith('### ')) {
        return <h3 key={index} className="article-h3">{paragraph.slice(4)}</h3>;
      }
      // Lists
      if (paragraph.startsWith('- ') || paragraph.startsWith('1. ')) {
        const items = paragraph.split('\n').filter(line => line.trim());
        const isOrdered = paragraph.startsWith('1. ');
        const ListTag = isOrdered ? 'ol' : 'ul';
        return (
          <ListTag key={index} className="article-list">
            {items.map((item, i) => (
              <li key={i}>{item.replace(/^[-\d.]\s*/, '').replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')}</li>
            ))}
          </ListTag>
        );
      }
      // Warning/Note blocks
      if (paragraph.startsWith('**Warning**:') || paragraph.startsWith('**Note**:')) {
        return <div key={index} className="article-warning">{paragraph}</div>;
      }
      // Regular paragraphs with bold text support
      return (
        <p
          key={index}
          className="article-paragraph"
          dangerouslySetInnerHTML={{
            __html: paragraph.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
          }}
        />
      );
    });
  };

  return (
    <div className="article-detail-page">
      {/* Breadcrumb */}
      <nav className="article-breadcrumb">
        <Link to="/">Home</Link>
        <span className="breadcrumb-separator">/</span>
        <Link to="/articles">Articles</Link>
        {!isNotFound && (
          <>
            <span className="breadcrumb-separator">/</span>
            <span className="breadcrumb-current">{article.title}</span>
          </>
        )}
      </nav>

      {isNotFound ? (
        <div className="article-not-found">
          <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <circle cx="12" cy="12" r="10"/>
            <path d="M12 8v4M12 16h.01"/>
          </svg>
          <h1>Article Not Found</h1>
          <p>The article you're looking for doesn't exist or has been moved.</p>
          <Link to="/articles" className="btn btn-primary">Browse All Articles</Link>
        </div>
      ) : (
        <>
          {/* Article Header */}
          <header className="article-header">
            <span className="article-category-badge">{article.category}</span>
            <h1 className="article-title">{article.title}</h1>
            <p className="article-excerpt">{article.excerpt}</p>

            <div className="article-meta">
              <div className="article-author-info">
                <div className="author-avatar-large">
                  {article.author.charAt(0)}
                </div>
                <div className="author-details">
                  <span className="author-name">{article.author}</span>
                  <span className="author-bio">{article.authorBio}</span>
                </div>
              </div>
              <div className="article-stats">
                <span className="article-date">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
                    <line x1="16" y1="2" x2="16" y2="6"/>
                    <line x1="8" y1="2" x2="8" y2="6"/>
                    <line x1="3" y1="10" x2="21" y2="10"/>
                  </svg>
                  {article.date}
                </span>
                <span className="article-reading-time">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="12" cy="12" r="10"/>
                    <polyline points="12 6 12 12 16 14"/>
                  </svg>
                  {article.readingTime}
                </span>
              </div>
            </div>
          </header>

          {/* Article Content */}
          <article className="article-content">
            {renderContent(article.content)}
          </article>

          {/* Article Footer */}
          <footer className="article-footer">
            <div className="article-share">
              <span className="share-label">Share this article:</span>
              <div className="share-buttons">
                <button className="share-btn" aria-label="Share on Twitter">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                  </svg>
                </button>
                <button className="share-btn" aria-label="Share on Facebook">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                  </svg>
                </button>
                <button className="share-btn" aria-label="Share on LinkedIn">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
                  </svg>
                </button>
                <button className="share-btn" aria-label="Copy link">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/>
                    <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/>
                  </svg>
                </button>
              </div>
            </div>

            <Link to="/articles" className="back-to-articles">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M15 18l-6-6 6-6"/>
              </svg>
              Back to All Articles
            </Link>
          </footer>
        </>
      )}
    </div>
  );
}

export default ArticleDetailPage;
