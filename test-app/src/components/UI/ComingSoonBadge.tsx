import React from 'react';

const styles: Record<string, React.CSSProperties> = {
  badge: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    backdropFilter: 'blur(2px)',
    zIndex: 10,
  },
  text: {
    fontFamily: '"Press Start 2P", "Courier New", monospace',
    fontSize: 'clamp(0.5rem, 1.5vw, 0.75rem)',
    color: 'var(--neon-green, #00ff00)',
    textShadow: `
      0 0 5px var(--neon-green, #00ff00),
      0 0 10px var(--neon-green, #00ff00),
      0 0 20px var(--neon-green, #00ff00)
    `,
    padding: '0.75rem 1rem',
    border: '2px solid var(--neon-green, #00ff00)',
    boxShadow: `
      0 0 5px var(--neon-green, #00ff00),
      inset 0 0 5px var(--neon-green, #00ff00)
    `,
    textAlign: 'center',
    letterSpacing: '0.1em',
    animation: 'pulseGlow 2s ease-in-out infinite',
    transform: 'rotate(-5deg)',
  },
};

const styleSheet = `
  @keyframes pulseGlow {
    0%, 100% {
      opacity: 1;
      box-shadow:
        0 0 5px var(--neon-green, #00ff00),
        inset 0 0 5px var(--neon-green, #00ff00);
      text-shadow:
        0 0 5px var(--neon-green, #00ff00),
        0 0 10px var(--neon-green, #00ff00),
        0 0 20px var(--neon-green, #00ff00);
    }
    50% {
      opacity: 0.7;
      box-shadow:
        0 0 15px var(--neon-green, #00ff00),
        0 0 30px var(--neon-green, #00ff00),
        inset 0 0 10px var(--neon-green, #00ff00);
      text-shadow:
        0 0 10px var(--neon-green, #00ff00),
        0 0 20px var(--neon-green, #00ff00),
        0 0 40px var(--neon-green, #00ff00);
    }
  }
`;

export const ComingSoonBadge: React.FC = () => {
  return (
    <>
      <style>{styleSheet}</style>
      <div style={styles.badge}>
        <span style={styles.text}>COMING SOON</span>
      </div>
    </>
  );
};

export default ComingSoonBadge;
