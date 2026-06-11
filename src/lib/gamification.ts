import { db } from "@/lib/db";
import { LEVELS, XP_RULES } from "@/types";
import { differenceInCalendarDays } from "date-fns";

export interface LevelResult {
  level: number;
  name: string;
  xpRequired: number;
  xpNext: number | null;
}

export function getLevelFromXP(xp: number): LevelResult {
  const sortedLevels = [...LEVELS].sort((a, b) => b.level - a.level);
  
  const currentLevelObj = sortedLevels.find((l) => xp >= l.xpRequired) || LEVELS[0];
  
  const nextLevelObj = LEVELS.find((l) => l.level === currentLevelObj.level + 1) || null;
  
  return {
    level: currentLevelObj.level,
    name: currentLevelObj.name,
    xpRequired: currentLevelObj.xpRequired,
    xpNext: nextLevelObj ? nextLevelObj.xpRequired : null,
  };
}

export function getXPProgress(xp: number): number {
  const current = getLevelFromXP(xp);
  
  if (current.xpNext === null) {
    return 100;
  }
  
  const range = current.xpNext - current.xpRequired;
  if (range <= 0) return 0;
  
  const progress = ((xp - current.xpRequired) / range) * 100;
  return Math.min(100, Math.max(0, Math.round(progress)));
}

export async function awardXP(
  userId: string, 
  action: keyof typeof XP_RULES | "session_complete" | "perfect_session" | "streak_bonus"
) {
  try {
    const xpToAdd = (action in XP_RULES) ? XP_RULES[action as keyof typeof XP_RULES] : 0;

    let lingotsToAdd = 0;
    if (action === "session_complete" || action === "DAILY_MEDITATION" || action === "PROCLAMATION_SESSION" || action === "MEMORIZATION") {
      lingotsToAdd = 5;
    } else if (action === "perfect_session") {
      lingotsToAdd = 10;
    } else if (action === "streak_bonus" || action === "STREAK_BONUS_BASE") {
      lingotsToAdd = 3;
    }

    return await db.$transaction(async (tx) => {
      let progress = await tx.userProgress.findUnique({
        where: { userId },
      });

      if (!progress) {
        progress = await tx.userProgress.create({
          data: {
            userId,
            totalXP: 0,
            level: "Semence",
            versesLearned: 0,
            sessionsTotal: 0,
            lingots: 0,
          },
        });
      }

      const oldXP = progress.totalXP;
      const newXP = oldXP + xpToAdd;
      
      const oldLevelInfo = getLevelFromXP(oldXP);
      const newLevelInfo = getLevelFromXP(newXP);
      
      const leveledUp = newLevelInfo.level > oldLevelInfo.level;
      const newLingots = progress.lingots + lingotsToAdd;

      await tx.userProgress.update({
        where: { userId },
        data: {
          totalXP: newXP,
          level: newLevelInfo.name,
          lingots: newLingots,
        },
      });

      if (xpToAdd > 0) {
        await tx.xPTransaction.create({
          data: {
            userId,
            amount: xpToAdd,
            reason: action,
          },
        });
      }

      return {
        newXP,
        leveledUp,
        newLevel: newLevelInfo.level,
        levelName: newLevelInfo.name,
        newLingots,
      };
    });
  } catch (error: unknown) {
    console.error("Error awarding XP:", error);
    throw error;
  }
}

export async function updateStreak(userId: string): Promise<number> {
  try {
    const today = new Date();

    let streak = await db.streak.findUnique({
      where: { userId },
    });

    if (!streak) {
      streak = await db.streak.create({
        data: {
          userId,
          currentStreak: 0,
          longestStreak: 0,
          lastActivityAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
        },
      });
    }

    const daysDiff = differenceInCalendarDays(today, streak.lastActivityAt);

    let newCurrentStreak = streak.currentStreak;

    if (daysDiff === 0) {
      return streak.currentStreak;
    } else if (daysDiff === 1) {
      newCurrentStreak += 1;
    } else {
      // Le streak risque d'être brisé, on vérifie si un streak freeze est dispo et on l'applique
      const freezeResult = await applyStreakFreezeIfNeeded(userId);
      if (freezeResult.freezeUsed) {
        // Le streak est maintenu intact
      } else {
        newCurrentStreak = 1;
      }
    }

    const newLongestStreak = Math.max(streak.longestStreak, newCurrentStreak);

    await db.streak.update({
      where: { userId },
      data: {
        currentStreak: newCurrentStreak,
        longestStreak: newLongestStreak,
        lastActivityAt: today,
      },
    });

    return newCurrentStreak;
  } catch (error: unknown) {
    console.error("Error updating streak:", error);
    throw error;
  }
}

export async function checkAndAwardBadges(userId: string) {
  try {
    const progress = await db.userProgress.findUnique({
      where: { userId },
    });

    const streak = await db.streak.findUnique({
      where: { userId },
    });

    if (!progress) return [];

    const currentStreak = streak ? streak.currentStreak : 0;
    const sessionsTotal = progress.sessionsTotal;
    const versesLearned = progress.versesLearned;

    const badgeConditions = [
      {
        condition: "first_session",
        name: "Premier Pas",
        description: "Terminez votre première session quotidienne",
        icon: "Compass",
        met: sessionsTotal >= 1,
      },
      {
        condition: "streak_7",
        name: "Fidèle Étoile",
        description: "Atteignez une série de 7 jours consécutifs",
        icon: "Flame",
        met: currentStreak >= 7,
      },
      {
        condition: "streak_30",
        name: "Guerrier de la Parole",
        description: "Atteignez une série de 30 jours consécutifs",
        icon: "Crown",
        met: currentStreak >= 30,
      },
      {
        condition: "verses_10",
        name: "Scribe de l'Esprit",
        description: "Apprenez 10 versets de la Bible",
        icon: "BookOpen",
        met: versesLearned >= 10,
      },
      {
        condition: "sessions_50",
        name: "Pilier de Foi",
        description: "Complétez 50 sessions au total",
        icon: "Shield",
        met: sessionsTotal >= 50,
      },
    ];

    const newlyAwardedBadges: Array<{ name: string; icon: string; description: string }> = [];

    for (const b of badgeConditions) {
      if (b.met) {
        const badge = await db.badge.upsert({
          where: { name: b.name },
          update: {},
          create: {
            name: b.name,
            description: b.description,
            icon: b.icon,
            condition: b.condition,
          },
        });

        const alreadyHasBadge = await db.userBadge.findUnique({
          where: {
            userId_badgeId: {
              userId,
              badgeId: badge.id,
            },
          },
        });

        if (!alreadyHasBadge) {
          await db.userBadge.create({
            data: {
              userId,
              badgeId: badge.id,
            },
          });

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
    console.error("Error checking and awarding badges:", error);
    throw error;
  }
}

// === LOGIQUE LIÉE AUX LINGOTS ET STREAK FREEZE (Tâche #41) ===

export async function awardLingots(userId: string, amount: number): Promise<number> {
  const progress = await db.userProgress.upsert({
    where: { userId },
    update: {
      lingots: { increment: amount }
    },
    create: {
      userId,
      totalXP: 0,
      level: "Semence",
      versesLearned: 0,
      sessionsTotal: 0,
      lingots: amount
    }
  });
  return progress.lingots;
}

export async function spendLingots(userId: string, amount: number): Promise<{ success: boolean; newTotal: number }> {
  return await db.$transaction(async (tx) => {
    const progress = await tx.userProgress.findUnique({
      where: { userId }
    });
    
    if (!progress || progress.lingots < amount) {
      return { success: false, newTotal: progress ? progress.lingots : 0 };
    }

    const updated = await tx.userProgress.update({
      where: { userId },
      data: {
        lingots: { decrement: amount }
      }
    });

    return { success: true, newTotal: updated.lingots };
  });
}

export async function buyStreakFreeze(userId: string): Promise<{ success: boolean; freezesAvailable: number; lingotsRemaining: number }> {
  const spendResult = await spendLingots(userId, 10);
  
  if (!spendResult.success) {
    const freeze = await db.streakFreeze.findUnique({
      where: { userId }
    });
    return {
      success: false,
      freezesAvailable: freeze ? freeze.freezesAvailable : 0,
      lingotsRemaining: spendResult.newTotal
    };
  }

  const streakFreeze = await db.streakFreeze.upsert({
    where: { userId },
    update: {
      freezesAvailable: { increment: 1 }
    },
    create: {
      userId,
      freezesAvailable: 1
    }
  });

  return {
    success: true,
    freezesAvailable: streakFreeze.freezesAvailable,
    lingotsRemaining: spendResult.newTotal
  };
}

export async function applyStreakFreezeIfNeeded(userId: string): Promise<{ freezeUsed: boolean }> {
  return await db.$transaction(async (tx) => {
    const freeze = await tx.streakFreeze.findUnique({
      where: { userId }
    });

    if (freeze && freeze.freezesAvailable > 0) {
      await tx.streakFreeze.update({
        where: { userId },
        data: {
          freezesAvailable: { decrement: 1 },
          lastUsedAt: new Date()
        }
      });
      return { freezeUsed: true };
    }

    return { freezeUsed: false };
  });
}
