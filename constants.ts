// Gameplay Constants
export const CUSTOMERS_PER_DAY = 10;
export const BASE_PATIENCE_DECAY = 0.1; // Per game loop tick (50ms)
export const NPC_SPEED = 0.5; // units per game loop tick (50ms)

// Ranks
export const RANKS = [
  { name: 'Prompt Intern', minMoney: 0 },
  { name: 'Junior Prompter', minMoney: 500 },
  { name: 'Prompt Engineer', minMoney: 1500 },
  { name: 'Senior Prompt Architect', minMoney: 3000 },
  { name: 'Master of Prompts', minMoney: 5000 },
];

// Emojis and Visuals
export const CELEBRATION_EMOJIS = ['🎉', '✨', '💖', '🌟', '👍'];
export const ANGRY_EMOJIS = ['💢', '😤', '😡', '🔥'];

export const THOUGHT_BUBBLES = {
  happy: ['😊', '👍', '💡'],
  neutral: ['🤔', '...'],
  impatient: ['⏳', '😠', ' tapping... '],
  angry: ['😡', '😤', '!!!'],
};

// World Coordinates (as percentages of the container)
export const WORLD_COORDINATES = {
    ENTRANCE: { x: 50, y: 95 }, // Bottom center (customers enter from here)
    EXIT: { x: 50, y: 105 }, // Off-screen bottom for exit
    QUEUE_SPOTS: [
        { x: 20, y: 75 }, // Queue waiting area - bottom left
        { x: 30, y: 75 },
        { x: 70, y: 75 }, // Bottom right side
        { x: 80, y: 75 },
    ],
    BAR_POSITION: { x: 50, y: 45 }, // Customer approaches the genius bar (center-middle)
    PLAYER_POSITION: { x: 50, y: 35 }, // Player stays behind the genius bar
    STATIONS: {
        order: { x: 50, y: 35 }, // Same as player position
        template: { x: 30, y: 30 }, // Left side station
        compose: { x: 70, y: 30 }, // Right side station
        finish: { x: 50, y: 20 }, // Back station
    },
};

// Customer Data
const rubric_summarize = [
  { concept: 'Key Points', description: 'Identify and extract the main ideas.', keywords: ['summarize', 'main points', 'key ideas', 'briefly'], weight: 0.4, tip: 'Focus on the who, what, where, when, why.' },
  { concept: 'Conciseness', description: 'Be brief and to the point.', keywords: ['concise', 'short', 'brief'], weight: 0.3, tip: 'Avoid unnecessary words and repetition.' },
  { concept: 'Format', description: 'Use the requested format (e.g., bullet points).', keywords: ['bullet points', 'list', 'numbered'], weight: 0.3, tip: 'Structure the output as requested.' }
];

const rubric_creative = [
    { concept: 'Adherence to Theme', description: 'The story should match the requested theme.', keywords: ['sci-fi', 'robot', 'space', 'future'], weight: 0.4, tip: 'Incorporate elements of science fiction.' },
    { concept: 'Engaging Narrative', description: 'Create a compelling story.', keywords: ['story', 'narrative', 'plot', 'character'], weight: 0.4, tip: 'A good story has a beginning, middle, and end.' },
    { concept: 'Tone', description: 'Match the requested tone (e.g., humorous).', keywords: ['funny', 'humor', 'joke', 'silly'], weight: 0.2, tip: 'Use witty language and amusing situations.' }
];

const order_summarize = {
  description: "I need a summary of the latest quarterly report. Make it short and sweet, just the highlights in bullet points.",
  tone: "Professional",
  format: "Bullet Points",
  wordCount: 150,
  rubricItems: rubric_summarize,
};

const order_creative = {
    description: "Write me a funny, short sci-fi story about a robot who is afraid of toasters.",
    tone: "Humorous",
    format: "Short Story",
    wordCount: 300,
    rubricItems: rubric_creative,
};

export const CUSTOMERS_DATA = [
  {
    name: 'Brenda',
    title: 'Corporate Analyst',
    avatar: '👩‍💼',
    type: 'business',
    spriteSheet: '/assets/characters/business_female.png',
    orders: [order_summarize],
  },
  {
    name: 'Leo',
    title: 'Aspiring Novelist',
    avatar: '👨‍🎨',
    type: 'creative',
    spriteSheet: '/assets/characters/creative_male.png',
    orders: [order_creative],
  },
  {
    name: 'Chad',
    title: 'Startup Bro',
    avatar: '😎',
    type: 'tech',
    spriteSheet: '/assets/characters/tech_male.png',
    orders: [order_summarize],
  },
  {
    name: 'Penelope',
    title: 'Poet',
    avatar: '👩‍🎤',
    type: 'creative',
    // Re-using a sprite sheet for variety
    spriteSheet: '/assets/characters/marketing_male.png',
    orders: [order_creative],
  }
];

// Daily Waves
export const WAVE_SCHEDULE = {
    1: { types: ['business'], message: "Looks like it's a corporate crowd today!" },
    2: { types: ['creative'], message: "The artists are in town!" },
    3: { types: ['tech', 'business'], message: "A mix of tech and business clients are coming." },
    4: { types: ['creative', 'business'], message: "Creatives and corporates are mingling today." },
    5: { types: ['tech', 'creative', 'business'], message: "Everyone's here! It's going to be a busy day." }
};
