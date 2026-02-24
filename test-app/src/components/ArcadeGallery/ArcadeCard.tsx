import React from 'react';
import { ComingSoonBadge } from '../UI/ComingSoonBadge';
import './ArcadeGallery.css';

// Local Game interface stub
interface Game {
  id: string;
  name: string;
  available: boolean;
  description?: string;
  coverColor?: string;
}

interface ArcadeCardProps {
  game: Game;
  onPlay: (id: string) => void;
}

/**
 * Pixel Art Game Illustration
 * Renders unique pixel art for each game
 */
const GamePixelArt: React.FC<{ gameId: string; color: string }> = ({ gameId, color }) => {
  const pixelSize = 4;

  // Pixel art patterns for each game (16x16 grids)
  const patterns: Record<string, string[][]> = {
    tetris: [
      '................',
      '....CCCC........',
      '....C...........',
      '....CC..........',
      '.........YYY....',
      '..........Y.....',
      '...GG...........',
      '...GG....RR.....',
      '.........RR.....',
      '....BB..........',
      '....BB...MMM....',
      '....BB....M.....',
      'GGGGBBCCCCMRRRR.',
      'GGGGBBCCCCMRRRR.',
      'YYYYMMMMBBBBCCCC',
      'YYYYMMMMBBBBCCCC',
    ].map(r => r.split('')),
    snake: [
      '................',
      '......RRR.......',
      '.....R...R......',
      '.....RRRRR......',
      '................',
      '..GGGGG.........',
      '.G....GG........',
      '.G.....GGG......',
      '.G.......GG.....',
      '..G.......G.....',
      '..G.......G.....',
      '...G.....GG.....',
      '...GGGGGG.......',
      '................',
      '................',
      '................',
    ].map(r => r.split('')),
    'space-invaders': [
      '................',
      '....M....M......',
      '.....M..M.......',
      '....MMMMMM......',
      '...MM.MM.MM.....',
      '...MMMMMMMM.....',
      '...M.MMMM.M.....',
      '...M......M.....',
      '....MM..MM......',
      '................',
      '.......G........',
      '......GGG.......',
      '.....GGGGG......',
      '....GGGGGGG.....',
      '......G.G.......',
      '................',
    ].map(r => r.split('')),
    asteroids: [
      '................',
      '.......GG.......',
      '......GGGG......',
      '.....GG.GGG.....',
      '....GG...GG.....',
      '...GGG...GGG....',
      '...GGGGGGGG.....',
      '....GGGGG.......',
      '................',
      '........W.......',
      '.......WWW......',
      '......W.W.W.....',
      '.....W..W..W....',
      '........W.......',
      '.......WWW......',
      '................',
    ].map(r => r.split('')),
    contra: [
      '................',
      '.......BB.......',
      '......BBBB......',
      '.....BBBBBB.....',
      '......YYYY......',
      '.....Y.YY.Y.....',
      '.....YYYYYY.....',
      '......YYYY......',
      '......RRRR......',
      '.....RR..RR.....',
      '....RR....RR....',
      '....BB....BB....',
      '....BB....BB....',
      '...BBB....BBB...',
      '...BB......BB...',
      '................',
    ].map(r => r.split('')),
    'pac-man': [
      '................',
      '.....YYYYY......',
      '....YYYYYYY.....',
      '...YYYYYYYY.....',
      '...YYY.YYYY.....',
      '...YYYYYYYY.....',
      '...YYYYY........',
      '...YYYY.........',
      '...YYYYY........',
      '...YYYYYYYY.....',
      '...YYYYYYYY.....',
      '....YYYYYYY.....',
      '.....YYYYY......',
      '..W...W...W.....',
      '................',
      '................',
    ].map(r => r.split('')),
    'donkey-kong': [
      '................',
      '......BBB.......',
      '.....BBBBB......',
      '....BB.B.BB.....',
      '....BBBBBBB.....',
      '.....BBBBB......',
      '......BBB.......',
      '.....BBBBB......',
      '....BBBBBBB.....',
      '....BB...BB.....',
      '...RRRRRRRR.....',
      '...RRRRRRRR.....',
      '....R....R......',
      '................',
      '................',
      '................',
    ].map(r => r.split('')),
    frogger: [
      '................',
      '.....GGGG.......',
      '....G....G......',
      '...GG.GG.GG.....',
      '...GGGGGGGG.....',
      '....GGGGGG......',
      '.....G..G.......',
      '....GG..GG......',
      '................',
      '..BBBBBBBBBB....',
      '..B........B....',
      '..BBBBBBBBBB....',
      '................',
      '..RRRR...RRRR...',
      '..R..R...R..R...',
      '................',
    ].map(r => r.split('')),
    galaga: [
      '................',
      '....R...R.......',
      '.....RRR........',
      '....RRRRR.......',
      '...RRRRRRR......',
      '...R.RRR.R......',
      '...R.....R......',
      '................',
      '................',
      '.......C........',
      '......CCC.......',
      '.....CCCCC......',
      '....CC.C.CC.....',
      '...C..CCC..C....',
      '......C.C.......',
      '................',
    ].map(r => r.split('')),
    centipede: [
      '................',
      '...GGG.GGG.GGG..',
      '..G...G...G...G.',
      '...GGG.GGG.GGG..',
      '................',
      '....MMMM........',
      '...M....M.......',
      '....MMMM........',
      '........MMMM....',
      '.......M....M...',
      '........MMMM....',
      '................',
      '.......W........',
      '......WWW.......',
      '.....W.W.W......',
      '................',
    ].map(r => r.split('')),
    'dig-dug': [
      '................',
      '......WWW.......',
      '.....W.B.W......',
      '......WWW.......',
      '.....RRRRR......',
      '....RR...RR.....',
      '....RRRRRRR.....',
      '.....R...R......',
      '....BB...BB.....',
      '....B.....B.....',
      '................',
      '...BBBBBBBB.....',
      '..B........B....',
      '..B........B....',
      '..BBBBBBBBBB....',
      '................',
    ].map(r => r.split('')),
    pong: [
      '................',
      '..WW........WW..',
      '..WW........WW..',
      '..WW........WW..',
      '..WW........WW..',
      '..WW........WW..',
      '..WW........WW..',
      '........W.......',
      '.......WWW......',
      '........W.......',
      '..WW........WW..',
      '..WW........WW..',
      '..WW........WW..',
      '..WW........WW..',
      '..WW........WW..',
      '................',
    ].map(r => r.split('')),
  };

  const colorMap: Record<string, string> = {
    'R': '#ff3333', // Red
    'G': '#33ff33', // Green
    'B': '#3366ff', // Blue
    'Y': '#ffff33', // Yellow
    'C': '#33ffff', // Cyan
    'M': '#ff33ff', // Magenta
    'W': '#ffffff', // White
    'O': '#ff9933', // Orange
    '.': 'transparent',
  };

  const pattern = patterns[gameId] || patterns['pong'];

  return (
    <svg viewBox="0 0 80 80" xmlns="http://www.w3.org/2000/svg" style={{ imageRendering: 'pixelated' }}>
      {/* Background with game color glow */}
      <rect x="0" y="0" width="80" height="80" fill="#111" rx="4" />
      <rect x="0" y="0" width="80" height="80" fill={color} opacity="0.1" rx="4" />

      {/* Pixel art */}
      <g transform="translate(8, 8)">
        {pattern.map((row, y) =>
          row.map((pixel, x) => {
            if (pixel === '.') return null;
            return (
              <rect
                key={`${x}-${y}`}
                x={x * pixelSize}
                y={y * pixelSize}
                width={pixelSize}
                height={pixelSize}
                fill={colorMap[pixel] || color}
              />
            );
          })
        )}
      </g>

      {/* Scanline overlay */}
      <defs>
        <pattern id={`scanlines-${gameId}`} width="4" height="4" patternUnits="userSpaceOnUse">
          <line x1="0" y1="0" x2="80" y2="0" stroke="#000" strokeWidth="1" opacity="0.15" />
        </pattern>
      </defs>
      <rect x="0" y="0" width="80" height="80" fill={`url(#scanlines-${gameId})`} rx="4" />

      {/* Border glow */}
      <rect x="1" y="1" width="78" height="78" fill="none" stroke={color} strokeWidth="2" rx="3" opacity="0.6" />
    </svg>
  );
};

export const ArcadeCard: React.FC<ArcadeCardProps> = ({ game, onPlay }) => {
  const handlePlayClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (game.available) {
      onPlay(game.id);
    }
  };

  const gameColor = game.coverColor || '#00ffff';

  return (
    <div className={`arcade-card ${game.available ? 'available' : ''}`}>
      <div className="arcade-card__cabinet">
        <GamePixelArt gameId={game.id} color={gameColor} />
      </div>

      <div className="arcade-card__name">{game.name}</div>

      {game.available ? (
        <button
          className="arcade-card__play-btn"
          onClick={handlePlayClick}
          aria-label={`Play ${game.name}`}
        >
          INSERT COIN
        </button>
      ) : (
        <ComingSoonBadge />
      )}
    </div>
  );
};

export default ArcadeCard;
