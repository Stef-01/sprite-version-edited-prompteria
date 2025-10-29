import React from 'react';
import { Customer } from '../../types';
import NPC from './NPC';

interface GameWorldProps {
  customers: Map<string, Customer>;
  onCustomerClick: (id: string) => void;
}

const GameWorld = React.forwardRef<HTMLDivElement, GameWorldProps>(({ customers, onCustomerClick }, ref) => {
  // Convert map to array for rendering
  const customerList = Array.from(customers.values());

  return (
    <div 
      ref={ref} 
      className="flex-1 bg-slate-800 relative overflow-hidden"
      style={{ 
        backgroundImage: "url('/assets/backgrounds/bar_floor.png')", 
        backgroundSize: 'cover',
        backgroundPosition: 'center' 
      }}
    >
      {/* A simple representation of the bar counter */}
      <div 
        className="absolute bg-contain bg-no-repeat bg-center"
        style={{
          backgroundImage: "url('/assets/objects/bar_counter.png')",
          width: '90%',
          height: '25%',
          left: '5%',
          top: '40%',
          zIndex: 49, // NPCs at the bar (y=50) will appear in front
        }}
      />
      
      {/* Render all customers */}
      {customerList.map(customer => (
        <NPC key={customer.id} customer={customer} onClick={onCustomerClick} />
      ))}
    </div>
  );
});

export default GameWorld;
