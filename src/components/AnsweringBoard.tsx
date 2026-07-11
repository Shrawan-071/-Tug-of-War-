import React, { useEffect, useState, useRef } from 'react';
import { motion, useAnimation } from 'motion/react';
import { ClientQuestion } from '../types';
import { audio } from '../services/audio';

interface AnsweringBoardProps {
  question: ClientQuestion;
  questionEndsAt: number;
  questionStartedAt: number;
  onAnswerSubmit: (option: string, responseTime: number) => void;
  hasAnswered: boolean;
  selectedAnswer: string | null;
}

export const AnsweringBoard: React.FC<AnsweringBoardProps> = ({
  question,
  questionEndsAt,
  questionStartedAt,
  onAnswerSubmit,
  hasAnswered,
  selectedAnswer
}) => {
  const [secondsLeft, setSecondsLeft] = useState<number>(20);
  const [progress, setProgress] = useState<number>(100);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  
  // Track last played beep second so we don't beep multiple times in the same second
  const lastBeepSecond = useRef<number>(-1);

  useEffect(() => {
    // Reset timer
    if (timerRef.current) clearInterval(timerRef.current);

    const totalDuration = questionEndsAt - questionStartedAt;

    const updateTimer = () => {
      const now = Date.now();
      const difference = questionEndsAt - now;
      const seconds = Math.max(0, Math.ceil(difference / 1000));
      setSecondsLeft(seconds);

      const ratio = Math.max(0, Math.min(100, (difference / totalDuration) * 100));
      setProgress(ratio);

      // Play Warning Beeps on final 5 seconds
      if (seconds > 0 && seconds <= 5 && seconds !== lastBeepSecond.current && !hasAnswered) {
        audio.playBeep();
        lastBeepSecond.current = seconds;
      }

      if (difference <= 0) {
        if (timerRef.current) clearInterval(timerRef.current);
      }
    };

    updateTimer();
    timerRef.current = setInterval(updateTimer, 100);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [questionEndsAt, questionStartedAt, hasAnswered]);

  // Keyboard navigation
  useEffect(() => {
    if (hasAnswered) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      const key = e.key.toLowerCase();
      let optionIndex = -1;

      if (key === 'a' || key === '1') optionIndex = 0;
      else if (key === 'b' || key === '2') optionIndex = 1;
      else if (key === 'c' || key === '3') optionIndex = 2;
      else if (key === 'd' || key === '4') optionIndex = 3;

      if (optionIndex >= 0 && optionIndex < question.options.length) {
        handleSubmit(question.options[optionIndex]);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [question, hasAnswered]);

  const handleSubmit = (option: string) => {
    if (hasAnswered) return;
    const responseTime = Date.now() - questionStartedAt;
    onAnswerSubmit(option, responseTime);
  };

  const optionPrefixes = ['A', 'B', 'C', 'D'];

  return (
    <div className="bg-zinc-900/40 border border-zinc-800 rounded-2xl p-4 md:p-6 shadow-xl space-y-6">
      {/* Timer Bar and Header */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <span className="bg-amber-950 text-amber-400 border border-amber-800 text-[10px] font-mono px-2 py-0.5 rounded-full font-bold uppercase tracking-wider">
            {question.category.replace('_', ' ')}
          </span>
          <span className="text-zinc-500 font-mono text-[10px] uppercase font-semibold">
            {question.subcategory}
          </span>
        </div>

        {/* Dynamic Circular-like Timer badge */}
        <div className={`flex items-center gap-1.5 font-mono font-black text-sm px-3 py-1 rounded-full border transition-all duration-300 ${
          secondsLeft <= 5 
            ? 'bg-red-950/80 border-red-500 text-red-400 animate-pulse' 
            : 'bg-zinc-950 border-zinc-800 text-amber-500'
        }`}>
          <span>⏱️</span>
          <span>{secondsLeft}s</span>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="w-full bg-zinc-950 h-2 rounded-full overflow-hidden border border-zinc-800/50">
        <div 
          className={`h-full transition-all duration-100 ease-linear ${
            secondsLeft <= 5 ? 'bg-red-600' : 'bg-amber-500'
          }`}
          style={{ width: `${progress}%` }}
        />
      </div>

      {/* Main Question Box */}
      <div className="bg-zinc-950 border border-zinc-800/80 rounded-2xl p-5 md:p-7 text-center relative overflow-hidden">
        {/* Subtle decorative quote brackets */}
        <span className="absolute top-2 left-4 text-zinc-800 text-6xl font-serif font-black select-none pointer-events-none">“</span>
        <h2 className="text-lg md:text-xl font-bold text-white leading-relaxed relative z-10 font-sans tracking-tight">
          {question.questionText}
        </h2>
        <span className="absolute bottom-[-16px] right-4 text-zinc-800 text-6xl font-serif font-black select-none pointer-events-none">”</span>
      </div>

      {/* Answering Options Buttons Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
        {question.options.map((option, idx) => {
          const isSelected = selectedAnswer === option;
          const letter = optionPrefixes[idx];

          return (
            <button
              key={option}
              type="button"
              disabled={hasAnswered}
              onClick={() => handleSubmit(option)}
              className={`group relative text-left py-4 px-5 rounded-xl border-2 transition-all duration-150 flex items-center gap-4 ${
                hasAnswered
                  ? isSelected
                    ? 'bg-amber-950/40 border-amber-500 text-amber-300 scale-[0.99] opacity-100'
                    : 'bg-zinc-950 border-zinc-900/60 text-zinc-600 opacity-40 cursor-not-allowed'
                  : 'bg-zinc-950 border-zinc-800 text-zinc-100 hover:border-amber-600 hover:bg-zinc-900 hover:scale-[1.01] active:scale-[0.99]'
              }`}
            >
              {/* Hotkey circle */}
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-mono font-bold text-xs border transition-colors duration-150 ${
                hasAnswered
                  ? isSelected
                    ? 'bg-amber-500 text-zinc-950 border-amber-400'
                    : 'bg-zinc-900 text-zinc-700 border-zinc-850'
                  : 'bg-zinc-900 text-zinc-400 border-zinc-800 group-hover:bg-amber-950 group-hover:text-amber-400 group-hover:border-amber-700'
              }`}>
                {letter}
              </div>

              {/* Option text */}
              <span className="font-semibold text-sm leading-snug grow">
                {option}
              </span>

              {/* Custom selection icon */}
              {!hasAnswered && (
                <span className="text-[10px] text-zinc-600 font-mono font-semibold uppercase opacity-0 group-hover:opacity-100 transition-opacity">
                  Press {letter}
                </span>
              )}
              {hasAnswered && isSelected && (
                <span className="text-xs text-amber-400 font-bold uppercase font-mono bg-amber-950/80 px-2 py-0.5 rounded border border-amber-800">
                  🔒 Locked
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Locked In State banner */}
      {hasAnswered && (
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center p-3 bg-zinc-950 border border-zinc-850 rounded-xl text-xs font-mono text-zinc-400"
        >
          <span className="inline-block animate-bounce mr-2">⏳</span>
          Your answer is locked! Waiting for other players or timer expiration...
        </motion.div>
      )}
    </div>
  );
};
