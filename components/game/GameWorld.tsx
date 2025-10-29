import React from 'react';
import { Customer } from '../../types';
import { WORLD_COORDINATES } from '../../constants';
import NPC from './NPC';
import Player from './Player';

interface GameWorldProps {
  customers: Map<string, Customer>;
  onCustomerClick: (id: string) => void;
}

const GameWorld = React.forwardRef<HTMLDivElement, GameWorldProps>(
  ({ customers, onCustomerClick }, ref) => {
    // Convert map to array for rendering
    const customerList = Array.from(customers.values());

    return (
      <div
        ref={ref}
        className="flex-1 relative overflow-hidden"
        style={{
          backgroundImage: "url('/assets/background.png')",
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          imageRendering: 'pixelated',
        }}
      >
        {/* Render Player - stationary at the genius bar */}
        <Player
          position={WORLD_COORDINATES.PLAYER_POSITION}
          animation={{ state: 'idle', direction: 'down', frame: 0 }}
          isInteracting={false}
        />

        {/* Render all customers */}
        {customerList.map(customer => (
          <NPC key={customer.id} customer={customer} onClick={onCustomerClick} />
        ))}
      </div>
    );
  }
);

export default GameWorld;
