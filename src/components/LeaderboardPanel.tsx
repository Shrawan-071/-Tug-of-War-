import React from 'react';
import { RoomState, Player } from '../types';

interface LeaderboardPanelProps {
  room: RoomState;
}

export const LeaderboardPanel: React.FC<LeaderboardPanelProps> = ({ room }) => {
  const { players, hostPlayerId, settings } = room;

  // Sort players authoritatively:
  // 1. Highest score
  // 2. Most correct answers
  // 3. Lowest average response time
  const sortedPlayers = [...players].sort((a, b) => {
    if (b.score !== a.score) {
      return b.score - a.score;
    }
    if (b.correctAnswers !== a.correctAnswers) {
      return b.correctAnswers - a.correctAnswers;
    }
    const avgA = a.responseTimes.length > 0 
      ? a.responseTimes.reduce((sum, x) => sum + x, 0) / a.responseTimes.length 
      : Infinity;
    const avgB = b.responseTimes.length > 0 
      ? b.responseTimes.reduce((sum, x) => sum + x, 0) / b.responseTimes.length 
      : Infinity;
    return avgA - avgB;
  });

  return (
    <div className="bg-zinc-900/40 border border-zinc-800 rounded-2xl p-4 md:p-5 shadow-xl space-y-4">
      <div className="flex items-center justify-between border-b border-zinc-850 pb-2.5">
        <h3 className="text-xs font-bold uppercase font-mono tracking-widest text-zinc-400 flex items-center gap-1.5">
          📊 Live Scoreboard ({players.length})
        </h3>
        {settings.gameMode === 'TEAMS' && (
          <div className="flex gap-2 text-[10px] font-mono font-black">
            <span className="text-red-400">RED: {players.filter(p => p.team === 'RED').reduce((s, x) => s + x.score, 0)}</span>
            <span className="text-blue-400">BLUE: {players.filter(p => p.team === 'BLUE').reduce((s, x) => s + x.score, 0)}</span>
          </div>
        )}
      </div>

      <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
        {sortedPlayers.map((player, idx) => {
          const isHost = player.id === hostPlayerId;
          const isOffline = !player.connected;
          const rank = idx + 1;

          // Rank background color accents
          let rankColor = 'bg-zinc-800 text-zinc-400 border-zinc-700';
          if (rank === 1) rankColor = 'bg-yellow-500/15 text-yellow-500 border-yellow-550';
          else if (rank === 2) rankColor = 'bg-zinc-300/15 text-zinc-300 border-zinc-400';
          else if (rank === 3) rankColor = 'bg-amber-700/15 text-amber-500 border-amber-800';

          return (
            <div
              key={player.id}
              className={`flex items-center justify-between p-2.5 rounded-xl border transition-all duration-200 ${
                isOffline 
                  ? 'bg-zinc-950/20 border-zinc-900/40 opacity-40' 
                  : 'bg-zinc-950 border-zinc-850/60 hover:bg-zinc-900/50'
              }`}
            >
              <div className="flex items-center gap-2.5">
                {/* Rank Badge */}
                <div className={`w-5.5 h-5.5 rounded-md flex items-center justify-center font-mono font-black text-xs border ${rankColor}`}>
                  {rank}
                </div>

                {/* Avatar with optional sleeping mask or team indicator */}
                <div className="relative">
                  <span className="text-2xl select-none">{player.avatar}</span>
                  {settings.gameMode === 'TEAMS' && (
                    <span className={`absolute -bottom-1 -right-1 w-3.5 h-3.5 rounded-full border border-zinc-950 flex items-center justify-center text-[7px] font-black text-white ${
                      player.team === 'RED' ? 'bg-red-600' : 'bg-blue-600'
                    }`}>
                      {player.team === 'RED' ? 'R' : 'B'}
                    </span>
                  )}
                  {isOffline && (
                    <span className="absolute -top-1 -right-1 text-[10px]">💤</span>
                  )}
                </div>

                {/* Profile detail */}
                <div className="flex flex-col">
                  <span className="text-xs font-bold text-white font-sans flex items-center gap-1">
                    {player.nickname}
                    {isHost && <span title="Game Host">👑</span>}
                  </span>
                  
                  {/* Streak and accuracy markers */}
                  <div className="flex items-center gap-1.5 text-[9px] font-mono text-zinc-500">
                    {player.currentStreak >= 2 && (
                      <span className="text-orange-500 font-bold uppercase animate-pulse">
                        🔥 {player.currentStreak} Streak
                      </span>
                    )}
                    <span>
                      ✓ {player.correctAnswers} / ✗ {player.wrongAnswers}
                    </span>
                  </div>
                </div>
              </div>

              {/* Score display */}
              <div className="text-right">
                <span className="text-xs font-black text-amber-500 font-mono block">
                  {player.score}
                </span>
                <span className="text-[8px] font-mono text-zinc-500 uppercase tracking-wider block">
                  POINTS
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
