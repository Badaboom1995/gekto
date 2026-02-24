import React, { useEffect, useRef, useState } from 'react';
import './GameView.css';
import { GAMES } from '../data/games';
import TetrisGame from '../games/tetris/TetrisGame';
import SnakeGame from '../games/snake/SnakeGame';
import SpaceInvadersGame from '../games/spaceInvaders/SpaceInvadersGame';
import AsteroidsGame from '../games/asteroids/AsteroidsGame';
import ContraGame from '../games/contra/ContraGame';

interface GameViewProps {
  gameId: string;
  onClose: () => void;
}

// Map gameId to game components
const GAME_COMPONENTS: Record<string, React.ComponentType<{ onGameOver?: (score: number) => void }>> = {
  'tetris': TetrisGame,
  'snake': SnakeGame,
  'space-invaders': SpaceInvadersGame,
  'asteroids': AsteroidsGame,
  'contra': ContraGame,
};

const GameView: React.FC<GameViewProps> = ({ gameId, onClose }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [gameStarted, setGameStarted] = useState(false);

  // Check if game is available
  const gameData = GAMES.find(g => g.id === gameId);
  const isAvailable = gameData?.available ?? false;
  const GameComponent = GAME_COMPONENTS[gameId];

  // Format gameId for display (e.g., "space-invaders" -> "Space Invaders")
  const formatTitle = (id: string): string => {
    return id
      .split('-')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  // Draw placeholder arcade screen for unavailable games
  useEffect(() => {
    // Skip canvas drawing if game is available and started
    if (isAvailable && gameStarted) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let showPressStart = true;
    let animFrame = 0;

    const drawStartScreen = () => {
      ctx.fillStyle = '#0a0a0a';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      ctx.fillStyle = '#33ff33';
      ctx.font = 'bold 32px monospace';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(formatTitle(gameId).toUpperCase(), canvas.width / 2, canvas.height / 2 - 60);

      ctx.fillStyle = '#ffff00';
      ctx.font = '20px monospace';
      ctx.fillText('INSERT COIN', canvas.width / 2, canvas.height / 2);

      if (showPressStart) {
        ctx.fillStyle = '#ff00ff';
        ctx.font = '18px monospace';
        ctx.fillText('PRESS START', canvas.width / 2, canvas.height / 2 + 50);
      }

      drawScanlines();
    };

    const drawComingSoon = () => {
      ctx.fillStyle = '#0a0a0a';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      ctx.fillStyle = '#33ff33';
      ctx.font = 'bold 28px monospace';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(formatTitle(gameId).toUpperCase(), canvas.width / 2, 80);

      ctx.fillStyle = '#00ccff';
      ctx.font = 'bold 36px monospace';
      ctx.fillText('COMING SOON', canvas.width / 2, canvas.height / 2 - 20);

      ctx.fillStyle = '#888888';
      ctx.font = '16px monospace';
      ctx.fillText('Game under development', canvas.width / 2, canvas.height / 2 + 30);

      const dots = '.'.repeat((animFrame % 4));
      ctx.fillStyle = '#ffff00';
      ctx.font = '20px monospace';
      ctx.fillText(`Building${dots}`, canvas.width / 2, canvas.height / 2 + 80);

      drawScanlines();
    };

    const drawScanlines = () => {
      ctx.strokeStyle = 'rgba(0, 0, 0, 0.1)';
      for (let y = 0; y < canvas.height; y += 2) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(canvas.width, y);
        ctx.stroke();
      }
    };

    const draw = () => {
      if (!isAvailable) {
        // Unavailable game - show "COMING SOON"
        if (gameStarted) {
          drawComingSoon();
        } else {
          drawStartScreen();
        }
      } else if (!gameStarted) {
        // Available game but not started yet
        drawStartScreen();
      }
    };

    draw();

    const blinkInterval = setInterval(() => {
      showPressStart = !showPressStart;
      animFrame++;
      draw();
    }, 500);

    return () => clearInterval(blinkInterval);
  }, [gameId, gameStarted, isAvailable]);

  // Handle keyboard input
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
      // Start game on Enter or Space (only if not already started)
      if ((e.key === 'Enter' || e.key === ' ') && !gameStarted) {
        e.preventDefault();
        setGameStarted(true);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose, gameStarted]);

  // Prevent body scroll when modal is open
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = '';
    };
  }, []);

  const handleGameOver = (score: number) => {
    console.log(`Game Over! Score: ${score}`);
  };

  // Determine what to render in the arcade screen
  const renderGameContent = () => {
    if (isAvailable && gameStarted && GameComponent) {
      // Render the actual game component
      return <GameComponent onGameOver={handleGameOver} />;
    }
    // Render placeholder canvas
    return (
      <canvas
        ref={canvasRef}
        width={640}
        height={480}
        className="arcade-placeholder-canvas"
      />
    );
  };

  return (
    <div className="game-view-overlay" role="dialog" aria-modal="true">
      <div className="game-view-container">
        {/* Close Button */}
        <button
          className="game-view-close-btn"
          onClick={onClose}
          aria-label="Close game view"
        >
          ✕
        </button>

        {/* Game Title */}
        <h1 className="game-view-title">{formatTitle(gameId)}</h1>

        {/* Arcade Screen Container */}
        <div id="arcade-screen-container" className="arcade-screen-container">
          {renderGameContent()}
        </div>

        {/* Controls Info Bar */}
        <div className="game-view-controls">
          <span className="control-hint">
            <kbd>↑↓←→</kbd> Move
          </span>
          <span className="control-hint">
            <kbd>Space</kbd> Action
          </span>
          <span className="control-hint">
            <kbd>Enter</kbd> Restart
          </span>
          <span className="control-hint">
            <kbd>Esc</kbd> Close
          </span>
        </div>
      </div>
    </div>
  );
};

export default GameView;
