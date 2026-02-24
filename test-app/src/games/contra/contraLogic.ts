// Contra-style side-scroller game logic
// Pure TypeScript - no React dependencies

export interface InputState {
  left: boolean;
  right: boolean;
  up: boolean;
  shoot: boolean;
}

export interface Bullet {
  x: number;
  y: number;
  vx: number;
  vy: number;
  isEnemy: boolean;
}

export interface Enemy {
  x: number;
  y: number;
  vx: number;
  health: number;
  shootCooldown: number;
  facing: 'left' | 'right';
}

export interface Player {
  x: number;
  y: number;
  vx: number;
  vy: number;
  onGround: boolean;
  health: number;
  facing: 'left' | 'right';
  shootCooldown: number;
  invincibleTime: number;
}

export interface Platform {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface GameState {
  player: Player;
  bullets: Bullet[];
  enemies: Enemy[];
  platforms: Platform[];
  scrollOffset: number;
  scrollSpeed: number;
  score: number;
  gameOver: boolean;
  canvasWidth: number;
  canvasHeight: number;
  groundY: number;
  enemySpawnTimer: number;
}

// Constants
const GRAVITY = 1800;
const PLAYER_SPEED = 250;
const JUMP_VELOCITY = -550;
const BULLET_SPEED = 600;
const ENEMY_BULLET_SPEED = 300;
const PLAYER_WIDTH = 32;
const PLAYER_HEIGHT = 48;
const ENEMY_WIDTH = 32;
const ENEMY_HEIGHT = 48;
const BULLET_SIZE = 6;
const SHOOT_COOLDOWN = 0.15;
const ENEMY_SHOOT_COOLDOWN = 2.0;
const SCROLL_SPEED = 30;
const ENEMY_SPAWN_INTERVAL = 2.5;
const ENEMY_SPEED = 80;
const INVINCIBLE_DURATION = 1.5;

export function initContraState(canvasWidth: number = 800, canvasHeight: number = 600): GameState {
  const groundY = canvasHeight - 60;

  return {
    player: {
      x: 100,
      y: groundY - PLAYER_HEIGHT,
      vx: 0,
      vy: 0,
      onGround: true,
      health: 5,
      facing: 'right',
      shootCooldown: 0,
      invincibleTime: 0,
    },
    bullets: [],
    enemies: [],
    platforms: generatePlatforms(canvasWidth, canvasHeight, groundY),
    scrollOffset: 0,
    scrollSpeed: SCROLL_SPEED,
    score: 0,
    gameOver: false,
    canvasWidth,
    canvasHeight,
    groundY,
    enemySpawnTimer: ENEMY_SPAWN_INTERVAL,
  };
}

function generatePlatforms(canvasWidth: number, canvasHeight: number, groundY: number): Platform[] {
  // Create some floating platforms
  return [
    { x: 200, y: groundY - 100, width: 120, height: 20 },
    { x: 400, y: groundY - 180, width: 100, height: 20 },
    { x: 600, y: groundY - 120, width: 150, height: 20 },
    { x: 850, y: groundY - 160, width: 100, height: 20 },
    { x: 1050, y: groundY - 100, width: 120, height: 20 },
    { x: 1300, y: groundY - 200, width: 100, height: 20 },
  ];
}

export function spawnEnemies(state: GameState): void {
  // Spawn enemy from the right edge of visible area
  const spawnX = state.scrollOffset + state.canvasWidth + 50;
  const spawnY = state.groundY - ENEMY_HEIGHT;

  state.enemies.push({
    x: spawnX,
    y: spawnY,
    vx: -ENEMY_SPEED,
    health: 1,
    shootCooldown: Math.random() * ENEMY_SHOOT_COOLDOWN,
    facing: 'left',
  });
}

export function updateContra(state: GameState, input: InputState, dt: number): GameState {
  if (state.gameOver) {
    return state;
  }

  // Update scroll
  state.scrollOffset += state.scrollSpeed * dt;

  // Update player
  updatePlayer(state, input, dt);

  // Update bullets
  updateBullets(state, dt);

  // Update enemies
  updateEnemies(state, dt);

  // Spawn enemies
  state.enemySpawnTimer -= dt;
  if (state.enemySpawnTimer <= 0) {
    spawnEnemies(state);
    state.enemySpawnTimer = ENEMY_SPAWN_INTERVAL + Math.random() * 1.5;
  }

  // Check collisions
  checkCollisions(state);

  // Check game over
  if (state.player.health <= 0) {
    state.gameOver = true;
  }

  // Keep player in bounds (don't let them go too far left)
  const minX = state.scrollOffset + 20;
  if (state.player.x < minX) {
    state.player.x = minX;
  }

  // Don't let player go too far right
  const maxX = state.scrollOffset + state.canvasWidth - PLAYER_WIDTH - 20;
  if (state.player.x > maxX) {
    state.player.x = maxX;
  }

  return state;
}

function updatePlayer(state: GameState, input: InputState, dt: number): void {
  const player = state.player;

  // Horizontal movement
  player.vx = 0;
  if (input.left) {
    player.vx = -PLAYER_SPEED;
    player.facing = 'left';
  }
  if (input.right) {
    player.vx = PLAYER_SPEED;
    player.facing = 'right';
  }

  // Jump
  if (input.up && player.onGround) {
    player.vy = JUMP_VELOCITY;
    player.onGround = false;
  }

  // Apply gravity
  player.vy += GRAVITY * dt;

  // Update position
  player.x += player.vx * dt;
  player.y += player.vy * dt;

  // Ground collision
  player.onGround = false;
  if (player.y + PLAYER_HEIGHT >= state.groundY) {
    player.y = state.groundY - PLAYER_HEIGHT;
    player.vy = 0;
    player.onGround = true;
  }

  // Platform collision
  for (const platform of state.platforms) {
    if (checkPlatformCollision(player, platform, PLAYER_WIDTH, PLAYER_HEIGHT)) {
      if (player.vy > 0) {
        player.y = platform.y - PLAYER_HEIGHT;
        player.vy = 0;
        player.onGround = true;
      }
    }
  }

  // Shooting
  player.shootCooldown -= dt;
  if (input.shoot && player.shootCooldown <= 0) {
    const bulletX = player.facing === 'right'
      ? player.x + PLAYER_WIDTH
      : player.x - BULLET_SIZE;
    const bulletY = player.y + PLAYER_HEIGHT / 2;
    const bulletVx = player.facing === 'right' ? BULLET_SPEED : -BULLET_SPEED;

    state.bullets.push({
      x: bulletX,
      y: bulletY,
      vx: bulletVx,
      vy: 0,
      isEnemy: false,
    });

    player.shootCooldown = SHOOT_COOLDOWN;
  }

  // Update invincibility
  if (player.invincibleTime > 0) {
    player.invincibleTime -= dt;
  }
}

function checkPlatformCollision(
  entity: { x: number; y: number; vy?: number },
  platform: Platform,
  entityWidth: number,
  entityHeight: number
): boolean {
  const prevY = entity.y - (entity.vy || 0) * 0.016; // Approximate previous position

  return (
    entity.x + entityWidth > platform.x &&
    entity.x < platform.x + platform.width &&
    entity.y + entityHeight >= platform.y &&
    entity.y + entityHeight <= platform.y + platform.height + 10 &&
    prevY + entityHeight <= platform.y + 5
  );
}

function updateBullets(state: GameState, dt: number): void {
  state.bullets = state.bullets.filter(bullet => {
    bullet.x += bullet.vx * dt;
    bullet.y += bullet.vy * dt;

    // Remove bullets that are off screen
    const screenLeft = state.scrollOffset - 50;
    const screenRight = state.scrollOffset + state.canvasWidth + 50;

    return bullet.x >= screenLeft && bullet.x <= screenRight &&
           bullet.y >= -50 && bullet.y <= state.canvasHeight + 50;
  });
}

function updateEnemies(state: GameState, dt: number): void {
  const player = state.player;

  state.enemies = state.enemies.filter(enemy => {
    // Move enemy
    enemy.x += enemy.vx * dt;

    // Apply gravity for enemies too
    const enemyGroundY = state.groundY - ENEMY_HEIGHT;
    if (enemy.y < enemyGroundY) {
      enemy.y = enemyGroundY;
    }

    // Face the player
    enemy.facing = enemy.x > player.x ? 'left' : 'right';

    // Shoot at player
    enemy.shootCooldown -= dt;
    if (enemy.shootCooldown <= 0) {
      const bulletX = enemy.facing === 'right'
        ? enemy.x + ENEMY_WIDTH
        : enemy.x - BULLET_SIZE;
      const bulletY = enemy.y + ENEMY_HEIGHT / 2;

      // Calculate direction to player
      const dx = player.x + PLAYER_WIDTH / 2 - bulletX;
      const dy = player.y + PLAYER_HEIGHT / 2 - bulletY;
      const dist = Math.sqrt(dx * dx + dy * dy);

      if (dist > 0) {
        state.bullets.push({
          x: bulletX,
          y: bulletY,
          vx: (dx / dist) * ENEMY_BULLET_SPEED,
          vy: (dy / dist) * ENEMY_BULLET_SPEED,
          isEnemy: true,
        });
      }

      enemy.shootCooldown = ENEMY_SHOOT_COOLDOWN + Math.random() * 1.0;
    }

    // Remove enemies that are too far left
    return enemy.x > state.scrollOffset - 100;
  });
}

function checkCollisions(state: GameState): void {
  const player = state.player;

  // Player bullets hitting enemies
  state.bullets = state.bullets.filter(bullet => {
    if (bullet.isEnemy) return true;

    for (let i = state.enemies.length - 1; i >= 0; i--) {
      const enemy = state.enemies[i];

      if (
        bullet.x < enemy.x + ENEMY_WIDTH &&
        bullet.x + BULLET_SIZE > enemy.x &&
        bullet.y < enemy.y + ENEMY_HEIGHT &&
        bullet.y + BULLET_SIZE > enemy.y
      ) {
        enemy.health -= 1;
        if (enemy.health <= 0) {
          state.enemies.splice(i, 1);
          state.score += 100;
        }
        return false; // Remove bullet
      }
    }
    return true;
  });

  // Enemy bullets hitting player
  if (player.invincibleTime <= 0) {
    state.bullets = state.bullets.filter(bullet => {
      if (!bullet.isEnemy) return true;

      if (
        bullet.x < player.x + PLAYER_WIDTH &&
        bullet.x + BULLET_SIZE > player.x &&
        bullet.y < player.y + PLAYER_HEIGHT &&
        bullet.y + BULLET_SIZE > player.y
      ) {
        player.health -= 1;
        player.invincibleTime = INVINCIBLE_DURATION;
        return false;
      }
      return true;
    });
  }

  // Player touching enemies
  if (player.invincibleTime <= 0) {
    for (const enemy of state.enemies) {
      if (
        player.x < enemy.x + ENEMY_WIDTH &&
        player.x + PLAYER_WIDTH > enemy.x &&
        player.y < enemy.y + ENEMY_HEIGHT &&
        player.y + PLAYER_HEIGHT > enemy.y
      ) {
        player.health -= 1;
        player.invincibleTime = INVINCIBLE_DURATION;
        break;
      }
    }
  }
}

export function resetContraState(state: GameState): GameState {
  return initContraState(state.canvasWidth, state.canvasHeight);
}

// Export constants for rendering
export const CONST = {
  PLAYER_WIDTH,
  PLAYER_HEIGHT,
  ENEMY_WIDTH,
  ENEMY_HEIGHT,
  BULLET_SIZE,
};
