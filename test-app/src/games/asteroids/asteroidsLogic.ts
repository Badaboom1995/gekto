// Asteroids game logic - pure functions, no React
// Canvas size: 480×640

export interface Ship {
  x: number;
  y: number;
  rotation: number; // in radians
  velocityX: number;
  velocityY: number;
  radius: number;
  invincible: boolean;
  invincibleTimer: number;
}

export interface Rock {
  x: number;
  y: number;
  velocityX: number;
  velocityY: number;
  radius: number;
  size: 'large' | 'medium' | 'small';
  rotation: number;
  rotationSpeed: number;
  vertices: number[]; // Angles for irregular polygon
}

export interface Bullet {
  x: number;
  y: number;
  velocityX: number;
  velocityY: number;
  radius: number;
  lifetime: number;
}

export interface Particle {
  x: number;
  y: number;
  velocityX: number;
  velocityY: number;
  lifetime: number;
  maxLifetime: number;
}

export interface AsteroidsState {
  ship: Ship;
  rocks: Rock[];
  bullets: Bullet[];
  particles: Particle[];
  score: number;
  lives: number;
  level: number;
  gameOver: boolean;
  canvasWidth: number;
  canvasHeight: number;
  respawnTimer: number;
}

const CANVAS_WIDTH = 480;
const CANVAS_HEIGHT = 640;
const SHIP_RADIUS = 15;
const ROTATION_SPEED = 5; // radians per second
const THRUST_POWER = 200;
const MAX_SPEED = 300;
const FRICTION = 0.99;
const BULLET_SPEED = 400;
const BULLET_LIFETIME = 1200; // ms
const ROCK_SIZES = {
  large: { radius: 40, score: 20, speed: 50 },
  medium: { radius: 25, score: 50, speed: 75 },
  small: { radius: 12, score: 100, speed: 100 },
};
const INVINCIBLE_TIME = 2000;

function generateRockVertices(): number[] {
  const vertices: number[] = [];
  const numVertices = 8 + Math.floor(Math.random() * 4);
  for (let i = 0; i < numVertices; i++) {
    const angle = (i / numVertices) * Math.PI * 2;
    const variance = 0.7 + Math.random() * 0.6;
    vertices.push(angle);
    vertices.push(variance);
  }
  return vertices;
}

function createRock(
  x: number,
  y: number,
  size: 'large' | 'medium' | 'small',
  velocityX?: number,
  velocityY?: number
): Rock {
  const config = ROCK_SIZES[size];
  const angle = Math.random() * Math.PI * 2;
  const speed = config.speed * (0.5 + Math.random() * 0.5);

  return {
    x,
    y,
    velocityX: velocityX ?? Math.cos(angle) * speed,
    velocityY: velocityY ?? Math.sin(angle) * speed,
    radius: config.radius,
    size,
    rotation: Math.random() * Math.PI * 2,
    rotationSpeed: (Math.random() - 0.5) * 2,
    vertices: generateRockVertices(),
  };
}

function createInitialRocks(level: number, shipX: number, shipY: number): Rock[] {
  const rocks: Rock[] = [];
  const numRocks = 3 + level;

  for (let i = 0; i < numRocks; i++) {
    let x: number, y: number;
    // Ensure rocks don't spawn too close to ship
    do {
      x = Math.random() * CANVAS_WIDTH;
      y = Math.random() * CANVAS_HEIGHT;
    } while (
      Math.hypot(x - shipX, y - shipY) < 150
    );

    rocks.push(createRock(x, y, 'large'));
  }

  return rocks;
}

export function createInitialState(): AsteroidsState {
  const ship: Ship = {
    x: CANVAS_WIDTH / 2,
    y: CANVAS_HEIGHT / 2,
    rotation: -Math.PI / 2, // Point up
    velocityX: 0,
    velocityY: 0,
    radius: SHIP_RADIUS,
    invincible: true,
    invincibleTimer: INVINCIBLE_TIME,
  };

  return {
    ship,
    rocks: createInitialRocks(1, ship.x, ship.y),
    bullets: [],
    particles: [],
    score: 0,
    lives: 3,
    level: 1,
    gameOver: false,
    canvasWidth: CANVAS_WIDTH,
    canvasHeight: CANVAS_HEIGHT,
    respawnTimer: 0,
  };
}

function wrapPosition(value: number, max: number, buffer: number = 0): number {
  if (value < -buffer) return max + buffer;
  if (value > max + buffer) return -buffer;
  return value;
}

function checkCollision(
  x1: number,
  y1: number,
  r1: number,
  x2: number,
  y2: number,
  r2: number
): boolean {
  const dx = x1 - x2;
  const dy = y1 - y2;
  const distance = Math.sqrt(dx * dx + dy * dy);
  return distance < r1 + r2;
}

function createExplosionParticles(x: number, y: number, count: number): Particle[] {
  const particles: Particle[] = [];
  for (let i = 0; i < count; i++) {
    const angle = Math.random() * Math.PI * 2;
    const speed = 50 + Math.random() * 100;
    particles.push({
      x,
      y,
      velocityX: Math.cos(angle) * speed,
      velocityY: Math.sin(angle) * speed,
      lifetime: 500 + Math.random() * 500,
      maxLifetime: 500 + Math.random() * 500,
    });
  }
  return particles;
}

export function fireAsteroidsBullet(state: AsteroidsState): AsteroidsState {
  if (state.gameOver || state.respawnTimer > 0) return state;

  // Limit bullets
  if (state.bullets.length >= 5) return state;

  const { ship } = state;
  const newBullet: Bullet = {
    x: ship.x + Math.cos(ship.rotation) * ship.radius,
    y: ship.y + Math.sin(ship.rotation) * ship.radius,
    velocityX: Math.cos(ship.rotation) * BULLET_SPEED + ship.velocityX * 0.5,
    velocityY: Math.sin(ship.rotation) * BULLET_SPEED + ship.velocityY * 0.5,
    radius: 2,
    lifetime: BULLET_LIFETIME,
  };

  return {
    ...state,
    bullets: [...state.bullets, newBullet],
  };
}

export function updateGame(
  state: AsteroidsState,
  delta: number,
  keys: Set<string>
): AsteroidsState {
  if (state.gameOver) return state;

  const deltaSeconds = delta / 1000;
  let newState = { ...state };

  // Handle respawn
  if (state.respawnTimer > 0) {
    const newTimer = state.respawnTimer - delta;
    if (newTimer <= 0) {
      newState.ship = {
        x: CANVAS_WIDTH / 2,
        y: CANVAS_HEIGHT / 2,
        rotation: -Math.PI / 2,
        velocityX: 0,
        velocityY: 0,
        radius: SHIP_RADIUS,
        invincible: true,
        invincibleTimer: INVINCIBLE_TIME,
      };
      newState.respawnTimer = 0;
    } else {
      newState.respawnTimer = newTimer;
    }
  }

  // Update ship
  let ship = { ...newState.ship };

  if (newState.respawnTimer <= 0) {
    // Rotation
    if (keys.has('ArrowLeft')) {
      ship.rotation -= ROTATION_SPEED * deltaSeconds;
    }
    if (keys.has('ArrowRight')) {
      ship.rotation += ROTATION_SPEED * deltaSeconds;
    }

    // Thrust
    if (keys.has('ArrowUp')) {
      ship.velocityX += Math.cos(ship.rotation) * THRUST_POWER * deltaSeconds;
      ship.velocityY += Math.sin(ship.rotation) * THRUST_POWER * deltaSeconds;

      // Clamp speed
      const speed = Math.sqrt(ship.velocityX ** 2 + ship.velocityY ** 2);
      if (speed > MAX_SPEED) {
        ship.velocityX = (ship.velocityX / speed) * MAX_SPEED;
        ship.velocityY = (ship.velocityY / speed) * MAX_SPEED;
      }
    }

    // Apply friction
    ship.velocityX *= FRICTION;
    ship.velocityY *= FRICTION;

    // Move ship
    ship.x += ship.velocityX * deltaSeconds;
    ship.y += ship.velocityY * deltaSeconds;

    // Wrap position
    ship.x = wrapPosition(ship.x, CANVAS_WIDTH);
    ship.y = wrapPosition(ship.y, CANVAS_HEIGHT);

    // Update invincibility
    if (ship.invincible) {
      ship.invincibleTimer -= delta;
      if (ship.invincibleTimer <= 0) {
        ship.invincible = false;
        ship.invincibleTimer = 0;
      }
    }
  }

  newState.ship = ship;

  // Update bullets
  let bullets = state.bullets
    .map((bullet) => ({
      ...bullet,
      x: wrapPosition(bullet.x + bullet.velocityX * deltaSeconds, CANVAS_WIDTH),
      y: wrapPosition(bullet.y + bullet.velocityY * deltaSeconds, CANVAS_HEIGHT),
      lifetime: bullet.lifetime - delta,
    }))
    .filter((bullet) => bullet.lifetime > 0);

  // Update rocks
  let rocks = state.rocks.map((rock) => ({
    ...rock,
    x: wrapPosition(rock.x + rock.velocityX * deltaSeconds, CANVAS_WIDTH, rock.radius),
    y: wrapPosition(rock.y + rock.velocityY * deltaSeconds, CANVAS_HEIGHT, rock.radius),
    rotation: rock.rotation + rock.rotationSpeed * deltaSeconds,
  }));

  // Update particles
  let particles = state.particles
    .map((particle) => ({
      ...particle,
      x: particle.x + particle.velocityX * deltaSeconds,
      y: particle.y + particle.velocityY * deltaSeconds,
      lifetime: particle.lifetime - delta,
    }))
    .filter((particle) => particle.lifetime > 0);

  // Bullet vs Rock collisions
  let score = state.score;
  const survivingBullets: Bullet[] = [];
  const newRocks: Rock[] = [];
  const destroyedRockIndices = new Set<number>();

  for (const bullet of bullets) {
    let bulletHit = false;

    for (let i = 0; i < rocks.length; i++) {
      if (destroyedRockIndices.has(i)) continue;

      const rock = rocks[i];
      if (checkCollision(bullet.x, bullet.y, bullet.radius, rock.x, rock.y, rock.radius)) {
        destroyedRockIndices.add(i);
        bulletHit = true;
        score += ROCK_SIZES[rock.size].score;

        // Create explosion particles
        particles = [...particles, ...createExplosionParticles(rock.x, rock.y, 8)];

        // Split rock
        if (rock.size === 'large') {
          const angle1 = Math.random() * Math.PI * 2;
          const angle2 = angle1 + Math.PI;
          newRocks.push(
            createRock(rock.x, rock.y, 'medium', Math.cos(angle1) * 80, Math.sin(angle1) * 80),
            createRock(rock.x, rock.y, 'medium', Math.cos(angle2) * 80, Math.sin(angle2) * 80)
          );
        } else if (rock.size === 'medium') {
          const angle1 = Math.random() * Math.PI * 2;
          const angle2 = angle1 + Math.PI;
          newRocks.push(
            createRock(rock.x, rock.y, 'small', Math.cos(angle1) * 100, Math.sin(angle1) * 100),
            createRock(rock.x, rock.y, 'small', Math.cos(angle2) * 100, Math.sin(angle2) * 100)
          );
        }
        break;
      }
    }

    if (!bulletHit) {
      survivingBullets.push(bullet);
    }
  }

  rocks = rocks.filter((_, i) => !destroyedRockIndices.has(i));
  rocks = [...rocks, ...newRocks];
  bullets = survivingBullets;

  // Ship vs Rock collisions
  let lives = state.lives;
  let respawnTimer = newState.respawnTimer;

  if (respawnTimer <= 0 && !ship.invincible) {
    for (const rock of rocks) {
      if (checkCollision(ship.x, ship.y, ship.radius * 0.7, rock.x, rock.y, rock.radius)) {
        lives--;
        particles = [...particles, ...createExplosionParticles(ship.x, ship.y, 15)];

        if (lives <= 0) {
          return {
            ...newState,
            lives: 0,
            gameOver: true,
            rocks,
            bullets,
            particles,
            score,
          };
        }

        respawnTimer = 1500;
        break;
      }
    }
  }

  // Check for new wave
  let level = state.level;
  if (rocks.length === 0) {
    level++;
    rocks = createInitialRocks(level, ship.x, ship.y);
  }

  return {
    ...newState,
    ship,
    rocks,
    bullets,
    particles,
    score,
    lives,
    level,
    respawnTimer,
  };
}
