import React, { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { RoomState, RoundResultData } from '../types';
import { audio } from '../services/audio';

interface RoundResultBoardProps {
  room: RoomState;
  results: RoundResultData;
}

export const RoundResultBoard: React.FC<RoundResultBoardProps> = ({ room, results }) => {
  const { playerResults, correctAnswer, explanation } = results;
  const [countdownLeft, setCountdownLeft] = useState(10);

  // Play appropriate correct/wrong chime for the local player on reveal
  useEffect(() => {
    // Locate the local player's result
    const localSessionId = localStorage.getItem('tow_session_id');
    const localResult = playerResults.find(p => p.playerId === localSessionId);
    
    if (localResult) {
      if (localResult.isCorrect) {
        audio.playCorrect();
      } else {
        audio.playWrong();
      }
    }
  }, [results, playerResults]);

  // Simple countdown to let players know when next question starts
  useEffect(() => {
    setCountdownLeft(10);
    const interval = setInterval(() => {
      setCountdownLeft(prev => Math.max(0, prev - 1));
    }, 1000);
    return () => clearInterval(interval);
  }, [results]);

  return (
    <div className="bg-zinc-900/40 border border-zinc-800 rounded-2xl p-5 md:p-6 shadow-xl space-y-6">
      
      {/* 1. Correct Answer Header */}
      <div className="bg-gradient-to-r from-emerald-950/40 via-emerald-950/70 to-emerald-950/40 border border-emerald-500/30 rounded-2xl p-5 text-center relative overflow-hidden">
        <h3 className="text-[10px] font-extrabold uppercase font-mono tracking-widest text-emerald-400 mb-1">
          ✓ Correct Answer Revealed
        </h3>
        <h2 className="text-xl md:text-2xl font-black text-emerald-300 font-sans tracking-tight">
          {correctAnswer}
        </h2>
      </div>

      {/* 2. Educational Explanation Box */}
      {explanation && (
        <div className="bg-zinc-950/80 border border-zinc-850 rounded-xl p-4 md:p-5">
          <h4 className="text-[10px] font-bold uppercase font-mono text-zinc-500 mb-2">💡 Step-by-Step Explanation</h4>
          <p className="text-xs md:text-sm text-zinc-300 leading-relaxed font-sans">
            {explanation}
          </p>
        </div>
      )}

      {/* 3. Players Results Grid */}
      <div className="space-y-2.5">
        <h4 className="text-[10px] font-bold uppercase font-mono text-zinc-500 mb-2">🏁 Round Score Sheet</h4>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5 max-h-56 overflow-y-auto pr-1">
          {playerResults.map((p) => {
            let statusBadge = 'bg-zinc-950 border-zinc-800 text-zinc-500';
            let label = '⌛ No Answer';
            
            if (p.answer !== null) {
              if (p.isCorrect) {
                statusBadge = 'bg-emerald-950/30 border-emerald-850 text-emerald-400';
                label = `✓ Correct (${(p.responseTime / 1000).toFixed(2)}s)`;
              } else {
                statusBadge = 'bg-red-950/20 border-red-900/40 text-red-400';
                label = `✗ Wrong (${p.answer})`;
              }
            }

            return (
              <div 
                key={p.playerId}
                className="flex items-center justify-between p-3 rounded-xl bg-zinc-950 border border-zinc-900/60"
              >
                <div className="flex items-center gap-2.5">
                  <span className="text-2xl select-none">{p.avatar}</span>
                  <div className="flex flex-col">
                    <span className="text-xs font-bold text-white flex items-center gap-1.5 font-sans">
                      {p.nickname}
                      {p.team && (
                        <span className={`w-2 h-2 rounded-full ${p.team === 'RED' ? 'bg-red-500' : 'bg-blue-500'}`} />
                      )}
                    </span>
                    <span className={`text-[9px] font-mono font-bold uppercase tracking-wider ${
                      p.isCorrect ? 'text-emerald-400' : p.answer === null ? 'text-zinc-500' : 'text-red-400'
                    }`}>
                      {label}
                    </span>
                  </div>
                </div>

                {/* Points Earned */}
                <div className="text-right">
                  <span className={`text-xs font-bold font-mono ${p.pointsEarned > 0 ? 'text-amber-500' : 'text-zinc-500'}`}>
                    {p.pointsEarned > 0 ? `+${p.pointsEarned}` : '0'} pts
                  </span>
                  <span className="block text-[8px] font-mono text-zinc-600">
                    ROUND
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 4. Timer Transition Bar */}
      <div className="flex items-center justify-between text-zinc-500 font-mono text-[10px] uppercase font-bold pt-3 border-t border-zinc-850">
        <span>Prancing to next round...</span>
        <span className="text-amber-500">⏳ Next round in {countdownLeft}s</span>
      </div>
    </div>
  );
};
