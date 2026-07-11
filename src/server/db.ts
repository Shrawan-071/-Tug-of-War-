import fs from 'fs';
import path from 'path';
import { Question, GameHistory, Difficulty, Category } from '../types';
import { getInitialQuestions } from './questionsData';

const DATA_DIR = path.join(process.cwd(), 'data');
const DB_FILE = path.join(DATA_DIR, 'db.json');

interface Schema {
  questions: Question[];
  history: GameHistory[];
}

class FileDatabase {
  private cache: Schema = { questions: [], history: [] };

  constructor() {
    this.init();
  }

  private init() {
    try {
      if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
      }

      if (fs.existsSync(DB_FILE)) {
        const raw = fs.readFileSync(DB_FILE, 'utf-8');
        this.cache = JSON.parse(raw);
        console.log(`[DB] Database loaded from ${DB_FILE}. Questions: ${this.cache.questions.length}, History: ${this.cache.history.length}`);
      } else {
        console.log('[DB] No database file found. Seeding initial questions...');
        this.cache.questions = getInitialQuestions();
        this.cache.history = [];
        this.save();
        console.log(`[DB] Successfully seeded ${this.cache.questions.length} questions.`);
      }
    } catch (err) {
      console.error('[DB] Failed to initialize database, falling back to in-memory state:', err);
      this.cache.questions = getInitialQuestions();
      this.cache.history = [];
    }
  }

  private save() {
    try {
      fs.writeFileSync(DB_FILE, JSON.stringify(this.cache, null, 2), 'utf-8');
    } catch (err) {
      console.error('[DB] Error writing to database file:', err);
    }
  }

  public getQuestions(difficulty?: Difficulty, categories?: Category[]): Question[] {
    let list = this.cache.questions;
    if (difficulty) {
      list = list.filter(q => q.difficulty === difficulty);
    }
    if (categories && categories.length > 0) {
      list = list.filter(q => categories.includes(q.category));
    }
    return list;
  }

  public getQuestionById(id: string): Question | undefined {
    return this.cache.questions.find(q => q.id === id);
  }

  public addQuestion(question: Question) {
    this.cache.questions.push(question);
    this.save();
  }

  public deleteQuestion(id: string) {
    this.cache.questions = this.cache.questions.filter(q => q.id !== id);
    this.save();
  }

  public saveGameHistory(record: GameHistory) {
    this.cache.history.push(record);
    this.save();
    console.log(`[DB] Game history saved for room ${record.roomCode}, ID: ${record.id}`);
  }

  public getGameHistory(): GameHistory[] {
    return this.cache.history.sort((a, b) => b.finishedAt - a.finishedAt);
  }

  public getHistoryById(id: string): GameHistory | undefined {
    return this.cache.history.find(h => h.id === id);
  }
}

export const db = new FileDatabase();
export default db;
