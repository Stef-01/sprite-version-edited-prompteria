import React from 'react';
import { Customer } from '../../types';
import Sprite from './Sprite';

interface NPCProps {
  customer: Customer;
  onClick: (id: string) => void;
}

// Configuration for sprite sheets (Stardew Valley style)
const SPRITE_CONFIG = {
    width: 16, // Correct width for a single frame
    height: 32, // Correct height for a single frame
    scale: 4, // Make sprites larger on screen
    directions: {
        down: 0,
        right: 1, // Corrected from up
        left: 2,
        up: 3,   // Corrected from right
    },
    walkingFrames: 6, // Corrected from 4
};

const NPC: React.FC<NPCProps> = ({ customer, onClick }) => {
    // This will update on each re-render, driven by the main game loop
    const frameCounter = Math.floor(Date.now() / 150) % SPRITE_CONFIG.walkingFrames;

    const getSpriteFrame = () => {
        // Idle is the first frame of the 'down' animation
        if (customer.animation.state === 'idle') {
            return {
                x: 0, 
                y: SPRITE_CONFIG.directions.down
            };
        }
        // Walking animation
        return {
            x: frameCounter,
            y: SPRITE_CONFIG.directions[customer.animation.direction],
        };
    };
    
    const spriteFrame = getSpriteFrame();
    
    const isClickable = customer.state === 'ordering';
    
    const animationClass = () => {
        if (customer.state === 'celebrating') return 'animate-celebrate';
        if (customer.isWaving) return 'animate-wave';
        if (customer.mood === 'angry') return 'animate-shake';
        if (customer.mood === 'impatient' || customer.isTapping) return 'animate-tap';
        return '';
    };

    return (
        <div
            className={`absolute transition-opacity duration-300 transform -translate-x-1/2 -translate-y-full ${isClickable ? 'cursor-pointer hover:scale-110' : ''} ${customer.state === 'leaving' ? 'opacity-0' : 'opacity-100'}`}
            style={{
                left: `${customer.position.x}%`,
                top: `${customer.position.y}%`,
                zIndex: Math.floor(customer.position.y),
                transitionProperty: 'left, top, opacity',
                transitionDuration: '50ms', // Match game loop interval
                transitionTimingFunction: 'linear',
            }}
            onClick={() => isClickable && onClick(customer.id)}
        >
            {/* Thought Bubble */}
            {(customer.state === 'ordering' || customer.state === 'waiting' || customer.state === 'at_bar') && (
                <div className="absolute -top-12 left-1/2 -translate-x-1/2 bg-white text-black text-2xl px-3 py-1 rounded-full shadow-lg animate-pop-in whitespace-nowrap">
                    {customer.thoughtBubble}
                </div>
            )}
            
            {/* Main NPC Body */}
            <div className={`relative ${animationClass()}`} style={{width: SPRITE_CONFIG.width * SPRITE_CONFIG.scale, height: SPRITE_CONFIG.height * SPRITE_CONFIG.scale}}>
                 <Sprite
                    spriteSheet={customer.spriteSheet}
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

export default NPC;