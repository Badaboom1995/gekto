// Tetris Game Logic - Pure functions with no React/DOM dependencies

export type TetrominoType = 'I' | 'O' | 'T' | 'S' | 'Z' | 'J' | 'L';

export interface TetrominoPiece {
  type: TetrominoType;
  shape: number[][];
  color: string;
  x: number;
  y: number;
}

export interface TetrisState {
  board: (string | null)[][]; // 10x20, null = empty, string = color
  currentPiece: TetrominoPiece | null;
  nextPiece: TetrominoPiece;
  score: number;
  level: number;
  lines: number;
  gameOver: boolean;
}

const BOARD_WIDTH = 10;
const BOARD_HEIGHT = 20;

// Tetromino shapes and colors
const TETROMINOES: Record<TetrominoType, { shape: number[][]; color: string }> = {
  I: {
    shape: [
      [0, 0, 0, 0],
      [1, 1, 1, 1],
      [0, 0, 0, 0],
      [0, 0, 0, 0],
    ],
    color: '#00f0f0', // Cyan
  },
  O: {
    shape: [
      [1, 1],
      [1, 1],
    ],
    color: '#f0f000', // Yellow
  },
  T: {
    shape: [
      [0, 1, 0],
      [1, 1, 1],
      [0, 0, 0],
    ],
    color: '#a000f0', // Purple
  },
  S: {
    shape: [
      [0, 1, 1],
      [1, 1, 0],
      [0, 0, 0],
    ],
    color: '#00f000', // Green
  },
  Z: {
    shape: [
      [1, 1, 0],
      [0, 1, 1],
      [0, 0, 0],
    ],
    color: '#f00000', // Red
  },
  J: {
    shape: [
      [1, 0, 0],
      [1, 1, 1],
      [0, 0, 0],
    ],
    color: '#0000f0', // Blue
  },
  L: {
    shape: [
      [0, 0, 1],
      [1, 1, 1],
      [0, 0, 0],
    ],
    color: '#f0a000', // Orange
  },
};

const TETROMINO_TYPES: TetrominoType[] = ['I', 'O', 'T', 'S', 'Z', 'J', 'L'];

function createEmptyBoard(): (string | null)[][] {
  return Array.from({ length: BOARD_HEIGHT }, () =>
    Array.from({ length: BOARD_WIDTH }, () => null)
  );
}

function getRandomTetrominoType(): TetrominoType {
  return TETROMINO_TYPES[Math.floor(Math.random() * TETROMINO_TYPES.length)];
}

function createPiece(type: TetrominoType): TetrominoPiece {
  const tetromino = TETROMINOES[type];
  return {
    type,
    shape: tetromino.shape.map(row => [...row]),
    color: tetromino.color,
    x: Math.floor((BOARD_WIDTH - tetromino.shape[0].length) / 2),
    y: 0,
  };
}

function checkCollision(
  board: (string | null)[][],
  piece: TetrominoPiece,
  offsetX: number = 0,
  offsetY: number = 0
): boolean {
  for (let y = 0; y < piece.shape.length; y++) {
    for (let x = 0; x < piece.shape[y].length; x++) {
      if (piece.shape[y][x]) {
        const newX = piece.x + x + offsetX;
        const newY = piece.y + y + offsetY;

        // Check boundaries
        if (newX < 0 || newX >= BOARD_WIDTH || newY >= BOARD_HEIGHT) {
          return true;
        }

        // Check collision with locked pieces (only if within board)
        if (newY >= 0 && board[newY][newX] !== null) {
          return true;
        }
      }
    }
  }
  return false;
}

function lockPiece(board: (string | null)[][], piece: TetrominoPiece): (string | null)[][] {
  const newBoard = board.map(row => [...row]);
  for (let y = 0; y < piece.shape.length; y++) {
    for (let x = 0; x < piece.shape[y].length; x++) {
      if (piece.shape[y][x]) {
        const boardY = piece.y + y;
        const boardX = piece.x + x;
        if (boardY >= 0 && boardY < BOARD_HEIGHT && boardX >= 0 && boardX < BOARD_WIDTH) {
          newBoard[boardY][boardX] = piece.color;
        }
      }
    }
  }
  return newBoard;
}

function clearLines(board: (string | null)[][]): { board: (string | null)[][]; linesCleared: number } {
  const newBoard = board.filter(row => row.some(cell => cell === null));
  const linesCleared = BOARD_HEIGHT - newBoard.length;

  // Add empty rows at the top
  while (newBoard.length < BOARD_HEIGHT) {
    newBoard.unshift(Array.from({ length: BOARD_WIDTH }, () => null));
  }

  return { board: newBoard, linesCleared };
}

function rotatePieceMatrix(shape: number[][]): number[][] {
  const size = shape.length;
  const rotated: number[][] = Array.from({ length: size }, () =>
    Array.from({ length: size }, () => 0)
  );

  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      rotated[x][size - 1 - y] = shape[y][x];
    }
  }

  return rotated;
}

export function createInitialState(): TetrisState {
  const firstPiece = createPiece(getRandomTetrominoType());
  const nextPiece = createPiece(getRandomTetrominoType());

  return {
    board: createEmptyBoard(),
    currentPiece: firstPiece,
    nextPiece,
    score: 0,
    level: 1,
    lines: 0,
    gameOver: false,
  };
}

export function tick(state: TetrisState): TetrisState {
  if (state.gameOver || !state.currentPiece) {
    return state;
  }

  // Try to move piece down
  if (!checkCollision(state.board, state.currentPiece, 0, 1)) {
    return {
      ...state,
      currentPiece: {
        ...state.currentPiece,
        y: state.currentPiece.y + 1,
      },
    };
  }

  // Lock piece and spawn new one
  let newBoard = lockPiece(state.board, state.currentPiece);
  const { board: clearedBoard, linesCleared } = clearLines(newBoard);
  newBoard = clearedBoard;

  const newLines = state.lines + linesCleared;
  const newLevel = Math.floor(newLines / 10) + 1;
  const lineScore = linesCleared > 0 ? 100 * linesCleared * state.level : 0;

  // Spawn new piece
  const newPiece = state.nextPiece;
  const nextPiece = createPiece(getRandomTetrominoType());

  // Check game over - if new piece collides immediately
  const gameOver = checkCollision(newBoard, newPiece, 0, 0);

  return {
    board: newBoard,
    currentPiece: gameOver ? null : newPiece,
    nextPiece,
    score: state.score + lineScore,
    level: newLevel,
    lines: newLines,
    gameOver,
  };
}

export function moveLeft(state: TetrisState): TetrisState {
  if (state.gameOver || !state.currentPiece) {
    return state;
  }

  if (!checkCollision(state.board, state.currentPiece, -1, 0)) {
    return {
      ...state,
      currentPiece: {
        ...state.currentPiece,
        x: state.currentPiece.x - 1,
      },
    };
  }

  return state;
}

export function moveRight(state: TetrisState): TetrisState {
  if (state.gameOver || !state.currentPiece) {
    return state;
  }

  if (!checkCollision(state.board, state.currentPiece, 1, 0)) {
    return {
      ...state,
      currentPiece: {
        ...state.currentPiece,
        x: state.currentPiece.x + 1,
      },
    };
  }

  return state;
}

export function rotate(state: TetrisState): TetrisState {
  if (state.gameOver || !state.currentPiece) {
    return state;
  }

  const rotatedShape = rotatePieceMatrix(state.currentPiece.shape);
  const rotatedPiece: TetrominoPiece = {
    ...state.currentPiece,
    shape: rotatedShape,
  };

  // Try rotation at current position
  if (!checkCollision(state.board, rotatedPiece, 0, 0)) {
    return {
      ...state,
      currentPiece: rotatedPiece,
    };
  }

  // Wall kick - try shifting left or right
  const kicks = [-1, 1, -2, 2];
  for (const kick of kicks) {
    if (!checkCollision(state.board, rotatedPiece, kick, 0)) {
      return {
        ...state,
        currentPiece: {
          ...rotatedPiece,
          x: rotatedPiece.x + kick,
        },
      };
    }
  }

  return state;
}

export function drop(state: TetrisState): TetrisState {
  if (state.gameOver || !state.currentPiece) {
    return state;
  }

  let dropDistance = 0;
  while (!checkCollision(state.board, state.currentPiece, 0, dropDistance + 1)) {
    dropDistance++;
  }

  const droppedPiece: TetrominoPiece = {
    ...state.currentPiece,
    y: state.currentPiece.y + dropDistance,
  };

  // Lock immediately after drop
  let newBoard = lockPiece(state.board, droppedPiece);
  const { board: clearedBoard, linesCleared } = clearLines(newBoard);
  newBoard = clearedBoard;

  const newLines = state.lines + linesCleared;
  const newLevel = Math.floor(newLines / 10) + 1;
  const lineScore = linesCleared > 0 ? 100 * linesCleared * state.level : 0;
  const dropScore = dropDistance * 2; // Bonus for hard drop

  // Spawn new piece
  const newPiece = state.nextPiece;
  const nextPiece = createPiece(getRandomTetrominoType());

  // Check game over
  const gameOver = checkCollision(newBoard, newPiece, 0, 0);

  return {
    board: newBoard,
    currentPiece: gameOver ? null : newPiece,
    nextPiece,
    score: state.score + lineScore + dropScore,
    level: newLevel,
    lines: newLines,
    gameOver,
  };
}

export function getGhostPosition(state: TetrisState): number {
  if (!state.currentPiece) {
    return 0;
  }

  let ghostY = 0;
  while (!checkCollision(state.board, state.currentPiece, 0, ghostY + 1)) {
    ghostY++;
  }

  return state.currentPiece.y + ghostY;
}

export function getDropInterval(level: number): number {
  // Start at 1000ms, decrease by 50ms per level, minimum 100ms
  return Math.max(100, 1000 - (level - 1) * 50);
}
