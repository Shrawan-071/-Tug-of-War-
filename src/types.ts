export type Difficulty = 'EASY' | 'MEDIUM' | 'HARD';
export type Category = 'MATHEMATICS' | 'LOGICAL_THINKING' | 'PAHELI';
export type GameMode = 'DUEL' | 'TEAMS';
export type RoomStatus = 'LOBBY' | 'STARTING' | 'QUESTION' | 'ROUND_RESULT' | 'FINISHED';

export interface Question {
  id: string;
  questionText: string;
  difficulty: Difficulty;
  category: Category;
  subcategory: string;
  options: string[];
  correctAnswer: string;
  explanation: string;
  language: string;
  defaultTimeLimit: number;
  active: boolean;
  createdAt: number;
  updatedAt?: number;
}

// Question object sent to client (doesn't expose correctAnswer or explanation)
export interface ClientQuestion {
  id: string;
  questionText: string;
  difficulty: Difficulty;
  category: Category;
  subcategory: string;
  options: string[];
  defaultTimeLimit: number;
}

export interface GameSettings {
  gameMode: GameMode;
  difficulty: Difficulty;
  rounds: number;
  categories: Category[];
  timeLimit: number; // in seconds
}

export interface Player {
  id: string;
  socketId: string;
  sessionId: string;
  nickname: string;
  avatar: string;
  connected: boolean;
  ready: boolean;
  team: 'RED' | 'BLUE' | null;
  score: number;
  correctAnswers: number;
  wrongAnswers: number;
  unanswered: number;
  currentStreak: number;
  bestStreak: number;
  responseTimes: number[]; // array of response time in ms for current game
}

export interface PlayerResult {
  playerId: string;
  nickname: string;
  avatar: string;
  team: 'RED' | 'BLUE' | null;
  answer: string | null; // what they chose, null if No Answer
  isCorrect: boolean;
  pointsEarned: number;
  responseTime: number; // in ms
  streak: number;
  score: number;
}

export interface RoundResultData {
  round: number;
  correctAnswer: string;
  explanation: string;
  playerResults: PlayerResult[];
  ropePosition: number;
  pullAmount: number; // amount rope moved this round (+ for right, - for left)
}

export interface RoomState {
  roomCode: string;
  hostPlayerId: string;
  status: RoomStatus;
  players: Player[];
  settings: GameSettings;
  selectedQuestionIds: string[];
  currentRound: number; // 1-indexed
  currentQuestion: ClientQuestion | null;
  questionStartedAt: number; // server timestamp (ms)
  questionEndsAt: number; // server timestamp (ms)
  submittedAnswers: Record<string, { option: string; responseTime: number }>; // key: playerId
  ropePosition: number; // -100 (left player/red team) to +100 (right player/blue team)
  createdAt: number;
}

export interface GameHistory {
  id: string;
  roomCode: string;
  gameMode: GameMode;
  difficulty: Difficulty;
  rounds: number;
  startedAt: number;
  finishedAt: number;
  winnerId: string; // nickname, team name, etc.
  playerResults: PlayerGameResult[];
}

export interface PlayerGameResult {
  id: string;
  gameId: string;
  playerName: string;
  finalScore: number;
  correctAnswers: number;
  wrongAnswers: number;
  unanswered: number;
  accuracy: number; // percentage (0 - 100)
  averageResponseTime: number; // in ms
  bestStreak: number;
  finalRank: number;
}

export interface EmojiReaction {
  id: string;
  playerId: string;
  nickname: string;
  emoji: string;
  createdAt: number;
}
