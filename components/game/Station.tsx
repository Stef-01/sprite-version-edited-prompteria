import React from 'react';

interface StationProps {
  type: string;
  position: { x: number; y: number };
  isActive: boolean;
  onClick: () => void;
  label: string;
}

const Station: React.FC<StationProps> = ({ position, isActive, onClick, label }) => {
  return (
    <div
      className={`absolute transition-all transform -translate-x-1/2 -translate-y-1/2 cursor-pointer hover:scale-110 ${
        isActive ? 'animate-pulse-glow' : ''
      }`}
      style={{
        left: `${position.x}%`,
        top: `${position.y}%`,
        zIndex: 5,
      }}
      onClick={onClick}
    >
      <div
        className={`px-4 py-2 rounded-lg font-bold text-sm shadow-lg ${
          isActive
            ? 'bg-cyan-500 text-white scale-110'
            : 'bg-slate-700/80 text-slate-300 hover:bg-slate-600/80'
        }`}
      >
        {label}
      </div>
    </div>
  );
};

export default Station;


