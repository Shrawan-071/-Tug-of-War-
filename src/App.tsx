import { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { socket, getOrCreateSessionId, getSavedProfile, saveProfile } from './services/socket';
import { audio } from './services/audio';
import { RoomState, GameSettings, ClientQuestion, RoundResultData, GameHistory, EmojiReaction } from './types';
import { TugOfWarArena } from './components/TugOfWarArena';
import { LobbySettings } from './components/LobbySettings';
import { AnsweringBoard } from './components/AnsweringBoard';
import { RoundResultBoard } from './components/RoundResultBoard';
import { FinalSummaryBoard } from './components/FinalSummaryBoard';
import { LeaderboardPanel } from './components/LeaderboardPanel';
import { EmojiBoard } from './components/EmojiBoard';
import { HowToPlayModal } from './components/HowToPlayModal';
import { Volume2, VolumeX, HelpCircle, Copy, Share2, Play, Users, Award, ShieldAlert, CheckCircle2 } from 'lucide-react';

const AVATARS = ['🦊', '🦁', '🐯', '🐼', '🐸', '🐵', '🐨', '🐙', '🦄', '🦖', '🐝', '🦥'];

export default function App() {
  const [sessionId] = useState(getOrCreateSessionId);
  const [profile, setProfile] = useState(getSavedProfile);
  
  // App views
  const [screen, setScreen] = useState<'LANDING' | 'CREATE' | 'JOIN'>('LANDING');
  const [roomCodeInput, setRoomCodeInput] = useState('');
  const [showHowTo, setShowHowTo] = useState(false);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [globalHistory, setGlobalHistory] = useState<GameHistory[]>([]);

  // Sound settings
  const [isMusicOn, setIsMusicOn] = useState(false);
  const [isSfxOn, setIsSfxOn] = useState(true);

  // Real-time Game Sync State
  const [room, setRoom] = useState<RoomState | null>(null);
  const [lastRoundResults, setLastRoundResults] = useState<RoundResultData | null>(null);
  const [historyRecord, setHistoryRecord] = useState<GameHistory | null>(null);
  const [activeReactions, setActiveReactions] = useState<EmojiReaction[]>([]);
  
  // Statuses
  const [connecting, setConnecting] = useState(false);
  const [lobbyReady, setLobbyReady] = useState(false);
  const [errorBanner, setErrorBanner] = useState<string | null>(null);
  const [infoBanner, setInfoBanner] = useState<string | null>(null);
  const [isAnswering, setIsAnswering] = useState(false);
  const [hasAnswered, setHasAnswered] = useState(false);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [startCountdown, setStartCountdown] = useState<number | null>(null);

  // Check for invite code in URL
  useEffect(() => {
    const path = window.location.pathname;
    const match = path.match(/^\/join\/([A-Z0-9]{6})$/i);
    if (match) {
      const code = match[1].toUpperCase();
      setRoomCodeInput(code);
      setScreen('JOIN');
    }
  }, []);

  // Fetch completed games list on Landing
  const fetchGlobalHistory = async () => {
    try {
      const res = await fetch('/api/history');
      if (res.ok) {
        const data = await res.json();
        setGlobalHistory(data);
      }
    } catch (e) {
      // Fail silently
    }
  };

  useEffect(() => {
    fetchGlobalHistory();
  }, [screen]);

  // Connect socket and handle universal triggers
  useEffect(() => {
    socket.connect();

    socket.on('connect', () => {
      setConnecting(false);
      // Auto-rejoin if we were already in a room session
      const lastRoom = sessionStorage.getItem('tow_active_room');
      if (lastRoom && profile.nickname) {
        socket.emit('room:join', {
          roomCode: lastRoom,
          nickname: profile.nickname,
          avatar: profile.avatar,
          sessionId
        }, (res: any) => {
          if (res.error) {
            sessionStorage.removeItem('tow_active_room');
          } else {
            setRoom(res.room);
          }
        });
      }
    });

    socket.on('connect_error', () => {
      setConnecting(false);
      triggerError('Failed to establish server connection.');
    });

    socket.on('room:updated', (updatedRoom: RoomState) => {
      setRoom(updatedRoom);
      // Persist room code
      sessionStorage.setItem('tow_active_room', updatedRoom.roomCode);

      // Local player ready status synchronization
      const localPlayer = updatedRoom.players.find(p => p.id === sessionId);
      if (localPlayer) {
        setLobbyReady(localPlayer.ready);
      }
    });

    socket.on('player:joined', ({ nickname, avatar }) => {
      triggerInfo(`👋 ${avatar} ${nickname} entered the lobby!`);
    });

    socket.on('player:left', ({ id }) => {
      // Find name before removal
      if (room) {
        const p = room.players.find(x => x.id === id);
        if (p) triggerInfo(`🚪 ${p.avatar} ${p.nickname} left the room.`);
      }
    });

    socket.on('player:offline', ({ id }) => {
      if (room) {
        const p = room.players.find(x => x.id === id);
        if (p) triggerInfo(`💤 ${p.avatar} ${p.nickname} went offline. 60s to reconnect.`);
      }
    });

    socket.on('host:changed', ({ nickname }) => {
      triggerInfo(`👑 Host transferred to ${nickname}!`);
    });

    socket.on('game:started', () => {
      setStartCountdown(3);
      audio.playRoundStart();
    });

    socket.on('round:started', ({ question, questionEndsAt }) => {
      setStartCountdown(null);
      setLastRoundResults(null);
      setHasAnswered(false);
      setSelectedOption(null);
      setIsAnswering(true);
    });

    socket.on('round:ended', (results: RoundResultData) => {
      setIsAnswering(false);
      setLastRoundResults(results);
    });

    socket.on('reaction:received', (react: EmojiReaction) => {
      setActiveReactions(prev => [...prev, react]);
      setTimeout(() => {
        setActiveReactions(prev => prev.filter(r => r.id !== react.id));
      }, 3000);
    });

    socket.on('game:finished', (history: GameHistory) => {
      setHistoryRecord(history);
      audio.playVictory();
    });

    socket.on('game:rematched', () => {
      setHistoryRecord(null);
      setLastRoundResults(null);
      setHasAnswered(false);
      setSelectedOption(null);
      setIsAnswering(false);
      triggerInfo('🔄 A new rematch has started!');
    });

    socket.on('game:error', ({ message }) => {
      triggerError(message);
    });

    return () => {
      socket.off('connect');
      socket.off('connect_error');
      socket.off('room:updated');
      socket.off('player:joined');
      socket.off('player:left');
      socket.off('player:offline');
      socket.off('host:changed');
      socket.off('game:started');
      socket.off('round:started');
      socket.off('round:ended');
      socket.off('reaction:received');
      socket.off('game:finished');
      socket.off('game:rematched');
      socket.off('game:error');
    };
  }, [room, profile, sessionId]);

  // Handle Game Started Countdown Timer (3s starting lock)
  useEffect(() => {
    if (startCountdown === null) return;
    if (startCountdown <= 0) return;

    const interval = setInterval(() => {
      setStartCountdown(prev => (prev !== null ? prev - 1 : null));
    }, 1000);
    return () => clearInterval(interval);
  }, [startCountdown]);

  const triggerError = (msg: string) => {
    setErrorBanner(msg);
    setTimeout(() => setErrorBanner(null), 5000);
  };

  const triggerInfo = (msg: string) => {
    setInfoBanner(msg);
    setTimeout(() => setInfoBanner(null), 4000);
  };

  // Sound System Sync
  const toggleMusic = () => {
    audio.resume();
    audio.toggleMusic();
    setIsMusicOn(audio.musicEnabled);
  };

  const toggleSfx = () => {
    audio.resume();
    audio.toggleSfx();
    setIsSfxOn(audio.sfxEnabled);
  };

  // Landing Form Actions
  const handleProfileChange = (nickname: string, avatar: string) => {
    const updated = { nickname: nickname.slice(0, 20), avatar };
    setProfile(updated);
    saveProfile(updated.nickname, updated.avatar);
  };

  const handleCreateGame = () => {
    if (!profile.nickname.trim() || profile.nickname.trim().length < 2) {
      return triggerError('Nickname must be at least 2 characters.');
    }
    setConnecting(true);
    audio.resume();
    audio.startMusic();
    setIsMusicOn(audio.musicEnabled);

    socket.emit('room:create', {
      nickname: profile.nickname,
      avatar: profile.avatar,
      sessionId
    }, (res: any) => {
      setConnecting(false);
      if (res.error) {
        triggerError(res.error);
      } else {
        setRoom(res.room);
      }
    });
  };

  const handleJoinGame = () => {
    if (!profile.nickname.trim() || profile.nickname.trim().length < 2) {
      return triggerError('Nickname must be at least 2 characters.');
    }
    if (!roomCodeInput.trim() || roomCodeInput.trim().length !== 6) {
      return triggerError('Please enter a valid 6-character Room Code.');
    }
    setConnecting(true);
    audio.resume();
    audio.startMusic();
    setIsMusicOn(audio.musicEnabled);

    const formattedCode = roomCodeInput.toUpperCase().trim();
    socket.emit('room:join', {
      roomCode: formattedCode,
      nickname: profile.nickname,
      avatar: profile.avatar,
      sessionId
    }, (res: any) => {
      setConnecting(false);
      if (res.error) {
        triggerError(res.error);
      } else {
        setRoom(res.room);
      }
    });
  };

  // Lobby Actions
  const handleReadyToggle = () => {
    if (!room) return;
    const nextReady = !lobbyReady;
    setLobbyReady(nextReady);
    socket.emit('player:ready', {
      roomCode: room.roomCode,
      sessionId,
      ready: nextReady
    });
  };

  const handleSettingsChange = (newSettings: GameSettings) => {
    if (!room) return;
    socket.emit('settings:update', {
      roomCode: room.roomCode,
      sessionId,
      settings: newSettings
    });
  };

  const handleStartGame = () => {
    if (!room) return;
    socket.emit('game:start', {
      roomCode: room.roomCode,
      sessionId
    });
  };

  const handleLeaveRoom = () => {
    if (!room) return;
    socket.emit('room:leave', {
      roomCode: room.roomCode,
      sessionId
    }, () => {
      setRoom(null);
      setHistoryRecord(null);
      setLastRoundResults(null);
      sessionStorage.removeItem('tow_active_room');
    });
  };

  // Question Board Actions
  const handleAnswerSubmit = (option: string, responseTime: number) => {
    if (!room) return;
    setSelectedOption(option);
    setHasAnswered(true);

    socket.emit('answer:submit', {
      roomCode: room.roomCode,
      sessionId,
      option,
      responseTime
    });
  };

  // Send reaction
  const handleSendReaction = (emoji: string) => {
    if (!room) return;
    socket.emit('reaction:send', {
      roomCode: room.roomCode,
      sessionId,
      emoji
    });
  };

  // Rematch
  const handleRematch = () => {
    if (!room) return;
    socket.emit('game:rematch', {
      roomCode: room.roomCode,
      sessionId
    });
  };

  // Return home
  const handleReturnHome = () => {
    handleLeaveRoom();
    setScreen('LANDING');
  };

  const copyInviteLink = () => {
    if (!room) return;
    const link = `${window.location.origin}/join/${room.roomCode}`;
    navigator.clipboard.writeText(link);
    triggerInfo('📋 Invite link copied to clipboard!');
  };

  const copyRoomCode = () => {
    if (!room) return;
    navigator.clipboard.writeText(room.roomCode);
    triggerInfo('📋 Room code copied to clipboard!');
  };

  // Determine if I am the Host
  const isHost = room ? room.hostPlayerId === sessionId : false;

  return (
    <div className="min-h-screen bg-zinc-950 text-white font-sans selection:bg-amber-600 selection:text-zinc-950">
      
      {/* 1. Global Game Header bar */}
      <header className="sticky top-0 z-40 bg-zinc-950/80 backdrop-blur-md border-b border-zinc-900 px-4 py-3 shadow-md flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-600 to-yellow-500 flex items-center justify-center font-black text-zinc-950 shadow shadow-amber-900/40 text-lg">
            🪢
          </div>
          <div>
            <h1 className="text-sm font-black tracking-tight font-mono">TUG OF WAR</h1>
            <span className="text-[10px] text-zinc-500 font-medium">Think Fast. Answer Right. Pull Hard.</span>
          </div>
        </div>

        {/* Header Controls (Sound, Music, Help) */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={toggleMusic}
            title="Toggle Music"
            className={`p-2 rounded-lg border text-xs transition-colors ${
              isMusicOn 
                ? 'bg-amber-950/40 border-amber-800 text-amber-400' 
                : 'bg-zinc-900 border-zinc-800 text-zinc-500 hover:text-zinc-300'
            }`}
          >
            {isMusicOn ? <Volume2 size={16} /> : <VolumeX size={16} />}
          </button>

          <button
            type="button"
            onClick={toggleSfx}
            title="Toggle Sound Effects"
            className={`p-2 rounded-lg border text-xs transition-colors ${
              isSfxOn 
                ? 'bg-amber-950/40 border-amber-800 text-amber-400' 
                : 'bg-zinc-900 border-zinc-800 text-zinc-500 hover:text-zinc-300'
            }`}
          >
            {isSfxOn ? <span className="font-bold">SFX</span> : <span className="text-zinc-600 line-through">SFX</span>}
          </button>

          <button
            type="button"
            onClick={() => setShowHowTo(true)}
            title="How to Play"
            className="p-2 rounded-lg bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-white transition-colors"
          >
            <HelpCircle size={16} />
          </button>
        </div>
      </header>

      {/* 2. Error/Info Banners */}
      <AnimatePresence>
        {errorBanner && (
          <motion.div
            initial={{ opacity: 0, y: -50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -50 }}
            className="fixed top-16 left-4 right-4 md:left-1/2 md:-ml-60 md:w-120 z-50 bg-red-950/90 border-2 border-red-500 text-red-200 px-4 py-3 rounded-xl shadow-xl flex items-center gap-3"
          >
            <ShieldAlert className="text-red-500 shrink-0" size={20} />
            <span className="text-xs font-mono font-bold leading-relaxed">{errorBanner}</span>
          </motion.div>
        )}

        {infoBanner && (
          <motion.div
            initial={{ opacity: 0, y: -50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -50 }}
            className="fixed top-16 left-4 right-4 md:left-1/2 md:-ml-60 md:w-120 z-50 bg-emerald-950/90 border-2 border-emerald-500 text-emerald-100 px-4 py-3 rounded-xl shadow-xl flex items-center gap-3"
          >
            <CheckCircle2 className="text-emerald-500 shrink-0" size={20} />
            <span className="text-xs font-mono font-bold leading-relaxed">{infoBanner}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 3. Main Stage Routing Container */}
      <main className="max-w-4xl mx-auto px-4 py-6 md:py-10">
        
        {/* --- STAGE A: OUTSIDE THE GAME ROOM --- */}
        {!room ? (
          <div className="space-y-8">
            
            {/* Landing screen */}
            {screen === 'LANDING' && (
              <div className="space-y-8">
                {/* Visual Banner */}
                <div className="text-center space-y-3 py-6">
                  <motion.div 
                    initial={{ scale: 0.9 }}
                    animate={{ scale: 1 }}
                    className="inline-block text-6xl filter drop-shadow-[0_10px_20px_rgba(245,158,11,0.2)]"
                  >
                    🪢
                  </motion.div>
                  <h2 className="text-3xl md:text-5xl font-black text-white font-sans tracking-tight">
                    TUG OF WAR
                  </h2>
                  <p className="text-zinc-400 font-mono text-xs md:text-sm">
                    "Think Fast. Answer Right. Pull Hard."
                  </p>
                </div>

                {/* Nickname and Avatar picker card */}
                <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-6 md:p-8 shadow-xl max-w-md mx-auto space-y-6">
                  <div>
                    <label className="block text-xs font-bold font-mono uppercase text-zinc-500 mb-2">
                      👤 ENTER YOUR PLAYER NAME
                    </label>
                    <input
                      type="text"
                      maxLength={20}
                      value={profile.nickname}
                      onChange={(e) => handleProfileChange(e.target.value, profile.avatar)}
                      placeholder="Enter a cool nickname"
                      className="w-full bg-zinc-950 border-2 border-zinc-800 rounded-2xl py-3 px-4 text-white font-sans font-bold focus:outline-none focus:border-amber-500 transition-colors"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold font-mono uppercase text-zinc-500 mb-2">
                      🦊 CHOOSE YOUR AVATAR
                    </label>
                    <div className="grid grid-cols-6 gap-2">
                      {AVATARS.map(emoji => (
                        <button
                          key={emoji}
                          type="button"
                          onClick={() => handleProfileChange(profile.nickname, emoji)}
                          className={`text-2xl py-2 rounded-xl transition-all duration-150 border-2 ${
                            profile.avatar === emoji 
                              ? 'bg-amber-950/40 border-amber-500 scale-[1.1] shadow-md shadow-amber-950/40' 
                              : 'bg-zinc-950 border-zinc-850 hover:bg-zinc-900'
                          }`}
                        >
                          {emoji}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Play Actions Buttons */}
                  <div className="pt-2 grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={handleCreateGame}
                      disabled={connecting}
                      className="py-3 px-4 rounded-xl bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 text-zinc-950 font-black font-mono transition-all uppercase tracking-wide flex items-center justify-center gap-1 text-sm shadow-md"
                    >
                      <Play size={16} fill="currentColor" /> Create Game
                    </button>

                    <button
                      type="button"
                      onClick={() => setScreen('JOIN')}
                      className="py-3 px-4 rounded-xl bg-zinc-950 border border-zinc-850 text-zinc-200 hover:bg-zinc-900 hover:border-zinc-700 font-bold font-mono transition-all uppercase tracking-wide text-sm flex items-center justify-center gap-1"
                    >
                      <Users size={16} /> Join Game
                    </button>
                  </div>

                  <div className="border-t border-zinc-850/60 pt-4 flex justify-between items-center text-[10px] text-zinc-500 font-mono">
                    <button 
                      type="button"
                      onClick={() => setShowHistoryModal(true)}
                      className="hover:text-zinc-300 transition-colors uppercase font-bold flex items-center gap-1"
                    >
                      <Award size={12} /> View Game Records
                    </button>
                    <span>ID: {sessionId.slice(0, 8)}</span>
                  </div>
                </div>
              </div>
            )}

            {/* Join game room screen */}
            {screen === 'JOIN' && (
              <div className="max-w-md mx-auto bg-zinc-900 border border-zinc-800 rounded-3xl p-6 md:p-8 shadow-xl space-y-6">
                <div className="flex items-center justify-between border-b border-zinc-850 pb-3">
                  <h3 className="font-bold font-mono text-sm uppercase text-zinc-300">⚔️ ENTER GAME CODE</h3>
                  <button 
                    type="button"
                    onClick={() => setScreen('LANDING')}
                    className="text-xs text-zinc-500 hover:text-zinc-300 font-mono uppercase"
                  >
                    ← Back
                  </button>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold font-mono uppercase text-zinc-500 mb-1.5">Your Nickname</label>
                    <input
                      type="text"
                      maxLength={20}
                      value={profile.nickname}
                      onChange={(e) => handleProfileChange(e.target.value, profile.avatar)}
                      className="w-full bg-zinc-950 border border-zinc-800 rounded-2xl py-2.5 px-4 text-white font-sans font-semibold focus:outline-none focus:border-amber-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold font-mono uppercase text-zinc-500 mb-1.5">6-Character Room Code</label>
                    <input
                      type="text"
                      maxLength={6}
                      value={roomCodeInput}
                      onChange={(e) => setRoomCodeInput(e.target.value.toUpperCase())}
                      placeholder="A7K9P2"
                      className="w-full bg-zinc-950 border-2 border-zinc-800 rounded-2xl py-3 px-4 text-center text-xl text-white font-mono font-extrabold focus:outline-none focus:border-amber-500 uppercase tracking-widest"
                    />
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleJoinGame}
                  disabled={connecting}
                  className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 text-zinc-950 font-black font-mono transition-all uppercase tracking-wider text-sm flex items-center justify-center gap-1.5"
                >
                  {connecting ? 'Connecting...' : '⚔️ Join Room'}
                </button>
              </div>
            )}

          </div>
        ) : (
          
          /* --- STAGE B: INSIDE AN ACTIVE MULTIPLAYER ROOM --- */
          <div className="space-y-8">
            
            {/* LOBBY PHASE */}
            {room.status === 'LOBBY' && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                
                {/* Lobby Details and Settings Panel (Left side) */}
                <div className="md:col-span-2 space-y-6">
                  
                  {/* Code Card */}
                  <div className="bg-zinc-900 border border-zinc-850 rounded-2xl p-5 flex flex-col sm:flex-row items-center justify-between gap-4">
                    <div>
                      <span className="block text-[10px] text-zinc-500 font-mono uppercase tracking-wider">ROOM INVITATION CODE</span>
                      <h2 className="text-3xl font-black font-mono text-white tracking-widest">{room.roomCode}</h2>
                    </div>
                    <div className="flex gap-2 w-full sm:w-auto">
                      <button
                        type="button"
                        onClick={copyRoomCode}
                        className="flex-1 sm:flex-initial py-2 px-3 rounded-lg bg-zinc-950 border border-zinc-800 hover:bg-zinc-900 text-zinc-300 font-mono font-bold text-xs flex items-center justify-center gap-1.5"
                      >
                        <Copy size={14} /> Copy Code
                      </button>
                      <button
                        type="button"
                        onClick={copyInviteLink}
                        className="flex-1 sm:flex-initial py-2 px-3 rounded-lg bg-zinc-950 border border-zinc-800 hover:bg-zinc-900 text-zinc-300 font-mono font-bold text-xs flex items-center justify-center gap-1.5"
                      >
                        <Share2 size={14} /> Invite Link
                      </button>
                    </div>
                  </div>

                  {/* Settings Manager */}
                  <LobbySettings
                    settings={room.settings}
                    isHost={isHost}
                    onSettingsChange={handleSettingsChange}
                  />

                </div>

                {/* Player List Panel (Right side) */}
                <div className="space-y-6">
                  <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5 shadow-lg space-y-4">
                    <div className="flex items-center justify-between border-b border-zinc-850 pb-2">
                      <h3 className="text-xs font-bold uppercase font-mono tracking-wider text-zinc-400">
                        👥 LOBBY READINESS
                      </h3>
                      <span className="text-[10px] bg-zinc-950 border border-zinc-850 px-2 py-0.5 rounded text-zinc-500 font-mono font-semibold">
                        {room.players.length} Joined
                      </span>
                    </div>

                    <div className="space-y-2">
                      {room.players.map(p => {
                        const isPlayerHost = p.id === room.hostPlayerId;
                        return (
                          <div 
                            key={p.id}
                            className="flex items-center justify-between p-2.5 rounded-xl bg-zinc-950 border border-zinc-900"
                          >
                            <div className="flex items-center gap-2">
                              <span className="text-2xl">{p.avatar}</span>
                              <div className="flex flex-col">
                                <span className="text-xs font-bold text-white flex items-center gap-1">
                                  {p.nickname}
                                  {isPlayerHost && <span title="Host">👑</span>}
                                  {p.id === sessionId && <span className="text-[10px] font-mono text-zinc-500">(You)</span>}
                                </span>
                                {room.settings.gameMode === 'TEAMS' && p.team && (
                                  <span className={`text-[8px] font-bold ${p.team === 'RED' ? 'text-red-400' : 'text-blue-400'}`}>
                                    {p.team === 'RED' ? '🔴 RED TEAM' : '🔵 BLUE TEAM'}
                                  </span>
                                )}
                              </div>
                            </div>

                            {/* Ready Status indicator */}
                            <span className={`text-[10px] font-mono font-black uppercase px-2 py-0.5 rounded border ${
                              p.ready 
                                ? 'bg-emerald-950/40 border-emerald-800 text-emerald-400' 
                                : 'bg-red-950/20 border-red-900/40 text-red-400 animate-pulse'
                            }`}>
                              {p.ready ? '✓ Ready' : '⏳ Waiting'}
                            </span>
                          </div>
                        );
                      })}
                    </div>

                    {/* Readiness controls */}
                    <div className="space-y-2 pt-3">
                      {/* Host doesn't need to ready up, but other players do */}
                      {!isHost && (
                        <button
                          type="button"
                          onClick={handleReadyToggle}
                          className={`w-full py-2.5 px-4 rounded-xl font-bold font-mono text-xs uppercase tracking-wider transition-colors border ${
                            lobbyReady
                              ? 'bg-emerald-950/40 border-emerald-800 text-emerald-400 hover:bg-emerald-900/20'
                              : 'bg-amber-600 border-amber-500 text-zinc-950 hover:bg-amber-500'
                          }`}
                        >
                          {lobbyReady ? '✓ You Are Ready' : '⏳ Click To Ready Up'}
                        </button>
                      )}

                      {/* Start button for host */}
                      {isHost && (
                        <button
                          type="button"
                          onClick={handleStartGame}
                          className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 text-zinc-950 font-black font-mono text-xs uppercase tracking-wider transition-colors shadow-md"
                        >
                          ⚔️ Start Tug of War
                        </button>
                      )}

                      <button
                        type="button"
                        onClick={handleLeaveRoom}
                        className="w-full py-2 px-4 rounded-xl bg-zinc-950 border border-zinc-900 text-zinc-500 hover:text-zinc-300 font-medium font-mono text-[10px] uppercase transition-colors"
                      >
                        🚪 Leave Lobby
                      </button>
                    </div>
                  </div>
                </div>

              </div>
            )}

            {/* PRE-GAME START COUNTDOWN PHASE */}
            {room.status === 'STARTING' && (
              <div className="text-center py-24 space-y-6">
                <motion.div 
                  key={startCountdown}
                  initial={{ scale: 0.5, opacity: 0 }}
                  animate={{ scale: 1.5, opacity: 1 }}
                  className="text-8xl md:text-9xl font-black font-mono text-amber-500 drop-shadow"
                >
                  {startCountdown}
                </motion.div>
                <h2 className="text-xl font-black tracking-widest font-mono text-white uppercase animate-pulse">
                  Get ready! Tug of War is beginning...
                </h2>
              </div>
            )}

            {/* ACTIVE PLAY PHASE (QUESTION OR ROUND RESULT) */}
            {(room.status === 'QUESTION' || room.status === 'ROUND_RESULT') && (
              <div className="space-y-6">
                
                {/* Round Progress Bar */}
                <div className="flex items-center justify-between text-zinc-500 font-mono text-[10px] uppercase font-bold">
                  <span>ROUND {room.currentRound} OF {room.settings.rounds}</span>
                  <div className="w-1/2 bg-zinc-900 h-1.5 rounded-full overflow-hidden mx-4">
                    <div 
                      className="h-full bg-amber-500 transition-all duration-300"
                      style={{ width: `${(room.currentRound / room.settings.rounds) * 100}%` }}
                    />
                  </div>
                  <span>{Math.round((room.currentRound / room.settings.rounds) * 100)}% COMPLETE</span>
                </div>

                {/* Pulling Arena */}
                <TugOfWarArena 
                  room={room} 
                  pullAmount={lastRoundResults?.pullAmount}
                />

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  
                  {/* Core Answering Box / Round Result Box (Middle/Left) */}
                  <div className="lg:col-span-2 space-y-4">
                    {room.status === 'QUESTION' && room.currentQuestion && (
                      <AnsweringBoard
                        question={room.currentQuestion}
                        questionEndsAt={room.questionEndsAt}
                        questionStartedAt={room.questionStartedAt}
                        onAnswerSubmit={handleAnswerSubmit}
                        hasAnswered={hasAnswered}
                        selectedAnswer={selectedOption}
                      />
                    )}

                    {room.status === 'ROUND_RESULT' && lastRoundResults && (
                      <RoundResultBoard
                        room={room}
                        results={lastRoundResults}
                      />
                    )}
                  </div>

                  {/* Leaderboard and Emoji Reaction Board (Right Side) */}
                  <div className="space-y-4">
                    <LeaderboardPanel room={room} />
                    
                    <EmojiBoard 
                      onSendReaction={handleSendReaction}
                      activeReactions={activeReactions}
                    />
                    
                    <button
                      type="button"
                      onClick={handleLeaveRoom}
                      className="w-full py-2 px-4 rounded-xl bg-zinc-950 border border-zinc-900 text-zinc-500 hover:text-red-400 font-bold font-mono text-[10px] uppercase transition-colors"
                    >
                      🏳️ Surrender / Quit Match
                    </button>
                  </div>

                </div>

              </div>
            )}

            {/* FINAL RESULTS / FINISHED PODIUM PHASE */}
            {room.status === 'FINISHED' && (
              <FinalSummaryBoard
                room={room}
                historyRecord={historyRecord}
                isHost={isHost}
                onRematch={handleRematch}
                onReturnHome={handleReturnHome}
              />
            )}

          </div>
        )}

      </main>

      {/* --- FLOATING HELP MODALS --- */}
      <AnimatePresence>
        {showHowTo && (
          <HowToPlayModal onClose={() => setShowHowTo(false)} />
        )}

        {showHistoryModal && (
          <div className="fixed inset-0 bg-black/85 backdrop-blur-md z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-xl bg-zinc-900 border border-zinc-800 rounded-3xl p-6 relative overflow-hidden text-zinc-300 font-sans"
            >
              <div className="flex items-center justify-between border-b border-zinc-800 pb-3 mb-4">
                <h3 className="font-bold font-mono text-sm uppercase text-zinc-300">🏆 PAST GAME HISTORY RECORDS</h3>
                <button 
                  type="button" 
                  onClick={() => setShowHistoryModal(false)}
                  className="text-xs text-zinc-500 hover:text-zinc-300 font-mono uppercase"
                >
                  ✕ Close
                </button>
              </div>

              {globalHistory.length === 0 ? (
                <div className="py-12 text-center text-zinc-500 font-mono text-xs">
                  No completed game history found. Play a game to record the first match!
                </div>
              ) : (
                <div className="space-y-2 overflow-y-auto max-h-[50vh] pr-1.5 scrollbar-thin font-mono text-xs">
                  {globalHistory.map((h) => {
                    const date = new Date(h.finishedAt).toLocaleDateString();
                    return (
                      <div key={h.id} className="bg-zinc-950 border border-zinc-900 rounded-xl p-3 flex justify-between items-center">
                        <div className="space-y-1">
                          <span className="block text-white font-bold">👑 Winner: {h.winnerId}</span>
                          <span className="block text-[10px] text-zinc-500">
                            {date} • {h.rounds} Rounds • {h.difficulty} • Mode: {h.gameMode}
                          </span>
                        </div>
                        <div className="text-right">
                          <span className="text-[10px] bg-zinc-900 border border-zinc-800 px-2 py-0.5 rounded font-bold text-zinc-400">
                            Room {h.roomCode}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Footer credits */}
      <footer className="py-8 text-center text-[10px] text-zinc-600 font-mono border-t border-zinc-900 mt-12">
        <p>TUG OF WAR • ONLINE MULTIPLAYER EDUCATION GAME</p>
        <p className="mt-1">Crafted with precision & Web Audio API synthesis</p>
      </footer>
    </div>
  );
}
