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
  },
  'history-of-internet': {
    id: 23,
    title: 'The History of the Internet: From ARPANET to the World Wide Web',
    excerpt: 'Discover how a Cold War military project evolved into the global network that connects billions of people and transformed human civilization.',
    content: `The Internet is arguably the most transformative invention of the 20th century. What began as a military research project has evolved into a global network connecting over 5 billion people, fundamentally changing how we communicate, work, learn, and live.

## The Cold War Origins

The story of the Internet begins in the late 1950s, at the height of the Cold War. After the Soviet Union launched Sputnik in 1957, the United States created ARPA (Advanced Research Projects Agency) to ensure American technological superiority.

In 1962, J.C.R. Licklider of MIT wrote a series of memos describing his vision of a "Galactic Network" - a globally interconnected set of computers through which everyone could quickly access data and programs from any site. This vision would guide the development of what became the Internet.

## ARPANET: The First Network

The first practical steps toward the Internet came with ARPANET, which went online in 1969. The initial network connected four nodes:

- **UCLA**: University of California, Los Angeles
- **Stanford Research Institute**: Menlo Park, California
- **UC Santa Barbara**: University of California, Santa Barbara
- **University of Utah**: Salt Lake City

The first message ever sent over ARPANET was "LO" - the system crashed before the complete word "LOGIN" could be transmitted. Despite this inauspicious beginning, the network grew rapidly.

## Packet Switching: The Key Innovation

ARPANET pioneered packet switching, a revolutionary method of data transmission developed independently by Paul Baran in the US and Donald Davies in the UK.

Instead of maintaining a dedicated circuit between two points (like a telephone call), packet switching breaks data into small packets that can travel independently through the network, taking different routes if necessary. Key benefits included:

- **Resilience**: No single point of failure could bring down the network
- **Efficiency**: Network resources shared among many users
- **Flexibility**: Different types of data could traverse the same network

## TCP/IP: The Language of the Internet

By the early 1970s, ARPANET needed a standardized way for different computer networks to communicate. Vint Cerf and Bob Kahn developed the Transmission Control Protocol (TCP) and Internet Protocol (IP), which became the fundamental communication protocols of the Internet.

TCP/IP was officially adopted by ARPANET on January 1, 1983 - a date many consider the true birthday of the Internet. This standardization allowed diverse networks to interconnect, creating a true "network of networks."

## Email: The Killer Application

In 1971, Ray Tomlinson sent the first email, choosing the @ symbol to separate the user name from the computer name. Email quickly became the most popular application on the early Internet.

By 1973, email comprised 75% of all ARPANET traffic. It demonstrated the Internet's potential for human communication beyond simple file transfers and remote computer access.

## The Domain Name System

As the network grew, remembering numerical IP addresses became impractical. In 1983, Paul Mockapetris invented the Domain Name System (DNS), allowing users to type memorable names like "stanford.edu" instead of numbers.

The first domain names were registered in 1985:

1. symbolics.com (March 15, 1985)
2. bbn.com
3. think.com
4. mcc.com
5. dec.com

## The World Wide Web

While the Internet provided the infrastructure, it was the World Wide Web that made it accessible to ordinary people. In 1989, Tim Berners-Lee, a British scientist at CERN, proposed a hypertext system for sharing information.

In 1991, Berners-Lee released three fundamental technologies:

- **HTML**: HyperText Markup Language for creating web pages
- **URI/URL**: Uniform Resource Identifier for addressing web resources
- **HTTP**: HyperText Transfer Protocol for transmitting data

### The First Web Browser

The first web browser, called WorldWideWeb (later renamed Nexus), was also created by Berners-Lee. However, it was the Mosaic browser, released in 1993, that truly popularized the Web with its user-friendly graphical interface and support for images.

## Commercialization and the Dot-Com Era

In 1991, the National Science Foundation lifted restrictions on commercial use of the Internet. This opened the floodgates for businesses to establish an online presence.

Key milestones of the commercialization era:

- **1994**: Amazon and Yahoo founded
- **1995**: eBay launches; Netscape goes public
- **1998**: Google founded
- **2000**: Dot-com bubble peaks and bursts

## The Social Web

The early 2000s saw the rise of social networking and user-generated content:

- **2003**: MySpace launches
- **2004**: Facebook founded at Harvard
- **2005**: YouTube begins streaming video
- **2006**: Twitter introduces microblogging
- **2007**: iPhone revolutionizes mobile Internet access

## The Modern Internet

Today's Internet bears little resemblance to its academic origins. It has become essential infrastructure for:

- **Commerce**: E-commerce represents trillions of dollars annually
- **Communication**: Email, messaging, video calls connect billions
- **Entertainment**: Streaming services deliver music, movies, and games
- **Education**: Online learning reaches students worldwide
- **Work**: Remote work and cloud computing transform business

## Challenges and the Future

The Internet faces significant challenges:

- **Privacy**: Data collection and surveillance concerns
- **Security**: Cyber attacks and information warfare
- **Misinformation**: Fake news and content moderation
- **Digital divide**: Unequal access across regions and demographics
- **Net neutrality**: Debates over equal treatment of Internet traffic

## Legacy and Impact

From a network of four computers to a global system connecting billions of devices, the Internet represents one of humanity's greatest collaborative achievements. The vision of Licklider's "Galactic Network" has been realized beyond what its pioneers could have imagined.

The Internet has democratized information, enabled new forms of human connection, and created entirely new industries. As we look to the future with developments in artificial intelligence, the Internet of Things, and beyond, the network continues to evolve and shape our world in profound ways.`,
    author: 'Dr. Rebecca Torres',
    authorBio: 'Technology historian and professor of Computer Science at MIT, specializing in the social impact of networking technologies.',
    date: 'January 15, 2025',
    readingTime: '14 min read',
    category: 'History',
    slug: 'history-of-internet'
  },
  'evolution-operating-systems': {
    id: 24,
    title: 'The Evolution of Operating Systems: From Batch Processing to Modern Multitasking',
    excerpt: 'Trace the fascinating journey of operating systems from the earliest mainframes to today\'s sophisticated platforms that power everything from smartphones to supercomputers.',
    content: `Operating systems are the unsung heroes of computing. Every time you tap your smartphone, type on your laptop, or interact with any digital device, an operating system is working behind the scenes to make it all possible. This is the story of how these remarkable pieces of software evolved over seven decades.

## The Pre-Operating System Era (1940s-1950s)

In the earliest days of computing, there were no operating systems at all. Programmers interacted directly with the hardware, feeding instructions through punch cards and toggle switches.

### The ENIAC Era

The ENIAC (Electronic Numerical Integrator and Computer), completed in 1945, required operators to physically rewire the machine for each new program. Running a single calculation could take days of preparation for mere seconds of actual computation.

### Manual Operation Challenges

Early computers presented significant operational challenges:

- **Single-user operation**: Only one program could run at a time
- **Manual scheduling**: Human operators managed job queues
- **No abstraction**: Programmers needed intimate hardware knowledge
- **Wasted resources**: Expensive machines sat idle between jobs

## Batch Processing Systems (1950s-1960s)

The first true operating systems emerged to solve the inefficiency of manual operation. Batch processing systems automated the loading and execution of multiple jobs.

### GM-NAA I/O (1956)

General Motors and North American Aviation developed one of the first operating systems for the IBM 704. It automatically loaded the next job when the current one finished, dramatically improving computer utilization.

### Key Batch Processing Features

- **Job Control Language (JCL)**: Standardized commands for job submission
- **Automatic job sequencing**: Reduced idle time between programs
- **Input/Output management**: Abstracted hardware details from programmers
- **Error handling**: Basic recovery from program failures

### The Mainframe Era

IBM dominated this period with systems like the IBM 7090 and its operating systems. IBSYS and later OS/360 became industry standards, establishing many concepts still used today.

## Time-Sharing Revolution (1960s-1970s)

Batch processing was efficient for the computer but frustrating for users who had to wait hours or days for results. Time-sharing changed everything by allowing multiple users to interact with the computer simultaneously.

### Compatible Time-Sharing System (CTSS)

Developed at MIT in 1961, CTSS demonstrated that multiple users could share a single computer through terminals. Each user felt like they had the entire machine to themselves.

### Multics: The Ambitious Pioneer

The Multiplexed Information and Computing Service (Multics), begun in 1965 as a collaboration between MIT, Bell Labs, and General Electric, introduced revolutionary concepts:

- **Hierarchical file systems**: Directories containing directories
- **Security rings**: Multiple levels of privilege
- **Dynamic linking**: Loading code on demand
- **Virtual memory**: Using disk space as extended RAM

Though Multics was considered commercially unsuccessful, its influence on future operating systems was immeasurable.

## The Birth of Unix (1969-1980s)

When Bell Labs withdrew from the Multics project, Ken Thompson and Dennis Ritchie created Unix, a simpler but elegant operating system that would change computing forever.

### Unix Philosophy

Unix introduced a design philosophy that remains influential:

- **Do one thing well**: Small, focused programs
- **Text streams**: Universal data format
- **Pipes**: Connecting programs together
- **Everything is a file**: Unified interface to resources

### The C Language Connection

Dennis Ritchie's C programming language, developed alongside Unix, made the operating system portable. By 1973, Unix was rewritten in C, allowing it to run on different hardware platforms.

### Unix Variants Proliferate

The 1980s saw Unix spread across academia and industry:

- **BSD**: Berkeley Software Distribution, adding networking
- **System V**: AT&T's commercial Unix
- **SunOS/Solaris**: Sun Microsystems' workstation OS
- **AIX**: IBM's Unix variant
- **HP-UX**: Hewlett-Packard's implementation

## Personal Computer Revolution (1970s-1980s)

While Unix dominated larger systems, an entirely different branch of operating systems emerged for the new personal computers.

### CP/M: The Pioneer

Gary Kildall's Control Program for Microcomputers (CP/M), released in 1974, became the dominant operating system for early microcomputers. Its simple design included:

- **Command-line interface**: Typed commands for interaction
- **File system**: Organized storage on floppy disks
- **Hardware abstraction**: BIOS layer for portability

### MS-DOS and the IBM PC

When IBM chose Microsoft to provide the operating system for their PC in 1981, Bill Gates acquired QDOS (Quick and Dirty Operating System) and transformed it into MS-DOS. This decision would shape the industry for decades.

MS-DOS features included:

- **FAT file system**: Simple but effective storage organization
- **Batch files**: Automated command sequences
- **Memory management**: Working within 640KB limitations
- **Device drivers**: Extending hardware support

### The Macintosh Revolution

Apple's Macintosh, released in 1984, brought the graphical user interface to consumers. Built on concepts from Xerox PARC, the Mac OS introduced:

- **Windows and icons**: Visual representation of files and programs
- **Mouse-driven interaction**: Point and click instead of typing
- **WYSIWYG**: What You See Is What You Get editing
- **Desktop metaphor**: Familiar office concepts on screen

## The Windows Era (1985-2000s)

Microsoft's Windows brought graphical interfaces to the vast installed base of DOS computers, eventually becoming the dominant desktop operating system.

### Windows Evolution

- **Windows 1.0 (1985)**: Tiled windows, limited functionality
- **Windows 3.0 (1990)**: Overlapping windows, improved memory management
- **Windows 95 (1995)**: Start menu, taskbar, Plug and Play
- **Windows NT (1993)**: Enterprise-grade, 32-bit architecture
- **Windows XP (2001)**: Merged consumer and professional lines
- **Windows 7 (2009)**: Refined interface, improved stability
- **Windows 10 (2015)**: Unified platform across devices

### The NT Kernel

Windows NT, designed by Dave Cutler (formerly of DEC), introduced a modern kernel architecture:

- **Preemptive multitasking**: OS controls program scheduling
- **Protected memory**: Programs cannot crash each other
- **NTFS file system**: Security, compression, large file support
- **Hardware abstraction**: Clean separation from hardware details

## Linux and Open Source (1991-Present)

Linus Torvalds' announcement on a Usenet newsgroup in 1991 began one of the most remarkable collaborative projects in history.

### Linux Kernel Development

Starting as a hobby project to create a free Unix-like system, Linux grew through contributions from thousands of developers worldwide. Key characteristics include:

- **Open source**: Anyone can view, modify, and distribute the code
- **Modular design**: Load only needed components
- **Scalability**: Runs on everything from watches to supercomputers
- **Community driven**: Development by global volunteers

### Linux Distributions

Linux distributions package the kernel with additional software:

- **Red Hat/Fedora**: Enterprise and community editions
- **Debian/Ubuntu**: User-friendly desktop focus
- **SUSE**: European enterprise favorite
- **Arch**: Cutting-edge, do-it-yourself approach
- **Android**: Mobile Linux variant powering billions of phones

### The Server Dominance

Linux now powers the majority of web servers, cloud infrastructure, and supercomputers. Its reliability, security, and cost-effectiveness made it the backbone of the internet age.

## Modern Operating Systems (2000s-Present)

Today's operating systems face challenges their creators could never have imagined: smartphones, cloud computing, artificial intelligence, and security threats from global adversaries.

### macOS: Unix Meets Apple

Apple's macOS, built on a Unix foundation (Darwin/XNU kernel), combines Unix power with Apple's design sensibility:

- **BSD-based**: Robust Unix underpinnings
- **Aqua interface**: Polished visual design
- **Metal**: High-performance graphics framework
- **Tight integration**: Seamless device ecosystem

### Mobile Operating Systems

Smartphones required operating systems optimized for touch interfaces, limited batteries, and constant connectivity:

- **iOS**: Apple's mobile system, derived from macOS
- **Android**: Google's Linux-based platform
- **Touch-centric design**: Gestures replace mouse clicks
- **App ecosystems**: Curated software stores
- **Always connected**: Background sync and notifications

### Cloud and Container Operating Systems

Modern data centers run specialized operating systems designed for virtualization and containers:

- **VMware ESXi**: Enterprise virtualization platform
- **Container Linux**: Minimal OS for running containers
- **Kubernetes**: Container orchestration across clusters
- **Serverless**: Functions without visible operating systems

## Key Innovations Throughout History

Several breakthrough technologies transformed operating systems over the decades:

### Memory Management

- **Virtual memory**: Programs can use more memory than physically available
- **Paging**: Moving data between RAM and disk automatically
- **Memory protection**: Preventing programs from interfering with each other

### Process Management

- **Multitasking**: Running multiple programs simultaneously
- **Scheduling algorithms**: Fairly distributing CPU time
- **Inter-process communication**: Programs sharing data safely

### File Systems

- **Hierarchical directories**: Organizing files in tree structures
- **Journaling**: Protecting against data loss during crashes
- **Distributed file systems**: Files spanning multiple computers

### Security

- **User authentication**: Verifying user identity
- **Access control**: Restricting who can do what
- **Sandboxing**: Isolating potentially dangerous code
- **Encryption**: Protecting data from unauthorized access

## The Future of Operating Systems

Operating systems continue evolving to meet new challenges:

### Emerging Trends

- **AI integration**: Built-in machine learning capabilities
- **Edge computing**: Processing data close to its source
- **Quantum computing**: New paradigms for computation
- **Real-time systems**: Guaranteed response times for critical tasks
- **Security hardening**: Protection against sophisticated attacks

### Unikernel and Microkernel Approaches

Modern systems are exploring minimal designs:

- **Microkernels**: Minimal kernel with services in user space
- **Unikernels**: Single-purpose, library-based systems
- **Security through simplicity**: Less code means fewer vulnerabilities

## Conclusion

From the room-sized ENIAC requiring human operators to toggle switches, to smartphones running sophisticated operating systems in our pockets, the evolution has been remarkable. Each generation built upon the innovations of its predecessors while solving new challenges.

Operating systems remain essential but increasingly invisible. We interact with apps and services, rarely thinking about the complex software making it all possible. Yet every tap, click, and voice command relies on decades of innovation in managing hardware resources, protecting data, and enabling human-computer interaction.

As we look toward a future of artificial intelligence, quantum computing, and ubiquitous connectivity, operating systems will continue evolving. The fundamental challenges remain the same: efficiently managing resources, providing useful abstractions, and enabling people to accomplish their goals with technology. The solutions, however, will be as innovative as anything we've seen in the past seventy years.`,
    author: 'Dr. Michael Patterson',
    authorBio: 'Systems architect and computing historian with 30 years of experience in operating system development, formerly with Bell Labs and Microsoft Research.',
    date: 'January 22, 2025',
    readingTime: '16 min read',
    category: 'History',
    slug: 'evolution-operating-systems'
  }
};

// Default article for unknown slugs
const defaultArticle: Article = {
  id: 0,
  title: 'Article Not Found',
  excerpt: 'The requested article could not be found.',
  content: 'The article you are looking for does not exist or has been moved. Please check the URL or browse our other articles.',
  author: 'ClassicPC Team',
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
