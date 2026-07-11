import React from 'react';
import { motion } from 'motion/react';

interface HowToPlayModalProps {
  onClose: () => void;
}

export const HowToPlayModal: React.FC<HowToPlayModalProps> = ({ onClose }) => {
  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="w-full max-w-xl bg-zinc-900 border-2 border-zinc-800 rounded-3xl p-6 md:p-8 shadow-2xl relative overflow-hidden"
      >
        {/* Glow effect */}
        <div className="absolute -top-40 -left-40 w-80 h-80 bg-amber-600/10 rounded-full filter blur-3xl" />

        <div className="flex items-center justify-between border-b border-zinc-800 pb-4 mb-6 relative z-10">
          <h2 className="text-lg md:text-xl font-black text-white font-mono tracking-wide flex items-center gap-2">
            🪢 HOW TO PLAY: TUG OF WAR
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-zinc-950 border border-zinc-800 flex items-center justify-center text-zinc-400 hover:text-white hover:border-zinc-700 transition-colors"
          >
            ✕
          </button>
        </div>

        <div className="space-y-6 text-zinc-300 overflow-y-auto max-h-[60vh] pr-1.5 scrollbar-thin relative z-10 text-xs md:text-sm leading-relaxed">
          {/* Section 1: Objective */}
          <div>
            <h3 className="text-amber-500 font-bold uppercase font-mono mb-1.5 flex items-center gap-1.5">
              🎯 GAME OBJECTIVE
            </h3>
            <p>
              Compete against other players in an educational real-time battle! Answer mathematics equations, logical reasoning puzzles, and clever riddles (Paheli) correctly and quickly to <strong>pull the rope to your side</strong>.
            </p>
          </div>

          {/* Section 2: Scoring Formula */}
          <div>
            <h3 className="text-amber-500 font-bold uppercase font-mono mb-2 flex items-center gap-1.5">
              🧮 CHEAT-PROOF SCORING SYSTEM
            </h3>
            <div className="bg-zinc-950 p-4 rounded-2xl border border-zinc-850/60 space-y-2.5 font-mono text-[11px]">
              <div>
                <span className="text-emerald-400 font-bold">1. BASE SCORE:</span>
                <p className="text-zinc-400 font-sans mt-0.5 pl-4">Get <strong>100 points</strong> for answering a question correctly.</p>
              </div>
              <div>
                <span className="text-emerald-400 font-bold">2. SPEED BONUS:</span>
                <p className="text-zinc-400 font-sans mt-0.5 pl-4">Earn up to <strong>+50 points</strong> based on how fast you submit compared to the time limit. Speed is computed safely on the server.</p>
              </div>
              <div>
                <span className="text-emerald-400 font-bold">3. STREAK MULTIPLIER:</span>
                <p className="text-zinc-400 font-sans mt-0.5 pl-4">Reward consecutive answers: 2 correct = <strong>+10</strong>, 3 correct = <strong>+20</strong>, 4 correct = <strong>+30</strong>, and 5+ correct = <strong>+40 max</strong> per round! Wrong/No Answer resets streak to 0.</p>
              </div>
            </div>
          </div>

          {/* Section 3: Rope Mechanics */}
          <div>
            <h3 className="text-amber-500 font-bold uppercase font-mono mb-1.5 flex items-center gap-1.5">
              ⛓️ TUG OF WAR PHYSICS
            </h3>
            <ul className="list-disc pl-5 space-y-1.5">
              <li>
                <strong>1v1 Duel Mode:</strong> Left player pulls left, Right player pulls right. Net round score difference determines rope movement!
              </li>
              <li>
                <strong>Team Battle:</strong> Divided into <span className="text-red-400 font-bold">TEAM RED</span> and <span className="text-blue-400 font-bold">TEAM BLUE</span>. Average round scores are pitted against each other!
              </li>
              <li>
                <strong>Free-For-All (FFA):</strong> More than 2 players individually battle. The top ranked player pulls right, and the second-ranked player pulls left to symbolize the championship tug!
              </li>
            </ul>
          </div>

          {/* Section 4: Hotkeys */}
          <div>
            <h3 className="text-amber-500 font-bold uppercase font-mono mb-1.5 flex items-center gap-1.5">
              ⌨️ KEYBOARD SHORTCUT HOTKEYS
            </h3>
            <p>
              Lock in your answer instantly with speed using your computer keyboard:
            </p>
            <div className="grid grid-cols-4 gap-2 text-center font-mono mt-2 font-black">
              <div className="bg-zinc-950 p-2 rounded-lg border border-zinc-800">
                <kbd className="bg-zinc-900 border border-zinc-700 px-1.5 py-0.5 rounded text-white text-[11px]">A</kbd> or <kbd className="bg-zinc-900 border border-zinc-700 px-1.5 py-0.5 rounded text-white text-[11px]">1</kbd>
              </div>
              <div className="bg-zinc-950 p-2 rounded-lg border border-zinc-800">
                <kbd className="bg-zinc-900 border border-zinc-700 px-1.5 py-0.5 rounded text-white text-[11px]">B</kbd> or <kbd className="bg-zinc-900 border border-zinc-700 px-1.5 py-0.5 rounded text-white text-[11px]">2</kbd>
              </div>
              <div className="bg-zinc-950 p-2 rounded-lg border border-zinc-800">
                <kbd className="bg-zinc-900 border border-zinc-700 px-1.5 py-0.5 rounded text-white text-[11px]">C</kbd> or <kbd className="bg-zinc-900 border border-zinc-700 px-1.5 py-0.5 rounded text-white text-[11px]">3</kbd>
              </div>
              <div className="bg-zinc-950 p-2 rounded-lg border border-zinc-800">
                <kbd className="bg-zinc-900 border border-zinc-700 px-1.5 py-0.5 rounded text-white text-[11px]">D</kbd> or <kbd className="bg-zinc-900 border border-zinc-700 px-1.5 py-0.5 rounded text-white text-[11px]">4</kbd>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-6 pt-4 border-t border-zinc-800 flex justify-end relative z-10">
          <button
            type="button"
            onClick={onClose}
            className="py-2.5 px-6 rounded-xl bg-amber-600 hover:bg-amber-500 text-zinc-950 font-bold font-mono transition-colors text-xs uppercase"
          >
            Got It, Let's Pull!
          </button>
        </div>
      </motion.div>
    </div>
  );
};
