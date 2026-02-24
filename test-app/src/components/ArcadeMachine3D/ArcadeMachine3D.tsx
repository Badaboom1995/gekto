import React, { useRef } from 'react';
import { useArcadeScene } from './useArcadeScene';
import './ArcadeMachine3D.css';

interface ArcadeMachine3DProps {
  /** Optional ref to a game canvas that will be used as the screen texture */
  gameCanvas?: React.RefObject<HTMLCanvasElement>;
}

/**
 * A 3D arcade machine component rendered with Three.js.
 * Optionally displays a game canvas on the screen.
 */
export const ArcadeMachine3D: React.FC<ArcadeMachine3DProps> = ({ gameCanvas }) => {
  const threeCanvasRef = useRef<HTMLCanvasElement>(null);

  useArcadeScene(threeCanvasRef, gameCanvas);

  return (
    <div className="arcade-machine-3d">
      <canvas ref={threeCanvasRef} />
    </div>
  );
};

export default ArcadeMachine3D;
