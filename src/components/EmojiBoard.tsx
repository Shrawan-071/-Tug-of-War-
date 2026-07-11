import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { EmojiReaction } from '../types';

interface EmojiBoardProps {
  onSendReaction: (emoji: string) => void;
  activeReactions: EmojiReaction[];
}

const EMOJIS = ['😂', '🔥', '😎', '😭', '💪', '👏'];

export const EmojiBoard: React.FC<EmojiBoardProps> = ({ onSendReaction, activeReactions }) => {
  const [cooldown, setCooldown] = useState(false);

  const handleClick = (emoji: string) => {
    if (cooldown) return;
    onSendReaction(emoji);
    
    // 1.2s local rate limit
    setCooldown(true);
    setTimeout(() => {
      setCooldown(false);
    }, 1200);
  };

  return (
    <div className="relative flex flex-col items-center gap-2">
      {/* Floating Reactions Overlay */}
      <div className="absolute -top-40 left-0 right-0 h-40 pointer-events-none z-50 overflow-hidden">
        <AnimatePresence>
          {activeReactions.map((react) => (
            <motion.div
              key={react.id}
              initial={{ opacity: 0, y: 120, scale: 0.5, x: Math.random() * 80 - 40 }}
              animate={{ opacity: [0, 1, 1, 0], y: -20, scale: [0.5, 1.3, 1, 0.8] }}
              exit={{ opacity: 0 }}
              transition={{ duration: 2.2, ease: 'easeOut' }}
              className="absolute left-1/2 -ml-6 bg-zinc-900 border border-zinc-800 shadow-xl px-2 py-1 rounded-full flex items-center gap-1.5 z-50 text-sm whitespace-nowrap"
            >
              <span className="text-xl">{react.emoji}</span>
              <span className="text-[10px] font-mono text-zinc-400 font-bold">{react.nickname}</span>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Emoji Buttons List */}
      <div className="bg-zinc-950/80 backdrop-blur-md border border-zinc-900 rounded-full py-1.5 px-4 shadow-lg flex items-center gap-2">
        <span className="text-[10px] text-zinc-500 font-mono font-bold uppercase tracking-wider hidden md:inline mr-1">
          REACTION:
        </span>
        <div className="flex items-center gap-2">
          {EMOJIS.map((emoji) => (
            <button
              key={emoji}
              type="button"
              disabled={cooldown}
              onClick={() => handleClick(emoji)}
              className={`text-xl md:text-2xl hover:scale-125 hover:rotate-12 active:scale-95 transition-all duration-150 ${
                cooldown 
                  ? 'opacity-40 cursor-not-allowed' 
                  : 'cursor-pointer'
              }`}
            >
              {emoji}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
