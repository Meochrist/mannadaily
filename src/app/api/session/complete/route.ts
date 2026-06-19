import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { awardXP, updateStreak, checkAndAwardBadges } from "@/lib/gamification";
import { addXPToLeague } from "@/lib/leaderboard";
import { XP_RULES } from "@/types";
import { NextResponse } from "next/server";
import { trackEvent } from "@/lib/posthog";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.id;
    const body = await req.json();
    const { type, notes } = body;
    let period = body.period;

    const allowedTypes = ["classic", "thematic", "proclaim", "proclamation"];
    if (!type || !allowedTypes.includes(type)) {
      return NextResponse.json({ error: "Invalid or missing session type" }, { status: 400 });
    }

    // Auto-détecter la période si non fournie (si heure UTC < 14h -> morning, sinon evening)
    if (!period) {
      const utcHour = new Date().getUTCHours();
      period = utcHour < 14 ? "morning" : "evening";
    }

    if (period !== "morning" && period !== "evening") {
      return NextResponse.json({ error: "Invalid period. Must be morning or evening" }, { status: 400 });
    }

    // Chaque session de période rapporte 15 XP de base
    const xpEarned = 15;
    const xpReason = period === "morning" ? "morning_session" : "evening_session";

    // Enregistrer la session
    await db.dailySession.create({
      data: {
        userId,
        type,
        period,
        xpEarned,
        duration: 120,
        notes: notes || null,
      },
    });

    const todayStr = new Date().toISOString().split("T")[0];

    // Récupérer et mettre à jour UserProgress (flags de sessions quotidiennes)
    let progress = await db.userProgress.findUnique({
      where: { userId },
    });

    if (!progress) {
      progress = await db.userProgress.create({
        data: {
          userId,
          totalXP: 0,
          level: "Semence",
          versesLearned: 0,
          sessionsTotal: 0,
          lingots: 0,
          morningSessionToday: false,
          eveningSessionToday: false,
        },
      });
    }

    const isNewDay = progress.lastSessionDate !== todayStr;
    const wasMorningDoneBefore = isNewDay ? false : progress.morningSessionToday;
    const wasEveningDoneBefore = isNewDay ? false : progress.eveningSessionToday;
    const wasDayCompleteBefore = wasMorningDoneBefore && wasEveningDoneBefore;

    const morningDone = period === "morning" ? true : wasMorningDoneBefore;
    const eveningDone = period === "evening" ? true : wasEveningDoneBefore;
    const dayComplete = morningDone && eveningDone;
    const dayJustCompleted = dayComplete && !wasDayCompleteBefore;

    // Sauvegarder l'état mis à jour dans la progression de l'utilisateur
    await db.userProgress.update({
      where: { userId },
      data: {
        morningSessionToday: morningDone,
        eveningSessionToday: eveningDone,
        lastSessionDate: todayStr,
        sessionsTotal: {
          increment: 1,
        },
      },
    });

    // Attribuer l'XP de base
    let finalXPResult = await awardXP(userId, xpReason);

    // Si la journée vient d'être complétée, attribuer le bonus et mettre à jour le streak
    let bonusXP = 0;
    let currentStreak = 0;

    if (dayJustCompleted) {
      bonusXP = 10;
      finalXPResult = await awardXP(userId, "day_complete_bonus");
      currentStreak = await updateStreak(userId);
    } else {
      const userStreak = await db.streak.findUnique({
        where: { userId },
        select: { currentStreak: true }
      });
      currentStreak = userStreak ? userStreak.currentStreak : 0;
    }

    // Ajouter l'XP gagnée au classement de la ligue hebdomadaire
    await addXPToLeague(userId, xpEarned + bonusXP);

    // PostHog event tracking
    trackEvent(userId, "session_completed", { 
      type, 
      period, 
      xpEarned: xpEarned + bonusXP, 
      dayComplete 
    });

    const newBadges = await checkAndAwardBadges(userId);

    return NextResponse.json({
      xpEarned,
      bonusXP,
      dayComplete,
      morningDone,
      eveningDone,
      newXP: finalXPResult.newXP,
      leveledUp: finalXPResult.leveledUp,
      newLevel: finalXPResult.newLevel,
      levelName: finalXPResult.levelName,
      streak: currentStreak,
      newBadges,
    });
  } catch (error: unknown) {
    console.error("Error in session completion API:", error);
    const message = error instanceof Error ? error.message : "Internal Server Error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
