// Gamification — Version SQLite (remplace Prisma)
import { getServerDb, initServerDb } from '@/server/db';
import { XP_RULES, LEVELS } from '@/types';
import { differenceInCalendarDays } from 'date-fns';
import { getLevelFromXP, getXPProgress } from '@/lib/xp-utils';

export { getLevelFromXP, getXPProgress };
export type { LevelResult } from '@/lib/xp-utils';

export async function awardXP(
  userId: string,
  action: keyof typeof XP_RULES | 'session_complete' | 'perfect_session' | 'streak_bonus' | 'morning_session' | 'evening_session' | 'day_complete_bonus'
) {
  try {
    let xpToAdd = (action in XP_RULES) ? XP_RULES[action as keyof typeof XP_RULES] : 0;
    let lingotsToAdd = 0;

    if (action === 'morning_session' || action === 'evening_session') {
      xpToAdd = 15;
      lingotsToAdd = 5;
    } else if (action === 'day_complete_bonus') {
      xpToAdd = 10;
      lingotsToAdd = 5;
    } else if (action === 'session_complete' || action === 'DAILY_MEDITATION' || action === 'PROCLAMATION_SESSION' || action === 'MEMORIZATION') {
      lingotsToAdd = 5;
    } else if (action === 'perfect_session') {
      lingotsToAdd = 10;
    } else if (action === 'streak_bonus' || action === 'STREAK_BONUS_BASE') {
      lingotsToAdd = 3;
    } else if (action === 'meditation_mini_1') {
      lingotsToAdd = 2;
    } else if (action === 'meditation_mini_2') {
      lingotsToAdd = 3;
    } else if (action === 'meditation_mini_3') {
      lingotsToAdd = 5;
    }

    const db = initServerDb();

    let progress = db.prepare('SELECT * FROM user_progress WHERE userId = ?').get(userId);
    
    if (!progress) {
      db.prepare(`
        INSERT INTO user_progress (id, userId, totalXP, level, versesLearned, sessionsTotal, lingots)
        VALUES (?, ?, 0, 'Semence', 0, 0, 0)
      `).run(crypto.randomUUID(), userId);
      progress = db.prepare('SELECT * FROM user_progress WHERE userId = ?').get(userId);
    }

    const oldXP = progress.totalXP;
    const newXP = oldXP + xpToAdd;
    
    const oldLevelInfo = getLevelFromXP(oldXP);
    const newLevelInfo = getLevelFromXP(newXP);
    
    const leveledUp = newLevelInfo.level > oldLevelInfo.level;
    const newLingots = progress.lingots + lingotsToAdd;

    db.prepare(`
      UPDATE user_progress SET totalXP = ?, level = ?, lingots = ? WHERE userId = ?
    `).run(newXP, newLevelInfo.name, newLingots, userId);

    if (xpToAdd > 0) {
      db.prepare(`
        INSERT INTO xp_transactions (id, userId, amount, reason) VALUES (?, ?, ?, ?)
      `).run(crypto.randomUUID(), userId, xpToAdd, action);
    }

    return {
      newXP,
      leveledUp,
      newLevel: newLevelInfo.level,
      levelName: newLevelInfo.name,
      newLingots,
    };
  } catch (error: unknown) {
    console.error('Error awarding XP:', error);
    throw error;
  }
}

export async function checkDayCompletion(userId: string) {
  try {
    const todayStr = new Date().toISOString().split('T')[0];
    const db = initServerDb();
    
    const progress = db.prepare(`
      SELECT morningSessionToday, middaySessionToday, eveningSessionToday, lastSessionDate
      FROM user_progress WHERE userId = ?
    `).get(userId);

    if (!progress) {
      return { morningDone: false, middayDone: false, eveningDone: false, dayComplete: false };
    }

    if (progress.lastSessionDate !== todayStr) {
      return { morningDone: false, middayDone: false, eveningDone: false, dayComplete: false };
    }

    const dayComplete = progress.morningSessionToday && progress.middaySessionToday && progress.eveningSessionToday;
    return {
      morningDone: progress.morningSessionToday,
      middayDone: progress.middaySessionToday,
      eveningDone: progress.eveningSessionToday,
      dayComplete,
    };
  } catch (error) {
    console.error('Error checking day completion:', error);
    return { morningDone: false, eveningDone: false, dayComplete: false };
  }
}

export async function updateStreak(userId: string): Promise<number> {
  try {
    const today = new Date();
    const db = initServerDb();

    let streak = db.prepare('SELECT * FROM streaks WHERE userId = ?').get(userId);

    if (!streak) {
      db.prepare(`
        INSERT INTO streaks (id, userId, currentStreak, longestStreak, lastActivityAt)
        VALUES (?, ?, 0, 0, ?)
      `).run(crypto.randomUUID(), userId, new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString());
      streak = db.prepare('SELECT * FROM streaks WHERE userId = ?').get(userId);
    }

    const daysDiff = differenceInCalendarDays(today, new Date(streak.lastActivityAt));

    let newCurrentStreak: number;

    if (daysDiff === 0) {
      return streak.currentStreak;
    } else if (daysDiff === 1) {
      newCurrentStreak = streak.currentStreak + 1;
    } else {
      const freezeResult = await applyStreakFreezeIfNeeded(userId);
      if (freezeResult.freezeUsed) {
        newCurrentStreak = streak.currentStreak;
      } else {
        newCurrentStreak = 1;
      }
    }

    const newLongestStreak = Math.max(streak.longestStreak, newCurrentStreak);

    db.prepare(`
      UPDATE streaks SET currentStreak = ?, longestStreak = ?, lastActivityAt = ? WHERE userId = ?
    `).run(newCurrentStreak, newLongestStreak, today.toISOString(), userId);

    return newCurrentStreak;
  } catch (error: unknown) {
    console.error('Error updating streak:', error);
    throw error;
  }
}

export async function checkAndAwardBadges(userId: string) {
  try {
    const db = initServerDb();
    
    const progress = db.prepare('SELECT * FROM user_progress WHERE userId = ?').get(userId);
    const streak = db.prepare('SELECT * FROM streaks WHERE userId = ?').get(userId);

    if (!progress) return [];

    const currentStreak = streak ? streak.currentStreak : 0;
    const sessionsTotal = progress.sessionsTotal;
    const versesLearned = progress.versesLearned;

    const badgeConditions = [
      { condition: 'first_session', name: 'Premier Pas', description: 'Terminez votre première session quotidienne', icon: 'Compass', met: sessionsTotal >= 1 },
      { condition: 'streak_7', name: 'Fidèle Étoile', description: 'Atteignez une série de 7 jours consécutifs', icon: 'Flame', met: currentStreak >= 7 },
      { condition: 'streak_30', name: 'Guerrier de la Parole', description: 'Atteignez une série de 30 jours consécutifs', icon: 'Crown', met: currentStreak >= 30 },
      { condition: 'verses_10', name: 'Scribe de l\'Esprit', description: 'Apprenez 10 versets de la Bible', icon: 'BookOpen', met: versesLearned >= 10 },
      { condition: 'sessions_50', name: 'Pilier de Foi', description: 'Complétez 50 sessions au total', icon: 'Shield', met: sessionsTotal >= 50 },
    ];

    const newlyAwardedBadges: Array<{ name: string; icon: string; description: string }> = [];

    for (const b of badgeConditions) {
      if (b.met) {
        let badge = db.prepare('SELECT * FROM badges WHERE name = ?').get(b.name);
        
        if (!badge) {
          db.prepare(`
            INSERT INTO badges (id, name, description, icon, condition) VALUES (?, ?, ?, ?, ?)
          `).run(crypto.randomUUID(), b.name, b.description, b.icon, b.condition);
          badge = db.prepare('SELECT * FROM badges WHERE name = ?').get(b.name);
        }

        const alreadyHasBadge = db.prepare('SELECT * FROM user_badges WHERE userId = ? AND badgeId = ?').get(userId, badge.id);

        if (!alreadyHasBadge) {
          db.prepare(`
            INSERT INTO user_badges (id, userId, badgeId) VALUES (?, ?, ?)
          `).run(crypto.randomUUID(), userId, badge.id);

          newlyAwardedBadges.push({
            name: badge.name,
            icon: badge.icon,
            description: badge.description,
          });
        }
      }
    }

    return newlyAwardedBadges;
  } catch (error: unknown) {
    console.error('Error checking and awarding badges:', error);
    throw error;
  }
}

export async function awardLingots(userId: string, amount: number): Promise<number> {
  const db = initServerDb();
  
  db.prepare(`
    INSERT INTO user_progress (id, userId, totalXP, level, versesLearned, sessionsTotal, lingots)
    VALUES (?, ?, 0, 'Semence', 0, 0, ?)
    ON CONFLICT(userId) DO UPDATE SET lingots = lingots + ?
  `).run(crypto.randomUUID(), userId, amount, amount);

  const progress = db.prepare('SELECT lingots FROM user_progress WHERE userId = ?').get(userId);
  return progress.lingots;
}

export async function spendLingots(userId: string, amount: number): Promise<{ success: boolean; newTotal: number }> {
  const db = initServerDb();
  
  const progress = db.prepare('SELECT lingots FROM user_progress WHERE userId = ?').get(userId);
  
  if (!progress || progress.lingots < amount) {
    return { success: false, newTotal: progress ? progress.lingots : 0 };
  }

  db.prepare('UPDATE user_progress SET lingots = lingots - ? WHERE userId = ?').run(amount, userId);
  
  const updated = db.prepare('SELECT lingots FROM user_progress WHERE userId = ?').get(userId);
  return { success: true, newTotal: updated.lingots };
}

export async function buyStreakFreeze(userId: string): Promise<{ success: boolean; freezesAvailable: number; lingotsRemaining: number }> {
  const spendResult = await spendLingots(userId, 10);
  
  if (!spendResult.success) {
    const db = initServerDb();
    const freeze = db.prepare('SELECT freezesAvailable FROM streak_freeze WHERE userId = ?').get(userId);
    return {
      success: false,
      freezesAvailable: freeze ? freeze.freezesAvailable : 0,
      lingotsRemaining: spendResult.newTotal
    };
  }

  const db = initServerDb();
  db.prepare(`
    INSERT INTO streak_freeze (id, userId, freezesAvailable, lastUsedAt)
    VALUES (?, ?, 1, NULL)
    ON CONFLICT(userId) DO UPDATE SET freezesAvailable = freezesAvailable + 1
  `).run(crypto.randomUUID(), userId);

  const freeze = db.prepare('SELECT freezesAvailable FROM streak_freeze WHERE userId = ?').get(userId);
  return {
    success: true,
    freezesAvailable: freeze.freezesAvailable,
    lingotsRemaining: spendResult.newTotal
  };
}

export async function applyStreakFreezeIfNeeded(userId: string): Promise<{ freezeUsed: boolean }> {
  const db = initServerDb();
  
  const freeze = db.prepare('SELECT * FROM streak_freeze WHERE userId = ?').get(userId);

  if (freeze && freeze.freezesAvailable > 0) {
    db.prepare(`
      UPDATE streak_freeze SET freezesAvailable = freezesAvailable - 1, lastUsedAt = ? WHERE userId = ?
    `).run(new Date().toISOString(), userId);
    return { freezeUsed: true };
  }

  return { freezeUsed: false };
}
