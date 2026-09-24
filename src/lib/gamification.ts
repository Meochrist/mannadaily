// Gamification — Version PostgreSQL (remplace SQLite)
import { query, queryOne, execute, insert } from '@/server/db';
import { XP_RULES } from '@/types';
import { differenceInCalendarDays } from 'date-fns';
import { getLevelFromXP, getXPProgress } from '@/lib/xp-utils';

export { getLevelFromXP, getXPProgress };
export type { LevelResult } from '@/lib/xp-utils';

type Progress = {
  totalXP: number;
  level: string;
  versesLearned: number;
  sessionsTotal: number;
  lingots: number;
  morningSessionToday?: boolean;
  middaySessionToday?: boolean;
  eveningSessionToday?: boolean;
  lastSessionDate?: string;
};

type Streak = {
  currentStreak: number;
  longestStreak: number;
  lastActivityAt: string;
};

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

    let progress = await queryOne<Progress>('SELECT * FROM user_progress WHERE userId = $1', [userId]);

    if (!progress) {
      await execute(`
        INSERT INTO user_progress (id, userId, totalXP, level, versesLearned, sessionsTotal, lingots)
        VALUES ($1, $2, 0, 'Semence', 0, 0, 0)
      `, [crypto.randomUUID(), userId]);
      progress = await queryOne<Progress>('SELECT * FROM user_progress WHERE userId = $1', [userId]);
    }

    const oldXP = progress!.totalXP;
    const newXP = oldXP + xpToAdd;

    const oldLevelInfo = getLevelFromXP(oldXP);
    const newLevelInfo = getLevelFromXP(newXP);

    const leveledUp = newLevelInfo.level > oldLevelInfo.level;
    const newLingots = progress!.lingots + lingotsToAdd;

    await execute(`
      UPDATE user_progress SET totalXP = $1, level = $2, lingots = $3 WHERE userId = $4
    `, [newXP, newLevelInfo.name, newLingots, userId]);

    if (xpToAdd > 0) {
      await execute(`
        INSERT INTO xp_transactions (id, userId, amount, reason) VALUES ($1, $2, $3, $4)
      `, [crypto.randomUUID(), userId, xpToAdd, action]);
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

    const progress = await queryOne<Progress>(`
      SELECT morningSessionToday, middaySessionToday, eveningSessionToday, lastSessionDate
      FROM user_progress WHERE userId = $1
    `, [userId]);

    if (!progress) {
      return { morningDone: false, middayDone: false, eveningDone: false, dayComplete: false };
    }

    if (progress.lastSessionDate !== todayStr) {
      return { morningDone: false, middayDone: false, eveningDone: false, dayComplete: false };
    }

    const dayComplete = !!progress.morningSessionToday && !!progress.middaySessionToday && !!progress.eveningSessionToday;
    return {
      morningDone: !!progress.morningSessionToday,
      middayDone: !!progress.middaySessionToday,
      eveningDone: !!progress.eveningSessionToday,
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

    let streak = await queryOne<Streak>('SELECT * FROM streaks WHERE userId = $1', [userId]);

    if (!streak) {
      await execute(`
        INSERT INTO streaks (id, userId, currentStreak, longestStreak, lastActivityAt)
        VALUES ($1, $2, 0, 0, $3)
      `, [crypto.randomUUID(), userId, new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()]);
      streak = await queryOne<Streak>('SELECT * FROM streaks WHERE userId = $1', [userId]);
    }

    const daysDiff = differenceInCalendarDays(today, new Date(streak!.lastActivityAt));

    let newCurrentStreak: number;

    if (daysDiff === 0) {
      return streak!.currentStreak;
    } else if (daysDiff === 1) {
      newCurrentStreak = streak!.currentStreak + 1;
    } else {
      const freezeResult = await applyStreakFreezeIfNeeded(userId);
      if (freezeResult.freezeUsed) {
        newCurrentStreak = streak!.currentStreak;
      } else {
        newCurrentStreak = 1;
      }
    }

    const newLongestStreak = Math.max(streak!.longestStreak, newCurrentStreak);

    await execute(`
      UPDATE streaks SET currentStreak = $1, longestStreak = $2, lastActivityAt = $3 WHERE userId = $4
    `, [newCurrentStreak, newLongestStreak, today.toISOString(), userId]);

    return newCurrentStreak;
  } catch (error: unknown) {
    console.error('Error updating streak:', error);
    throw error;
  }
}

export async function checkAndAwardBadges(userId: string) {
  try {
    const progress = await queryOne<Progress>('SELECT * FROM user_progress WHERE userId = $1', [userId]);
    const streak = await queryOne<Streak>('SELECT * FROM streaks WHERE userId = $1', [userId]);

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
        let badge = await queryOne<{ id: string; name: string; icon: string; description: string }>('SELECT * FROM badges WHERE name = $1', [b.name]);

        if (!badge) {
          await execute(`
            INSERT INTO badges (id, name, description, icon, condition) VALUES ($1, $2, $3, $4, $5)
          `, [crypto.randomUUID(), b.name, b.description, b.icon, b.condition]);
          badge = await queryOne<{ id: string; name: string; icon: string; description: string }>('SELECT * FROM badges WHERE name = $1', [b.name]);
        }

        const alreadyHasBadge = await queryOne('SELECT * FROM user_badges WHERE userId = $1 AND badgeId = $2', [userId, badge!.id]);

        if (!alreadyHasBadge) {
          await execute(`
            INSERT INTO user_badges (id, userId, badgeId) VALUES ($1, $2, $3)
          `, [crypto.randomUUID(), userId, badge!.id]);

          newlyAwardedBadges.push({
            name: badge!.name,
            icon: badge!.icon,
            description: badge!.description,
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
  await execute(`
    INSERT INTO user_progress (id, userId, totalXP, level, versesLearned, sessionsTotal, lingots)
    VALUES ($1, $2, 0, 'Semence', 0, 0, $3)
    ON CONFLICT(userId) DO UPDATE SET lingots = user_progress.lingots + EXCLUDED.lingots
  `, [crypto.randomUUID(), userId, amount]);

  const progress = await queryOne<{ lingots: number }>('SELECT lingots FROM user_progress WHERE userId = $1', [userId]);
  return progress!.lingots;
}

export async function spendLingots(userId: string, amount: number): Promise<{ success: boolean; newTotal: number }> {
  const progress = await queryOne<{ lingots: number }>('SELECT lingots FROM user_progress WHERE userId = $1', [userId]);

  if (!progress || progress.lingots < amount) {
    return { success: false, newTotal: progress ? progress.lingots : 0 };
  }

  await execute('UPDATE user_progress SET lingots = lingots - $1 WHERE userId = $2', [amount, userId]);

  const updated = await queryOne<{ lingots: number }>('SELECT lingots FROM user_progress WHERE userId = $1', [userId]);
  return { success: true, newTotal: updated!.lingots };
}

export async function buyStreakFreeze(userId: string): Promise<{ success: boolean; freezesAvailable: number; lingotsRemaining: number }> {
  const spendResult = await spendLingots(userId, 10);

  if (!spendResult.success) {
    const freeze = await queryOne<{ freezesAvailable: number }>('SELECT freezesAvailable FROM streak_freeze WHERE userId = $1', [userId]);
    return {
      success: false,
      freezesAvailable: freeze ? freeze.freezesAvailable : 0,
      lingotsRemaining: spendResult.newTotal
    };
  }

  await execute(`
    INSERT INTO streak_freeze (id, userId, freezesAvailable, lastUsedAt)
    VALUES ($1, $2, 1, NULL)
    ON CONFLICT(userId) DO UPDATE SET freezesAvailable = freezesAvailable + 1
  `, [crypto.randomUUID(), userId]);

  const freeze = await queryOne<{ freezesAvailable: number }>('SELECT freezesAvailable FROM streak_freeze WHERE userId = $1', [userId]);
  return {
    success: true,
    freezesAvailable: freeze!.freezesAvailable,
    lingotsRemaining: spendResult.newTotal
  };
}

export async function applyStreakFreezeIfNeeded(userId: string): Promise<{ freezeUsed: boolean }> {
  const freeze = await queryOne<{ freezesAvailable: number }>('SELECT * FROM streak_freeze WHERE userId = $1', [userId]);

  if (freeze && freeze.freezesAvailable > 0) {
    await execute(`
      UPDATE streak_freeze SET freezesAvailable = freezesAvailable - 1, lastUsedAt = $1 WHERE userId = $2
    `, [new Date().toISOString(), userId]);
    return { freezeUsed: true };
  }

  return { freezeUsed: false };
}