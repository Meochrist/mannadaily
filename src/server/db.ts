// PostgreSQL Database Service — pg (Node.js)
import { Pool } from 'pg';

let poolInstance: Pool | null = null;

export function getPool(): Pool {
  if (poolInstance) return poolInstance;
  
  poolInstance = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : undefined,
    max: 10,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 2000,
  });
  
  return poolInstance;
}

// Helpers pour les requêtes SQL
export async function query<T = any>(sql: string, params: any[] =[]): Promise<T[]> {
  const pool = getPool();
  const result = await pool.query(sql, params);
  return result.rows;
}

export async function queryOne<T = any>(sql: string, params: any[] =[]): Promise<T | null> {
  const rows = await query<T>(sql, params);
  return rows[0] || null;
}

export async function execute(sql: string, params: any[] =[]): Promise<void> {
  const pool = getPool();
  await pool.query(sql, params);
}

export async function insert(sql: string, params: any[] =[]): Promise<string> {
  const id = crypto.randomUUID();
  await execute(sql.replace('VALUES (', `VALUES ('${id}',`), params);
  return id;
}

export async function initDb(): Promise<void> {
  const pool = getPool();
  
  await pool.query(`
    CREATE TABLE IF NOT EXISTS users (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      name TEXT,
      email TEXT UNIQUE,
      emailVerified TIMESTAMPTZ,
      password TEXT,
      image TEXT,
      createdAt TIMESTAMPTZ DEFAULT NOW(),
      updatedAt TIMESTAMPTZ DEFAULT NOW(),
      notificationTime TEXT DEFAULT '19:00',
      readingReminders INTEGER DEFAULT 1,
      timezoneOffset INTEGER,
      onboardingCompleted INTEGER DEFAULT 0,
      favoriteMascot TEXT,
      isPremium INTEGER DEFAULT 0,
      premiumUntil TIMESTAMPTZ,
      meditationProgress JSONB
    );

    CREATE TABLE IF NOT EXISTS daily_sessions (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      userId UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      type TEXT DEFAULT 'classic',
      period TEXT DEFAULT 'morning',
      activityDate DATE NOT NULL,
      xpEarned INTEGER DEFAULT 0,
      duration INTEGER DEFAULT 0,
      notes TEXT,
      createdAt TIMESTAMPTZ DEFAULT NOW(),
      UNIQUE(userId, activityDate, period)
    );

    CREATE TABLE IF NOT EXISTS streaks (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      userId UUID UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      currentStreak INTEGER DEFAULT 0,
      longestStreak INTEGER DEFAULT 0,
      lastActivityAt TIMESTAMPTZ DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS user_progress (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      userId UUID UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      totalXP INTEGER DEFAULT 0,
      level TEXT DEFAULT 'Semence',
      versesLearned INTEGER DEFAULT 0,
      sessionsTotal INTEGER DEFAULT 0,
      lingots INTEGER DEFAULT 0,
      morningSessionToday INTEGER DEFAULT 0,
      middaySessionToday INTEGER DEFAULT 0,
      eveningSessionToday INTEGER DEFAULT 0,
      lastSessionDate DATE,
      updatedAt TIMESTAMPTZ DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS badges (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      name TEXT UNIQUE NOT NULL,
      description TEXT,
      icon TEXT,
      condition TEXT
    );

    CREATE TABLE IF NOT EXISTS user_badges (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      userId UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      badgeId UUID NOT NULL REFERENCES badges(id) ON DELETE CASCADE,
      earnedAt TIMESTAMPTZ DEFAULT NOW(),
      UNIQUE(userId, badgeId)
    );

    CREATE TABLE IF NOT EXISTS xp_transactions (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      userId UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      amount INTEGER NOT NULL,
      reason TEXT,
      createdAt TIMESTAMPTZ DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS verses (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      book TEXT NOT NULL,
      chapter INTEGER NOT NULL,
      verse INTEGER NOT NULL,
      text TEXT NOT NULL,
      translation TEXT DEFAULT 'LSG',
      UNIQUE(book, chapter, verse, translation)
    );

    CREATE TABLE IF NOT EXISTS bible_verses (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      book TEXT NOT NULL,
      bookNumber INTEGER NOT NULL,
      chapter INTEGER NOT NULL,
      verse INTEGER NOT NULL,
      text TEXT NOT NULL,
      translation TEXT DEFAULT 'LSG',
      UNIQUE(book, chapter, verse, translation)
    );

    CREATE TABLE IF NOT EXISTS strong_entries (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      number TEXT UNIQUE NOT NULL,
      language TEXT NOT NULL,
      lemma TEXT,
      transliteration TEXT,
      pronunciation TEXT,
      definition TEXT,
      kjvUsage TEXT,
      definitionFr TEXT,
      kjvUsageFr TEXT,
      translatedAt TIMESTAMPTZ,
      createdAt TIMESTAMPTZ DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS reading_plans (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      name TEXT NOT NULL,
      slug TEXT UNIQUE NOT NULL,
      description TEXT,
      duration INTEGER NOT NULL,
      category TEXT DEFAULT 'full_bible',
      createdAt TIMESTAMPTZ DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS reading_plan_days (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      planId UUID NOT NULL REFERENCES reading_plans(id) ON DELETE CASCADE,
      dayNumber INTEGER NOT NULL,
      title TEXT,
      UNIQUE(planId, dayNumber)
    );

    CREATE TABLE IF NOT EXISTS reading_plan_readings (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      dayId UUID NOT NULL REFERENCES reading_plan_days(id) ON DELETE CASCADE,
      book TEXT NOT NULL,
      bookNumber INTEGER NOT NULL,
      chapter INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS reading_plan_enrollments (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      userId UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      planId UUID NOT NULL REFERENCES reading_plans(id) ON DELETE CASCADE,
      startDate TIMESTAMPTZ DEFAULT NOW(),
      currentDay INTEGER DEFAULT 1,
      completed INTEGER DEFAULT 0,
      completedAt TIMESTAMPTZ,
      updatedAt TIMESTAMPTZ DEFAULT NOW(),
      UNIQUE(userId, planId)
    );

    CREATE TABLE IF NOT EXISTS reading_plan_progress (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      userId UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      planId UUID NOT NULL REFERENCES reading_plans(id) ON DELETE CASCADE,
      dayNumber INTEGER NOT NULL,
      completedAt TIMESTAMPTZ DEFAULT NOW(),
      UNIQUE(userId, planId, dayNumber)
    );

    CREATE TABLE IF NOT EXISTS verse_memorizations (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      userId UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      verseId UUID,
      reference TEXT NOT NULL,
      verseText TEXT NOT NULL,
      status TEXT DEFAULT 'learning',
      easeFactor REAL DEFAULT 2.5,
      interval INTEGER DEFAULT 1,
      repetitions INTEGER DEFAULT 0,
      nextReview TIMESTAMPTZ DEFAULT NOW(),
      lastReview TIMESTAMPTZ,
      createdAt TIMESTAMPTZ DEFAULT NOW(),
      UNIQUE(userId, reference)
    );

    CREATE TABLE IF NOT EXISTS verse_highlights (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      userId UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      verseId UUID NOT NULL REFERENCES bible_verses(id) ON DELETE CASCADE,
      color TEXT DEFAULT 'yellow',
      createdAt TIMESTAMPTZ DEFAULT NOW(),
      UNIQUE(userId, verseId)
    );

    CREATE TABLE IF NOT EXISTS verse_notes (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      userId UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      verseId UUID NOT NULL,
      content TEXT NOT NULL,
      isVoice INTEGER DEFAULT 0,
      book TEXT,
      chapter INTEGER,
      verse INTEGER,
      createdAt TIMESTAMPTZ DEFAULT NOW(),
      updatedAt TIMESTAMPTZ DEFAULT NOW(),
      UNIQUE(userId, verseId)
    );

    CREATE TABLE IF NOT EXISTS push_subscriptions (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      userId UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      endpoint TEXT UNIQUE NOT NULL,
      p256dh TEXT,
      auth TEXT,
      createdAt TIMESTAMPTZ DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS bible_commentaries (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      book INTEGER NOT NULL,
      chapter INTEGER NOT NULL,
      verse INTEGER,
      verseEnd INTEGER,
      author TEXT NOT NULL,
      content TEXT NOT NULL,
      language TEXT DEFAULT 'fr',
      createdAt TIMESTAMPTZ DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS streak_freeze (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      userId UUID UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      freezesAvailable INTEGER DEFAULT 0,
      lastUsedAt TIMESTAMPTZ
    );

    CREATE TABLE IF NOT EXISTS meditations (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      verseId UUID,
      content TEXT NOT NULL,
      createdAt TIMESTAMPTZ DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS leagues (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      name TEXT NOT NULL,
      tier TEXT DEFAULT 'bronze',
      weekStart DATE NOT NULL,
      weekEnd DATE NOT NULL,
      createdAt TIMESTAMPTZ DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS league_members (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      leagueId UUID NOT NULL REFERENCES leagues(id) ON DELETE CASCADE,
      userId UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      xpThisWeek INTEGER DEFAULT 0,
      rank INTEGER DEFAULT 0,
      UNIQUE(leagueId, userId)
    );

    CREATE INDEX IF NOT EXISTS idx_daily_sessions_user_date ON daily_sessions(userId, activityDate);
    CREATE INDEX IF NOT EXISTS idx_bible_verses_book_chapter ON bible_verses(book, chapter);
    CREATE INDEX IF NOT EXISTS idx_strong_entries_number ON strong_entries(number);
    CREATE INDEX IF NOT EXISTS idx_strong_entries_language ON strong_entries(language);
    CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
    CREATE INDEX IF NOT EXISTS idx_push_subscriptions_userId ON push_subscriptions(userId);
  `);
}
