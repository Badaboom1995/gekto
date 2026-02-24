import React from 'react';
import { ArcadeCard } from './ArcadeCard';
import './ArcadeGallery.css';

// Local Game interface stub
interface Game {
  id: string;
  name: string;
  available: boolean;
  description?: string;
  coverColor?: string;
}

interface ArcadeGalleryProps {
  onPlay: (id: string) => void;
}

// Hardcoded stub game data - 12 retro arcade games
// First 5 are available, rest are coming soon
const GAMES: Game[] = [
  {
    id: 'tetris',
    name: 'Tetris',
    available: true,
    description: 'Stack the falling blocks!',
    coverColor: '#00ffff',
  },
  {
    id: 'snake',
    name: 'Snake',
    available: true,
    description: 'Eat and grow, but don\'t bite yourself!',
    coverColor: '#00ff00',
  },
  {
    id: 'space-invaders',
    name: 'Space Invaders',
    available: true,
    description: 'Defend Earth from alien invasion!',
    coverColor: '#ff00ff',
  },
  {
    id: 'asteroids',
    name: 'Asteroids',
    available: true,
    description: 'Navigate through the asteroid field!',
    coverColor: '#ffff00',
  },
  {
    id: 'contra',
    name: 'Contra',
    available: true,
    description: 'Run and gun action!',
    coverColor: '#ff6600',
  },
  {
    id: 'pac-man',
    name: 'Pac-Man',
    available: false,
    description: 'Eat all the dots, avoid the ghosts!',
    coverColor: '#ffff00',
  },
  {
    id: 'donkey-kong',
    name: 'Donkey Kong',
    available: false,
    description: 'Climb to rescue the princess!',
    coverColor: '#ff3366',
  },
  {
    id: 'frogger',
    name: 'Frogger',
    available: false,
    description: 'Cross the road and river safely!',
    coverColor: '#33ff66',
  },
  {
    id: 'galaga',
    name: 'Galaga',
    available: false,
    description: 'Shoot down the alien swarm!',
    coverColor: '#6633ff',
  },
  {
    id: 'centipede',
    name: 'Centipede',
    available: false,
    description: 'Blast the centipede segments!',
    coverColor: '#ff33cc',
  },
  {
    id: 'dig-dug',
    name: 'Dig Dug',
    available: false,
    description: 'Dig tunnels and defeat monsters!',
    coverColor: '#33ccff',
  },
  {
    id: 'pong',
    name: 'Pong',
    available: false,
    description: 'The classic paddle game!',
    coverColor: '#ffffff',
  },
];

export const ArcadeGallery: React.FC<ArcadeGalleryProps> = ({ onPlay }) => {
  return (
    <div className="arcade-gallery">
      {GAMES.map((game) => (
        <ArcadeCard
          key={game.id}
          game={game}
          onPlay={onPlay}
        />
      ))}
    </div>
  );
};

export default ArcadeGallery;
