import { Game } from '../types/game';

export const GAMES: Game[] = [
  // Available games (5)
  {
    id: 'tetris',
    name: 'Tetris',
    description: 'Stack falling blocks to clear lines in this legendary puzzle game.',
    available: true,
    coverColor: '#00ff88',
  },
  {
    id: 'snake',
    name: 'Snake',
    description: 'Guide the snake to eat food and grow without hitting walls or yourself.',
    available: true,
    coverColor: '#00ffcc',
  },
  {
    id: 'space-invaders',
    name: 'Space Invaders',
    description: 'Defend Earth from waves of descending alien invaders.',
    available: true,
    coverColor: '#ff00ff',
  },
  {
    id: 'asteroids',
    name: 'Asteroids',
    description: 'Navigate through space and destroy asteroids before they destroy you.',
    available: true,
    coverColor: '#00ccff',
  },
  {
    id: 'contra',
    name: 'Contra',
    description: 'Run and gun through enemy territory in this action-packed shooter.',
    available: true,
    coverColor: '#ff6600',
  },
  // Coming soon games (7)
  {
    id: 'pac-man',
    name: 'Pac-Man',
    description: 'Chomp dots and avoid ghosts in the iconic maze chase game.',
    available: false,
    coverColor: '#ffff00',
  },
  {
    id: 'donkey-kong',
    name: 'Donkey Kong',
    description: 'Climb ladders and jump barrels to rescue the princess from the giant ape.',
    available: false,
    coverColor: '#ff4444',
  },
  {
    id: 'frogger',
    name: 'Frogger',
    description: 'Help the frog cross busy roads and rivers to reach home safely.',
    available: false,
    coverColor: '#44ff44',
  },
  {
    id: 'galaga',
    name: 'Galaga',
    description: 'Battle swarms of alien insects in this classic space shooter.',
    available: false,
    coverColor: '#ff00aa',
  },
  {
    id: 'centipede',
    name: 'Centipede',
    description: 'Blast the segmented centipede as it winds through the mushroom field.',
    available: false,
    coverColor: '#88ff00',
  },
  {
    id: 'q-bert',
    name: 'Q*bert',
    description: 'Hop on cubes to change their colors while avoiding enemies.',
    available: false,
    coverColor: '#ff8800',
  },
  {
    id: 'dig-dug',
    name: 'Dig Dug',
    description: 'Tunnel underground and inflate enemies to defeat them.',
    available: false,
    coverColor: '#0088ff',
  },
];
