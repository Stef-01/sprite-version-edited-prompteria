import React from 'react';

interface SpriteProps {
  spriteSheet: string;
  frameX: number;
  frameY: number;
  width: number;
  height: number;
  scale?: number;
}

const Sprite: React.FC<SpriteProps> = ({
  spriteSheet,
  frameX,
  frameY,
  width,
  height,
  scale = 1,
}) => {
  const scaledWidth = width * scale;
  const scaledHeight = height * scale;

  return (
    <div
      style={{
        width: `${scaledWidth}px`,
        height: `${scaledHeight}px`,
        backgroundImage: `url(${spriteSheet})`,
        backgroundPosition: `-${frameX * width}px -${frameY * height}px`,
        backgroundRepeat: 'no-repeat',
        imageRendering: 'pixelated', // Keep it crisp
      }}
    />
  );
};

export default Sprite;
