import express from 'express';
import http from 'http';
import path from 'path';
import { Server as SocketServer, Socket } from 'socket.io';
import { createServer as createViteServer } from 'vite';
import { db } from './src/server/db';
import * as GameManager from './src/server/gameManager';
import { GameSettings } from './src/types';

const PORT = Number(process.env.PORT) || 3000;
const app = express();
const server = http.createServer(app);

// Enable JSON parsing
app.use(express.json());

// API Routes
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: Date.now() });
});

// Get completed game history
app.get('/api/history', (req, res) => {
  try {
    const history = db.getGameHistory();
    res.json(history);
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to fetch history' });
  }
});

// Get history item details
app.get('/api/history/:id', (req, res) => {
  try {
    const item = db.getHistoryById(req.params.id);
    if (!item) {
      return res.status(404).json({ error: 'Game history not found' });
    }
    res.json(item);
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to fetch record' });
  }
});

// Get summary stats of questions
app.get('/api/questions/stats', (req, res) => {
  try {
    const all = db.getQuestions();
    const stats = {
      total: all.length,
      easy: all.filter(q => q.difficulty === 'EASY').length,
      medium: all.filter(q => q.difficulty === 'MEDIUM').length,
      hard: all.filter(q => q.difficulty === 'HARD').length,
      mathematics: all.filter(q => q.category === 'MATHEMATICS').length,
      logical: all.filter(q => q.category === 'LOGICAL_THINKING').length,
      paheli: all.filter(q => q.category === 'PAHELI').length
    };
    res.json(stats);
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to fetch stats' });
  }
});

// Set up Socket.IO server
const io = new SocketServer(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  },
  pingTimeout: 30000,
  pingInterval: 15000
});

// In-memory record of socketId -> sessionId mapping to handle abrupt disconnects
const socketToSession: Record<string, { sessionId: string; roomCode: string }> = {};

// Active round timers to automatically end questions when time limit expires
const activeRoundTimers: Record<string, NodeJS.Timeout> = {};

function clearRoundTimer(roomCode: string) {
  if (activeRoundTimers[roomCode]) {
    clearTimeout(activeRoundTimers[roomCode]);
    delete activeRoundTimers[roomCode];
  }
}

// Authoritative function to execute the end of a question round
function triggerRoundEnd(roomCode: string) {
  clearRoundTimer(roomCode);
  try {
    const room = GameManager.getRoom(roomCode);
    if (!room || room.status !== 'QUESTION') return;

    // Calculate scores, streaks, and rope shifts
    const { room: updatedRoom, results } = GameManager.calculateRoundResults(roomCode);
    
    // Broadcast round ends, exposing correct answer, explanation, and results
    io.to(roomCode).emit('round:ended', results);
    io.to(roomCode).emit('room:updated', updatedRoom);

    // Schedule transition to the next round or finishing the game after a pleasant delay
    // Let's give players 10 seconds to read the explanation and view results
    activeRoundTimers[roomCode] = setTimeout(() => {
      triggerNextStep(roomCode);
    }, 10000);
  } catch (err: any) {
    console.error(`[Socket] Error ending round for room ${roomCode}:`, err);
    io.to(roomCode).emit('game:error', { message: err.message || 'Error processing round result' });
  }
}

// Transition from Round Result screen to either next question or final podium
function triggerNextStep(roomCode: string) {
  clearRoundTimer(roomCode);
  try {
    const room = GameManager.getRoom(roomCode);
    if (!room) return;

    if (room.currentRound < room.settings.rounds) {
      // Start next round
      const updatedRoom = GameManager.startRound(roomCode);
      io.to(roomCode).emit('room:updated', updatedRoom);
      
      // Send separate round start event so clients synchronize their local timers
      io.to(roomCode).emit('round:started', {
        question: updatedRoom.currentQuestion,
        questionStartedAt: updatedRoom.questionStartedAt,
        questionEndsAt: updatedRoom.questionEndsAt
      });

      // Schedule the next automatic end timer
      const durationMs = room.settings.timeLimit * 1000;
      activeRoundTimers[roomCode] = setTimeout(() => {
        triggerRoundEnd(roomCode);
      }, durationMs);

    } else {
      // No more rounds! Save game and show final winners
      const historyRecord = GameManager.saveCompletedGame(roomCode);
      io.to(roomCode).emit('game:finished', historyRecord);
      io.to(roomCode).emit('room:updated', room);
    }
  } catch (err: any) {
    console.error(`[Socket] Error stepping forward in room ${roomCode}:`, err);
    io.to(roomCode).emit('game:error', { message: err.message || 'Error advancing round' });
  }
}

io.on('connection', (socket: Socket) => {
  console.log(`[Socket] Client connected: ${socket.id}`);

  // Create room
  socket.on('room:create', ({ nickname, avatar, sessionId }, callback) => {
    try {
      if (!nickname || nickname.trim().length < 2 || nickname.trim().length > 20) {
        return callback({ error: 'Nickname must be between 2 and 20 characters.' });
      }
      const room = GameManager.createRoom(nickname, avatar, sessionId, socket.id);
      
      socket.join(room.roomCode);
      socketToSession[socket.id] = { sessionId, roomCode: room.roomCode };
      
      console.log(`[Socket] Room created: ${room.roomCode} by host: ${nickname}`);
      callback({ roomCode: room.roomCode, room });
    } catch (err: any) {
      callback({ error: err.message || 'Failed to create room.' });
    }
  });

  // Join room
  socket.on('room:join', ({ roomCode, nickname, avatar, sessionId }, callback) => {
    try {
      if (!roomCode) {
        return callback({ error: 'Room code is required.' });
      }
      if (!nickname || nickname.trim().length < 2 || nickname.trim().length > 20) {
        return callback({ error: 'Nickname must be between 2 and 20 characters.' });
      }

      const formattedCode = roomCode.toUpperCase().trim();
      const room = GameManager.joinRoom(formattedCode, nickname, avatar, sessionId, socket.id);
      
      socket.join(formattedCode);
      socketToSession[socket.id] = { sessionId, roomCode: formattedCode };
      
      // If player was in disconnectedSessions cache, clean it
      if (GameManager.disconnectedSessions[sessionId]) {
        delete GameManager.disconnectedSessions[sessionId];
      }

      console.log(`[Socket] Player ${nickname} joined room: ${formattedCode}`);
      
      // Notify other players
      socket.to(formattedCode).emit('player:joined', { nickname, avatar, id: sessionId });
      
      // Broadcast updated room state
      io.to(formattedCode).emit('room:updated', room);
      
      callback({ room });
    } catch (err: any) {
      callback({ error: err.message || 'Failed to join room.' });
    }
  });

  // Manual ready toggle
  socket.on('player:ready', ({ roomCode, sessionId, ready }, callback) => {
    try {
      const room = GameManager.setPlayerReady(roomCode, sessionId, ready);
      io.to(roomCode.toUpperCase()).emit('room:updated', room);
      if (callback) callback({ success: true });
    } catch (err: any) {
      if (callback) callback({ error: err.message });
    }
  });

  // Host update game settings
  socket.on('settings:update', ({ roomCode, sessionId, settings }, callback) => {
    try {
      const room = GameManager.updateSettings(roomCode, sessionId, settings);
      io.to(roomCode.toUpperCase()).emit('room:updated', room);
      if (callback) callback({ success: true });
    } catch (err: any) {
      if (callback) callback({ error: err.message });
    }
  });

  // Host starts the game
  socket.on('game:start', ({ roomCode, sessionId }, callback) => {
    try {
      const room = GameManager.initializeGame(roomCode, sessionId);
      io.to(roomCode.toUpperCase()).emit('room:updated', room);
      
      // Broadcast game started
      io.to(roomCode.toUpperCase()).emit('game:started');
      
      // Set a small delay (3 seconds starting countdown) to let clients show "GAME STARTING..."
      setTimeout(() => {
        try {
          const updatedRoom = GameManager.startRound(roomCode);
          io.to(roomCode.toUpperCase()).emit('room:updated', updatedRoom);
          
          // Broadcast round started
          io.to(roomCode.toUpperCase()).emit('round:started', {
            question: updatedRoom.currentQuestion,
            questionStartedAt: updatedRoom.questionStartedAt,
            questionEndsAt: updatedRoom.questionEndsAt
          });

          // Schedule auto-end timer
          const durationMs = updatedRoom.settings.timeLimit * 1000;
          activeRoundTimers[roomCode.toUpperCase()] = setTimeout(() => {
            triggerRoundEnd(roomCode.toUpperCase());
          }, durationMs);

        } catch (subErr: any) {
          io.to(roomCode.toUpperCase()).emit('game:error', { message: subErr.message });
        }
      }, 3000);

      if (callback) callback({ success: true });
    } catch (err: any) {
      if (callback) callback({ error: err.message });
    }
  });

  // Submit Answer
  socket.on('answer:submit', ({ roomCode, sessionId, option, responseTime }, callback) => {
    try {
      const formattedCode = roomCode.toUpperCase().trim();
      const { room, allAnswered } = GameManager.submitAnswer(formattedCode, sessionId, option, responseTime);
      
      // Acknowledge submission to sender
      socket.emit('answer:accepted', { option });
      
      // Sync room state to let others see "Answer Locked" status (excluding correct/wrong indicators)
      io.to(formattedCode).emit('room:updated', room);

      if (allAnswered) {
        // Everyone has answered early! End the round instantly!
        console.log(`[Socket] All players answered early in room ${formattedCode}. Triggering calculation.`);
        triggerRoundEnd(formattedCode);
      }

      if (callback) callback({ success: true });
    } catch (err: any) {
      if (callback) callback({ error: err.message });
    }
  });

  // Send reaction (emoji)
  socket.on('reaction:send', ({ roomCode, sessionId, emoji }) => {
    try {
      const formattedCode = roomCode.toUpperCase().trim();
      const room = GameManager.getRoom(formattedCode);
      if (!room) return;

      const player = room.players.find(p => p.id === sessionId);
      if (!player) return;

      // Broadcast emoji reaction to all players in the room
      io.to(formattedCode).emit('reaction:received', {
        id: `react-${Date.now()}-${Math.random()}`,
        playerId: sessionId,
        nickname: player.nickname,
        emoji
      });
    } catch (err) {
      // Fail silently for non-critical features
    }
  });

  // Request Rematch
  socket.on('game:rematch', ({ roomCode, sessionId }, callback) => {
    try {
      const formattedCode = roomCode.toUpperCase().trim();
      const room = GameManager.resetRoomForRematch(formattedCode, sessionId);
      clearRoundTimer(formattedCode);
      
      io.to(formattedCode).emit('room:updated', room);
      io.to(formattedCode).emit('game:rematched');
      
      if (callback) callback({ success: true });
    } catch (err: any) {
      if (callback) callback({ error: err.message });
    }
  });

  // Manual Room Leaving
  socket.on('room:leave', ({ roomCode, sessionId }, callback) => {
    try {
      const formattedCode = roomCode.toUpperCase().trim();
      const { room, hostChanged, newHostId, destroyed } = GameManager.leaveRoom(formattedCode, sessionId);
      
      socket.leave(formattedCode);
      delete socketToSession[socket.id];

      if (!destroyed && room) {
        socket.to(formattedCode).emit('player:left', { id: sessionId });
        if (hostChanged && newHostId) {
          const hostPlayer = room.players.find(p => p.id === newHostId);
          io.to(formattedCode).emit('host:changed', { 
            id: newHostId, 
            nickname: hostPlayer ? hostPlayer.nickname : 'Another Player' 
          });
        }
        io.to(formattedCode).emit('room:updated', room);
      }
      if (callback) callback({ success: true });
    } catch (err: any) {
      if (callback) callback({ error: err.message });
    }
  });

  // Disconnection handler
  socket.on('disconnect', () => {
    console.log(`[Socket] Client disconnected: ${socket.id}`);
    
    const mapping = socketToSession[socket.id];
    if (mapping) {
      const { sessionId, roomCode } = mapping;
      delete socketToSession[socket.id];

      // Mark player as offline, trigger grace period
      const { room, hostChanged, newHostId, destroyed } = GameManager.leaveRoom(roomCode, sessionId);
      
      if (!destroyed && room) {
        socket.to(roomCode).emit('player:offline', { id: sessionId });
        if (hostChanged && newHostId) {
          const hostPlayer = room.players.find(p => p.id === newHostId);
          io.to(roomCode).emit('host:changed', { 
            id: newHostId, 
            nickname: hostPlayer ? hostPlayer.nickname : 'Another Player' 
          });
        }
        io.to(roomCode).emit('room:updated', room);
      }
    }
  });
});

// Periodically clean expired sessions (every 10 seconds)
setInterval(() => {
  GameManager.cleanExpiredSessions();
}, 10000);

// Set up Vite or static serving
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  server.listen(PORT, '0.0.0.0', () => {
    console.log(`[Server] Tug of War server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
