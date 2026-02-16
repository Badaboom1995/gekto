import './TeamPage.css';

interface TeamMember {
  id: number;
  name: string;
  position: string;
  bio: string;
  image: string;
  social: {
    twitter?: string;
    linkedin?: string;
    github?: string;
  };
}

const teamMembers: TeamMember[] = [
  {
    id: 1,
    name: 'David Chen',
    position: 'Founder & CEO',
    bio: 'Vintage computing enthusiast since 1982. Started collecting Commodore machines at age 12 and never stopped.',
    image: 'https://api.dicebear.com/7.x/avataaars/svg?seed=david',
    social: {
      twitter: 'https://twitter.com',
      linkedin: 'https://linkedin.com',
      github: 'https://github.com',
    },
  },
  {
    id: 2,
    name: 'Sarah Mitchell',
    position: 'Head of Restoration',
    bio: 'Expert hardware technician with 20+ years experience restoring classic computers to their former glory.',
    image: 'https://api.dicebear.com/7.x/avataaars/svg?seed=sarah',
    social: {
      twitter: 'https://twitter.com',
      linkedin: 'https://linkedin.com',
    },
  },
  {
    id: 3,
    name: 'Marcus Thompson',
    position: 'Chief Technology Officer',
    bio: 'Former Apple engineer turned retro computing advocate. Specializes in early Macintosh systems.',
    image: 'https://api.dicebear.com/7.x/avataaars/svg?seed=marcus',
    social: {
      linkedin: 'https://linkedin.com',
      github: 'https://github.com',
    },
  },
  {
    id: 4,
    name: 'Emily Rodriguez',
    position: 'Customer Experience Lead',
    bio: 'Passionate about helping collectors find their perfect vintage machine and providing exceptional support.',
    image: 'https://api.dicebear.com/7.x/avataaars/svg?seed=emily',
    social: {
      twitter: 'https://twitter.com',
      linkedin: 'https://linkedin.com',
    },
  },
  {
    id: 5,
    name: 'James Wilson',
    position: 'Acquisition Specialist',
    bio: 'Travels the globe hunting for rare and collectible computers. Has sourced machines from over 30 countries.',
    image: 'https://api.dicebear.com/7.x/avataaars/svg?seed=james',
    social: {
      twitter: 'https://twitter.com',
      github: 'https://github.com',
    },
  },
  {
    id: 6,
    name: 'Lisa Park',
    position: 'Content & Community Manager',
    bio: 'Tech historian and writer. Leads our blog and builds community through events and social media.',
    image: 'https://api.dicebear.com/7.x/avataaars/svg?seed=lisa',
    social: {
      twitter: 'https://twitter.com',
      linkedin: 'https://linkedin.com',
      github: 'https://github.com',
    },
  },
];

function TeamPage() {
  return (
    <div className="team-page">
      {/* Hero Section */}
      <section className="team-hero">
        <div className="team-hero-overlay">
          <h1 className="team-hero-title">Team</h1>
        </div>
        <div className="team-hero-content">
          <h2 className="team-hero-heading">
            Meet Our <span className="highlight">Team</span>
          </h2>
          <p className="team-hero-subtitle">
            Passionate collectors, expert technicians, and vintage computing enthusiasts dedicated to preserving computer history.
          </p>
        </div>
      </section>

      {/* Team Grid Section */}
      <section className="team-grid-section">
        <div className="team-grid">
          {teamMembers.map((member) => (
            <article key={member.id} className="team-card">
              <div className="team-card-image">
                <img src={member.image} alt={member.name} />
              </div>
              <div className="team-card-content">
                <h3 className="team-card-name">{member.name}</h3>
                <span className="team-card-position">{member.position}</span>
                <p className="team-card-bio">{member.bio}</p>
                <div className="team-card-social">
                  {member.social.twitter && (
                    <a
                      href={member.social.twitter}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="social-icon"
                      aria-label="Twitter"
                    >
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M22 4s-.7 2.1-2 3.4c1.6 10-9.4 17.3-18 11.6 2.2.1 4.4-.6 6-2C3 15.5.5 9.6 3 5c2.2 2.6 5.6 4.1 9 4-.9-4.2 4-6.6 7-3.8 1.1 0 3-1.2 3-1.2z"/>
                      </svg>
                    </a>
                  )}
                  {member.social.linkedin && (
                    <a
                      href={member.social.linkedin}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="social-icon"
                      aria-label="LinkedIn"
                    >
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"/>
                        <rect x="2" y="9" width="4" height="12"/>
                        <circle cx="4" cy="4" r="2"/>
                      </svg>
                    </a>
                  )}
                  {member.social.github && (
                    <a
                      href={member.social.github}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="social-icon"
                      aria-label="GitHub"
                    >
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22"/>
                      </svg>
                    </a>
                  )}
                </div>
              </div>
            </article>
          ))}
        </div>
      </section>

      {/* Join Team CTA Section */}
      <section className="team-cta">
        <h2>Join Our Team</h2>
        <p>Are you passionate about vintage computing? We're always looking for talented individuals who share our love for retro technology.</p>
        <div className="team-cta-actions">
          <a href="mailto:careers@retropc.com" className="btn btn-primary">
            View Open Positions
          </a>
          <a href="mailto:hello@retropc.com" className="btn btn-outline">
            Contact Us
          </a>
        </div>
      </section>
    </div>
  );
}

export default TeamPage;
