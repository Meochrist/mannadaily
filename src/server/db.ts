// PostgreSQL Database Service — pg (Node.js) with in-memory fallback
import { Pool } from 'pg';

let poolInstance: Pool | null = null;
let postgresAvailable = true;

// In-memory fallback tables
const memoryUsers = new Map<string, any>([
  ['default-user', { id: 'default-user', name: 'Disciple', email: 'user@mannadaily.app', favoriteMascot: 'manny' }]
]);
const memoryProgress = new Map<string, any>([
  ['default-user', { id: 'p1', userId: 'default-user', totalXP: 140, level: 'Pousse', versesLearned: 5, sessionsTotal: 7, lingots: 35, morningSessionToday: 1, middaySessionToday: 0, eveningSessionToday: 0, lastSessionDate: new Date().toISOString().split('T')[0] }]
]);
const memoryStreaks = new Map<string, any>([
  ['default-user', { id: 's1', userId: 'default-user', currentStreak: 3, longestStreak: 7, lastActivityAt: new Date().toISOString() }]
]);
const memoryBadges = new Map<string, any>([
  ['Premier Pas', { id: 'b1', name: 'Premier Pas', description: 'Terminez votre première session quotidienne', icon: 'Compass', condition: 'first_session' }],
  ['Fidèle Étoile', { id: 'b2', name: 'Fidèle Étoile', description: 'Atteignez une série de 7 jours consécutifs', icon: 'Flame', condition: 'streak_7' }]
]);
const memoryUserBadges = new Map<string, any>([
  ['default-user_b1', { id: 'ub1', userId: 'default-user', badgeId: 'b1', earnedAt: new Date().toISOString() }]
]);
const memoryFreeze = new Map<string, any>([
  ['default-user', { id: 'f1', userId: 'default-user', freezesAvailable: 1, lastUsedAt: null }]
]);
const memorySessions: any[] = [];
const memoryXpTransactions: any[] = [];

export function getPool(): Pool | null {
  if (!process.env.DATABASE_URL) {
    postgresAvailable = false;
    return null;
  }
  if (poolInstance) return poolInstance;
  
  try {
    poolInstance = new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : undefined,
      max: 10,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 2000,
    });
    poolInstance.on('error', (err) => {
      console.warn('Postgres connection pool error:', err.message);
      postgresAvailable = false;
    });
    return poolInstance;
  } catch (err) {
    console.warn('Postgres init error, using memory fallback:', err);
    postgresAvailable = false;
    return null;
  }
}

function handleMemoryQuery<T = any>(sql: string, params: any[] = []): T[] {
  const cleanSql = sql.trim().toLowerCase();

  if (cleanSql.includes('from user_progress')) {
    const userId = params[0] || 'default-user';
    const row = memoryProgress.get(userId) || memoryProgress.get('default-user');
    return row ? [row as unknown as T] : [];
  }

  if (cleanSql.includes('from streaks')) {
    const userId = params[0] || 'default-user';
    const row = memoryStreaks.get(userId) || memoryStreaks.get('default-user');
    return row ? [row as unknown as T] : [];
  }

  if (cleanSql.includes('from users')) {
    const emailOrId = params[0] || 'default-user';
    const user = memoryUsers.get(emailOrId) || Array.from(memoryUsers.values()).find(u => u.email === emailOrId) || memoryUsers.get('default-user');
    return user ? [user as unknown as T] : [];
  }

  if (cleanSql.includes('from badges')) {
    const name = params[0];
    if (name) {
      const b = memoryBadges.get(name);
      return b ? [b as unknown as T] : [];
    }
    return Array.from(memoryBadges.values()) as unknown as T[];
  }

  if (cleanSql.includes('from user_badges')) {
    const userId = params[0] || 'default-user';
    const badgeId = params[1];
    const results = Array.from(memoryUserBadges.values()).filter(ub => ub.userId === userId && (!badgeId || ub.badgeId === badgeId));
    return results as unknown as T[];
  }

  if (cleanSql.includes('from streak_freeze')) {
    const userId = params[0] || 'default-user';
    const freeze = memoryFreeze.get(userId) || memoryFreeze.get('default-user');
    return freeze ? [freeze as unknown as T] : [];
  }

  if (cleanSql.includes('from leagues') || cleanSql.includes('from league_members')) {
    return [
      { id: '1', name: 'Ligue David (Or)', tier: 'or', currentStreak: 3, xpThisWeek: 340, rank: 1, userName: 'Samuel' },
      { id: '2', name: 'Ligue David (Or)', tier: 'or', currentStreak: 5, xpThisWeek: 280, rank: 2, userName: 'Esther' },
      { id: '3', name: 'Ligue David (Or)', tier: 'or', currentStreak: 2, xpThisWeek: 210, rank: 3, userName: 'Disciple (Moi)' },
      { id: '4', name: 'Ligue David (Or)', tier: 'or', currentStreak: 1, xpThisWeek: 150, rank: 4, userName: 'Élie' }
    ] as unknown as T[];
  }

  return [];
}

function handleMemoryExecute(sql: string, params: any[] = []): void {
  const cleanSql = sql.trim().toLowerCase();

  if (cleanSql.includes('update user_progress')) {
    const userId = params[params.length - 1] || 'default-user';
    const prev = memoryProgress.get(userId) || memoryProgress.get('default-user') || {};
    memoryProgress.set(userId, {
      ...prev,
      totalXP: params[0] !== undefined ? params[0] : prev.totalXP,
      level: params[1] !== undefined ? params[1] : prev.level,
      lingots: params[2] !== undefined ? params[2] : prev.lingots,
    });
  } else if (cleanSql.includes('insert into user_progress')) {
    const userId = params[1] || 'default-user';
    memoryProgress.set(userId, {
      id: crypto.randomUUID(),
      userId,
      totalXP: params[2] || 0,
      level: params[3] || 'Semence',
      versesLearned: params[4] || 0,
      sessionsTotal: params[5] || 0,
      lingots: params[6] || 0,
    });
  } else if (cleanSql.includes('update streaks')) {
    const userId = params[params.length - 1] || 'default-user';
    const prev = memoryStreaks.get(userId) || memoryStreaks.get('default-user') || {};
    memoryStreaks.set(userId, {
      ...prev,
      currentStreak: params[0] !== undefined ? params[0] : prev.currentStreak,
      longestStreak: params[1] !== undefined ? params[1] : prev.longestStreak,
      lastActivityAt: params[2] || new Date().toISOString(),
    });
  } else if (cleanSql.includes('insert into streaks')) {
    const userId = params[1] || 'default-user';
    memoryStreaks.set(userId, {
      id: crypto.randomUUID(),
      userId,
      currentStreak: 1,
      longestStreak: 1,
      lastActivityAt: new Date().toISOString(),
    });
  } else if (cleanSql.includes('insert into xp_transactions')) {
    memoryXpTransactions.push({ id: crypto.randomUUID(), userId: params[1], amount: params[2], reason: params[3] });
  } else if (cleanSql.includes('insert into daily_sessions')) {
    memorySessions.push({ id: crypto.randomUUID(), userId: params[0], date: new Date().toISOString() });
  }
}

// Helpers pour les requêtes SQL
export async function query<T = any>(sql: string, params: any[] = []): Promise<T[]> {
  const pool = getPool();
  if (!pool || !postgresAvailable) {
    return handleMemoryQuery<T>(sql, params);
  }
  try {
    const result = await pool.query(sql, params);
    return result.rows;
  } catch (err) {
    console.warn('Postgres query failed, falling back to memory store:', (err as any)?.message);
    postgresAvailable = false;
    return handleMemoryQuery<T>(sql, params);
  }
}

export async function queryOne<T = any>(sql: string, params: any[] = []): Promise<T | null> {
  const rows = await query<T>(sql, params);
  return rows[0] || null;
}

export async function execute(sql: string, params: any[] = []): Promise<void> {
  const pool = getPool();
  if (!pool || !postgresAvailable) {
    handleMemoryExecute(sql, params);
    return;
  }
  try {
    await pool.query(sql, params);
  } catch (err) {
    console.warn('Postgres execute failed, falling back to memory store:', (err as any)?.message);
    postgresAvailable = false;
    handleMemoryExecute(sql, params);
  }
}

export async function insert(sql: string, params: any[] = []): Promise<string> {
  const id = crypto.randomUUID();
  await execute(sql.replace('VALUES (', `VALUES ('${id}',`), params);
  return id;
}

export async function initDb(): Promise<void> {
  const pool = getPool();
  if (!pool || !postgresAvailable) {
    return;
  }
  try {
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
  } catch (err) {
    console.warn('Postgres initDb failed, fallback active:', (err as any)?.message);
  }
}
