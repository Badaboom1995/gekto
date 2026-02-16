import { Link } from 'react-router-dom';
import './AboutPage.css';

const milestones = [
  {
    year: '2009',
    title: 'The Beginning',
    description: 'Founded in a small garage with a passion for preserving computing history.'
  },
  {
    year: '2012',
    title: 'First Warehouse',
    description: 'Expanded to our first dedicated restoration facility with professional equipment.'
  },
  {
    year: '2016',
    title: 'Global Reach',
    description: 'Started shipping internationally, connecting collectors across 30+ countries.'
  },
  {
    year: '2020',
    title: '10K Collectors',
    description: 'Reached milestone of 10,000 happy collectors in our community.'
  },
  {
    year: '2024',
    title: 'Industry Leader',
    description: 'Recognized as the premier destination for vintage computing enthusiasts worldwide.'
  }
];

const values = [
  {
    icon: '🔍',
    title: 'Authenticity',
    description: 'Every machine is verified and documented with complete provenance.'
  },
  {
    icon: '🛠️',
    title: 'Quality Restoration',
    description: 'Expert technicians restore each computer to working condition with period-correct parts.'
  },
  {
    icon: '🤝',
    title: 'Community',
    description: 'We build connections between collectors, enthusiasts, and historians.'
  },
  {
    icon: '📚',
    title: 'Education',
    description: 'Preserving knowledge through documentation, guides, and workshops.'
  }
];

const stats = [
  { value: '15+', label: 'Years Experience' },
  { value: '500+', label: 'Machines Restored' },
  { value: '10K+', label: 'Happy Collectors' },
  { value: '50+', label: 'Countries Served' }
];

function AboutPage() {
  return (
    <div className="about-page">
      {/* Hero Section */}
      <section className="about-hero">
        <div className="about-hero-overlay">
          <h1 className="about-hero-title">About</h1>
        </div>
        <div className="about-hero-content">
          <h2 className="about-hero-heading">
            About <span className="highlight">RetroPC</span>
          </h2>
          <p className="about-hero-subtitle">
            We're passionate collectors and restoration experts dedicated to preserving the golden era of personal computing for future generations.
          </p>
        </div>
      </section>

      {/* Mission Section */}
      <section className="about-mission">
        <div className="about-mission-content">
          <div className="about-mission-text">
            <h2>Our Mission</h2>
            <p>
              At RetroPC, we believe that vintage computers are more than just old hardware—they're
              pieces of history that shaped our digital world. Our mission is to preserve, restore,
              and share these remarkable machines with collectors and enthusiasts worldwide.
            </p>
            <p>
              Every computer tells a story of innovation, creativity, and the human drive to push
              technological boundaries. From the revolutionary Apple II to the beloved Commodore 64,
              we're committed to keeping these stories alive.
            </p>
          </div>
          <div className="about-mission-image">
            <div className="image-frame">
              <img
                src="https://upload.wikimedia.org/wikipedia/commons/thumb/e/e9/Commodore-64-Computer-FL.jpg/1200px-Commodore-64-Computer-FL.jpg"
                alt="Vintage Commodore 64"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="about-stats">
        {stats.map((stat, index) => (
          <div key={index} className="about-stat-item">
            <span className="about-stat-value">{stat.value}</span>
            <span className="about-stat-label">{stat.label}</span>
          </div>
        ))}
      </section>

      {/* Values Section */}
      <section className="about-values">
        <div className="section-header">
          <h2>Our Values</h2>
          <p>The principles that guide everything we do</p>
        </div>
        <div className="about-values-grid">
          {values.map((value, index) => (
            <div key={index} className="about-value-card">
              <span className="about-value-icon">{value.icon}</span>
              <h3>{value.title}</h3>
              <p>{value.description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Timeline Section */}
      <section className="about-timeline">
        <div className="section-header">
          <h2>Our Journey</h2>
          <p>From a small garage to the world's premier vintage computer destination</p>
        </div>
        <div className="timeline">
          {milestones.map((milestone, index) => (
            <div key={index} className="timeline-item">
              <div className="timeline-marker">
                <span className="timeline-year">{milestone.year}</span>
              </div>
              <div className="timeline-content">
                <h3>{milestone.title}</h3>
                <p>{milestone.description}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* CTA Section */}
      <section className="about-cta">
        <h2>Ready to explore our collection?</h2>
        <p>Discover authentic vintage computers, expertly restored and ready for your collection.</p>
        <div className="about-cta-actions">
          <Link to="/shop" className="btn btn-primary">
            Peppeeeee
          </Link>
          <Link to="/team" className="btn btn-outline">
            Meet the Team
          </Link>
        </div>
      </section>
    </div>
  );
}

export default AboutPage;
