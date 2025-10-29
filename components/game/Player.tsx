import React from 'react';
import Sprite from './Sprite';

interface PlayerProps {
  position: { x: number; y: number };
  animation: {
    state: 'idle' | 'walking';
    direction: 'down' | 'up' | 'left' | 'right';
    frame: number;
  };
  isInteracting?: boolean;
}

// Configuration for player sprite sheets
const SPRITE_CONFIG = {
  width: 16,
  height: 32,
  scale: 4,
  directions: {
    down: 0,
    right: 1,
    left: 2,
    up: 3,
  },
  walkingFrames: 6,
};

const Player: React.FC<PlayerProps> = ({ position, animation, isInteracting = false }) => {
  const frameCounter = Math.floor(Date.now() / 150) % SPRITE_CONFIG.walkingFrames;

  const getSpriteFrame = () => {
    if (animation.state === 'idle') {
      return {
        x: 0,
        y: SPRITE_CONFIG.directions[animation.direction],
      };
    }
    return {
      x: frameCounter,
      y: SPRITE_CONFIG.directions[animation.direction],
    };
  };

  const spriteFrame = getSpriteFrame();

  return (
    <div
      className="absolute transition-all duration-75 transform -translate-x-1/2 -translate-y-full"
      style={{
        left: `${position.x}%`,
        top: `${position.y}%`,
        zIndex: Math.floor(position.y) + 1, // Player slightly above NPCs at same position
        transitionProperty: 'left, top',
        transitionTimingFunction: 'linear',
      }}
    >
      {/* Player indicator */}
      {!isInteracting && (
        <div className="absolute -top-8 left-1/2 -translate-x-1/2 text-2xl animate-bounce-slow">
          ⭐
        </div>
      )}

      {/* Main Player Sprite */}
      <div
        className="relative"
        style={{
          width: SPRITE_CONFIG.width * SPRITE_CONFIG.scale,
          height: SPRITE_CONFIG.height * SPRITE_CONFIG.scale,
        }}
      >
        <Sprite
          spriteSheet="/assets/characters/tech_male.png"
          frameX={spriteFrame.x}
          frameY={spriteFrame.y}
          width={SPRITE_CONFIG.width}
          height={SPRITE_CONFIG.height}
          scale={SPRITE_CONFIG.scale}
        />
      </div>
    </div>
  );
};

export default Player;


