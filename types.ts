export type CustomerState = 'arriving' | 'ordering' | 'waiting' | 'at_bar' | 'served' | 'celebrating' | 'angry' | 'leaving';
export type StationState = 'idle' | 'active' | 'evaluating' | 'complete';
export type StationType = 'order' | 'template' | 'compose' | 'finish';
export type CustomerMood = 'happy' | 'neutral' | 'impatient' | 'angry';
export type Signal = 'Exact' | 'Stem' | 'Fuzzy' | 'Semantic' | 'None';

export interface RubricItem {
  concept: string;
  description: string;
  keywords: string[];
  weight: number;
  tip: string;
}

export interface CustomerOrder {
  description: string;
  tone: string;
  format: string;
  wordCount: number;
  rubricItems: RubricItem[];
  timeOrdered: number;
}

export interface Customer {
  id: string;
  name: string;
  title: string;
  avatar: string;
  type: string;
  state: CustomerState;
  mood: CustomerMood;
  order: CustomerOrder | null;
  patience: number;
  composition: string;
  selectedWordCount: number;
  thoughtBubble: string;
  isWaving: boolean;
  isTapping: boolean;
  satisfactionScore: number;
  emoteTime: number;
  rubricScore: number;
  speedScore: number;
  wordCountScore: number;
  queueIndex: number;
  // New properties for sprite-based game
  position: { x: number; y: number };
  targetPosition: { x: number; y: number };
  spriteSheet: string;
  animation: {
    state: 'idle' | 'walking';
    direction: 'down' | 'up' | 'left' | 'right';
    frame: number;
  };
}

export interface Station {
  type: StationType;
  state: StationState;
  currentCustomer: string | null;
}

export interface GameStats {
  day: number;
  money: number;
  rank: string;
  rankProgress: number;
  ordersCompleted: number;
  perfectOrders: number;
  streak: number;
  dailyOrders: Array<{customer: string; score: number; tip: number}>;
}

export interface Particle {
  id: string;
  x: number;
  y: number;
  emoji: string;
  velocity: { x: number; y: number };
}

export interface ScorePopup {
  id: string;
  score: number;
  emoji: string;
  x: number;
  y: number;
}
