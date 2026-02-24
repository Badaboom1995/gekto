// Snake Game Logic - Pure functions with no React/DOM dependencies

export type Direction = 'UP' | 'DOWN' | 'LEFT' | 'RIGHT';

export interface Position {
  x: number;
  y: number;
}

export interface SnakeState {
  snake: Position[];
  food: Position;
  direction: Direction;
  nextDirection: Direction;
  score: number;
  gameOver: boolean;
  gridSize: number;
}

const GRID_SIZE = 20;

function getRandomPosition(excludePositions: Position[]): Position {
  const allPositions: Position[] = [];

  for (let x = 0; x < GRID_SIZE; x++) {
    for (let y = 0; y < GRID_SIZE; y++) {
      const isExcluded = excludePositions.some(pos => pos.x === x && pos.y === y);
      if (!isExcluded) {
        allPositions.push({ x, y });
      }
    }
  }

  if (allPositions.length === 0) {
    // No empty cells available (snake fills the board - win condition!)
    return { x: 0, y: 0 };
  }

  return allPositions[Math.floor(Math.random() * allPositions.length)];
}

export function createInitialState(): SnakeState {
  // Start snake in the center
  const centerX = Math.floor(GRID_SIZE / 2);
  const centerY = Math.floor(GRID_SIZE / 2);

  const initialSnake: Position[] = [
    { x: centerX, y: centerY },
    { x: centerX - 1, y: centerY },
    { x: centerX - 2, y: centerY },
  ];

  const food = getRandomPosition(initialSnake);

  return {
    snake: initialSnake,
    food,
    direction: 'RIGHT',
    nextDirection: 'RIGHT',
    score: 0,
    gameOver: false,
    gridSize: GRID_SIZE,
  };
}

function getOppositeDirection(dir: Direction): Direction {
  switch (dir) {
    case 'UP':
      return 'DOWN';
    case 'DOWN':
      return 'UP';
    case 'LEFT':
      return 'RIGHT';
    case 'RIGHT':
      return 'LEFT';
  }
}

export function changeDirection(state: SnakeState, newDirection: Direction): SnakeState {
  if (state.gameOver) {
    return state;
  }

  // Prevent reversing direction (180-degree turn)
  if (newDirection === getOppositeDirection(state.direction)) {
    return state;
  }

  return {
    ...state,
    nextDirection: newDirection,
  };
}

export function tick(state: SnakeState): SnakeState {
  if (state.gameOver) {
    return state;
  }

  // Apply queued direction change
  const direction = state.nextDirection;

  // Calculate new head position
  const head = state.snake[0];
  let newHead: Position;

  switch (direction) {
    case 'UP':
      newHead = { x: head.x, y: head.y - 1 };
      break;
    case 'DOWN':
      newHead = { x: head.x, y: head.y + 1 };
      break;
    case 'LEFT':
      newHead = { x: head.x - 1, y: head.y };
      break;
    case 'RIGHT':
      newHead = { x: head.x + 1, y: head.y };
      break;
  }

  // Check wall collision
  if (
    newHead.x < 0 ||
    newHead.x >= GRID_SIZE ||
    newHead.y < 0 ||
    newHead.y >= GRID_SIZE
  ) {
    return {
      ...state,
      direction,
      gameOver: true,
    };
  }

  // Check self collision (exclude tail since it will move)
  const willEatFood = newHead.x === state.food.x && newHead.y === state.food.y;
  const bodyToCheck = willEatFood ? state.snake : state.snake.slice(0, -1);
  const selfCollision = bodyToCheck.some(
    segment => segment.x === newHead.x && segment.y === newHead.y
  );

  if (selfCollision) {
    return {
      ...state,
      direction,
      gameOver: true,
    };
  }

  // Move snake
  const newSnake = [newHead, ...state.snake];

  if (willEatFood) {
    // Snake grows - don't remove tail
    const newFood = getRandomPosition(newSnake);
    return {
      ...state,
      snake: newSnake,
      food: newFood,
      direction,
      score: state.score + 10,
    };
  } else {
    // Remove tail
    newSnake.pop();
    return {
      ...state,
      snake: newSnake,
      direction,
    };
  }
}

export function getTickInterval(): number {
  return 150;
}
