import React, { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import confetti from 'canvas-confetti';
import { RoomState, GameHistory, Player } from '../types';

interface FinalSummaryBoardProps {
  room: RoomState;
  historyRecord: GameHistory | null;
  isHost: boolean;
  onRematch: () => void;
  onReturnHome: () => void;
}

export const FinalSummaryBoard: React.FC<FinalSummaryBoardProps> = ({
  room,
  historyRecord,
  isHost,
  onRematch,
  onReturnHome
}) => {
  const { roomCode, players, settings } = room;
  const [copied, setCopied] = useState(false);

  // Trigger celebratory confetti burst on mount!
  useEffect(() => {
    const duration = 4 * 1000;
    const animationEnd = Date.now() + duration;
    const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 1000 };

    function randomInRange(min: number, max: number) {
      return Math.random() * (max - min) + min;
    }

    const interval: any = setInterval(function() {
      const timeLeft = animationEnd - Date.now();

      if (timeLeft <= 0) {
        return clearInterval(interval);
      }

      const particleCount = 50 * (timeLeft / duration);
      // Confetti burst from left and right corners
      confetti({ ...defaults, particleCount, origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 } });
      confetti({ ...defaults, particleCount, origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 } });
    }, 250);

    return () => clearInterval(interval);
  }, []);

  // Sort players by final standing
  const sortedPlayers = [...players].sort((a, b) => b.score - a.score);
  const firstPlace = sortedPlayers[0];
  const secondPlace = sortedPlayers[1];
  const thirdPlace = sortedPlayers[2];

  // Determine Overall Game Winner text (takes Teams into account)
  let overallWinner = '';
  let overallWinnerAvatar = '🏆';
  let overallWinnerSubtitle = '';

  if (settings.gameMode === 'TEAMS') {
    const redScore = players.filter(p => p.team === 'RED').reduce((s, p) => s + p.score, 0);
    const blueScore = players.filter(p => p.team === 'BLUE').reduce((s, p) => s + p.score, 0);
    
    if (blueScore > redScore) {
      overallWinner = 'TEAM BLUE';
      overallWinnerAvatar = '🔵';
      overallWinnerSubtitle = `Triumph with ${blueScore} pts vs Team Red's ${redScore} pts!`;
    } else if (redScore > blueScore) {
      overallWinner = 'TEAM RED';
      overallWinnerAvatar = '🔴';
      overallWinnerSubtitle = `Triumph with ${redScore} pts vs Team Blue's ${blueScore} pts!`;
    } else {
      overallWinner = 'DRAW / TIE';
      overallWinnerAvatar = '⚖️';
      overallWinnerSubtitle = `Both teams tied perfectly at ${redScore} pts!`;
    }
  } else if (firstPlace) {
    overallWinner = firstPlace.nickname;
    overallWinnerAvatar = firstPlace.avatar;
    overallWinnerSubtitle = `Triumph with a grand total of ${firstPlace.score} points!`;
  }

  // Handle results sharing
  const handleCopyResults = () => {
    let resultText = `🏆 TUG OF WAR QUIZ CHAMPIONS 🏆\n`;
    resultText += `Room Code: ${roomCode} | Mode: ${settings.gameMode} | Difficulty: ${settings.difficulty}\n\n`;
    resultText += `👑 WINNER: ${overallWinner} ${overallWinnerAvatar}\n`;
    if (overallWinnerSubtitle) resultText += `${overallWinnerSubtitle}\n\n`;

    resultText += `📊 LEADERBOARD STANDINGS:\n`;
    sortedPlayers.forEach((p, idx) => {
      const avgRt = p.responseTimes.length > 0 
        ? Math.round(p.responseTimes.reduce((s, x) => s + x, 0) / p.responseTimes.length) / 1000 
        : 0;
      resultText += `${idx + 1}. ${p.avatar} ${p.nickname} - ${p.score} pts (${p.correctAnswers} Correct, Avg Time: ${avgRt}s)\n`;
    });
    
    resultText += `\nThink Fast. Answer Right. Pull Hard. Play Tug of War now!`;

    navigator.clipboard.writeText(resultText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-8">
      {/* 1. Grand Winner Header Banner */}
      <div className="bg-gradient-to-r from-yellow-950/40 via-amber-950/60 to-yellow-950/40 border-2 border-yellow-500/40 rounded-2xl p-6 text-center shadow-xl relative overflow-hidden">
        {/* Animated Background Rays */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-yellow-500/10 via-transparent to-transparent animate-pulse" />

        <h1 className="text-sm font-extrabold uppercase font-mono tracking-widest text-yellow-500 mb-2">
          🎉 VICTORY SPELL CHAMPIONS 🎉
        </h1>
        
        <div className="relative inline-block my-3">
          <span className="text-6xl filter drop-shadow-[0_4px_10px_rgba(234,179,8,0.4)] animate-bounce inline-block">
            {overallWinnerAvatar}
          </span>
          <span className="absolute -top-2 -right-2 text-2xl rotate-12">👑</span>
        </div>

        <h2 className="text-2xl md:text-3xl font-black text-white font-sans tracking-tight uppercase">
          {overallWinner}
        </h2>
        <p className="text-zinc-400 font-medium text-xs md:text-sm mt-1 max-w-md mx-auto">
          {overallWinnerSubtitle}
        </p>
      </div>

      {/* 2. 3D Pedestal / Podium Layout for Individual FFA standings */}
      {settings.gameMode !== 'TEAMS' && sortedPlayers.length >= 2 && (
        <div className="flex justify-center items-end gap-2 md:gap-4 pt-10 pb-4">
          
          {/* Second Place Podium */}
          {secondPlace && (
            <motion.div 
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="flex flex-col items-center w-24 md:w-28"
            >
              <span className="text-3xl mb-1">{secondPlace.avatar}</span>
              <span className="text-xs font-bold text-zinc-300 font-sans truncate max-w-full text-center px-1 mb-1">
                {secondPlace.nickname}
              </span>
              <span className="text-[10px] font-mono text-zinc-500 mb-2">{secondPlace.score} pts</span>
              
              {/* Podium Column */}
              <div className="w-full h-20 bg-gradient-to-t from-zinc-800 to-zinc-700 border-x-2 border-t-2 border-zinc-600 rounded-t-lg flex items-center justify-center shadow-md">
                <span className="font-mono font-black text-2xl text-zinc-400">2</span>
              </div>
            </motion.div>
          )}

          {/* First Place Podium (Center/Highest) */}
          {firstPlace && (
            <motion.div 
              initial={{ opacity: 0, y: 70 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex flex-col items-center w-28 md:w-32"
            >
              <div className="relative mb-1">
                <span className="text-4xl">{firstPlace.avatar}</span>
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 text-lg">👑</span>
              </div>
              <span className="text-sm font-black text-yellow-500 font-sans truncate max-w-full text-center px-1 mb-1">
                {firstPlace.nickname}
              </span>
              <span className="text-xs font-mono text-amber-500 font-bold mb-2">{firstPlace.score} pts</span>
              
              {/* Podium Column */}
              <div className="w-full h-28 bg-gradient-to-t from-amber-600 to-amber-500 border-x-2 border-t-2 border-amber-400 rounded-t-lg flex items-center justify-center shadow-lg relative">
                <span className="font-mono font-black text-4xl text-yellow-250 drop-shadow">1</span>
                {/* Gold sparkle overlay */}
                <div className="absolute inset-0 bg-yellow-400/10 rounded-t-lg pointer-events-none" />
              </div>
            </motion.div>
          )}

          {/* Third Place Podium */}
          {thirdPlace && (
            <motion.div 
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="flex flex-col items-center w-24 md:w-28"
            >
              <span className="text-3xl mb-1">{thirdPlace.avatar}</span>
              <span className="text-xs font-bold text-zinc-400 font-sans truncate max-w-full text-center px-1 mb-1">
                {thirdPlace.nickname}
              </span>
              <span className="text-[10px] font-mono text-zinc-500 mb-2">{thirdPlace.score} pts</span>
              
              {/* Podium Column */}
              <div className="w-full h-14 bg-gradient-to-t from-amber-900 to-amber-800 border-x-2 border-t-2 border-amber-750 rounded-t-lg flex items-center justify-center shadow">
                <span className="font-mono font-black text-xl text-amber-600">3</span>
              </div>
            </motion.div>
          )}

        </div>
      )}

      {/* 3. Detailed Statistics Table */}
      <div className="bg-zinc-900/40 border border-zinc-800 rounded-2xl overflow-hidden shadow-xl">
        <div className="bg-zinc-950 p-4 border-b border-zinc-800">
          <h3 className="text-xs font-bold uppercase font-mono tracking-wider text-zinc-400">
            📝 Detailed Match Statistics
          </h3>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse font-mono text-xs text-zinc-300">
            <thead>
              <tr className="bg-zinc-950/40 border-b border-zinc-850 text-zinc-500 text-[10px] uppercase font-bold">
                <th className="py-3 px-4">Rank</th>
                <th className="py-3 px-4">Player</th>
                {settings.gameMode === 'TEAMS' && <th className="py-3 px-4">Team</th>}
                <th className="py-3 px-4 text-center">Score</th>
                <th className="py-3 px-4 text-center">Accuracy</th>
                <th className="py-3 px-4 text-center">Streak</th>
                <th className="py-3 px-4 text-center">Avg Response</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-850/60">
              {sortedPlayers.map((p, idx) => {
                const totalAns = p.correctAnswers + p.wrongAnswers;
                const accuracy = totalAns > 0 ? Math.round((p.correctAnswers / totalAns) * 100) : 0;
                const avgRt = p.responseTimes.length > 0 
                  ? (p.responseTimes.reduce((s, x) => s + x, 0) / p.responseTimes.length / 1000).toFixed(2) 
                  : '0.00';

                return (
                  <tr key={p.id} className="hover:bg-zinc-900/20 transition-colors">
                    <td className="py-3.5 px-4 font-black">{idx + 1}</td>
                    <td className="py-3.5 px-4 flex items-center gap-2">
                      <span className="text-lg">{p.avatar}</span>
                      <span className="font-sans font-bold text-white">{p.nickname}</span>
                    </td>
                    {settings.gameMode === 'TEAMS' && (
                      <td className="py-3.5 px-4">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          p.team === 'RED' ? 'bg-red-950/60 text-red-400 border border-red-900/50' : 'bg-blue-950/60 text-blue-400 border border-blue-900/50'
                        }`}>
                          {p.team === 'RED' ? '🔴 RED' : '🔵 BLUE'}
                        </span>
                      </td>
                    )}
                    <td className="py-3.5 px-4 text-center text-amber-500 font-bold">{p.score}</td>
                    <td className="py-3.5 px-4 text-center">
                      <div className="flex flex-col items-center">
                        <span className="font-bold">{accuracy}%</span>
                        <span className="text-[9px] text-zinc-500 font-mono">
                          ({p.correctAnswers}/{totalAns || 0})
                        </span>
                      </div>
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <span className="text-orange-500 font-bold">🔥 {p.bestStreak} max</span>
                    </td>
                    <td className="py-3.5 px-4 text-center text-zinc-400">{avgRt}s</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* 4. Action Control Buttons Panel */}
      <div className="flex flex-col sm:flex-row gap-3 pt-4 justify-center">
        {isHost ? (
          <button
            type="button"
            onClick={onRematch}
            className="flex-1 max-w-xs py-3.5 px-6 rounded-xl bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 text-zinc-950 font-black font-mono shadow-lg transition-all duration-150 text-center uppercase tracking-wider scale-[1.02] hover:scale-[1.04]"
          >
            🔄 Request Rematch
          </button>
        ) : (
          <div className="flex-1 max-w-xs py-3.5 px-6 rounded-xl bg-zinc-950 border border-zinc-850 text-zinc-400 font-mono text-center flex items-center justify-center gap-2">
            <span className="inline-block animate-spin">⏳</span>
            Waiting for Host Rematch...
          </div>
        )}

        <button
          type="button"
          onClick={handleCopyResults}
          className="py-3.5 px-6 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-300 hover:bg-zinc-850 font-bold font-mono transition-all duration-150 text-center uppercase tracking-wide flex items-center justify-center gap-2"
        >
          {copied ? '✓ Results Copied!' : '📋 Share / Copy Results'}
        </button>

        <button
          type="button"
          onClick={onReturnHome}
          className="py-3.5 px-6 rounded-xl bg-zinc-950 border border-zinc-900 text-zinc-500 hover:text-zinc-300 font-medium font-mono transition-all duration-150 text-center uppercase tracking-wide"
        >
          🚪 Return Home
        </button>
      </div>
    </div>
  );
};
