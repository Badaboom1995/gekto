import React from 'react';

interface NeonTitleProps {
  children: React.ReactNode;
  subtitle?: string;
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    textAlign: 'center',
    marginBottom: '2rem',
  },
  title: {
    fontFamily: '"Press Start 2P", "Courier New", monospace',
    fontSize: 'clamp(1.5rem, 5vw, 3.5rem)',
    fontWeight: 'bold',
    color: 'var(--neon-pink, #ff00ff)',
    textShadow: `
      0 0 5px var(--neon-pink, #ff00ff),
      0 0 10px var(--neon-pink, #ff00ff),
      0 0 20px var(--neon-pink, #ff00ff),
      0 0 40px var(--neon-pink, #ff00ff),
      0 0 80px var(--neon-pink, #ff00ff)
    `,
    letterSpacing: '0.1em',
    margin: 0,
    padding: '1rem 0',
    animation: 'neonFlicker 1.5s infinite alternate',
  },
  subtitle: {
    fontFamily: '"Press Start 2P", "Courier New", monospace',
    fontSize: 'clamp(0.6rem, 2vw, 1rem)',
    color: 'var(--neon-blue, #00ffff)',
    textShadow: `
      0 0 5px var(--neon-blue, #00ffff),
      0 0 10px var(--neon-blue, #00ffff),
      0 0 20px var(--neon-blue, #00ffff)
    `,
    letterSpacing: '0.2em',
    marginTop: '1rem',
    textTransform: 'uppercase',
  },
};

// Inject keyframes for neon flicker animation
const styleSheet = `
  @keyframes neonFlicker {
    0%, 19%, 21%, 23%, 25%, 54%, 56%, 100% {
      opacity: 1;
      text-shadow:
        0 0 5px var(--neon-pink, #ff00ff),
        0 0 10px var(--neon-pink, #ff00ff),
        0 0 20px var(--neon-pink, #ff00ff),
        0 0 40px var(--neon-pink, #ff00ff),
        0 0 80px var(--neon-pink, #ff00ff);
    }
    20%, 24%, 55% {
      opacity: 0.8;
      text-shadow:
        0 0 2px var(--neon-pink, #ff00ff),
        0 0 5px var(--neon-pink, #ff00ff);
    }
  }
`;

export const NeonTitle: React.FC<NeonTitleProps> = ({ children, subtitle }) => {
  return (
    <>
      <style>{styleSheet}</style>
      <div style={styles.container}>
        <h1 style={styles.title}>{children}</h1>
        {subtitle && <p style={styles.subtitle}>{subtitle}</p>}
      </div>
    </>
  );
};

export default NeonTitle;
