// Space Invaders game logic - pure functions, no React
// Canvas size: 480×640

export interface Invader {
  x: number;
  y: number;
  width: number;
  height: number;
  type: 0 | 1 | 2; // 3 different shapes by row
  alive: boolean;
}

export interface Bullet {
  x: number;
  y: number;
  width: number;
  height: number;
  velocityY: number;
  isPlayer: boolean;
}

export interface Barrier {
  x: number;
  y: number;
  blocks: boolean[][]; // 2D grid of barrier blocks
}

export interface Player {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface SpaceInvadersState {
  player: Player;
  invaders: Invader[];
  bullets: Bullet[];
  barriers: Barrier[];
  score: number;
  lives: number;
  gameOver: boolean;
  victory: boolean;
  invaderDirection: 1 | -1;
  invaderSpeed: number;
  lastInvaderShot: number;
  canvasWidth: number;
  canvasHeight: number;
}

const CANVAS_WIDTH = 480;
const CANVAS_HEIGHT = 640;
const INVADER_ROWS = 5;
const INVADER_COLS = 11;
const INVADER_WIDTH = 30;
const INVADER_HEIGHT = 24;
const INVADER_PADDING = 10;
const INVADER_START_Y = 80;
const PLAYER_WIDTH = 40;
const PLAYER_HEIGHT = 20;
const PLAYER_Y = CANVAS_HEIGHT - 60;
const BULLET_WIDTH = 4;
const BULLET_HEIGHT = 12;
const PLAYER_BULLET_SPEED = -400;
const INVADER_BULLET_SPEED = 200;
const PLAYER_SPEED = 250;
const BARRIER_COUNT = 4;
const BARRIER_WIDTH = 60;
const BARRIER_HEIGHT = 40;
const BARRIER_BLOCK_SIZE = 4;

export function createInitialState(): SpaceInvadersState {
  const invaders: Invader[] = [];
  const startX = (CANVAS_WIDTH - (INVADER_COLS * (INVADER_WIDTH + INVADER_PADDING))) / 2;

  for (let row = 0; row < INVADER_ROWS; row++) {
    for (let col = 0; col < INVADER_COLS; col++) {
      invaders.push({
        x: startX + col * (INVADER_WIDTH + INVADER_PADDING),
        y: INVADER_START_Y + row * (INVADER_HEIGHT + INVADER_PADDING),
        width: INVADER_WIDTH,
        height: INVADER_HEIGHT,
        type: row < 1 ? 0 : row < 3 ? 1 : 2,
        alive: true,
      });
    }
  }

  const barriers: Barrier[] = [];
  const barrierSpacing = CANVAS_WIDTH / (BARRIER_COUNT + 1);
  const blocksX = Math.floor(BARRIER_WIDTH / BARRIER_BLOCK_SIZE);
  const blocksY = Math.floor(BARRIER_HEIGHT / BARRIER_BLOCK_SIZE);

  for (let i = 0; i < BARRIER_COUNT; i++) {
    const blocks: boolean[][] = [];
    for (let y = 0; y < blocksY; y++) {
      blocks[y] = [];
      for (let x = 0; x < blocksX; x++) {
        // Create arch shape
        const centerX = blocksX / 2;
        const isArch = y >= blocksY * 0.6 && Math.abs(x - centerX) < blocksX * 0.3;
        blocks[y][x] = !isArch;
      }
    }
    barriers.push({
      x: barrierSpacing * (i + 1) - BARRIER_WIDTH / 2,
      y: CANVAS_HEIGHT - 150,
      blocks,
    });
  }

  return {
    player: {
      x: CANVAS_WIDTH / 2 - PLAYER_WIDTH / 2,
      y: PLAYER_Y,
      width: PLAYER_WIDTH,
      height: PLAYER_HEIGHT,
    },
    invaders,
    bullets: [],
    barriers,
    score: 0,
    lives: 3,
    gameOver: false,
    victory: false,
    invaderDirection: 1,
    invaderSpeed: 30,
    lastInvaderShot: 0,
    canvasWidth: CANVAS_WIDTH,
    canvasHeight: CANVAS_HEIGHT,
  };
}

function checkCollision(
  a: { x: number; y: number; width: number; height: number },
  b: { x: number; y: number; width: number; height: number }
): boolean {
  return (
    a.x < b.x + b.width &&
    a.x + a.width > b.x &&
    a.y < b.y + b.height &&
    a.y + a.height > b.y
  );
}

function checkBarrierCollision(bullet: Bullet, barrier: Barrier): { hit: boolean; blockX: number; blockY: number } {
  const relX = bullet.x - barrier.x;
  const relY = bullet.y - barrier.y;
  const blockX = Math.floor(relX / BARRIER_BLOCK_SIZE);
  const blockY = Math.floor(relY / BARRIER_BLOCK_SIZE);

  if (
    blockX >= 0 &&
    blockX < barrier.blocks[0]?.length &&
    blockY >= 0 &&
    blockY < barrier.blocks.length &&
    barrier.blocks[blockY]?.[blockX]
  ) {
    return { hit: true, blockX, blockY };
  }
  return { hit: false, blockX: -1, blockY: -1 };
}

export function fireBullet(state: SpaceInvadersState): SpaceInvadersState {
  if (state.gameOver || state.victory) return state;

  // Limit player bullets on screen
  const playerBullets = state.bullets.filter((b) => b.isPlayer);
  if (playerBullets.length >= 2) return state;

  const newBullet: Bullet = {
    x: state.player.x + state.player.width / 2 - BULLET_WIDTH / 2,
    y: state.player.y - BULLET_HEIGHT,
    width: BULLET_WIDTH,
    height: BULLET_HEIGHT,
    velocityY: PLAYER_BULLET_SPEED,
    isPlayer: true,
  };

  return {
    ...state,
    bullets: [...state.bullets, newBullet],
  };
}

export function updateGame(
  state: SpaceInvadersState,
  delta: number,
  keys: Set<string>
): SpaceInvadersState {
  if (state.gameOver || state.victory) return state;

  const deltaSeconds = delta / 1000;
  let newState = { ...state };

  // Player movement
  let playerX = state.player.x;
  if (keys.has('ArrowLeft')) {
    playerX -= PLAYER_SPEED * deltaSeconds;
  }
  if (keys.has('ArrowRight')) {
    playerX += PLAYER_SPEED * deltaSeconds;
  }
  playerX = Math.max(0, Math.min(CANVAS_WIDTH - PLAYER_WIDTH, playerX));
  newState.player = { ...state.player, x: playerX };

  // Update bullets
  let bullets = state.bullets
    .map((bullet) => ({
      ...bullet,
      y: bullet.y + bullet.velocityY * deltaSeconds,
    }))
    .filter((bullet) => bullet.y > -BULLET_HEIGHT && bullet.y < CANVAS_HEIGHT);

  // Move invaders
  let invaders = [...state.invaders];
  let direction = state.invaderDirection;
  let needsStep = false;

  const aliveInvaders = invaders.filter((inv) => inv.alive);
  if (aliveInvaders.length === 0) {
    return { ...newState, victory: true, bullets };
  }

  const leftMost = Math.min(...aliveInvaders.map((inv) => inv.x));
  const rightMost = Math.max(...aliveInvaders.map((inv) => inv.x + inv.width));

  if (rightMost >= CANVAS_WIDTH - 10 && direction === 1) {
    direction = -1;
    needsStep = true;
  } else if (leftMost <= 10 && direction === -1) {
    direction = 1;
    needsStep = true;
  }

  const speed = state.invaderSpeed + (55 - aliveInvaders.length) * 2;
  invaders = invaders.map((inv) => ({
    ...inv,
    x: inv.x + direction * speed * deltaSeconds,
    y: needsStep ? inv.y + 20 : inv.y,
  }));

  // Check if invaders reached bottom
  const lowestInvader = Math.max(...aliveInvaders.map((inv) => inv.y + inv.height));
  if (lowestInvader >= PLAYER_Y - 20) {
    return { ...newState, gameOver: true, bullets, invaders };
  }

  // Invader shooting
  let lastInvaderShot = state.lastInvaderShot + delta;
  if (lastInvaderShot > 1000 + Math.random() * 500) {
    const shooters = aliveInvaders.filter((inv) => {
      // Only bottom invaders in each column can shoot
      const sameCol = aliveInvaders.filter(
        (other) => Math.abs(other.x - inv.x) < 5 && other.alive
      );
      const lowest = Math.max(...sameCol.map((i) => i.y));
      return inv.y === lowest;
    });

    if (shooters.length > 0) {
      const shooter = shooters[Math.floor(Math.random() * shooters.length)];
      bullets.push({
        x: shooter.x + shooter.width / 2 - BULLET_WIDTH / 2,
        y: shooter.y + shooter.height,
        width: BULLET_WIDTH,
        height: BULLET_HEIGHT,
        velocityY: INVADER_BULLET_SPEED,
        isPlayer: false,
      });
    }
    lastInvaderShot = 0;
  }

  // Collision detection - bullets vs invaders
  let score = state.score;
  const survivingBullets: Bullet[] = [];
  const hitInvaderIndices = new Set<number>();

  for (const bullet of bullets) {
    let bulletHit = false;

    if (bullet.isPlayer) {
      for (let i = 0; i < invaders.length; i++) {
        const inv = invaders[i];
        if (inv.alive && checkCollision(bullet, inv)) {
          hitInvaderIndices.add(i);
          bulletHit = true;
          score += inv.type === 0 ? 30 : inv.type === 1 ? 20 : 10;
          break;
        }
      }
    }

    if (!bulletHit) {
      survivingBullets.push(bullet);
    }
  }

  invaders = invaders.map((inv, i) =>
    hitInvaderIndices.has(i) ? { ...inv, alive: false } : inv
  );

  // Collision detection - bullets vs barriers
  let barriers = state.barriers.map((barrier) => ({
    ...barrier,
    blocks: barrier.blocks.map((row) => [...row]),
  }));

  const finalBullets: Bullet[] = [];
  for (const bullet of survivingBullets) {
    let bulletHit = false;

    for (const barrier of barriers) {
      const collision = checkBarrierCollision(bullet, barrier);
      if (collision.hit) {
        // Erode barrier blocks around hit point
        for (let dy = -1; dy <= 1; dy++) {
          for (let dx = -1; dx <= 1; dx++) {
            const by = collision.blockY + dy;
            const bx = collision.blockX + dx;
            if (
              by >= 0 &&
              by < barrier.blocks.length &&
              bx >= 0 &&
              bx < barrier.blocks[0].length &&
              Math.random() > 0.3
            ) {
              barrier.blocks[by][bx] = false;
            }
          }
        }
        bulletHit = true;
        break;
      }
    }

    if (!bulletHit) {
      finalBullets.push(bullet);
    }
  }

  // Collision detection - enemy bullets vs player
  let lives = state.lives;
  const nonPlayerBullets: Bullet[] = [];

  for (const bullet of finalBullets) {
    if (!bullet.isPlayer && checkCollision(bullet, newState.player)) {
      lives--;
      if (lives <= 0) {
        return {
          ...newState,
          lives: 0,
          gameOver: true,
          bullets: finalBullets.filter((b) => b.isPlayer),
          invaders,
          barriers,
          score,
        };
      }
    } else {
      nonPlayerBullets.push(bullet);
    }
  }

  // Check victory
  const remainingInvaders = invaders.filter((inv) => inv.alive);
  if (remainingInvaders.length === 0) {
    return {
      ...newState,
      victory: true,
      bullets: nonPlayerBullets,
      invaders,
      barriers,
      score,
      lives,
    };
  }

  return {
    ...newState,
    invaders,
    bullets: nonPlayerBullets,
    barriers,
    score,
    lives,
    invaderDirection: direction,
    lastInvaderShot,
  };
}
