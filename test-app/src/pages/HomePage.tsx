import React from 'react';
import { NeonTitle } from '../components/UI/NeonTitle';
import { ArcadeGallery } from '../components/ArcadeGallery/ArcadeGallery';

interface HomePageProps {
  onPlay: (id: string) => void;
}

const pageStyles: React.CSSProperties = {
  minHeight: '100vh',
  background: 'var(--bg-dark, #0a0a0f)',
  padding: '2rem 1rem',
  boxSizing: 'border-box',
};

export const HomePage: React.FC<HomePageProps> = ({ onPlay }) => {
  return (
    <div style={pageStyles}>
      <NeonTitle subtitle="SELECT YOUR GAME">
        GEKTO ARCADE
      </NeonTitle>
      <ArcadeGallery onPlay={onPlay} />
    </div>
  );
};

export default HomePage;
