import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { awardXP, updateStreak, checkAndAwardBadges } from "@/lib/gamification";
import { addXPToLeague } from "@/lib/leaderboard";
import { NextResponse } from "next/server";
import { trackEvent } from "@/lib/posthog";

export const dynamic = "force-dynamic";

const ALLOWED_TYPES = new Set(["classic", "thematic", "proclaim", "proclamation"]);
const ALLOWED_PERIODS = new Set(["morning", "midday", "evening"]);
const MAX_NOTES_LENGTH = 10_000;

function getActivityDate() {
  return new Date().toISOString().slice(0, 10);
}

function isUniqueConstraintError(error: unknown) {
  return typeof error === "object" && error !== null && "code" in error && error.code === "P2002";
}

export async function POST(req: Request) {
  try {
    const session = await auth();
    const userId = session?.user?.id;
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const contentLength = Number(req.headers.get("content-length") || 0);
    if (contentLength > 32_000) {
      return NextResponse.json({ error: "Payload too large" }, { status: 413 });
    }

    const body = await req.json();
    const { type, period, notes } = body as {
      type?: unknown;
      period?: unknown;
      notes?: unknown;
    };

    if (typeof type !== "string" || !ALLOWED_TYPES.has(type)) {
      return NextResponse.json({ error: "Invalid or missing session type" }, { status: 400 });
    }
    if (typeof period !== "string" || !ALLOWED_PERIODS.has(period)) {
      return NextResponse.json({ error: "Invalid period" }, { status: 400 });
    }
    if (notes !== undefined && notes !== null && (typeof notes !== "string" || notes.length > MAX_NOTES_LENGTH)) {
      return NextResponse.json({ error: "Notes are too long" }, { status: 400 });
    }

    const activityDate = getActivityDate();

    // The composite unique key is the server-side idempotency guard.
    try {
      await db.dailySession.create({
        data: {
          userId,
          type,
          period,
          activityDate,
          xpEarned: 15,
          duration: 120,
          notes: typeof notes === "string" && notes.trim() ? notes.trim() : null,
        },
      });
    } catch (error) {
      if (isUniqueConstraintError(error)) {
        const progress = await db.userProgress.findUnique({ where: { userId } });
        return NextResponse.json({
          success: true,
          alreadyCompleted: true,
          dayComplete: Boolean(progress?.morningSessionToday && progress.middaySessionToday && progress.eveningSessionToday),
          morningDone: progress?.lastSessionDate === activityDate && progress.morningSessionToday,
          middayDone: progress?.lastSessionDate === activityDate && progress.middaySessionToday,
          eveningDone: progress?.lastSessionDate === activityDate && progress.eveningSessionToday,
        });
      }
      throw error;
    }

    // Une méditation classique est déjà récompensée par les trois mini-sessions
    // via /api/meditate/progress. Cette route persiste uniquement le journal final
    // afin d'éviter de créditer deux fois l'XP.
    if (type === "classic") {
      const progress = await db.userProgress.findUnique({ where: { userId } });
      const sameDay = progress?.lastSessionDate === activityDate;
      const morningDone = Boolean(sameDay && progress?.morningSessionToday);
      const middayDone = Boolean(sameDay && progress?.middaySessionToday);
      const eveningDone = Boolean(sameDay && progress?.eveningSessionToday);
      return NextResponse.json({
        success: true,
        alreadyCompleted: false,
        xpEarned: 0,
        bonusXP: 0,
        dayComplete: morningDone && middayDone && eveningDone,
        morningDone,
        middayDone,
        eveningDone,
        newXP: progress?.totalXP ?? 0,
        leveledUp: false,
        newLevel: progress?.level ?? "Semence",
        levelName: progress?.level ?? "Semence",
        streak: (await db.streak.findUnique({ where: { userId }, select: { currentStreak: true } }))?.currentStreak ?? 0,
        newBadges: [],
      });
    }

    let progress = await db.userProgress.findUnique({ where: { userId } });
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
          middaySessionToday: false,
          eveningSessionToday: false,
        },
      });
    }

    const sameDay = progress.lastSessionDate === activityDate;
    const wasMorningDone = sameDay && progress.morningSessionToday;
    const wasMiddayDone = sameDay && progress.middaySessionToday;
    const wasEveningDone = sameDay && progress.eveningSessionToday;
    const wasDayComplete = wasMorningDone && wasMiddayDone && wasEveningDone;

    const morningDone = period === "morning" || wasMorningDone;
    const middayDone = period === "midday" || wasMiddayDone;
    const eveningDone = period === "evening" || wasEveningDone;
    const dayComplete = morningDone && middayDone && eveningDone;
    const dayJustCompleted = dayComplete && !wasDayComplete;

    await db.userProgress.update({
      where: { userId },
      data: {
        morningSessionToday: morningDone,
        middaySessionToday: middayDone,
        eveningSessionToday: eveningDone,
        lastSessionDate: activityDate,
        sessionsTotal: { increment: 1 },
      },
    });

    const baseXPResult = await awardXP(userId, "morning_session");
    let finalXPResult = baseXPResult;
    let bonusXP = 0;
    let currentStreak = (await db.streak.findUnique({ where: { userId }, select: { currentStreak: true } }))?.currentStreak ?? 0;

    if (dayJustCompleted) {
      bonusXP = 10;
      finalXPResult = await awardXP(userId, "day_complete_bonus");
      currentStreak = await updateStreak(userId);
    }

    await addXPToLeague(userId, 15 + bonusXP);
    trackEvent(userId, "session_completed", { type, period, xpEarned: 15 + bonusXP, dayComplete });
    const newBadges = await checkAndAwardBadges(userId);

    return NextResponse.json({
      success: true,
      alreadyCompleted: false,
      xpEarned: 15,
      bonusXP,
      dayComplete,
      morningDone,
      middayDone,
      eveningDone,
      newXP: baseXPResult.newXP + bonusXP,
      leveledUp: baseXPResult.leveledUp || finalXPResult.leveledUp,
      newLevel: finalXPResult.newLevel,
      levelName: finalXPResult.levelName,
      streak: currentStreak,
      newBadges,
    });
  } catch (error: unknown) {
    console.error("Error in session completion API:", error);
    return NextResponse.json({ error: "Unable to complete session" }, { status: 500 });
  }
}
