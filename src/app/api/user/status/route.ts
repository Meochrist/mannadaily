import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { getDailyVerse } from "@/lib/verses";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const session = await auth();
    const userId = session?.user?.id;
    const userName = session?.user?.name || "Ami";

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Verset du jour
    const dailyVerse = getDailyVerse();

    // Streak
    const streak = await db.streak.findUnique({
      where: { userId },
      select: { currentStreak: true, longestStreak: true },
    });
    const currentStreak = streak?.currentStreak ?? 0;
    const longestStreak = streak?.longestStreak ?? 0;

    // Progression de méditation
    const user = await db.user.findUnique({
      where: { id: userId },
      select: { meditationProgress: true },
    });

    const todayStr = new Date().toISOString().split("T")[0];
    let meditationProgress = null;
    let sessionsCompletedToday = 0;
    let dayStatus: "morning" | "evening" | "complete" | "none" = "none";

    if (user?.meditationProgress && typeof user.meditationProgress === "object") {
      const mp = user.meditationProgress as Record<string, unknown>;
      if (mp.lastActivityDate === todayStr) {
        meditationProgress = mp;
        const sessions = Array.isArray(mp.sessionsCompleted) ? mp.sessionsCompleted as number[] : [];
        sessionsCompletedToday = sessions.length;

        if (sessionsCompletedToday === 3) {
          dayStatus = "complete";
        } else if (sessionsCompletedToday >= 1) {
          dayStatus = "evening";
        } else {
          dayStatus = "morning";
        }
      }
    }

    // Vérifier les sessions du jour pour morning/evening
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const todaySessions = await db.dailySession.findMany({
      where: { userId, createdAt: { gte: todayStart } },
      select: { period: true },
    });

    const hasMorning = todaySessions.some((s) => s.period === "morning");
    const hasEvening = todaySessions.some((s) => s.period === "evening" || s.period === "midday");

    if (hasMorning && hasEvening) {
      dayStatus = "complete";
    } else if (hasMorning) {
      dayStatus = "morning";
    } else if (hasEvening) {
      dayStatus = "evening";
    }

    // XP et niveau
    const progress = await db.userProgress.findUnique({
      where: { userId },
      select: { totalXP: true, level: true },
    });
    const totalXP = progress?.totalXP ?? 0;
    const levelName = progress?.level ?? "Semence";

    // Lingots
    const freeze = await db.streakFreeze.findUnique({
      where: { userId },
      select: { freezesAvailable: true },
    });
    const freezesAvailable = freeze?.freezesAvailable ?? 0;

    return NextResponse.json({
      userId,
      userName,
      dailyVerse,
      currentStreak,
      longestStreak,
      dayStatus,
      sessionsCompletedToday,
      meditationProgress,
      totalXP,
      levelName,
      freezesAvailable,
    });
  } catch (error) {
    console.error("Error in /api/user/status:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
