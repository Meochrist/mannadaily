// SQLite Database Service — better-sqlite3 (Node.js natif)
// Ce fichier ne doit JAMAIS être importé dans des composants client
import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';

let dbInstance: Database.Database | null = null;

export function getServerDb(): Database.Database {
  if (dbInstance) return dbInstance;
  
  const dataDir = path.join(process.cwd(), 'data');
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }
  
  const dbPath = path.join(dataDir, 'mannadaily.db');
  dbInstance = new Database(dbPath);
  dbInstance.pragma('journal_mode = WAL');
  dbInstance.pragma('foreign_keys = ON');
  return dbInstance;
}

export function initServerDb(): Database.Database {
  const db = getServerDb();
  
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      name TEXT,
      email TEXT UNIQUE,
      emailVerified TEXT,
      password TEXT,
      image TEXT,
      createdAt TEXT DEFAULT (datetime('now')),
      updatedAt TEXT DEFAULT (datetime('now')),
      notificationTime TEXT DEFAULT '19:00',
      readingReminders INTEGER DEFAULT 1,
      timezoneOffset INTEGER,
      onboardingCompleted INTEGER DEFAULT 0,
      favoriteMascot TEXT,
      isPremium INTEGER DEFAULT 0,
      premiumUntil TEXT,
      meditationProgress TEXT
    );

    CREATE TABLE IF NOT EXISTS daily_sessions (
      id TEXT PRIMARY KEY,
      userId TEXT NOT NULL,
      type TEXT DEFAULT 'classic',
      period TEXT DEFAULT 'morning',
      activityDate TEXT NOT NULL,
      xpEarned INTEGER DEFAULT 0,
      duration INTEGER DEFAULT 0,
      notes TEXT,
      createdAt TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE,
      UNIQUE(userId, activityDate, period)
    );

    CREATE TABLE IF NOT EXISTS streaks (
      id TEXT PRIMARY KEY,
      userId TEXT UNIQUE NOT NULL,
      currentStreak INTEGER DEFAULT 0,
      longestStreak INTEGER DEFAULT 0,
      lastActivityAt TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS user_progress (
      id TEXT PRIMARY KEY,
      userId TEXT UNIQUE NOT NULL,
      totalXP INTEGER DEFAULT 0,
      level TEXT DEFAULT 'Semence',
      versesLearned INTEGER DEFAULT 0,
      sessionsTotal INTEGER DEFAULT 0,
      lingots INTEGER DEFAULT 0,
      morningSessionToday INTEGER DEFAULT 0,
      middaySessionToday INTEGER DEFAULT 0,
      eveningSessionToday INTEGER DEFAULT 0,
      lastSessionDate TEXT,
      updatedAt TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS badges (
      id TEXT PRIMARY KEY,
      name TEXT UNIQUE NOT NULL,
      description TEXT,
      icon TEXT,
      condition TEXT
    );

    CREATE TABLE IF NOT EXISTS user_badges (
      id TEXT PRIMARY KEY,
      userId TEXT NOT NULL,
      badgeId TEXT NOT NULL,
      earnedAt TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (badgeId) REFERENCES badges(id) ON DELETE CASCADE,
      UNIQUE(userId, badgeId)
    );

    CREATE TABLE IF NOT EXISTS xp_transactions (
      id TEXT PRIMARY KEY,
      userId TEXT NOT NULL,
      amount INTEGER NOT NULL,
      reason TEXT,
      createdAt TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS bible_verses (
      id TEXT PRIMARY KEY,
      book TEXT NOT NULL,
      bookNumber INTEGER NOT NULL,
      chapter INTEGER NOT NULL,
      verse INTEGER NOT NULL,
      text TEXT NOT NULL,
      translation TEXT DEFAULT 'LSG',
      UNIQUE(book, chapter, verse, translation)
    );

    CREATE TABLE IF NOT EXISTS strong_entries (
      id TEXT PRIMARY KEY,
      number TEXT UNIQUE NOT NULL,
      language TEXT NOT NULL,
      lemma TEXT,
      transliteration TEXT,
      pronunciation TEXT,
      definition TEXT,
      kjvUsage TEXT,
      definitionFr TEXT,
      kjvUsageFr TEXT,
      translatedAt TEXT,
      createdAt TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS reading_plans (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      slug TEXT UNIQUE NOT NULL,
      description TEXT,
      duration INTEGER NOT NULL,
      category TEXT DEFAULT 'full_bible',
      createdAt TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS reading_plan_days (
      id TEXT PRIMARY KEY,
      planId TEXT NOT NULL,
      dayNumber INTEGER NOT NULL,
      title TEXT,
      FOREIGN KEY (planId) REFERENCES reading_plans(id) ON DELETE CASCADE,
      UNIQUE(planId, dayNumber)
    );

    CREATE TABLE IF NOT EXISTS reading_plan_readings (
      id TEXT PRIMARY KEY,
      dayId TEXT NOT NULL,
      book TEXT NOT NULL,
      bookNumber INTEGER NOT NULL,
      chapter INTEGER NOT NULL,
      FOREIGN KEY (dayId) REFERENCES reading_plan_days(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS reading_plan_enrollments (
      id TEXT PRIMARY KEY,
      userId TEXT NOT NULL,
      planId TEXT NOT NULL,
      startDate TEXT DEFAULT (datetime('now')),
      currentDay INTEGER DEFAULT 1,
      completed INTEGER DEFAULT 0,
      completedAt TEXT,
      updatedAt TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (planId) REFERENCES reading_plans(id) ON DELETE CASCADE,
      UNIQUE(userId, planId)
    );

    CREATE TABLE IF NOT EXISTS reading_plan_progress (
      id TEXT PRIMARY KEY,
      userId TEXT NOT NULL,
      planId TEXT NOT NULL,
      dayNumber INTEGER NOT NULL,
      completedAt TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE,
      UNIQUE(userId, planId, dayNumber)
    );

    CREATE TABLE IF NOT EXISTS verse_memorizations (
      id TEXT PRIMARY KEY,
      userId TEXT NOT NULL,
      verseId TEXT,
      reference TEXT NOT NULL,
      verseText TEXT NOT NULL,
      status TEXT DEFAULT 'learning',
      easeFactor REAL DEFAULT 2.5,
      interval INTEGER DEFAULT 1,
      repetitions INTEGER DEFAULT 0,
      nextReview TEXT DEFAULT (datetime('now')),
      lastReview TEXT,
      createdAt TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE,
      UNIQUE(userId, reference)
    );

    CREATE TABLE IF NOT EXISTS verse_highlights (
      id TEXT PRIMARY KEY,
      userId TEXT NOT NULL,
      verseId TEXT NOT NULL,
      color TEXT DEFAULT 'yellow',
      createdAt TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (verseId) REFERENCES bible_verses(id) ON DELETE CASCADE,
      UNIQUE(userId, verseId)
    );

    CREATE TABLE IF NOT EXISTS verse_notes (
      id TEXT PRIMARY KEY,
      userId TEXT NOT NULL,
      verseId TEXT NOT NULL,
      content TEXT NOT NULL,
      isVoice INTEGER DEFAULT 0,
      createdAt TEXT DEFAULT (datetime('now')),
      updatedAt TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (verseId) REFERENCES bible_verses(id) ON DELETE CASCADE,
      UNIQUE(userId, verseId)
    );

    CREATE TABLE IF NOT EXISTS streak_freeze (
      id TEXT PRIMARY KEY,
      userId TEXT UNIQUE NOT NULL,
      freezesAvailable INTEGER DEFAULT 0,
      lastUsedAt TEXT,
      FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE INDEX IF NOT EXISTS idx_daily_sessions_user_date ON daily_sessions(userId, activityDate);
    CREATE INDEX IF NOT EXISTS idx_bible_verses_book_chapter ON bible_verses(book, chapter);
    CREATE INDEX IF NOT EXISTS idx_strong_entries_number ON strong_entries(number);
    CREATE INDEX IF NOT EXISTS idx_strong_entries_language ON strong_entries(language);
  `);
  
  return db;
}
