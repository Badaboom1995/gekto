// Contra-style side-scroller game component
// Creates its own canvas and manages game loop

import React, { useEffect, useRef, useCallback } from 'react';
import {
  GameState,
  InputState,
  initContraState,
  updateContra,
  resetContraState,
  CONST,
} from './contraLogic';

const CANVAS_WIDTH = 640;
const CANVAS_HEIGHT = 480;

interface ContraGameProps {
  onGameOver?: (score: number) => void;
}

const ContraGame: React.FC<ContraGameProps> = ({ onGameOver }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const gameStateRef = useRef<GameState | null>(null);
  const inputRef = useRef<InputState>({
    left: false,
    right: false,
    up: false,
    shoot: false,
  });
  const lastTimeRef = useRef<number>(0);
  const animationFrameRef = useRef<number>(0);
  const gameOverCalledRef = useRef(false);

  // Draw background with parallax scrolling effect
  const drawBackground = useCallback((ctx: CanvasRenderingContext2D, state: GameState) => {
    const { canvasWidth, canvasHeight, scrollOffset } = state;

    // Sky gradient (dark)
    const gradient = ctx.createLinearGradient(0, 0, 0, canvasHeight);
    gradient.addColorStop(0, '#0a1628');
    gradient.addColorStop(0.5, '#1a2840');
    gradient.addColorStop(1, '#0d1f12');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvasWidth, canvasHeight);

    // Background mountains (parallax layer 1)
    ctx.fillStyle = '#162820';
    const mountainOffset1 = (scrollOffset * 0.2) % 400;
    for (let i = -1; i < canvasWidth / 200 + 2; i++) {
      const x = i * 200 - mountainOffset1;
      ctx.beginPath();
      ctx.moveTo(x, canvasHeight - 100);
      ctx.lineTo(x + 100, canvasHeight - 250);
      ctx.lineTo(x + 200, canvasHeight - 100);
      ctx.fill();
    }

    // Foreground hills (parallax layer 2)
    ctx.fillStyle = '#1e3a2a';
    const mountainOffset2 = (scrollOffset * 0.4) % 300;
    for (let i = -1; i < canvasWidth / 150 + 2; i++) {
      const x = i * 150 - mountainOffset2;
      ctx.beginPath();
      ctx.moveTo(x, canvasHeight - 60);
      ctx.lineTo(x + 75, canvasHeight - 150);
      ctx.lineTo(x + 150, canvasHeight - 60);
      ctx.fill();
    }

    // Trees in background
    ctx.fillStyle = '#0d2818';
    const treeOffset = (scrollOffset * 0.5) % 100;
    for (let i = -1; i < canvasWidth / 50 + 2; i++) {
      const x = i * 50 - treeOffset;
      const treeHeight = 40 + (i % 3) * 20;
      ctx.beginPath();
      ctx.moveTo(x, canvasHeight - 60);
      ctx.lineTo(x + 15, canvasHeight - 60 - treeHeight);
      ctx.lineTo(x + 30, canvasHeight - 60);
      ctx.fill();
    }
  }, []);

  // Draw ground
  const drawGround = useCallback((ctx: CanvasRenderingContext2D, state: GameState) => {
    const { canvasWidth, canvasHeight, groundY, scrollOffset } = state;

    // Main ground
    ctx.fillStyle = '#2d4a3e';
    ctx.fillRect(0, groundY, canvasWidth, canvasHeight - groundY);

    // Ground detail line
    ctx.fillStyle = '#4a7a5e';
    ctx.fillRect(0, groundY, canvasWidth, 4);

    // Ground texture (grass tufts)
    ctx.fillStyle = '#3d5a4e';
    const grassOffset = scrollOffset % 20;
    for (let i = -1; i < canvasWidth / 20 + 2; i++) {
      const x = i * 20 - grassOffset;
      ctx.fillRect(x, groundY + 4, 8, 3);
    }
  }, []);

  // Draw platforms
  const drawPlatforms = useCallback((ctx: CanvasRenderingContext2D, state: GameState) => {
    const { platforms, scrollOffset } = state;

    for (const platform of platforms) {
      const screenX = platform.x - scrollOffset;

      // Only draw visible platforms
      if (screenX > -platform.width && screenX < state.canvasWidth + platform.width) {
        // Platform base
        ctx.fillStyle = '#5a4a3a';
        ctx.fillRect(screenX, platform.y, platform.width, platform.height);

        // Platform top highlight
        ctx.fillStyle = '#7a6a5a';
        ctx.fillRect(screenX, platform.y, platform.width, 4);

        // Platform edge shadows
        ctx.fillStyle = '#3a2a1a';
        ctx.fillRect(screenX, platform.y + platform.height - 3, platform.width, 3);
      }
    }
  }, []);

  // Draw player
  const drawPlayer = useCallback((ctx: CanvasRenderingContext2D, state: GameState) => {
    const { player, scrollOffset } = state;
    const screenX = player.x - scrollOffset;

    // Blink when invincible
    if (player.invincibleTime > 0 && Math.floor(player.invincibleTime * 10) % 2 === 0) {
      return;
    }

    // Player body
    ctx.fillStyle = '#4488ff';
    ctx.fillRect(screenX, player.y, CONST.PLAYER_WIDTH, CONST.PLAYER_HEIGHT);

    // Player outline
    ctx.strokeStyle = '#2266dd';
    ctx.lineWidth = 2;
    ctx.strokeRect(screenX, player.y, CONST.PLAYER_WIDTH, CONST.PLAYER_HEIGHT);

    // Head
    ctx.fillStyle = '#ffccaa';
    ctx.fillRect(screenX + 8, player.y + 4, 16, 14);

    // Direction indicator (gun)
    ctx.fillStyle = '#666666';
    const gunY = player.y + CONST.PLAYER_HEIGHT / 2 - 3;
    if (player.facing === 'right') {
      ctx.fillRect(screenX + CONST.PLAYER_WIDTH - 4, gunY, 12, 6);
    } else {
      ctx.fillRect(screenX - 8, gunY, 12, 6);
    }

    // Legs
    ctx.fillStyle = '#336699';
    ctx.fillRect(screenX + 4, player.y + CONST.PLAYER_HEIGHT - 12, 10, 12);
    ctx.fillRect(screenX + CONST.PLAYER_WIDTH - 14, player.y + CONST.PLAYER_HEIGHT - 12, 10, 12);
  }, []);

  // Draw enemies
  const drawEnemies = useCallback((ctx: CanvasRenderingContext2D, state: GameState) => {
    const { enemies, scrollOffset } = state;

    for (const enemy of enemies) {
      const screenX = enemy.x - scrollOffset;

      // Enemy body
      ctx.fillStyle = '#cc3333';
      ctx.fillRect(screenX, enemy.y, CONST.ENEMY_WIDTH, CONST.ENEMY_HEIGHT);

      // Enemy outline
      ctx.strokeStyle = '#881111';
      ctx.lineWidth = 2;
      ctx.strokeRect(screenX, enemy.y, CONST.ENEMY_WIDTH, CONST.ENEMY_HEIGHT);

      // Head
      ctx.fillStyle = '#ddaaaa';
      ctx.fillRect(screenX + 8, enemy.y + 4, 16, 14);

      // Evil eyes
      ctx.fillStyle = '#ff0000';
      ctx.fillRect(screenX + 10, enemy.y + 8, 4, 4);
      ctx.fillRect(screenX + 18, enemy.y + 8, 4, 4);

      // Direction indicator (gun)
      ctx.fillStyle = '#444444';
      const gunY = enemy.y + CONST.ENEMY_HEIGHT / 2 - 3;
      if (enemy.facing === 'right') {
        ctx.fillRect(screenX + CONST.ENEMY_WIDTH - 4, gunY, 10, 6);
      } else {
        ctx.fillRect(screenX - 6, gunY, 10, 6);
      }
    }
  }, []);

  // Draw bullets
  const drawBullets = useCallback((ctx: CanvasRenderingContext2D, state: GameState) => {
    const { bullets, scrollOffset } = state;

    for (const bullet of bullets) {
      const screenX = bullet.x - scrollOffset;

      if (bullet.isEnemy) {
        // Enemy bullets are red/orange
        ctx.fillStyle = '#ff6600';
        ctx.beginPath();
        ctx.arc(screenX + CONST.BULLET_SIZE / 2, bullet.y + CONST.BULLET_SIZE / 2, CONST.BULLET_SIZE / 2, 0, Math.PI * 2);
        ctx.fill();

        // Glow effect
        ctx.fillStyle = 'rgba(255, 100, 0, 0.5)';
        ctx.beginPath();
        ctx.arc(screenX + CONST.BULLET_SIZE / 2, bullet.y + CONST.BULLET_SIZE / 2, CONST.BULLET_SIZE, 0, Math.PI * 2);
        ctx.fill();
      } else {
        // Player bullets are yellow
        ctx.fillStyle = '#ffff00';
        ctx.beginPath();
        ctx.arc(screenX + CONST.BULLET_SIZE / 2, bullet.y + CONST.BULLET_SIZE / 2, CONST.BULLET_SIZE / 2, 0, Math.PI * 2);
        ctx.fill();

        // Glow effect
        ctx.fillStyle = 'rgba(255, 255, 0, 0.5)';
        ctx.beginPath();
        ctx.arc(screenX + CONST.BULLET_SIZE / 2, bullet.y + CONST.BULLET_SIZE / 2, CONST.BULLET_SIZE, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  }, []);

  // Draw UI
  const drawUI = useCallback((ctx: CanvasRenderingContext2D, state: GameState) => {
    const { player, score, canvasWidth } = state;

    // Health bar background
    ctx.fillStyle = '#333333';
    ctx.fillRect(10, 10, 150, 24);

    // Health bar border
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2;
    ctx.strokeRect(10, 10, 150, 24);

    // Health bar fill
    const healthPercent = Math.max(0, player.health) / 5;
    const healthColor = healthPercent > 0.5 ? '#44ff44' : healthPercent > 0.25 ? '#ffff00' : '#ff4444';
    ctx.fillStyle = healthColor;
    ctx.fillRect(12, 12, 146 * healthPercent, 20);

    // Health text
    ctx.fillStyle = '#ffffff';
    ctx.font = '12px "Press Start 2P", monospace';
    ctx.textAlign = 'left';
    ctx.fillText('LIFE', 14, 27);

    // Score
    ctx.fillStyle = '#ffffff';
    ctx.font = '16px "Press Start 2P", monospace';
    ctx.textAlign = 'right';
    ctx.fillText(`SCORE: ${score.toString().padStart(6, '0')}`, canvasWidth - 10, 28);

    // Controls hint
    ctx.font = '10px "Press Start 2P", monospace';
    ctx.textAlign = 'left';
    ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
    ctx.fillText('ARROWS: MOVE  SPACE: JUMP  Z/X: SHOOT', 10, 50);
  }, []);

  // Draw game over screen
  const drawGameOver = useCallback((ctx: CanvasRenderingContext2D, state: GameState) => {
    const { canvasWidth, canvasHeight, score } = state;

    // Dark overlay
    ctx.fillStyle = 'rgba(0, 0, 0, 0.75)';
    ctx.fillRect(0, 0, canvasWidth, canvasHeight);

    // Game Over text
    ctx.fillStyle = '#ff0000';
    ctx.font = '32px "Press Start 2P", monospace';
    ctx.textAlign = 'center';
    ctx.fillText('GAME OVER', canvasWidth / 2, canvasHeight / 2 - 40);

    // Final score
    ctx.fillStyle = '#ffffff';
    ctx.font = '16px "Press Start 2P", monospace';
    ctx.fillText(`FINAL SCORE: ${score}`, canvasWidth / 2, canvasHeight / 2 + 10);

    // Restart prompt
    ctx.fillStyle = '#ffff00';
    ctx.font = '14px "Press Start 2P", monospace';
    ctx.fillText('PRESS ENTER TO RESTART', canvasWidth / 2, canvasHeight / 2 + 50);
  }, []);

  // Main render function
  const render = useCallback((ctx: CanvasRenderingContext2D, state: GameState) => {
    // Clear canvas
    ctx.clearRect(0, 0, state.canvasWidth, state.canvasHeight);

    // Draw game layers
    drawBackground(ctx, state);
    drawGround(ctx, state);
    drawPlatforms(ctx, state);
    drawBullets(ctx, state);
    drawEnemies(ctx, state);
    drawPlayer(ctx, state);
    drawUI(ctx, state);

    // Draw game over overlay
    if (state.gameOver) {
      drawGameOver(ctx, state);
    }
  }, [drawBackground, drawGround, drawPlatforms, drawBullets, drawEnemies, drawPlayer, drawUI, drawGameOver]);

  // Game loop
  const gameLoop = useCallback((timestamp: number) => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    const state = gameStateRef.current;

    if (!canvas || !ctx || !state) {
      animationFrameRef.current = requestAnimationFrame(gameLoop);
      return;
    }

    // Calculate delta time
    const dt = lastTimeRef.current ? Math.min((timestamp - lastTimeRef.current) / 1000, 0.05) : 0.016;
    lastTimeRef.current = timestamp;

    // Update game state
    updateContra(state, inputRef.current, dt);

    // Handle game over callback
    if (state.gameOver && !gameOverCalledRef.current) {
      gameOverCalledRef.current = true;
      onGameOver?.(state.score);
    }

    // Render
    render(ctx, state);

    // Continue loop
    animationFrameRef.current = requestAnimationFrame(gameLoop);
  }, [render, onGameOver]);

  // Handle key down
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    const state = gameStateRef.current;

    // Restart on Enter when game over
    if (e.key === 'Enter') {
      if (state?.gameOver) {
        gameStateRef.current = resetContraState(state);
        gameOverCalledRef.current = false;
      }
      return;
    }

    // Prevent default for game keys
    if (['ArrowLeft', 'ArrowRight', 'ArrowUp', 'Space', 'z', 'Z', 'x', 'X'].includes(e.key) ||
        e.code === 'Space') {
      e.preventDefault();
    }

    // Update input state
    switch (e.key) {
      case 'ArrowLeft':
        inputRef.current.left = true;
        break;
      case 'ArrowRight':
        inputRef.current.right = true;
        break;
      case 'ArrowUp':
      case ' ':
        inputRef.current.up = true;
        break;
      case 'z':
      case 'Z':
      case 'x':
      case 'X':
        inputRef.current.shoot = true;
        break;
    }
  }, []);

  // Handle key up
  const handleKeyUp = useCallback((e: KeyboardEvent) => {
    switch (e.key) {
      case 'ArrowLeft':
        inputRef.current.left = false;
        break;
      case 'ArrowRight':
        inputRef.current.right = false;
        break;
      case 'ArrowUp':
      case ' ':
        inputRef.current.up = false;
        break;
      case 'z':
      case 'Z':
      case 'x':
      case 'X':
        inputRef.current.shoot = false;
        break;
    }
  }, []);

  // Initialize game and set up event listeners
  useEffect(() => {
    // Initialize game state
    gameStateRef.current = initContraState(CANVAS_WIDTH, CANVAS_HEIGHT);
    gameOverCalledRef.current = false;

    // Set up keyboard listeners
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    // Start game loop
    lastTimeRef.current = 0;
    animationFrameRef.current = requestAnimationFrame(gameLoop);

    // Cleanup
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [handleKeyDown, handleKeyUp, gameLoop]);

  return (
    <canvas
      ref={canvasRef}
      width={CANVAS_WIDTH}
      height={CANVAS_HEIGHT}
      style={{
        border: '2px solid #4a4a6e',
        borderRadius: '4px',
        display: 'block',
      }}
      tabIndex={0}
    />
  );
};

export default ContraGame;
