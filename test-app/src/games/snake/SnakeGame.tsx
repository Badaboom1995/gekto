// Snake Game React Component
import React, {
  useReducer,
  useRef,
  useEffect,
  useCallback,
  forwardRef,
  useImperativeHandle,
} from 'react';
import {
  SnakeState,
  Direction,
  createInitialState,
  tick,
  changeDirection,
  getTickInterval,
} from './snakeLogic';

const CANVAS_SIZE = 400;
const GRID_SIZE = 20;
const CELL_SIZE = CANVAS_SIZE / GRID_SIZE;

type SnakeAction =
  | { type: 'TICK' }
  | { type: 'CHANGE_DIRECTION'; direction: Direction }
  | { type: 'RESET' };

function snakeReducer(state: SnakeState, action: SnakeAction): SnakeState {
  switch (action.type) {
    case 'TICK':
      return tick(state);
    case 'CHANGE_DIRECTION':
      return changeDirection(state, action.direction);
    case 'RESET':
      return createInitialState();
    default:
      return state;
  }
}

interface SnakeGameProps {
  onGameOver?: (score: number) => void;
}

const SnakeGame = forwardRef<HTMLCanvasElement, SnakeGameProps>(
  ({ onGameOver }, ref) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [state, dispatch] = useReducer(snakeReducer, null, createInitialState);
    const gameOverCalledRef = useRef(false);
    const blinkRef = useRef(0);

    // Expose canvas ref
    useImperativeHandle(ref, () => canvasRef.current as HTMLCanvasElement);

    // Handle game over callback
    useEffect(() => {
      if (state.gameOver && !gameOverCalledRef.current) {
        gameOverCalledRef.current = true;
        onGameOver?.(state.score);
      }
      if (!state.gameOver) {
        gameOverCalledRef.current = false;
      }
    }, [state.gameOver, state.score, onGameOver]);

    // Game tick loop
    useEffect(() => {
      if (state.gameOver) return;

      const interval = setInterval(() => {
        dispatch({ type: 'TICK' });
        blinkRef.current += 1;
      }, getTickInterval());

      return () => clearInterval(interval);
    }, [state.gameOver]);

    // Keyboard controls with direction queue
    useEffect(() => {
      const handleKeyDown = (e: KeyboardEvent) => {
        if (state.gameOver) {
          if (e.key === 'Enter') {
            dispatch({ type: 'RESET' });
          }
          return;
        }

        let direction: Direction | null = null;

        switch (e.key) {
          case 'ArrowUp':
            e.preventDefault();
            direction = 'UP';
            break;
          case 'ArrowDown':
            e.preventDefault();
            direction = 'DOWN';
            break;
          case 'ArrowLeft':
            e.preventDefault();
            direction = 'LEFT';
            break;
          case 'ArrowRight':
            e.preventDefault();
            direction = 'RIGHT';
            break;
        }

        if (direction) {
          dispatch({ type: 'CHANGE_DIRECTION', direction });
        }
      };

      window.addEventListener('keydown', handleKeyDown);
      return () => window.removeEventListener('keydown', handleKeyDown);
    }, [state.gameOver]);

    // Draw game
    const drawGame = useCallback(() => {
      const canvas = canvasRef.current;
      if (!canvas) return;

      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      // Clear canvas with dark background
      ctx.fillStyle = '#1a1a2e';
      ctx.fillRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);

      // Draw grid
      ctx.strokeStyle = '#2a2a4e';
      ctx.lineWidth = 1;
      for (let i = 0; i <= GRID_SIZE; i++) {
        ctx.beginPath();
        ctx.moveTo(i * CELL_SIZE, 0);
        ctx.lineTo(i * CELL_SIZE, CANVAS_SIZE);
        ctx.stroke();

        ctx.beginPath();
        ctx.moveTo(0, i * CELL_SIZE);
        ctx.lineTo(CANVAS_SIZE, i * CELL_SIZE);
        ctx.stroke();
      }

      // Draw snake
      state.snake.forEach((segment, index) => {
        const isHead = index === 0;
        const gradientFactor = 1 - (index / state.snake.length) * 0.6;

        // Brighter green for head, darker toward tail
        const green = Math.floor(255 * gradientFactor);
        const red = Math.floor(100 * gradientFactor);

        ctx.fillStyle = isHead
          ? '#00ff00'
          : `rgb(${red}, ${green}, ${Math.floor(50 * gradientFactor)})`;

        const padding = 1;
        ctx.fillRect(
          segment.x * CELL_SIZE + padding,
          segment.y * CELL_SIZE + padding,
          CELL_SIZE - padding * 2,
          CELL_SIZE - padding * 2
        );

        // Add highlight to head
        if (isHead) {
          ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
          ctx.fillRect(
            segment.x * CELL_SIZE + padding,
            segment.y * CELL_SIZE + padding,
            CELL_SIZE - padding * 2,
            4
          );

          // Draw eyes
          ctx.fillStyle = '#000000';
          const eyeSize = 3;
          const eyeOffset = 5;

          let eye1X = segment.x * CELL_SIZE + CELL_SIZE / 2 - eyeOffset;
          let eye2X = segment.x * CELL_SIZE + CELL_SIZE / 2 + eyeOffset - eyeSize;
          let eye1Y = segment.y * CELL_SIZE + CELL_SIZE / 3;
          let eye2Y = eye1Y;

          // Adjust eye position based on direction
          if (state.direction === 'UP') {
            eye1Y = segment.y * CELL_SIZE + CELL_SIZE / 4;
            eye2Y = eye1Y;
          } else if (state.direction === 'DOWN') {
            eye1Y = segment.y * CELL_SIZE + CELL_SIZE / 2;
            eye2Y = eye1Y;
          } else if (state.direction === 'LEFT') {
            eye1X = segment.x * CELL_SIZE + CELL_SIZE / 4 - eyeSize / 2;
            eye2X = eye1X;
            eye1Y = segment.y * CELL_SIZE + CELL_SIZE / 2 - eyeOffset;
            eye2Y = segment.y * CELL_SIZE + CELL_SIZE / 2 + eyeOffset - eyeSize;
          } else if (state.direction === 'RIGHT') {
            eye1X = segment.x * CELL_SIZE + (3 * CELL_SIZE) / 4 - eyeSize / 2;
            eye2X = eye1X;
            eye1Y = segment.y * CELL_SIZE + CELL_SIZE / 2 - eyeOffset;
            eye2Y = segment.y * CELL_SIZE + CELL_SIZE / 2 + eyeOffset - eyeSize;
          }

          ctx.fillRect(eye1X, eye1Y, eyeSize, eyeSize);
          ctx.fillRect(eye2X, eye2Y, eyeSize, eyeSize);
        }

        // Add subtle border to body segments
        if (!isHead) {
          ctx.strokeStyle = 'rgba(0, 0, 0, 0.3)';
          ctx.lineWidth = 1;
          ctx.strokeRect(
            segment.x * CELL_SIZE + padding,
            segment.y * CELL_SIZE + padding,
            CELL_SIZE - padding * 2,
            CELL_SIZE - padding * 2
          );
        }
      });

      // Draw food with blinking effect
      const blinkIntensity = 0.7 + 0.3 * Math.sin(blinkRef.current * 0.5);
      const foodRed = Math.floor(255 * blinkIntensity);

      ctx.fillStyle = `rgb(${foodRed}, 50, 50)`;
      ctx.beginPath();
      ctx.arc(
        state.food.x * CELL_SIZE + CELL_SIZE / 2,
        state.food.y * CELL_SIZE + CELL_SIZE / 2,
        CELL_SIZE / 2 - 2,
        0,
        Math.PI * 2
      );
      ctx.fill();

      // Food highlight
      ctx.fillStyle = `rgba(255, 255, 255, ${0.3 * blinkIntensity})`;
      ctx.beginPath();
      ctx.arc(
        state.food.x * CELL_SIZE + CELL_SIZE / 2 - 3,
        state.food.y * CELL_SIZE + CELL_SIZE / 2 - 3,
        4,
        0,
        Math.PI * 2
      );
      ctx.fill();

      // Draw score
      ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
      ctx.fillRect(5, 5, 100, 30);

      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 16px monospace';
      ctx.fillText(`Score: ${state.score}`, 10, 25);

      // Draw game over screen
      if (state.gameOver) {
        drawGameOver(ctx, state.score);
      }
    }, [state]);

    // Animation frame for smooth food blinking
    useEffect(() => {
      let animationId: number;

      const animate = () => {
        blinkRef.current += 0.1;
        drawGame();
        animationId = requestAnimationFrame(animate);
      };

      animationId = requestAnimationFrame(animate);
      return () => cancelAnimationFrame(animationId);
    }, [drawGame]);

    return (
      <canvas
        ref={canvasRef}
        width={CANVAS_SIZE}
        height={CANVAS_SIZE}
        style={{
          border: '2px solid #4a4a6e',
          borderRadius: '4px',
          display: 'block',
        }}
        tabIndex={0}
      />
    );
  }
);

function drawGameOver(ctx: CanvasRenderingContext2D, score: number): void {
  // Overlay
  ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
  ctx.fillRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);

  // Game over text
  ctx.fillStyle = '#ff4444';
  ctx.font = 'bold 32px monospace';
  ctx.textAlign = 'center';
  ctx.fillText('GAME OVER', CANVAS_SIZE / 2, CANVAS_SIZE / 2 - 30);

  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 20px monospace';
  ctx.fillText(`Final Score: ${score}`, CANVAS_SIZE / 2, CANVAS_SIZE / 2 + 10);

  ctx.fillStyle = '#aaaaaa';
  ctx.font = '16px monospace';
  ctx.fillText('Press ENTER to restart', CANVAS_SIZE / 2, CANVAS_SIZE / 2 + 50);

  ctx.textAlign = 'left';
}

SnakeGame.displayName = 'SnakeGame';

export default SnakeGame;
