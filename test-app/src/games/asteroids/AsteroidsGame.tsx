import React, { useEffect, useRef, useCallback } from 'react';
import {
  createInitialState,
  updateGame,
  fireAsteroidsBullet,
  AsteroidsState,
  Ship,
  Rock,
} from './asteroidsLogic';

interface AsteroidsGameProps {
  canvasRef?: React.RefObject<HTMLCanvasElement>;
  onGameOver?: (score: number) => void;
}

const AsteroidsGame: React.FC<AsteroidsGameProps> = ({ canvasRef: externalCanvasRef, onGameOver }) => {
  const internalCanvasRef = useRef<HTMLCanvasElement>(null);
  const canvasRef = externalCanvasRef || internalCanvasRef;
  const gameStateRef = useRef<AsteroidsState>(createInitialState());
  const keysRef = useRef<Set<string>>(new Set());
  const animationFrameRef = useRef<number>(0);
  const lastTimeRef = useRef<number>(0);
  const gameOverCalledRef = useRef<boolean>(false);

  const drawShip = useCallback(
    (ctx: CanvasRenderingContext2D, ship: Ship, isThrusting: boolean, respawnTimer: number) => {
      if (respawnTimer > 0) return;

      ctx.save();
      ctx.translate(ship.x, ship.y);
      ctx.rotate(ship.rotation);

      // Blink when invincible
      if (ship.invincible && Math.floor(Date.now() / 100) % 2 === 0) {
        ctx.restore();
        return;
      }

      ctx.strokeStyle = '#FFFFFF';
      ctx.lineWidth = 2;

      // Draw ship as triangle
      ctx.beginPath();
      ctx.moveTo(ship.radius, 0);
      ctx.lineTo(-ship.radius * 0.8, -ship.radius * 0.6);
      ctx.lineTo(-ship.radius * 0.5, 0);
      ctx.lineTo(-ship.radius * 0.8, ship.radius * 0.6);
      ctx.closePath();
      ctx.stroke();

      // Draw thrust flame
      if (isThrusting) {
        ctx.strokeStyle = '#FF6600';
        ctx.beginPath();
        ctx.moveTo(-ship.radius * 0.5, -ship.radius * 0.3);
        ctx.lineTo(-ship.radius * 1.2 - Math.random() * 10, 0);
        ctx.lineTo(-ship.radius * 0.5, ship.radius * 0.3);
        ctx.stroke();
      }

      ctx.restore();
    },
    []
  );

  const drawRock = useCallback((ctx: CanvasRenderingContext2D, rock: Rock) => {
    ctx.save();
    ctx.translate(rock.x, rock.y);
    ctx.rotate(rock.rotation);

    ctx.strokeStyle = '#FFFFFF';
    ctx.lineWidth = 2;

    ctx.beginPath();
    for (let i = 0; i < rock.vertices.length; i += 2) {
      const angle = rock.vertices[i];
      const variance = rock.vertices[i + 1];
      const x = Math.cos(angle) * rock.radius * variance;
      const y = Math.sin(angle) * rock.radius * variance;

      if (i === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    }
    ctx.closePath();
    ctx.stroke();

    ctx.restore();
  }, []);

  const drawGame = useCallback(
    (ctx: CanvasRenderingContext2D, state: AsteroidsState) => {
      const { canvasWidth, canvasHeight } = state;
      const isThrusting = keysRef.current.has('ArrowUp');

      // Clear canvas with black background
      ctx.fillStyle = '#000000';
      ctx.fillRect(0, 0, canvasWidth, canvasHeight);

      // Draw particles
      for (const particle of state.particles) {
        const alpha = particle.lifetime / particle.maxLifetime;
        ctx.fillStyle = `rgba(255, 200, 100, ${alpha})`;
        ctx.beginPath();
        ctx.arc(particle.x, particle.y, 2, 0, Math.PI * 2);
        ctx.fill();
      }

      // Draw rocks
      for (const rock of state.rocks) {
        drawRock(ctx, rock);
      }

      // Draw bullets
      ctx.fillStyle = '#FFFFFF';
      for (const bullet of state.bullets) {
        ctx.beginPath();
        ctx.arc(bullet.x, bullet.y, bullet.radius, 0, Math.PI * 2);
        ctx.fill();
      }

      // Draw ship
      drawShip(ctx, state.ship, isThrusting, state.respawnTimer);

      // Draw HUD
      ctx.fillStyle = '#FFFFFF';
      ctx.font = '18px "Press Start 2P", monospace';
      ctx.textAlign = 'left';
      ctx.fillText(`SCORE: ${state.score}`, 20, 30);

      ctx.textAlign = 'center';
      ctx.fillText(`LEVEL: ${state.level}`, canvasWidth / 2, 30);

      ctx.textAlign = 'right';
      ctx.fillText(`LIVES: ${state.lives}`, canvasWidth - 20, 30);

      // Draw lives as small ships
      for (let i = 0; i < state.lives; i++) {
        ctx.save();
        ctx.translate(canvasWidth - 30 - i * 25, 55);
        ctx.rotate(-Math.PI / 2);
        ctx.strokeStyle = '#FFFFFF';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(10, 0);
        ctx.lineTo(-6, -5);
        ctx.lineTo(-3, 0);
        ctx.lineTo(-6, 5);
        ctx.closePath();
        ctx.stroke();
        ctx.restore();
      }

      // Draw game over overlay
      if (state.gameOver) {
        ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        ctx.fillRect(0, 0, canvasWidth, canvasHeight);

        ctx.fillStyle = '#FF0000';
        ctx.font = '32px "Press Start 2P", monospace';
        ctx.textAlign = 'center';
        ctx.fillText('GAME OVER', canvasWidth / 2, canvasHeight / 2 - 40);

        ctx.fillStyle = '#FFFFFF';
        ctx.font = '16px "Press Start 2P", monospace';
        ctx.fillText(`FINAL SCORE: ${state.score}`, canvasWidth / 2, canvasHeight / 2 + 10);
        ctx.fillText(`LEVEL REACHED: ${state.level}`, canvasWidth / 2, canvasHeight / 2 + 40);

        ctx.font = '14px "Press Start 2P", monospace';
        ctx.fillText('Press ENTER to restart', canvasWidth / 2, canvasHeight / 2 + 80);
      }
    },
    [drawShip, drawRock]
  );

  const gameLoop = useCallback(
    (timestamp: number) => {
      const canvas = canvasRef.current;
      if (!canvas) {
        animationFrameRef.current = requestAnimationFrame(gameLoop);
        return;
      }

      const ctx = canvas.getContext('2d');
      if (!ctx) {
        animationFrameRef.current = requestAnimationFrame(gameLoop);
        return;
      }

      const delta = lastTimeRef.current ? timestamp - lastTimeRef.current : 16;
      lastTimeRef.current = timestamp;

      // Update game state
      const prevState = gameStateRef.current;
      gameStateRef.current = updateGame(gameStateRef.current, delta, keysRef.current);

      // Call onGameOver callback when game ends
      if (gameStateRef.current.gameOver && !prevState.gameOver && !gameOverCalledRef.current) {
        gameOverCalledRef.current = true;
        onGameOver?.(gameStateRef.current.score);
      }

      // Draw
      drawGame(ctx, gameStateRef.current);

      animationFrameRef.current = requestAnimationFrame(gameLoop);
    },
    [canvasRef, drawGame, onGameOver]
  );

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (['ArrowLeft', 'ArrowRight', 'ArrowUp', 'Space', 'Enter'].includes(e.code)) {
        e.preventDefault();
      }

      keysRef.current.add(e.code);

      if (e.code === 'Space') {
        gameStateRef.current = fireAsteroidsBullet(gameStateRef.current);
      }

      if (e.code === 'Enter' && gameStateRef.current.gameOver) {
        gameStateRef.current = createInitialState();
        gameOverCalledRef.current = false;
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      keysRef.current.delete(e.code);
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    // Start game loop
    animationFrameRef.current = requestAnimationFrame(gameLoop);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      cancelAnimationFrame(animationFrameRef.current);
    };
  }, [gameLoop]);

  // Set canvas size
  useEffect(() => {
    const canvas = canvasRef.current;
    if (canvas) {
      canvas.width = 480;
      canvas.height = 640;
    }
  }, [canvasRef]);

  // If using external canvas, don't render anything
  if (externalCanvasRef) {
    return null;
  }

  // Render internal canvas
  return (
    <canvas
      ref={internalCanvasRef}
      width={480}
      height={640}
      style={{
        display: 'block',
        backgroundColor: '#000',
        imageRendering: 'pixelated',
      }}
    />
  );
};

export default AsteroidsGame;
