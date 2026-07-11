import { RoomState, Player, GameSettings, ClientQuestion, Question, RoundResultData, PlayerResult, GameHistory, Category, Difficulty } from '../types';
import db from './db';

export const activeRooms: Record<string, RoomState> = {};

// Stores sessions for reconnection: token -> { player, roomCode, expiresAt }
export const disconnectedSessions: Record<string, { player: Player; roomCode: string; expiresAt: number }> = {};

const RECONNECT_GRACE_PERIOD_MS = 60000; // 60 seconds

// Generate random uppercase code
export function generateRoomCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // Avoid confusing letters like I, O, 1, 0
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

export function createRoom(hostNickname: string, hostAvatar: string, sessionId: string, socketId: string): RoomState {
  const roomCode = generateRoomCode();
  
  const hostPlayer: Player = {
    id: sessionId, // use sessionId as permanent player id for reconnection support
    socketId,
    sessionId,
    nickname: hostNickname,
    avatar: hostAvatar,
    connected: true,
    ready: true, // host is ready by default
    team: null,
    score: 0,
    correctAnswers: 0,
    wrongAnswers: 0,
    unanswered: 0,
    currentStreak: 0,
    bestStreak: 0,
    responseTimes: []
  };

  const defaultSettings: GameSettings = {
    gameMode: 'DUEL',
    difficulty: 'EASY',
    rounds: 5,
    categories: ['MATHEMATICS', 'LOGICAL_THINKING', 'PAHELI'],
    timeLimit: 20
  };

  const room: RoomState = {
    roomCode,
    hostPlayerId: hostPlayer.id,
    status: 'LOBBY',
    players: [hostPlayer],
    settings: defaultSettings,
    selectedQuestionIds: [],
    currentRound: 0,
    currentQuestion: null,
    questionStartedAt: 0,
    questionEndsAt: 0,
    submittedAnswers: {},
    ropePosition: 0,
    createdAt: Date.now()
  };

  // Auto-assign teams if game mode changes
  autoAssignTeams(room);

  activeRooms[roomCode] = room;
  return room;
}

export function getRoom(roomCode: string): RoomState | undefined {
  return activeRooms[roomCode.toUpperCase()];
}

// Auto balanced teams or assigning
export function autoAssignTeams(room: RoomState) {
  if (room.settings.gameMode === 'TEAMS') {
    let redCount = 0;
    let blueCount = 0;
    room.players.forEach((p, idx) => {
      if (idx % 2 === 0) {
        p.team = 'RED';
        redCount++;
      } else {
        p.team = 'BLUE';
        blueCount++;
      }
    });
  } else {
    // FFA/DUEL: clear teams or set standard dual side
    room.players.forEach((p, idx) => {
      p.team = idx === 0 ? 'RED' : 'BLUE'; // in Duel mode, left (Red) and right (Blue)
    });
  }
}

export function joinRoom(roomCode: string, nickname: string, avatar: string, sessionId: string, socketId: string): RoomState {
  const room = getRoom(roomCode);
  if (!room) {
    throw new Error('Room not found.');
  }

  if (room.status !== 'LOBBY') {
    throw new Error('This game has already started.');
  }

  // Prevent duplicate names
  const normalizedNickname = nickname.trim().toLowerCase();
  const nameExists = room.players.some(p => p.connected && p.nickname.trim().toLowerCase() === normalizedNickname && p.id !== sessionId);
  if (nameExists) {
    throw new Error('This nickname is already being used in this room.');
  }

  // Max players limit (e.g. 16 for teams, 2 for duel if desired, let's allow larger and balance)
  if (room.settings.gameMode === 'DUEL' && room.players.length >= 2) {
    // Note: prompt says for DUEL it is exactly 2, but we can auto scale or throw if full
    throw new Error('This Duel room is full. Exactly 2 players are allowed.');
  }

  // Find if player is reconnecting
  const existingPlayerIdx = room.players.findIndex(p => p.id === sessionId);
  if (existingPlayerIdx >= 0) {
    const p = room.players[existingPlayerIdx];
    p.socketId = socketId;
    p.connected = true;
    p.nickname = nickname; // update name
    p.avatar = avatar; // update avatar
  } else {
    const newPlayer: Player = {
      id: sessionId,
      socketId,
      sessionId,
      nickname,
      avatar,
      connected: true,
      ready: false,
      team: null,
      score: 0,
      correctAnswers: 0,
      wrongAnswers: 0,
      unanswered: 0,
      currentStreak: 0,
      bestStreak: 0,
      responseTimes: []
    };
    room.players.push(newPlayer);
  }

  autoAssignTeams(room);
  return room;
}

export function leaveRoom(roomCode: string, playerId: string): { room: RoomState | null; hostChanged: boolean; newHostId: string | null; destroyed: boolean } {
  const room = getRoom(roomCode);
  if (!room) {
    return { room: null, hostChanged: false, newHostId: null, destroyed: true };
  }

  // Find player
  const playerIdx = room.players.findIndex(p => p.id === playerId);
  if (playerIdx === -1) {
    return { room, hostChanged: false, newHostId: null, destroyed: false };
  }

  const leavingPlayer = room.players[playerIdx];
  
  // If game is in LOBBY, remove permanently. If active, mark as disconnected for grace period
  let hostChanged = false;
  let newHostId: string | null = null;
  let destroyed = false;

  if (room.status === 'LOBBY') {
    room.players.splice(playerIdx, 1);
    autoAssignTeams(room);

    if (room.players.length === 0) {
      delete activeRooms[roomCode];
      destroyed = true;
    } else if (room.hostPlayerId === playerId) {
      // Transfer host
      const nextActive = room.players.find(p => p.connected);
      if (nextActive) {
        room.hostPlayerId = nextActive.id;
        nextActive.ready = true; // host is always ready
        hostChanged = true;
        newHostId = nextActive.id;
      } else {
        delete activeRooms[roomCode];
        destroyed = true;
      }
    }
  } else {
    // Active game: Mark disconnected, trigger grace timer
    leavingPlayer.connected = false;
    
    // Register in disconnectedSessions cache
    disconnectedSessions[playerId] = {
      player: leavingPlayer,
      roomCode,
      expiresAt: Date.now() + RECONNECT_GRACE_PERIOD_MS
    };

    // If host disconnected, temporarily assign to another active player
    if (room.hostPlayerId === playerId) {
      const nextActive = room.players.find(p => p.connected);
      if (nextActive) {
        room.hostPlayerId = nextActive.id;
        hostChanged = true;
        newHostId = nextActive.id;
      }
    }
  }

  return { room, hostChanged, newHostId, destroyed };
}

export function cleanExpiredSessions() {
  const now = Date.now();
  for (const sessionId in disconnectedSessions) {
    const session = disconnectedSessions[sessionId];
    if (now > session.expiresAt) {
      // Session expired. Remove from the actual room
      const room = getRoom(session.roomCode);
      if (room) {
        room.players = room.players.filter(p => p.id !== sessionId);
        if (room.players.length === 0) {
          delete activeRooms[session.roomCode];
          console.log(`[GameManager] Deleted empty room ${session.roomCode} after player session expiry.`);
        } else {
          // If the expired was host, delegate
          if (room.hostPlayerId === sessionId) {
            const nextActive = room.players.find(p => p.connected);
            if (nextActive) {
              room.hostPlayerId = nextActive.id;
            }
          }
          autoAssignTeams(room);
        }
      }
      delete disconnectedSessions[sessionId];
    }
  }
}

export function setPlayerReady(roomCode: string, playerId: string, ready: boolean): RoomState {
  const room = getRoom(roomCode);
  if (!room) throw new Error('Room not found.');
  
  const player = room.players.find(p => p.id === playerId);
  if (!player) throw new Error('Player not found in room.');

  // Host cannot toggle ready, host is always ready
  if (room.hostPlayerId === playerId) {
    player.ready = true;
  } else {
    player.ready = ready;
  }
  return room;
}

export function updateSettings(roomCode: string, hostPlayerId: string, settings: GameSettings): RoomState {
  const room = getRoom(roomCode);
  if (!room) throw new Error('Room not found.');
  if (room.hostPlayerId !== hostPlayerId) {
    throw new Error('Only the host can modify game settings.');
  }
  if (room.status !== 'LOBBY') {
    throw new Error('Cannot change settings once game has started.');
  }

  // Validate settings
  if (settings.rounds < 1 || settings.rounds > 50) {
    throw new Error('Rounds must be between 1 and 50.');
  }
  if (![10, 15, 20, 30].includes(settings.timeLimit)) {
    throw new Error('Invalid question time limit.');
  }

  room.settings = settings;
  autoAssignTeams(room);
  return room;
}

export function initializeGame(roomCode: string, hostPlayerId: string): RoomState {
  const room = getRoom(roomCode);
  if (!room) throw new Error('Room not found.');
  if (room.hostPlayerId !== hostPlayerId) {
    throw new Error('Only the host can start the game.');
  }

  // Validate players
  const activePlayers = room.players.filter(p => p.connected);
  if (activePlayers.length < 2) {
    throw new Error('At least 2 players are required to start the game.');
  }

  // Check if everyone is ready
  const unready = room.players.filter(p => p.connected && !p.ready && p.id !== room.hostPlayerId);
  if (unready.length > 0) {
    throw new Error('Wait for all connected players to be ready.');
  }

  // Fetch eligible questions
  const eligibleQuestions = db.getQuestions(room.settings.difficulty, room.settings.categories);
  if (eligibleQuestions.length < room.settings.rounds) {
    throw new Error(`Insufficient questions available. Only ${eligibleQuestions.length} matched your criteria.`);
  }

  // Shuffle and select random questions
  const shuffled = eligibleQuestions.sort(() => Math.random() - 0.5);
  room.selectedQuestionIds = shuffled.slice(0, room.settings.rounds).map(q => q.id);
  
  // Reset all stats
  room.players.forEach(p => {
    p.score = 0;
    p.correctAnswers = 0;
    p.wrongAnswers = 0;
    p.unanswered = 0;
    p.currentStreak = 0;
    p.bestStreak = 0;
    p.responseTimes = [];
  });

  room.currentRound = 0;
  room.ropePosition = 0;
  room.status = 'STARTING';
  
  return room;
}

export function startRound(roomCode: string): RoomState {
  const room = getRoom(roomCode);
  if (!room) throw new Error('Room not found.');
  
  room.currentRound += 1;
  room.submittedAnswers = {};
  room.status = 'QUESTION';

  const questionId = room.selectedQuestionIds[room.currentRound - 1];
  const q = db.getQuestionById(questionId);
  if (!q) {
    throw new Error(`Question not found for ID: ${questionId}`);
  }

  // Build client question (safe copy)
  const clientQ: ClientQuestion = {
    id: q.id,
    questionText: q.questionText,
    difficulty: q.difficulty,
    category: q.category,
    subcategory: q.subcategory,
    options: q.options,
    defaultTimeLimit: q.defaultTimeLimit
  };

  room.currentQuestion = clientQ;
  
  const durationMs = room.settings.timeLimit * 1000;
  room.questionStartedAt = Date.now();
  room.questionEndsAt = room.questionStartedAt + durationMs;

  return room;
}

export function submitAnswer(roomCode: string, playerId: string, option: string, clientResponseTime?: number): { room: RoomState; allAnswered: boolean } {
  const room = getRoom(roomCode);
  if (!room) throw new Error('Room not found.');
  if (room.status !== 'QUESTION') {
    throw new Error('Answers are only accepted during the question phase.');
  }

  const player = room.players.find(p => p.id === playerId);
  if (!player) throw new Error('Player not in this room.');
  if (!player.connected) throw new Error('Disconnected players cannot submit answers.');

  if (room.submittedAnswers[playerId]) {
    throw new Error('You have already submitted an answer for this round.');
  }

  const now = Date.now();
  if (now > room.questionEndsAt) {
    throw new Error('Time has expired for this question.');
  }

  // Calculate response time server-side for anti-cheat and absolute validation
  const calculatedResponseTime = Math.max(0, now - room.questionStartedAt);
  // Use server calculation, but if client sends reasonable response time, we can bound it
  const finalResponseTime = clientResponseTime && Math.abs(clientResponseTime - calculatedResponseTime) < 2000 
    ? clientResponseTime 
    : calculatedResponseTime;

  room.submittedAnswers[playerId] = {
    option,
    responseTime: finalResponseTime
  };

  // Check if all connected players have answered
  const connectedPlayers = room.players.filter(p => p.connected);
  const allAnswered = connectedPlayers.every(p => room.submittedAnswers[p.id] !== undefined);

  return { room, allAnswered };
}

export function calculateRoundResults(roomCode: string): { room: RoomState; results: RoundResultData } {
  const room = getRoom(roomCode);
  if (!room) throw new Error('Room not found.');
  if (room.status !== 'QUESTION') {
    throw new Error('Cannot compute results outside of answering phase.');
  }

  const questionId = room.selectedQuestionIds[room.currentRound - 1];
  const q = db.getQuestionById(questionId);
  if (!q) throw new Error('Question not found.');

  room.status = 'ROUND_RESULT';

  const playerResults: PlayerResult[] = [];
  let netPull = 0; // Negative pulls left (Red/P1), Positive pulls right (Blue/P2)

  // Scores computed for this round specifically
  const roundScores: Record<string, number> = {};

  const connectedPlayers = room.players.filter(p => p.connected);
  
  room.players.forEach(p => {
    const submission = room.submittedAnswers[p.id];
    let isCorrect = false;
    let pointsEarned = 0;
    let ans: string | null = null;
    let rt = 0;

    if (submission) {
      ans = submission.option;
      rt = submission.responseTime;
      isCorrect = (ans === q.correctAnswer);
      p.responseTimes.push(rt);

      if (isCorrect) {
        p.correctAnswers += 1;
        p.currentStreak += 1;
        p.bestStreak = Math.max(p.bestStreak, p.currentStreak);

        // Score Formula: Base (100) + Speed (max 50) + Streak (max 40)
        const baseScore = 100;
        
        // Speed bonus
        const totalTimeMs = room.settings.timeLimit * 1000;
        const remainingTime = Math.max(0, totalTimeMs - rt);
        const speedBonus = Math.round(50 * (remainingTime / totalTimeMs));

        // Streak bonus
        let streakBonus = 0;
        if (p.currentStreak === 2) streakBonus = 10;
        else if (p.currentStreak === 3) streakBonus = 20;
        else if (p.currentStreak === 4) streakBonus = 30;
        else if (p.currentStreak >= 5) streakBonus = 40;

        pointsEarned = baseScore + speedBonus + streakBonus;
      } else {
        p.wrongAnswers += 1;
        p.currentStreak = 0;
      }
    } else {
      // Unanswered
      p.unanswered += 1;
      p.currentStreak = 0;
    }

    p.score += pointsEarned;
    roundScores[p.id] = pointsEarned;

    playerResults.push({
      playerId: p.id,
      nickname: p.nickname,
      avatar: p.avatar,
      team: p.team,
      answer: ans,
      isCorrect,
      pointsEarned,
      responseTime: rt,
      streak: p.currentStreak,
      score: p.score
    });
  });

  // Calculate Tug-Of-War Rope Movement!
  // Mode 1: DUEL (exactly 2 players, P1 is Red/Left, P2 is Blue/Right)
  if (room.settings.gameMode === 'DUEL' && room.players.length === 2) {
    const p1 = room.players[0];
    const p2 = room.players[1];
    const p1RoundScore = roundScores[p1.id] || 0;
    const p2RoundScore = roundScores[p2.id] || 0;

    // Pull represents net round performance. Let's make it a nice, visible step
    // Max single round pull can be around 25% of rope length
    // Net pull = (P2 score - P1 score) * scale
    // P2 is Right (positive), P1 is Left (negative)
    netPull = (p2RoundScore - p1RoundScore) * 0.15;
  }
  // Mode 2: TEAM BATTLE (Red vs Blue)
  else if (room.settings.gameMode === 'TEAMS') {
    const redPlayers = room.players.filter(p => p.team === 'RED');
    const bluePlayers = room.players.filter(p => p.team === 'BLUE');

    const totalRedRound = redPlayers.reduce((acc, p) => acc + (roundScores[p.id] || 0), 0);
    const totalBlueRound = bluePlayers.reduce((acc, p) => acc + (roundScores[p.id] || 0), 0);

    const avgRed = redPlayers.length > 0 ? totalRedRound / redPlayers.length : 0;
    const avgBlue = bluePlayers.length > 0 ? totalBlueRound / bluePlayers.length : 0;

    // Blue is Right (+), Red is Left (-)
    netPull = (avgBlue - avgRed) * 0.15;
  }
  // Mode 1 FFA variant (Multiplayer Individual): Top #1 vs Top #2 pulling
  else {
    const sorted = [...room.players].sort((a, b) => b.score - a.score);
    if (sorted.length >= 2) {
      const top = sorted[0];
      const second = sorted[1];
      // Top player pulls right (+), second pulls left (-)
      const topRound = roundScores[top.id] || 0;
      const secondRound = roundScores[second.id] || 0;
      netPull = (topRound - secondRound) * 0.12;
    }
  }

  // Update rope position with bounds
  const prevPosition = room.ropePosition;
  room.ropePosition = Math.max(-100, Math.min(100, room.ropePosition + netPull));
  const actualPull = room.ropePosition - prevPosition;

  const results: RoundResultData = {
    round: room.currentRound,
    correctAnswer: q.correctAnswer,
    explanation: q.explanation,
    playerResults,
    ropePosition: room.ropePosition,
    pullAmount: Number(actualPull.toFixed(2))
  };

  return { room, results };
}

export function saveCompletedGame(roomCode: string): GameHistory {
  const room = getRoom(roomCode);
  if (!room) throw new Error('Room not found.');

  // Rank players
  const rankedPlayers = [...room.players].sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;
    if (b.correctAnswers !== a.correctAnswers) return b.correctAnswers - a.correctAnswers;
    const avgA = a.responseTimes.length > 0 ? a.responseTimes.reduce((s, x) => s + x, 0) / a.responseTimes.length : Infinity;
    const avgB = b.responseTimes.length > 0 ? b.responseTimes.reduce((s, x) => s + x, 0) / b.responseTimes.length : Infinity;
    return avgA - avgB;
  });

  const finalResults = rankedPlayers.map((p, idx) => {
    const avgRt = p.responseTimes.length > 0 ? Math.round(p.responseTimes.reduce((s, x) => s + x, 0) / p.responseTimes.length) : 0;
    const totalAns = p.correctAnswers + p.wrongAnswers;
    const accuracy = totalAns > 0 ? Math.round((p.correctAnswers / totalAns) * 100) : 0;

    return {
      id: `${roomCode}-${p.id}`,
      gameId: roomCode,
      playerName: p.nickname,
      finalScore: p.score,
      correctAnswers: p.correctAnswers,
      wrongAnswers: p.wrongAnswers,
      unanswered: p.unanswered,
      accuracy,
      averageResponseTime: avgRt,
      bestStreak: p.bestStreak,
      finalRank: idx + 1
    };
  });

  let winnerName = 'Tie';
  if (room.settings.gameMode === 'TEAMS') {
    // Red vs Blue based on final score
    const redScore = room.players.filter(p => p.team === 'RED').reduce((s, p) => s + p.score, 0);
    const blueScore = room.players.filter(p => p.team === 'BLUE').reduce((s, p) => s + p.score, 0);
    if (blueScore > redScore) {
      winnerName = 'TEAM BLUE';
    } else if (redScore > blueScore) {
      winnerName = 'TEAM RED';
    } else {
      winnerName = 'Draw';
    }
  } else if (rankedPlayers.length > 0) {
    winnerName = rankedPlayers[0].nickname;
  }

  const record: GameHistory = {
    id: `history-${roomCode}-${Date.now()}`,
    roomCode,
    gameMode: room.settings.gameMode,
    difficulty: room.settings.difficulty,
    rounds: room.settings.rounds,
    startedAt: room.createdAt,
    finishedAt: Date.now(),
    winnerId: winnerName,
    playerResults: finalResults
  };

  db.saveGameHistory(record);
  room.status = 'FINISHED';

  return record;
}

export function resetRoomForRematch(roomCode: string, playerId: string): RoomState {
  const room = getRoom(roomCode);
  if (!room) throw new Error('Room not found.');
  if (room.hostPlayerId !== playerId) {
    throw new Error('Only the host can request a rematch.');
  }

  // Fetch eligible questions excluding previous selected ones if possible
  const eligibleQuestions = db.getQuestions(room.settings.difficulty, room.settings.categories);
  const unspentQuestions = eligibleQuestions.filter(q => !room.selectedQuestionIds.includes(q.id));
  
  const pool = unspentQuestions.length >= room.settings.rounds ? unspentQuestions : eligibleQuestions;
  const shuffled = pool.sort(() => Math.random() - 0.5);
  room.selectedQuestionIds = shuffled.slice(0, room.settings.rounds).map(q => q.id);

  // Reset player scores
  room.players.forEach(p => {
    p.score = 0;
    p.correctAnswers = 0;
    p.wrongAnswers = 0;
    p.unanswered = 0;
    p.currentStreak = 0;
    p.bestStreak = 0;
    p.responseTimes = [];
    p.ready = (p.id === room.hostPlayerId); // host is automatically ready, others must click ready
  });

  room.currentRound = 0;
  room.currentQuestion = null;
  room.ropePosition = 0;
  room.submittedAnswers = {};
  room.status = 'LOBBY';

  return room;
}
