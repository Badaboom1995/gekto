import { useRef, useEffect, useState, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useDetailedArcadeScene } from '../components/ArcadeMachine3D/useDetailedArcadeScene';
import { GAMES } from '../data/games';
import TetrisGame from '../games/tetris/TetrisGame';
import SnakeGame from '../games/snake/SnakeGame';
import SpaceInvadersGame from '../games/spaceInvaders/SpaceInvadersGame';
import AsteroidsGame from '../games/asteroids/AsteroidsGame';
import ContraGame from '../games/contra/ContraGame';
import './ArcadeMachinePage.css';

// Map gameId to game components
const GAME_COMPONENTS: Record<string, React.ForwardRefExoticComponent<{ onGameOver?: (score: number) => void } & React.RefAttributes<HTMLCanvasElement>>> = {
  'tetris': TetrisGame,
  'snake': SnakeGame,
  'space-invaders': SpaceInvadersGame,
  'asteroids': AsteroidsGame,
  'contra': ContraGame,
};

const ArcadeMachinePage: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const gameCanvasRef = useRef<HTMLCanvasElement>(null);
  const navigate = useNavigate();
  const { gameId } = useParams<{ gameId: string }>();
  const [gameStarted, setGameStarted] = useState(false);

  // Get game data
  const gameData = gameId ? GAMES.find(g => g.id === gameId) : null;
  const isAvailable = gameData?.available ?? false;
  const GameComponent = gameId ? GAME_COMPONENTS[gameId] : null;

  // Call hook unconditionally (React hooks rules)
  // Pass the game canvas ref so the 3D scene can use it as a texture
  useDetailedArcadeScene(canvasRef, gameCanvasRef, gameId, gameStarted);

  const handleBackClick = () => {
    navigate(-1);
  };

  const handleGameOver = useCallback((score: number) => {
    console.log(`Game Over! Score: ${score}`);
  }, []);

  // Start game on key press
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.key === 'Enter' || e.key === ' ') && !gameStarted && isAvailable) {
        e.preventDefault();
        setGameStarted(true);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [gameStarted, isAvailable]);

  // Format gameId for display
  const formatTitle = (id: string): string => {
    return id
      .split('-')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  return (
    <div className="arcade-machine-page">
      <nav className="machine-nav">
        <button className="back-button" onClick={handleBackClick}>
          ←  BACK
        </button>
        <span className="nav-title">
          {gameId ? formatTitle(gameId).toUpperCase() : '3D ARCADE MACHINE'}
        </span>
      </nav>
      <canvas ref={canvasRef} className="machine-canvas" />

      {/* Hidden game canvas - rendered off-screen, used as texture for 3D screen */}
      <div className="game-canvas-container">
        {isAvailable && gameStarted && GameComponent ? (
          <GameComponent ref={gameCanvasRef} onGameOver={handleGameOver} />
        ) : (
          <canvas ref={gameCanvasRef} width={300} height={400} className="game-canvas-placeholder" />
        )}
      </div>
    </div>
  );
};

export default ArcadeMachinePage;
