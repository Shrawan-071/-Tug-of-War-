import React, { useState } from 'react';
import { GameSettings, Category, Difficulty, GameMode } from '../types';

interface LobbySettingsProps {
  settings: GameSettings;
  isHost: boolean;
  onSettingsChange: (settings: GameSettings) => void;
  maxAvailableQuestions?: number;
}

export const LobbySettings: React.FC<LobbySettingsProps> = ({
  settings,
  isHost,
  onSettingsChange,
  maxAvailableQuestions = 105
}) => {
  const [customRounds, setCustomRounds] = useState(settings.rounds.toString());

  const handleModeChange = (gameMode: GameMode) => {
    onSettingsChange({ ...settings, gameMode });
  };

  const handleDifficultyChange = (difficulty: Difficulty) => {
    onSettingsChange({ ...settings, difficulty });
  };

  const handleTimeLimitChange = (timeLimit: number) => {
    onSettingsChange({ ...settings, timeLimit });
  };

  const handleRoundsPreset = (rounds: number) => {
    setCustomRounds(rounds.toString());
    onSettingsChange({ ...settings, rounds });
  };

  const handleCustomRoundsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setCustomRounds(value);
    const parsed = parseInt(value, 10);
    if (!isNaN(parsed) && parsed >= 1 && parsed <= 50) {
      onSettingsChange({ ...settings, rounds: parsed });
    }
  };

  const handleCategoryToggle = (category: Category) => {
    let newCategories = [...settings.categories];
    if (newCategories.includes(category)) {
      // Must keep at least one category selected
      if (newCategories.length > 1) {
        newCategories = newCategories.filter(c => c !== category);
      }
    } else {
      newCategories.push(category);
    }
    onSettingsChange({ ...settings, categories: newCategories });
  };

  if (!isHost) {
    return (
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5 shadow-lg">
        <h3 className="text-sm font-semibold uppercase text-zinc-400 font-mono mb-4 tracking-wider">🔒 Match Settings (Host Controls)</h3>
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
          <div className="bg-zinc-950 p-3 rounded-xl border border-zinc-900">
            <span className="block text-[10px] text-zinc-500 font-mono uppercase">Game Mode</span>
            <span className="text-sm font-bold text-amber-500 font-mono">
              {settings.gameMode === 'DUEL' ? '⚔️ 1v1 DUEL' : '👥 TEAM BATTLE'}
            </span>
          </div>

          <div className="bg-zinc-950 p-3 rounded-xl border border-zinc-900">
            <span className="block text-[10px] text-zinc-500 font-mono uppercase">Difficulty</span>
            <span className="text-sm font-bold text-amber-500 font-mono">{settings.difficulty}</span>
          </div>

          <div className="bg-zinc-950 p-3 rounded-xl border border-zinc-900">
            <span className="block text-[10px] text-zinc-500 font-mono uppercase">Rounds</span>
            <span className="text-sm font-bold text-amber-500 font-mono">{settings.rounds} Rounds</span>
          </div>

          <div className="bg-zinc-950 p-3 rounded-xl border border-zinc-900">
            <span className="block text-[10px] text-zinc-500 font-mono uppercase">Time Limit</span>
            <span className="text-sm font-bold text-amber-500 font-mono">{settings.timeLimit}s / Question</span>
          </div>
        </div>

        <div className="mt-4 bg-zinc-950 p-3 rounded-xl border border-zinc-900">
          <span className="block text-[10px] text-zinc-500 font-mono uppercase mb-2">Selected Categories</span>
          <div className="flex flex-wrap justify-center gap-2">
            {settings.categories.map(c => (
              <span key={c} className="text-xs bg-amber-950/40 border border-amber-800 text-amber-400 px-2.5 py-1 rounded-full font-semibold font-mono">
                {c.replace('_', ' ')}
              </span>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-zinc-900 border-2 border-zinc-800 rounded-2xl p-6 shadow-xl space-y-6">
      <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
        <h3 className="text-sm font-bold uppercase text-zinc-300 font-mono tracking-wider flex items-center gap-2">
          🛠️ Host Game Room Controls
        </h3>
        <span className="bg-emerald-950/50 text-emerald-400 text-[10px] border border-emerald-800 px-2 py-0.5 rounded font-mono font-bold uppercase">
          Live Syncing
        </span>
      </div>

      {/* 1. Game Mode Selection */}
      <div>
        <label className="block text-xs font-semibold text-zinc-400 uppercase font-mono mb-2">Game Mode</label>
        <div className="grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={() => handleModeChange('DUEL')}
            className={`py-3 px-4 rounded-xl font-bold font-mono transition-all duration-200 border-2 text-center text-sm ${
              settings.gameMode === 'DUEL'
                ? 'bg-amber-600 border-amber-500 text-white shadow-lg shadow-amber-950/50 scale-[1.02]'
                : 'bg-zinc-950 border-zinc-800 text-zinc-400 hover:bg-zinc-900 hover:border-zinc-700'
            }`}
          >
            ⚔️ Classic 1v1 / FFA
          </button>
          <button
            type="button"
            onClick={() => handleModeChange('TEAMS')}
            className={`py-3 px-4 rounded-xl font-bold font-mono transition-all duration-200 border-2 text-center text-sm ${
              settings.gameMode === 'TEAMS'
                ? 'bg-amber-600 border-amber-500 text-white shadow-lg shadow-amber-950/50 scale-[1.02]'
                : 'bg-zinc-950 border-zinc-800 text-zinc-400 hover:bg-zinc-900 hover:border-zinc-700'
            }`}
          >
            👥 Team Battle
          </button>
        </div>
      </div>

      {/* 2. Difficulty Level */}
      <div>
        <label className="block text-xs font-semibold text-zinc-400 uppercase font-mono mb-2">Difficulty</label>
        <div className="grid grid-cols-3 gap-2">
          {(['EASY', 'MEDIUM', 'HARD'] as Difficulty[]).map(diff => (
            <button
              key={diff}
              type="button"
              onClick={() => handleDifficultyChange(diff)}
              className={`py-2 px-3 rounded-xl font-bold font-mono transition-all duration-150 border text-xs text-center ${
                settings.difficulty === diff
                  ? 'bg-amber-950/50 border-amber-500 text-amber-400 shadow shadow-amber-950/40'
                  : 'bg-zinc-950 border-zinc-800 text-zinc-500 hover:bg-zinc-900'
              }`}
            >
              {diff}
            </button>
          ))}
        </div>
      </div>

      {/* 3. Number of Rounds */}
      <div>
        <div className="flex justify-between items-center mb-2">
          <label className="text-xs font-semibold text-zinc-400 uppercase font-mono">Number of Rounds</label>
          <span className="text-[10px] text-zinc-500 font-mono">Max available: {maxAvailableQuestions}</span>
        </div>
        <div className="flex flex-wrap gap-2 mb-3">
          {[5, 10, 15, 20, 25].map(r => (
            <button
              key={r}
              type="button"
              onClick={() => handleRoundsPreset(r)}
              className={`py-1.5 px-3 rounded-lg font-bold font-mono border text-xs ${
                settings.rounds === r && customRounds === r.toString()
                  ? 'bg-amber-950/50 border-amber-600 text-amber-400'
                  : 'bg-zinc-950 border-zinc-900 text-zinc-500 hover:bg-zinc-900'
              }`}
            >
              {r}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-2 bg-zinc-950 border border-zinc-800 rounded-xl p-2">
          <span className="text-xs text-zinc-500 font-mono uppercase pl-2">Custom:</span>
          <input
            type="number"
            min="1"
            max="50"
            value={customRounds}
            onChange={handleCustomRoundsChange}
            className="bg-zinc-900 border border-zinc-800 rounded-lg py-1 px-3 text-sm text-white font-mono font-bold focus:outline-none focus:border-amber-500 w-24 text-center"
          />
          <span className="text-xs text-zinc-500 font-mono">Rounds (1-50)</span>
        </div>
      </div>

      {/* 4. Question Categories */}
      <div>
        <label className="block text-xs font-semibold text-zinc-400 uppercase font-mono mb-2">Categories (Select at least one)</label>
        <div className="space-y-2">
          {(['MATHEMATICS', 'LOGICAL_THINKING', 'PAHELI'] as Category[]).map(cat => {
            const isSelected = settings.categories.includes(cat);
            return (
              <button
                key={cat}
                type="button"
                onClick={() => handleCategoryToggle(cat)}
                className={`w-full flex items-center justify-between py-2.5 px-4 rounded-xl border text-left font-semibold font-mono transition-all duration-150 ${
                  isSelected
                    ? 'bg-amber-950/20 border-amber-700/60 text-amber-300'
                    : 'bg-zinc-950 border-zinc-900 text-zinc-500 hover:bg-zinc-900'
                }`}
              >
                <span className="text-xs">
                  {cat === 'MATHEMATICS' && '🧮 Math Equations'}
                  {cat === 'LOGICAL_THINKING' && '🧠 Logical Riddles'}
                  {cat === 'PAHELI' && '🪔 Nepali / English Paheli'}
                </span>
                <span className="text-[10px] px-1.5 py-0.5 rounded font-bold uppercase tracking-wider bg-zinc-900/50">
                  {isSelected ? '✓ On' : 'Off'}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* 5. Time per Question */}
      <div>
        <label className="block text-xs font-semibold text-zinc-400 uppercase font-mono mb-2">Timer Speed</label>
        <div className="grid grid-cols-4 gap-2">
          {[10, 15, 20, 30].map(seconds => (
            <button
              key={seconds}
              type="button"
              onClick={() => handleTimeLimitChange(seconds)}
              className={`py-2 rounded-xl font-bold font-mono transition-all duration-150 border text-xs text-center ${
                settings.timeLimit === seconds
                  ? 'bg-amber-950/50 border-amber-600 text-amber-400'
                  : 'bg-zinc-950 border-zinc-800 text-zinc-500 hover:bg-zinc-900'
              }`}
            >
              {seconds}s
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
