import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { RoomState, Player } from '../types';
import { audio } from '../services/audio';

interface TugOfWarArenaProps {
  room: RoomState;
  pullAmount?: number; // Last round pull amount to play SFX and flash animations
}

export const TugOfWarArena: React.FC<TugOfWarArenaProps> = ({ room, pullAmount = 0 }) => {
  const { ropePosition, settings, players } = room;
  const [lastPull, setLastPull] = useState(0);

  // Play a dynamic sound effect when the rope position shifts!
  useEffect(() => {
    if (pullAmount !== 0 && pullAmount !== lastPull) {
      audio.playRopePull();
      setLastPull(pullAmount);
    }
  }, [ropePosition, pullAmount, lastPull]);

  // Group players by Red / Blue sides
  let leftPlayers: Player[] = [];
  let rightPlayers: Player[] = [];

  if (settings.gameMode === 'TEAMS') {
    leftPlayers = players.filter(p => p.team === 'RED');
    rightPlayers = players.filter(p => p.team === 'BLUE');
  } else if (settings.gameMode === 'DUEL' && players.length >= 2) {
    leftPlayers = [players[0]];
    rightPlayers = [players[1]];
  } else {
    // Individual FFA mode: Put top 1 on the right, top 2 on the left, others wait as cheering audience
    const sorted = [...players].sort((a, b) => b.score - a.score);
    if (sorted.length >= 2) {
      leftPlayers = [sorted[1]];
      rightPlayers = [sorted[0]];
    } else if (sorted.length === 1) {
      leftPlayers = [];
      rightPlayers = [sorted[0]];
    }
  }

  // Calculate percentage offset for the center flag on the screen
  // ropePosition ranges from -100 to +100
  // Convert -100 -> 10% and +100 -> 90%, center (0) -> 50%
  const flagPercentage = 50 + (ropePosition * 0.4);

  return (
    <div className="relative w-full h-56 bg-gradient-to-b from-amber-900 to-amber-950 rounded-2xl overflow-hidden border-4 border-amber-800 shadow-2xl p-4">
      {/* Field markings (Center Line and Danger Zones) */}
      <div className="absolute inset-y-0 left-0 w-[12%] bg-red-950/40 border-r-2 border-red-800/40 flex items-center justify-center">
        <span className="text-[10px] text-red-600 font-mono tracking-widest uppercase rotate-90 whitespace-nowrap">RED MUD PIT</span>
      </div>
      <div className="absolute inset-y-0 right-0 w-[12%] bg-blue-950/40 border-l-2 border-blue-800/40 flex items-center justify-center">
        <span className="text-[10px] text-blue-600 font-mono tracking-widest uppercase -rotate-90 whitespace-nowrap">BLUE MUD PIT</span>
      </div>
      
      {/* Middle White Chalk Line */}
      <div className="absolute inset-y-0 left-1/2 w-1 bg-white/20 -translate-x-1/2 z-0" />

      {/* Arena Title / Tug Advantage bar */}
      <div className="absolute top-2 left-1/2 -translate-x-1/2 bg-black/60 backdrop-blur-md px-3 py-1 rounded-full text-[10px] md:text-xs text-white/90 font-mono z-10 flex items-center gap-2 border border-white/10">
        <span className="text-red-400 font-bold">RED</span>
        <div className="w-24 bg-zinc-800 h-2 rounded-full overflow-hidden flex">
          <div 
            className="h-full bg-gradient-to-r from-red-500 to-blue-500 transition-all duration-700 ease-out"
            style={{ width: `${50 + (ropePosition / 2)}%` }}
          />
        </div>
        <span className="text-blue-400 font-bold">BLUE</span>
      </div>

      {/* Core Tug of War Rope */}
      <motion.div 
        className="absolute inset-x-0 top-1/2 h-3.5 bg-amber-200 border-y border-amber-600 shadow-lg z-10 origin-center"
        animate={{
          y: pullAmount !== 0 ? [-3, 3, -1, 1, 0] : 0
        }}
        transition={{ duration: 0.5 }}
        style={{
          backgroundImage: 'repeating-linear-gradient(45deg, transparent, transparent 10px, #d97706 10px, #d97706 20px)'
        }}
      />

      {/* Red Center Flag on Rope */}
      <motion.div 
        className="absolute top-[44%] w-6 h-10 -ml-3 z-20 flex flex-col items-center"
        animate={{ left: `${flagPercentage}%` }}
        transition={{ type: 'spring', stiffness: 80, damping: 15 }}
      >
        <div className="w-1.5 h-full bg-yellow-500 rounded-full" />
        <div className="absolute top-0 left-1 w-5 h-4 bg-red-600 border border-red-500 rounded-sm" />
      </motion.div>

      {/* LEFT SIDE (RED) PULLERS */}
      <div className="absolute inset-y-0 left-0 right-1/2 z-20 flex items-center justify-end pr-12 md:pr-24 overflow-hidden">
        <div className="flex gap-4 items-end">
          <AnimatePresence>
            {leftPlayers.map((player, idx) => {
              const isDisconnected = !player.connected;
              return (
                <motion.div
                  key={player.id}
                  layoutId={`avatar-${player.id}`}
                  initial={{ opacity: 0, x: -100 }}
                  animate={{ 
                    opacity: isDisconnected ? 0.4 : 1, 
                    x: 0,
                    y: pullAmount < 0 ? [5, -5, 2, -2, 0] : [0, -2, 0]
                  }}
                  exit={{ opacity: 0, x: -100 }}
                  transition={{ duration: 0.5 }}
                  className="flex flex-col items-center select-none"
                >
                  <span className="text-xs font-bold text-red-400 font-mono drop-shadow bg-black/50 px-1.5 py-0.5 rounded">
                    {player.nickname.slice(0, 8)}
                  </span>
                  
                  {/* Puller Character */}
                  <motion.div 
                    className="relative text-3xl md:text-4xl filter drop-shadow-md my-1"
                    animate={{ 
                      rotate: pullAmount < 0 ? [-15, -25, -15] : [-15, -10, -15],
                      scale: isDisconnected ? 0.9 : [1, 1.05, 1]
                    }}
                    transition={{ repeat: Infinity, duration: 1.5 }}
                  >
                    {player.avatar}
                    {isDisconnected && (
                      <span className="absolute -top-1 -right-1 text-xs">💤</span>
                    )}
                  </motion.div>

                  <span className="text-[10px] text-zinc-300 bg-zinc-900/70 px-1 rounded font-mono">
                    {player.score} pts
                  </span>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      </div>

      {/* RIGHT SIDE (BLUE) PULLERS */}
      <div className="absolute inset-y-0 left-1/2 right-0 z-20 flex items-center justify-start pl-12 md:pl-24 overflow-hidden">
        <div className="flex gap-4 items-end">
          <AnimatePresence>
            {rightPlayers.map((player, idx) => {
              const isDisconnected = !player.connected;
              return (
                <motion.div
                  key={player.id}
                  layoutId={`avatar-${player.id}`}
                  initial={{ opacity: 0, x: 100 }}
                  animate={{ 
                    opacity: isDisconnected ? 0.4 : 1, 
                    x: 0,
                    y: pullAmount > 0 ? [5, -5, 2, -2, 0] : [0, -2, 0]
                  }}
                  exit={{ opacity: 0, x: 100 }}
                  transition={{ duration: 0.5 }}
                  className="flex flex-col items-center select-none"
                >
                  <span className="text-xs font-bold text-blue-400 font-mono drop-shadow bg-black/50 px-1.5 py-0.5 rounded">
                    {player.nickname.slice(0, 8)}
                  </span>

                  {/* Puller Character */}
                  <motion.div 
                    className="relative text-3xl md:text-4xl filter drop-shadow-md my-1"
                    animate={{ 
                      rotate: pullAmount > 0 ? [15, 25, 15] : [15, 10, 15],
                      scale: isDisconnected ? 0.9 : [1, 1.05, 1]
                    }}
                    transition={{ repeat: Infinity, duration: 1.5 }}
                  >
                    {player.avatar}
                    {isDisconnected && (
                      <span className="absolute -top-1 -right-1 text-xs">💤</span>
                    )}
                  </motion.div>

                  <span className="text-[10px] text-zinc-300 bg-zinc-900/70 px-1 rounded font-mono">
                    {player.score} pts
                  </span>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      </div>

      {/* Visual Pull Impact Flares */}
      <AnimatePresence>
        {pullAmount !== 0 && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 0.7, scale: 1.1 }}
            exit={{ opacity: 0 }}
            className={`absolute top-1/2 left-1/2 -translate-y-1/2 -translate-x-1/2 text-2xl font-black font-mono select-none pointer-events-none z-30 px-4 py-1 rounded-full shadow-lg ${
              pullAmount > 0 ? 'bg-blue-600 text-white' : 'bg-red-600 text-white'
            }`}
            style={{ left: `${flagPercentage}%` }}
          >
            {pullAmount > 0 ? 'BLUE PULL! ➔' : '片 RED PULL!'}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
