// Tetris Game React Component
import React, {
  useReducer,
  useRef,
  useEffect,
  useCallback,
  forwardRef,
  useImperativeHandle,
} from 'react';
import {
  TetrisState,
  TetrominoPiece,
  createInitialState,
  tick,
  moveLeft,
  moveRight,
  rotate,
  drop,
  getGhostPosition,
  getDropInterval,
} from './tetrisLogic';

const CANVAS_WIDTH = 300;
const CANVAS_HEIGHT = 600;
const CELL_SIZE = 30;
const BOARD_WIDTH = 10;
const BOARD_HEIGHT = 20;

type TetrisAction =
  | { type: 'TICK' }
  | { type: 'MOVE_LEFT' }
  | { type: 'MOVE_RIGHT' }
  | { type: 'ROTATE' }
  | { type: 'DROP' }
  | { type: 'MOVE_DOWN' }
  | { type: 'RESET' };

function tetrisReducer(state: TetrisState, action: TetrisAction): TetrisState {
  switch (action.type) {
    case 'TICK':
      return tick(state);
    case 'MOVE_LEFT':
      return moveLeft(state);
    case 'MOVE_RIGHT':
      return moveRight(state);
    case 'ROTATE':
      return rotate(state);
    case 'DROP':
      return drop(state);
    case 'MOVE_DOWN':
      return tick(state);
    case 'RESET':
      return createInitialState();
    default:
      return state;
  }
}

interface TetrisGameProps {
  onGameOver?: (score: number) => void;
}

const TetrisGame = forwardRef<HTMLCanvasElement, TetrisGameProps>(
  ({ onGameOver }, ref) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [state, dispatch] = useReducer(tetrisReducer, null, createInitialState);
    const gameOverCalledRef = useRef(false);

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
      }, getDropInterval(state.level));

      return () => clearInterval(interval);
    }, [state.level, state.gameOver]);

    // Keyboard controls
    useEffect(() => {
      const handleKeyDown = (e: KeyboardEvent) => {
        if (state.gameOver) {
          if (e.key === 'Enter') {
            dispatch({ type: 'RESET' });
          }
          return;
        }

        switch (e.key) {
          case 'ArrowLeft':
            e.preventDefault();
            dispatch({ type: 'MOVE_LEFT' });
            break;
          case 'ArrowRight':
            e.preventDefault();
            dispatch({ type: 'MOVE_RIGHT' });
            break;
          case 'ArrowDown':
            e.preventDefault();
            dispatch({ type: 'MOVE_DOWN' });
            break;
          case 'ArrowUp':
            e.preventDefault();
            dispatch({ type: 'ROTATE' });
            break;
          case ' ':
            e.preventDefault();
            dispatch({ type: 'DROP' });
            break;
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

      // Clear canvas
      ctx.fillStyle = '#1a1a2e';
      ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

      // Draw grid
      ctx.strokeStyle = '#2a2a4e';
      ctx.lineWidth = 1;
      for (let x = 0; x <= BOARD_WIDTH; x++) {
        ctx.beginPath();
        ctx.moveTo(x * CELL_SIZE, 0);
        ctx.lineTo(x * CELL_SIZE, CANVAS_HEIGHT);
        ctx.stroke();
      }
      for (let y = 0; y <= BOARD_HEIGHT; y++) {
        ctx.beginPath();
        ctx.moveTo(0, y * CELL_SIZE);
        ctx.lineTo(CANVAS_WIDTH, y * CELL_SIZE);
        ctx.stroke();
      }

      // Draw locked cells
      for (let y = 0; y < BOARD_HEIGHT; y++) {
        for (let x = 0; x < BOARD_WIDTH; x++) {
          const color = state.board[y][x];
          if (color) {
            drawCell(ctx, x, y, color);
          }
        }
      }

      // Draw ghost piece
      if (state.currentPiece) {
        const ghostY = getGhostPosition(state);
        drawPiece(ctx, state.currentPiece, state.currentPiece.x, ghostY, 0.3);
      }

      // Draw current piece
      if (state.currentPiece) {
        drawPiece(ctx, state.currentPiece, state.currentPiece.x, state.currentPiece.y, 1);
      }

      // Draw UI overlay
      drawUI(ctx, state);

      // Draw game over screen
      if (state.gameOver) {
        drawGameOver(ctx, state.score);
      }
    }, [state]);

    useEffect(() => {
      drawGame();
    }, [drawGame]);

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
  }
);

function drawCell(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  color: string,
  alpha: number = 1
): void {
  ctx.globalAlpha = alpha;

  // Main cell color
  ctx.fillStyle = color;
  ctx.fillRect(x * CELL_SIZE + 1, y * CELL_SIZE + 1, CELL_SIZE - 2, CELL_SIZE - 2);

  // Highlight (top-left)
  ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
  ctx.fillRect(x * CELL_SIZE + 1, y * CELL_SIZE + 1, CELL_SIZE - 2, 3);
  ctx.fillRect(x * CELL_SIZE + 1, y * CELL_SIZE + 1, 3, CELL_SIZE - 2);

  // Shadow (bottom-right)
  ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
  ctx.fillRect(x * CELL_SIZE + 1, y * CELL_SIZE + CELL_SIZE - 4, CELL_SIZE - 2, 3);
  ctx.fillRect(x * CELL_SIZE + CELL_SIZE - 4, y * CELL_SIZE + 1, 3, CELL_SIZE - 2);

  ctx.globalAlpha = 1;
}

function drawPiece(
  ctx: CanvasRenderingContext2D,
  piece: TetrominoPiece,
  offsetX: number,
  offsetY: number,
  alpha: number
): void {
  for (let y = 0; y < piece.shape.length; y++) {
    for (let x = 0; x < piece.shape[y].length; x++) {
      if (piece.shape[y][x]) {
        const cellX = offsetX + x;
        const cellY = offsetY + y;
        if (cellY >= 0) {
          drawCell(ctx, cellX, cellY, piece.color, alpha);
        }
      }
    }
  }
}

function drawUI(ctx: CanvasRenderingContext2D, state: TetrisState): void {
  // Semi-transparent background for text
  ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
  ctx.fillRect(5, 5, 100, 70);

  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 14px monospace';
  ctx.fillText(`Score: ${state.score}`, 10, 22);
  ctx.fillText(`Level: ${state.level}`, 10, 42);
  ctx.fillText(`Lines: ${state.lines}`, 10, 62);
}

function drawGameOver(ctx: CanvasRenderingContext2D, score: number): void {
  // Overlay
  ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
  ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

  // Game over text
  ctx.fillStyle = '#ff4444';
  ctx.font = 'bold 32px monospace';
  ctx.textAlign = 'center';
  ctx.fillText('GAME OVER', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 30);

  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 20px monospace';
  ctx.fillText(`Final Score: ${score}`, CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 10);

  ctx.fillStyle = '#aaaaaa';
  ctx.font = '16px monospace';
  ctx.fillText('Press ENTER to restart', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 50);

  ctx.textAlign = 'left';
}

TetrisGame.displayName = 'TetrisGame';

export default TetrisGame;
