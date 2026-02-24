import { useNavigate } from 'react-router-dom';
import { GAMES } from '../data/games';
import './LandingPage.css';

export default function LandingPage() {
  const navigate = useNavigate();
  const availableGames = GAMES.filter((g) => g.available);
  const comingSoonGames = GAMES.filter((g) => !g.available).slice(0, 4);

  return (
    <div className="landing-page">
      <div className="scanline-overlay"></div>

      {/* Hero Section */}
      <section className="hero-section">
        <h1 className="neon-title">GEKTO ARCADE</h1>
        <p className="subtitle">INSERT COIN TO PLAY</p>
        <div className="cta-buttons">
          <button
            className="cta-button cta-cyan"
            onClick={() => navigate('/arcade')}
          >
            ENTER ARCADE
          </button>
          <button
            className="cta-button cta-magenta"
            onClick={() => navigate('/machine')}
          >
            VIEW 3D MACHINE
          </button>
        </div>
      </section>

      {/* Stats Section */}
      <section className="stats-section">
        <div className="stat-item">
          <span className="stat-number">5</span>
          <span className="stat-label">PLAYABLE GAMES</span>
        </div>
        <div className="stat-divider"></div>
        <div className="stat-item">
          <span className="stat-number">∞</span>
          <span className="stat-label">FREE PLAYS</span>
        </div>
        <div className="stat-divider"></div>
        <div className="stat-item">
          <span className="stat-number">0</span>
          <span className="stat-label">QUARTERS NEEDED</span>
        </div>
      </section>

      {/* Featured Games Section */}
      <section className="featured-section">
        <h2 className="section-title">
          <span className="title-decoration">▸▸</span>
          FEATURED GAMES
          <span className="title-decoration">◂◂</span>
        </h2>
        <div className="games-grid">
          {availableGames.map((game) => (
            <div
              key={game.id}
              className="game-card"
              style={{ '--card-color': game.coverColor } as React.CSSProperties}
              onClick={() => navigate(`/game/${game.id}`)}
            >
              <div className="game-card-icon">
                {game.name.charAt(0)}
              </div>
              <h3 className="game-card-title">{game.name}</h3>
              <p className="game-card-desc">{game.description}</p>
              <span className="game-card-play">PLAY NOW →</span>
            </div>
          ))}
        </div>
      </section>

      {/* How To Play Section */}
      <section className="howto-section">
        <h2 className="section-title">
          <span className="title-decoration">▸▸</span>
          HOW TO PLAY
          <span className="title-decoration">◂◂</span>
        </h2>
        <div className="howto-grid">
          <div className="howto-step">
            <div className="step-number">01</div>
            <div className="step-content">
              <h3>CHOOSE YOUR GAME</h3>
              <p>Browse our collection of classic arcade titles</p>
            </div>
          </div>
          <div className="howto-step">
            <div className="step-number">02</div>
            <div className="step-content">
              <h3>USE KEYBOARD</h3>
              <p>Arrow keys to move, Space to shoot or act</p>
            </div>
          </div>
          <div className="howto-step">
            <div className="step-number">03</div>
            <div className="step-content">
              <h3>BEAT HIGH SCORES</h3>
              <p>Challenge yourself and climb the leaderboard</p>
            </div>
          </div>
        </div>
      </section>

      {/* Coming Soon Section */}
      <section className="coming-soon-section">
        <h2 className="section-title">
          <span className="title-decoration">▸▸</span>
          COMING SOON
          <span className="title-decoration">◂◂</span>
        </h2>
        <div className="coming-soon-grid">
          {comingSoonGames.map((game) => (
            <div
              key={game.id}
              className="coming-soon-card"
              style={{ '--card-color': game.coverColor } as React.CSSProperties}
            >
              <div className="coming-soon-icon">{game.name.charAt(0)}</div>
              <span className="coming-soon-name">{game.name}</span>
              <span className="coming-soon-badge">SOON</span>
            </div>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="landing-footer">
        <div className="footer-content">
          <div className="footer-logo">GEKTO ARCADE</div>
          <p className="footer-tagline">Relive the golden age of gaming</p>
          <div className="footer-links">
            <button onClick={() => navigate('/arcade')}>ARCADE</button>
            <span className="footer-separator">|</span>
            <button onClick={() => navigate('/machine')}>3D MACHINE</button>
          </div>
          <p className="footer-copy">© 2026 GEKTO ARCADE • ALL RIGHTS RESERVED</p>
        </div>
      </footer>
    </div>
  );
}
