import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Customer,
  Station,
  GameStats,
  Particle,
  StationType,
  CustomerOrder,
  ScorePopup,
  CustomerState
} from '../types';
import {
  CUSTOMERS_DATA,
  THOUGHT_BUBBLES,
  CELEBRATION_EMOJIS,
  ANGRY_EMOJIS,
  CUSTOMERS_PER_DAY,
  BASE_PATIENCE_DECAY,
  RANKS,
  WAVE_SCHEDULE,
  WORLD_COORDINATES,
  NPC_SPEED
} from '../constants';
import { findMatch } from '../utils/scoring';
import GameWorld from './game/GameWorld';

const getScoreEmoji = (score: number): string => {
  if (score >= 95) return '🤩';
  if (score >= 80) return '😄';
  if (score >= 60) return '🙂';
  if (score >= 40) return '😐';
  if (score >= 20) return '😟';
  return '😡';
};

const PromptBarGame: React.FC = () => {
  const [customers, setCustomers] = useState<Map<string, Customer>>(new Map());
  const [stations, setStations] = useState<Map<StationType, Station>>(new Map([
    ['order', { type: 'order', state: 'idle', currentCustomer: null }],
    ['template', { type: 'template', state: 'idle', currentCustomer: null }],
    ['compose', { type: 'compose', state: 'idle', currentCustomer: null }],
    ['finish', { type: 'finish', state: 'idle', currentCustomer: null }]
  ]));
  const [activeStation, setActiveStation] = useState<StationType | null>(null);
  const [gameStats, setGameStats] = useState<GameStats>({
    day: 1,
    money: 0,
    rank: 'Prompt Intern',
    rankProgress: 0,
    ordersCompleted: 0,
    perfectOrders: 0,
    streak: 0,
    dailyOrders: []
  });
  const [lobbyQueue, setLobbyQueue] = useState<string[]>([]);
  const [particles, setParticles] = useState<Particle[]>([]);
  const [scorePopups, setScorePopups] = useState<ScorePopup[]>([]);
  const [showDaySummary, setShowDaySummary] = useState(false);
  const [dayStartMoney, setDayStartMoney] = useState(0);
  
  const spawnTimerRef = useRef<number | null>(null);
  const gameLoopTimerRef = useRef<number | null>(null);
  const worldRef = useRef<HTMLDivElement>(null);


  const spawnCustomer = useCallback(() => {
    setGameStats(prevStats => {
        const currentCustomerCount = Array.from(customers.values()).filter(c => c.state !== 'leaving').length;
        if (prevStats.ordersCompleted + currentCustomerCount >= CUSTOMERS_PER_DAY) {
            if (spawnTimerRef.current) clearInterval(spawnTimerRef.current);
            return prevStats;
        }

        const waveInfo = WAVE_SCHEDULE[(prevStats.day - 1) % Object.keys(WAVE_SCHEDULE).length + 1];
        const eligibleCustomers = CUSTOMERS_DATA.filter(c => waveInfo.types.includes(c.type));
        const customerPool = eligibleCustomers.length > 0 ? eligibleCustomers : CUSTOMERS_DATA;
        const customerData = customerPool[Math.floor(Math.random() * customerPool.length)];
        const orderData = customerData.orders[0];

        setLobbyQueue(prevQueue => {
            const queueIndex = prevQueue.length % WORLD_COORDINATES.QUEUE_SPOTS.length;
            const newCustomerId = String(Date.now() + Math.random());

            const customer: Customer = {
                id: newCustomerId,
                name: customerData.name,
                title: customerData.title,
                avatar: customerData.avatar,
                type: customerData.type,
                spriteSheet: customerData.spriteSheet,
                state: 'arriving',
                mood: 'happy',
                order: { ...orderData, timeOrdered: Date.now() },
                patience: 100,
                composition: '',
                selectedWordCount: orderData.wordCount,
                thoughtBubble: '😊',
                isWaving: false,
                isTapping: false,
                satisfactionScore: 0,
                emoteTime: Date.now(),
                rubricScore: 0,
                speedScore: 0,
                wordCountScore: 0,
                queueIndex: queueIndex,
                position: WORLD_COORDINATES.ENTRANCE,
                targetPosition: WORLD_COORDINATES.QUEUE_SPOTS[queueIndex],
                animation: { state: 'walking', direction: 'up', frame: 0 } // Start walking up from entrance
            };

            setCustomers(prevCustomers => new Map(prevCustomers).set(customer.id, customer));
            return [...prevQueue, newCustomerId];
        });

        return prevStats;
    });
  }, [customers]);

  const customerLeaves = useCallback((customerId: string, satisfied: boolean) => {
    const customer = customers.get(customerId);
    if (!customer || customer.state === 'leaving' || customer.state === 'celebrating' || customer.state === 'angry') return;

    const worldRect = worldRef.current?.getBoundingClientRect();
    const popupX = worldRect ? worldRect.left + (customer.position.x / 100) * worldRect.width : 0;
    const popupY = worldRect ? worldRect.top + (customer.position.y / 100) * worldRect.height : 0;

    const showScorePopup = (score: number) => {
      if (worldRect) {
        const newPopup: ScorePopup = { id: customerId, score, emoji: getScoreEmoji(score), x: popupX, y: popupY };
        setScorePopups(prev => [...prev, newPopup]);
        setTimeout(() => setScorePopups(prev => prev.filter(p => p.id !== customerId)), 2000);
      }
    };
    
    if (satisfied) {
      setCustomers(prev => {
        const newMap = new Map(prev);
        const c = newMap.get(customerId);
        if (c) {
          const newCustomer = { ...c, state: 'celebrating' as CustomerState, targetPosition: WORLD_COORDINATES.EXIT };
          newMap.set(customerId, newCustomer);
        }
        return newMap;
      });
      if (worldRect) createParticles(popupX, popupY, CELEBRATION_EMOJIS);
      showScorePopup(customer.satisfactionScore);

      const basePay = 50;
      const tip = Math.floor(customer.satisfactionScore * 2.5);
      const total = basePay + tip;
      const isPerfect = customer.satisfactionScore >= 95;
      
      setGameStats(prev => {
        const newStats = {
          ...prev,
          money: prev.money + total,
          ordersCompleted: prev.ordersCompleted + 1,
          perfectOrders: isPerfect ? prev.perfectOrders + 1 : prev.perfectOrders,
          streak: isPerfect ? prev.streak + 1 : 0,
          dailyOrders: [...prev.dailyOrders, { customer: customer.name, score: customer.satisfactionScore, tip }]
        };
        if (newStats.ordersCompleted >= CUSTOMERS_PER_DAY) {
          if (spawnTimerRef.current) clearInterval(spawnTimerRef.current);
          setTimeout(() => setShowDaySummary(true), 2500);
        }
        return newStats;
      });
    } else {
      setCustomers(prev => {
        const newMap = new Map(prev);
        const c = newMap.get(customerId);
        if (c) {
          const newCustomer = { ...c, state: 'angry' as CustomerState, mood: 'angry' as const, targetPosition: WORLD_COORDINATES.EXIT };
          newMap.set(customerId, newCustomer);
        }
        return newMap;
      });
      if (worldRect) createParticles(popupX, popupY, ANGRY_EMOJIS);
      showScorePopup(0);
      setGameStats(prev => ({ ...prev, streak: 0, ordersCompleted: prev.ordersCompleted + 1 }));
    }
    setLobbyQueue(prev => prev.filter(id => id !== customerId));
  }, [customers]);

  useEffect(() => {
    spawnCustomer();
    spawnTimerRef.current = window.setInterval(spawnCustomer, 15000);

    gameLoopTimerRef.current = window.setInterval(() => {
      setParticles(prev => prev.map(p => ({ ...p, x: p.x + p.velocity.x, y: p.y + p.velocity.y, velocity: { x: p.velocity.x * 0.98, y: p.velocity.y + 0.5 } })).filter(p => p.y < window.innerHeight));

      setCustomers(prev => {
        const newMap = new Map<string, Customer>();

        prev.forEach((oldCustomer, id) => {
          const customer = { ...oldCustomer, position: { ...oldCustomer.position }, animation: { ...oldCustomer.animation } };
          
          const dx = customer.targetPosition.x - customer.position.x;
          const dy = customer.targetPosition.y - customer.position.y;
          const dist = Math.sqrt(dx * dx + dy * dy);

          if (dist > 0.1) {
            customer.animation.state = 'walking';
            // Set direction based on movement vector
            if (Math.abs(dx) > Math.abs(dy)) {
              customer.animation.direction = dx > 0 ? 'right' : 'left';
            } else {
              customer.animation.direction = dy > 0 ? 'down' : 'up';
            }
            
            const speed = NPC_SPEED;
            if (dist > speed) {
                const ratio = speed / dist;
                customer.position.x += dx * ratio;
                customer.position.y += dy * ratio;
            } else {
                customer.position.x = customer.targetPosition.x;
                customer.position.y = customer.targetPosition.y;
            }
          } else {
            customer.position = { ...customer.targetPosition };
            if (customer.animation.state === 'walking') {
              customer.animation.state = 'idle';
            }

            if (customer.state === 'arriving') {
                customer.state = 'ordering';
                customer.isWaving = true;
            }
            if (customer.state === 'celebrating' || customer.state === 'angry') {
                customer.state = 'leaving';
            }
             if (customer.state === 'leaving' && dist < 0.1) {
                // Do nothing, let it be deleted after the loop
             }
          }

          if (customer.state === 'leaving' && dist < 0.1) {
             // Mark for deletion by not adding it to the new map
          } else {
            if (customer.state === 'ordering' || customer.state === 'waiting' || customer.state === 'at_bar') {
              customer.patience = Math.max(0, customer.patience - (BASE_PATIENCE_DECAY / 2)); // Halved rate for balance
              if (customer.patience <= 0) setTimeout(() => customerLeaves(id, false), 0);
              
              if (customer.patience > 70) customer.mood = 'happy';
              else if (customer.patience > 40) customer.mood = 'neutral';
              else if (customer.patience > 20) customer.mood = 'impatient';
              else customer.mood = 'angry';
  
              if (Date.now() - customer.emoteTime > 1500) {
                customer.isWaving = Math.random() < 0.2;
                const bubbles = THOUGHT_BUBBLES[customer.mood];
                customer.thoughtBubble = bubbles[Math.floor(Math.random() * bubbles.length)];
                customer.emoteTime = Date.now();
              }
            }
            newMap.set(id, customer);
          }
        });
        
        return newMap;
      });
    }, 50);

    return () => {
      if (spawnTimerRef.current) clearInterval(spawnTimerRef.current);
      if (gameLoopTimerRef.current) clearInterval(gameLoopTimerRef.current);
    };
  }, [spawnCustomer, customerLeaves]);

  useEffect(() => {
    const currentRankIndex = RANKS.findIndex(r => r.name === gameStats.rank);
    const currentRank = RANKS[currentRankIndex];
    const nextRank = RANKS[currentRankIndex + 1];

    if (nextRank && gameStats.money >= nextRank.minMoney) {
      setGameStats(prev => ({ ...prev, rank: nextRank.name }));
    }
    
    if (nextRank) {
      const moneyInCurrentRank = gameStats.money - currentRank.minMoney;
      const moneyForNextRank = nextRank.minMoney - currentRank.minMoney;
      setGameStats(prev => ({ ...prev, rankProgress: Math.min(100, (moneyInCurrentRank / moneyForNextRank) * 100) }));
    } else {
      setGameStats(prev => ({ ...prev, rankProgress: 100 }));
    }
  }, [gameStats.money, gameStats.rank]);

  const createParticles = (x: number, y: number, emojis: string[]) => {
    const newParticles: Particle[] = Array.from({ length: 12 }).map((_, i) => ({
      id: `${Date.now()}-${i}`,
      x,
      y,
      emoji: emojis[Math.floor(Math.random() * emojis.length)],
      velocity: { x: (Math.random() - 0.5) * 12, y: -Math.random() * 18 - 5 }
    }));
    setParticles(prev => [...prev, ...newParticles]);
  };

  const handleCustomerClick = (customerId: string) => {
    const customer = customers.get(customerId);
    if (!customer || customer.state !== 'ordering' || activeStation) return;

    setCustomers(prev => {
      const newMap = new Map(prev);
      const c = newMap.get(customerId);
      if (c) {
        const newCustomer = { 
            ...c, 
            state: 'at_bar' as CustomerState,
            targetPosition: WORLD_COORDINATES.BAR_POSITION 
        };
        newMap.set(customerId, newCustomer);
      }
      return newMap;
    });

    setStations(prev => { const newMap = new Map(prev); const s = newMap.get('order'); if (s) { s.state = 'active'; s.currentCustomer = customerId; } return newMap; });
    setActiveStation('order');
  };

  const calculateScore = (text: string, order: CustomerOrder, patience: number, timeTaken: number): { overall: number; rubricScore: number; speedScore: number; wordCountScore: number; } => {
    let rubricTotal = 0;
    order.rubricItems.forEach(item => { rubricTotal += (findMatch(text, item.keywords).score / 100) * item.weight; });
    const rubricScore = rubricTotal * 100;
    const words = text.split(/\s+/).filter(Boolean);
    const wordDiff = Math.abs(words.length - order.wordCount);
    const wordCountScore = Math.max(0, 100 - (wordDiff / order.wordCount) * 50);
    const timeInSeconds = timeTaken / 1000;
    const speedScore = timeInSeconds > 90 ? Math.max(0, 100 - ((timeInSeconds - 90) / (360 - 90)) * 100) : 100;
    const baseScore = rubricScore * 0.60 + wordCountScore * 0.20 + speedScore * 0.20;
    return { overall: baseScore * (patience / 100), rubricScore, speedScore, wordCountScore };
  };

  const advanceStation = () => {
    if (!activeStation) return;
    const station = stations.get(activeStation);
    if (!station?.currentCustomer) return;
    const customer = customers.get(station.currentCustomer);
    if (!customer) return;

    const stationOrder: StationType[] = ['order', 'template', 'compose', 'finish'];
    const currentIndex = stationOrder.indexOf(activeStation);

    if (currentIndex < stationOrder.length - 1) {
      const nextStationType = stationOrder[currentIndex + 1];
      setStations(prev => {
        const newMap = new Map(prev);
        const current = newMap.get(activeStation);
        const next = newMap.get(nextStationType);
        if (current) { current.state = 'idle'; current.currentCustomer = null; }
        if (next) { next.state = 'active'; next.currentCustomer = customer.id; }
        return newMap;
      });
      setActiveStation(nextStationType);
    } else {
      const scores = calculateScore(customer.composition, customer.order!, customer.patience, Date.now() - customer.order!.timeOrdered);
      setCustomers(prev => { 
        const newMap = new Map(prev); 
        const c = newMap.get(customer.id); 
        if (c) { 
          const newCustomer = { ...c, satisfactionScore: scores.overall, rubricScore: scores.rubricScore, speedScore: scores.speedScore, wordCountScore: scores.wordCountScore };
          newMap.set(customer.id, newCustomer);
        } 
        return newMap; 
      });
      setStations(prev => { const newMap = new Map(prev); const s = newMap.get(activeStation); if (s) { s.state = 'idle'; s.currentCustomer = null; } return newMap; });
      setActiveStation(null);
      customerLeaves(customer.id, true);
    }
  };

  const startNextDay = () => {
    setShowDaySummary(false);
    setDayStartMoney(gameStats.money);
    setCustomers(new Map());
    setLobbyQueue([]);
    setGameStats(prev => ({ ...prev, day: prev.day + 1, ordersCompleted: 0, dailyOrders: [], perfectOrders: 0 }));
    spawnCustomer();
    spawnTimerRef.current = window.setInterval(spawnCustomer, 15000);
  };

  const activeCustomer = activeStation && stations.get(activeStation)?.currentCustomer ? customers.get(stations.get(activeStation)!.currentCustomer!) : null;

  return (
    <div className="w-full h-screen bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900 flex flex-col overflow-hidden relative font-sans">
      <style>{`
        @keyframes shake { 0%, 100% { transform: translateX(0) rotate(0deg); } 25% { transform: translateX(-8px) rotate(-3deg); } 75% { transform: translateX(8px) rotate(3deg); } }
        @keyframes wave { 0%, 100% { transform: rotate(0deg); } 25% { transform: rotate(-20deg); } 75% { transform: rotate(20deg); } }
        @keyframes tap { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-5px); } }
        @keyframes bounce { 0%, 100% { transform: translateY(0) scale(1); } 50% { transform: translateY(-10px) scale(1.05); } }
        @keyframes celebrate { 0%, 100% { transform: scale(1) rotate(0deg); } 25% { transform: scale(1.2) rotate(-10deg); } 75% { transform: scale(1.2) rotate(10deg); } }
        @keyframes pulse-glow { 0%, 100% { box-shadow: 0 0 20px rgba(6, 182, 212, 0.5); } 50% { box-shadow: 0 0 40px rgba(6, 182, 212, 0.8); } }
        @keyframes wiggle { 0%, 100% { transform: rotate(0deg); } 25% { transform: rotate(5deg); } 75% { transform: rotate(-5deg); } }
        @keyframes pop-in { 0% { transform: scale(0.5); opacity: 0; } 100% { transform: scale(1); opacity: 1; } }
        @keyframes score-popup { 0% { transform: translateY(0) scale(0.5) translateX(-50%); opacity: 0; } 20% { transform: translateY(-40px) scale(1.1) translateX(-50%); opacity: 1; } 80% { transform: translateY(-60px) scale(1) translateX(-50%); opacity: 1; } 100% { transform: translateY(-80px) scale(0.8) translateX(-50%); opacity: 0; } }
        .animate-shake { animation: shake 0.3s ease-in-out infinite; }
        .animate-wave { animation: wave 0.6s ease-in-out infinite; }
        .animate-tap { animation: tap 0.4s ease-in-out infinite; }
        .animate-bounce-slow { animation: bounce 1.5s ease-in-out infinite; }
        .animate-celebrate { animation: celebrate 0.5s ease-in-out infinite; }
        .animate-pulse-glow { animation: pulse-glow 1.5s ease-in-out infinite; }
        .animate-wiggle { animation: wiggle 0.3s ease-in-out infinite; }
        .animate-pop-in { animation: pop-in 0.3s ease-out forwards; }
        .animate-score-popup { animation: score-popup 2s ease-out forwards; }
      `}</style>

      {particles.map(p => <div key={p.id} className="fixed text-3xl pointer-events-none z-50 select-none" style={{ left: p.x, top: p.y }}>{p.emoji}</div>)}
      {scorePopups.map(p => <div key={p.id} className="absolute z-50 flex flex-col items-center pointer-events-none animate-score-popup" style={{ left: p.x, top: p.y }}><div className="text-6xl">{p.emoji}</div><div className="text-2xl font-black text-white bg-black/50 px-3 py-1 rounded-lg">{p.score.toFixed(0)}%</div></div>)}

      <div className="bg-gradient-to-r from-slate-800 via-slate-700 to-slate-800 p-2 md:p-4 flex justify-between items-center border-b-4 border-cyan-500 shadow-2xl z-20">
        <div className="flex gap-2 md:gap-4 items-center">
          <div className="bg-slate-900 px-3 md:px-5 py-2 rounded-lg shadow-lg border-2 border-cyan-800"><span className="text-cyan-400 font-bold text-sm md:text-lg">☀️ Day {gameStats.day}</span></div>
          <div className="bg-slate-900 px-3 md:px-5 py-2 rounded-lg shadow-lg border-2 border-green-800"><span className="text-green-400 font-bold text-sm md:text-lg">💰 ${gameStats.money}</span></div>
          <div className="bg-slate-900 p-2 rounded-lg shadow-lg border-2 border-yellow-800 md:w-48"><span className="text-yellow-400 font-bold text-sm md:text-lg block text-center truncate">{gameStats.rank}</span><div className="w-full h-2 bg-slate-700 rounded-full mt-1 overflow-hidden border border-slate-600"><div className="h-full bg-yellow-400 transition-all duration-500" style={{ width: `${gameStats.rankProgress}%` }}></div></div></div>
        </div>
        <div className="flex gap-2 md:gap-4">
          {gameStats.streak > 0 && <div className="bg-gradient-to-r from-orange-600 to-red-600 px-3 md:px-5 py-2 rounded-lg shadow-lg animate-pulse-glow"><span className="text-white font-bold text-sm md:text-lg">🔥 {gameStats.streak}x</span></div>}
          <div className="bg-slate-900 px-3 md:px-5 py-2 rounded-lg shadow-lg border-2 border-green-800"><span className="text-green-300 font-bold text-sm md:text-lg">📋 {gameStats.ordersCompleted}/{CUSTOMERS_PER_DAY}</span></div>
          <div className="bg-slate-900 px-3 md:px-5 py-2 rounded-lg shadow-lg border-2 border-purple-800"><span className="text-purple-400 font-bold text-sm md:text-lg">✨ {gameStats.perfectOrders}</span></div>
        </div>
      </div>
      
      <GameWorld ref={worldRef} customers={customers} onCustomerClick={handleCustomerClick} />

      {showDaySummary && (() => {
          const nextDay = gameStats.day + 1;
          const nextWaveIndex = (nextDay - 1) % Object.keys(WAVE_SCHEDULE).length;
          const nextWaveInfo = WAVE_SCHEDULE[nextWaveIndex + 1];
          return (
            <div className="absolute inset-0 bg-black/95 flex items-center justify-center z-50 animate-pop-in">
              <div className="bg-gradient-to-br from-slate-800 via-slate-900 to-slate-800 rounded-3xl p-6 md:p-10 max-w-4xl w-[95%] border-4 border-cyan-500 shadow-2xl max-h-[90vh] overflow-y-auto">
                <h1 className="text-4xl md:text-6xl font-black text-center mb-4 bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent">Day {gameStats.day} Complete!</h1>
                <p className="text-xl md:text-2xl text-center text-slate-300 mb-8">Time to count your earnings!</p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                  <div className="bg-slate-900 p-6 rounded-xl border-2 border-cyan-800"><p className="text-slate-400 text-lg mb-2">💰 Money Earned Today</p><p className="text-3xl md:text-5xl font-black text-green-400">${gameStats.money - dayStartMoney}</p></div>
                  <div className="bg-slate-900 p-6 rounded-xl border-2 border-purple-800"><p className="text-slate-400 text-lg mb-2">✨ Perfect Orders</p><p className="text-3xl md:text-5xl font-black text-purple-400">{gameStats.perfectOrders}</p></div>
                </div>
                <div className="bg-slate-900 p-6 rounded-xl border-2 border-slate-700 mb-8"><h3 className="text-2xl font-bold text-cyan-400 mb-4">📊 Order Breakdown</h3><div className="space-y-3">{gameStats.dailyOrders.map((order, idx) => (<div key={idx} className="flex justify-between items-center bg-slate-800 p-4 rounded-lg"><div><span className="font-bold text-white">{order.customer}</span><div className="text-sm text-slate-400">Score: {order.score.toFixed(1)}%</div></div><div className="text-right"><div className="text-xl md:text-2xl font-black text-green-400">+${order.tip + 50}</div><div className="text-xs text-slate-400">Base $50 + ${order.tip} tip</div></div></div>))}</div></div>
                <div className="bg-slate-900/50 p-4 rounded-lg mt-6 text-center border-2 border-slate-700"><p className="text-slate-400 text-lg mb-1">Up Next on Day {nextDay}:</p><p className="text-xl font-bold text-cyan-300">{nextWaveInfo.message}</p></div>
                <button onClick={startNextDay} className="w-full mt-8 py-4 md:py-6 bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-black text-2xl md:text-3xl rounded-xl hover:from-cyan-400 hover:to-blue-500 transition-all transform hover:scale-105 shadow-2xl animate-pulse-glow">Start Day {gameStats.day + 1} 🚀</button>
              </div>
            </div>
          )
      })()}

      {activeStation && activeCustomer && (
        <div className="absolute inset-0 bg-black/90 flex items-center justify-center p-4 z-40 animate-pop-in">
          <div className="bg-gradient-to-br from-slate-800 via-slate-900 to-slate-800 rounded-2xl p-4 md:p-8 max-w-4xl w-full border-4 border-cyan-500 shadow-2xl max-h-[90vh] overflow-y-auto animate-pulse-glow flex flex-col">
            <div className="flex items-center gap-4 md:gap-6 mb-6"><span className="text-5xl md:text-7xl animate-bounce-slow">{activeCustomer.avatar}</span><div className="flex-1"><h2 className="text-2xl md:text-4xl font-black text-cyan-400 mb-1">{activeCustomer.name}</h2><p className="text-md md:text-lg text-slate-400 mb-3">{activeCustomer.title}</p><p className="text-slate-300 text-sm md:text-lg italic">"{activeCustomer.order?.description}"</p></div></div>
            <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 p-4 md:p-6 rounded-xl mb-6 border-2 border-cyan-800 shadow-xl"><div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4"><div className="bg-yellow-900/50 px-4 py-3 rounded-lg"><p className="text-yellow-300 font-bold">🎭 Tone</p><p className="text-white text-sm">{activeCustomer.order?.tone}</p></div><div className="bg-yellow-900/50 px-4 py-3 rounded-lg"><p className="text-yellow-300 font-bold">📄 Format</p><p className="text-white text-sm">{activeCustomer.order?.format}</p></div><div className="bg-yellow-900/50 px-4 py-3 rounded-lg"><p className="text-yellow-300 font-bold">📝 Words</p><p className="text-white text-sm">~{activeCustomer.order?.wordCount}</p></div></div><details className="bg-slate-950 p-4 rounded-lg cursor-pointer"><summary className="text-cyan-400 font-bold">🎯 Prompting Keys</summary><div className="space-y-2 mt-2">{activeCustomer.order?.rubricItems.map((item, i) => (<div key={i} className="bg-slate-800 p-3 rounded-lg"><p className="text-white font-bold">{item.concept}</p><p className="text-slate-400 text-sm">{item.description}</p><p className="text-cyan-300 text-xs mt-1">💡 {item.tip}</p></div>))}</div></details></div>
            {activeStation === 'template' && (<div className="grid grid-cols-3 gap-4 md:gap-6 mb-6">{[50, 150, 300].map((count, idx) => (<button key={count} onClick={() => { setCustomers(prev => { const newMap = new Map(prev); const c = newMap.get(activeCustomer.id); if (c) { const newC = {...c, selectedWordCount: count }; newMap.set(activeCustomer.id, newC); } return newMap; }); }} style={{ animationDelay: `${idx * 0.1}s` }} className={`p-4 md:p-8 rounded-2xl font-black text-lg md:text-xl transition-all transform hover:scale-110 shadow-xl border-4 animate-pop-in ${ activeCustomer.selectedWordCount === count ? 'bg-gradient-to-br from-cyan-400 to-cyan-600 text-slate-900 scale-105 border-cyan-300 animate-pulse-glow' : 'bg-gradient-to-br from-slate-700 to-slate-800 text-slate-300 hover:from-slate-600 border-slate-600' }`} ><div className="text-3xl md:text-4xl mb-3">{count === 50 ? '🔹' : count === 150 ? '🔸' : '🔶'}</div><div>~{count} words</div></button>))}</div>)}
            {(activeStation === 'compose' || activeStation === 'finish') && (<div className="mb-6 flex-1 flex flex-col"><textarea value={activeCustomer.composition} onChange={(e) => { setCustomers(prev => { const newMap = new Map(prev); const c = newMap.get(activeCustomer.id); if (c) { const newC = {...c, composition: e.target.value }; newMap.set(activeCustomer.id, newC); } return newMap; }); }} className="w-full flex-1 p-4 md:p-6 bg-slate-950 border-4 border-slate-700 rounded-xl text-lg md:text-xl font-mono resize-none focus:outline-none focus:border-cyan-500 focus:shadow-cyan-500/50 focus:shadow-xl transition-all shadow-inner" placeholder="✨ Craft your perfect prompt here..."/><div className="flex justify-between items-center mt-3"><span className="text-slate-400 text-md md:text-lg font-bold">Words: {activeCustomer.composition.split(/\s+/).filter(Boolean).length} / ~{activeCustomer.selectedWordCount}</span> {activeCustomer.composition.split(/\s+/).filter(Boolean).length >= activeCustomer.selectedWordCount * 0.8 && (<span className="text-green-400 font-bold text-md md:text-lg animate-pulse">✓ Looking good!</span>)} </div></div>)}
            <div className="mb-6"><div className="flex justify-between text-lg mb-3"> <span className="text-slate-300 font-black flex items-center gap-2"> ⏱️ Customer Patience {activeCustomer.patience < 30 && <span className="animate-pulse text-red-400">⚠️ HURRY!</span>} </span> <span className={`font-black text-xl ${activeCustomer.patience > 70 ? 'text-green-400' : activeCustomer.patience > 40 ? 'text-yellow-400' : activeCustomer.patience > 20 ? 'text-orange-400' : 'text-red-400 animate-pulse'}`}> {Math.round(activeCustomer.patience)}% </span> </div><div className="w-full h-6 bg-slate-950 rounded-full overflow-hidden border-4 border-slate-800 shadow-inner"><div className={`h-full transition-all duration-300 ${activeCustomer.patience > 70 ? 'bg-gradient-to-r from-green-400 to-green-500' : activeCustomer.patience > 40 ? 'bg-gradient-to-r from-yellow-400 to-yellow-500' : activeCustomer.patience > 20 ? 'bg-gradient-to-r from-orange-400 to-orange-500' : 'bg-gradient-to-r from-red-500 to-red-600 animate-pulse'}`} style={{ width: `${activeCustomer.patience}%` }} /></div></div>
            <div className="flex gap-4 md:gap-6"><button onClick={() => { setActiveStation(null); setStations(prev => { const newMap = new Map(prev); newMap.forEach(s => { if (s.currentCustomer === activeCustomer.id) { s.currentCustomer = null; s.state = 'idle'; } }); return newMap; }); setCustomers(prev => { const newMap = new Map(prev); const c = newMap.get(activeCustomer.id); if (c) { const targetSpot = WORLD_COORDINATES.QUEUE_SPOTS[c.queueIndex] || WORLD_COORDINATES.QUEUE_SPOTS[0]; const newC = {...c, state: 'ordering' as CustomerState, targetPosition: targetSpot}; newMap.set(activeCustomer.id, newC); } return newMap; }); }} className="px-6 md:px-10 py-3 md:py-5 bg-gradient-to-r from-slate-700 to-slate-800 text-white font-black text-lg md:text-xl rounded-xl hover:from-slate-600 hover:to-slate-700 transition-all transform hover:scale-105 shadow-xl border-4 border-slate-600"> ❌ Cancel </button><button onClick={advanceStation} disabled={activeStation === 'compose' && !activeCustomer.composition.trim()} className="flex-1 px-6 md:px-10 py-3 md:py-5 bg-gradient-to-r from-cyan-500 via-cyan-600 to-blue-600 text-white font-black text-xl md:text-2xl rounded-xl hover:from-cyan-400 hover:via-cyan-500 hover:to-blue-500 transition-all transform hover:scale-105 shadow-2xl disabled:from-slate-700 disabled:to-slate-800 disabled:cursor-not-allowed border-4 border-cyan-400 disabled:border-slate-600 disabled:shadow-none disabled:animate-none"> {activeStation === 'finish' ? '🎉 Complete Order!' : '➡️ Next Station'} </button></div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PromptBarGame;
