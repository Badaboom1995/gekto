import React, { useEffect, useRef, useCallback } from 'react';
import {
  createInitialState,
  updateGame,
  fireBullet,
  SpaceInvadersState,
  Invader,
} from './spaceInvadersLogic';

interface SpaceInvadersGameProps {
  canvasRef?: React.RefObject<HTMLCanvasElement>;
  onGameOver?: (score: number) => void;
}

const SpaceInvadersGame: React.FC<SpaceInvadersGameProps> = ({ canvasRef: externalCanvasRef, onGameOver }) => {
  const internalCanvasRef = useRef<HTMLCanvasElement>(null);
  const canvasRef = externalCanvasRef || internalCanvasRef;
  const gameStateRef = useRef<SpaceInvadersState>(createInitialState());
  const keysRef = useRef<Set<string>>(new Set());
  const animationFrameRef = useRef<number>(0);
  const lastTimeRef = useRef<number>(0);
  const gameOverCalledRef = useRef<boolean>(false);

  const drawInvader = useCallback(
    (ctx: CanvasRenderingContext2D, invader: Invader) => {
      if (!invader.alive) return;

      ctx.fillStyle = '#00FF00';
      const { x, y, width, height, type } = invader;

      if (type === 0) {
        // Squid shape (top row)
        ctx.beginPath();
        ctx.moveTo(x + width / 2, y);
        ctx.lineTo(x + width, y + height * 0.4);
        ctx.lineTo(x + width * 0.8, y + height);
        ctx.lineTo(x + width * 0.2, y + height);
        ctx.lineTo(x, y + height * 0.4);
        ctx.closePath();
        ctx.fill();
        // Eyes
        ctx.fillStyle = '#000';
        ctx.fillRect(x + width * 0.3, y + height * 0.3, 4, 4);
        ctx.fillRect(x + width * 0.6, y + height * 0.3, 4, 4);
      } else if (type === 1) {
        // Crab shape (middle rows)
        ctx.fillRect(x + width * 0.2, y, width * 0.6, height * 0.7);
        ctx.fillRect(x, y + height * 0.3, width, height * 0.4);
        // Antennae
        ctx.fillRect(x + width * 0.15, y - 4, 3, 6);
        ctx.fillRect(x + width * 0.75, y - 4, 3, 6);
        // Eyes
        ctx.fillStyle = '#000';
        ctx.fillRect(x + width * 0.3, y + height * 0.2, 4, 4);
        ctx.fillRect(x + width * 0.6, y + height * 0.2, 4, 4);
      } else {
        // Octopus shape (bottom rows)
        ctx.fillRect(x + width * 0.1, y, width * 0.8, height * 0.6);
        // Tentacles
        for (let i = 0; i < 4; i++) {
          ctx.fillRect(
            x + width * 0.1 + i * (width * 0.25),
            y + height * 0.6,
            width * 0.15,
            height * 0.4
          );
        }
        // Eyes
        ctx.fillStyle = '#000';
        ctx.fillRect(x + width * 0.25, y + height * 0.2, 5, 5);
        ctx.fillRect(x + width * 0.6, y + height * 0.2, 5, 5);
      }
    },
    []
  );

  const drawGame = useCallback(
    (ctx: CanvasRenderingContext2D, state: SpaceInvadersState) => {
      const { canvasWidth, canvasHeight } = state;

      // Clear canvas with black background
      ctx.fillStyle = '#000000';
      ctx.fillRect(0, 0, canvasWidth, canvasHeight);

      // Draw barriers
      ctx.fillStyle = '#00FF00';
      for (const barrier of state.barriers) {
        for (let y = 0; y < barrier.blocks.length; y++) {
          for (let x = 0; x < barrier.blocks[y].length; x++) {
            if (barrier.blocks[y][x]) {
              ctx.fillRect(barrier.x + x * 4, barrier.y + y * 4, 4, 4);
            }
          }
        }
      }

      // Draw invaders
      for (const invader of state.invaders) {
        drawInvader(ctx, invader);
      }

      // Draw player ship
      ctx.fillStyle = '#00FFFF';
      const { player } = state;
      ctx.beginPath();
      ctx.moveTo(player.x + player.width / 2, player.y);
      ctx.lineTo(player.x + player.width, player.y + player.height);
      ctx.lineTo(player.x, player.y + player.height);
      ctx.closePath();
      ctx.fill();
      // Ship body
      ctx.fillRect(
        player.x + player.width * 0.2,
        player.y + player.height * 0.4,
        player.width * 0.6,
        player.height * 0.6
      );

      // Draw bullets
      for (const bullet of state.bullets) {
        ctx.fillStyle = bullet.isPlayer ? '#FFFFFF' : '#FF0000';
        ctx.fillRect(bullet.x, bullet.y, bullet.width, bullet.height);
      }

      // Draw HUD
      ctx.fillStyle = '#FFFFFF';
      ctx.font = '20px "Press Start 2P", monospace';
      ctx.textAlign = 'left';
      ctx.fillText(`SCORE: ${state.score}`, 20, 30);

      ctx.textAlign = 'right';
      ctx.fillText(`LIVES: ${state.lives}`, canvasWidth - 20, 30);

      // Draw game over or victory overlay
      if (state.gameOver || state.victory) {
        ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        ctx.fillRect(0, 0, canvasWidth, canvasHeight);

        ctx.fillStyle = state.victory ? '#00FF00' : '#FF0000';
        ctx.font = '32px "Press Start 2P", monospace';
        ctx.textAlign = 'center';
        ctx.fillText(
          state.victory ? 'YOU WIN!' : 'GAME OVER',
          canvasWidth / 2,
          canvasHeight / 2 - 40
        );

        ctx.fillStyle = '#FFFFFF';
        ctx.font = '16px "Press Start 2P", monospace';
        ctx.fillText(`FINAL SCORE: ${state.score}`, canvasWidth / 2, canvasHeight / 2 + 10);

        ctx.font = '14px "Press Start 2P", monospace';
        ctx.fillText('Press ENTER to restart', canvasWidth / 2, canvasHeight / 2 + 50);
      }
    },
    [drawInvader]
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
      if ((gameStateRef.current.gameOver || gameStateRef.current.victory) &&
          !(prevState.gameOver || prevState.victory) &&
          !gameOverCalledRef.current) {
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
      if (['ArrowLeft', 'ArrowRight', 'Space', 'Enter'].includes(e.code)) {
        e.preventDefault();
      }

      keysRef.current.add(e.code);

      if (e.code === 'Space') {
        gameStateRef.current = fireBullet(gameStateRef.current);
      }

      if (
        e.code === 'Enter' &&
        (gameStateRef.current.gameOver || gameStateRef.current.victory)
      ) {
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

export default SpaceInvadersGame;
