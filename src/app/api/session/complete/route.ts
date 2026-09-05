import { NextResponse } from "next/server";
import { initServerDb } from "@/server/db";
import { awardXP, updateStreak, checkAndAwardBadges } from "@/lib/gamification";
import { addXPToLeague } from "@/lib/leaderboard";
import { trackEvent } from "@/lib/posthog";

export const dynamic = "force-dynamic";

const ALLOWED_TYPES = new Set(["classic", "thematic", "proclaim", "proclamation"]);
const ALLOWED_PERIODS = new Set(["morning", "midday", "evening"]);
const MAX_NOTES_LENGTH = 10_000;

function getActivityDate() {
  return new Date().toISOString().slice(0, 10);
}

function getPeriodFromHour(): string {
  const hour = new Date().getHours();
  if (hour < 12) return "morning";
  if (hour < 17) return "midday";
  return "evening";
}

export async function POST(req: Request) {
  try {
    const authHeader = req.headers.get("authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const token = authHeader.slice(7);
    const decoded = JSON.parse(atob(token.split(".")[1]));
    const userId = decoded.userId;

    const contentLength = Number(req.headers.get("content-length") || 0);
    if (contentLength > 32_000) {
      return NextResponse.json({ error: "Payload too large" }, { status: 413 });
    }

    const body = await req.json();
    const { type, period, notes } = body;

    if (typeof type !== "string" || !ALLOWED_TYPES.has(type)) {
      return NextResponse.json({ error: "Invalid or missing session type" }, { status: 400 });
    }

    const resolvedPeriod = typeof period === "string" && ALLOWED_PERIODS.has(period) ? period : getPeriodFromHour();
    if (notes !== undefined && notes !== null && (typeof notes !== "string" || notes.length > MAX_NOTES_LENGTH)) {
      return NextResponse.json({ error: "Notes are too long" }, { status: 400 });
    }

    const activityDate = getActivityDate();
    const db = initServerDb();

    // Idempotency guard
    const existingSession = db.prepare("SELECT id FROM daily_sessions WHERE userId = ? AND activityDate = ? AND period = ?").get(userId, activityDate, resolvedPeriod);
    if (existingSession) {
      const progress = db.prepare("SELECT * FROM user_progress WHERE userId = ?").get(userId);
      const streak = db.prepare("SELECT currentStreak FROM streaks WHERE userId = ?").get(userId);
      return NextResponse.json({
        success: true,
        alreadyCompleted: true,
        dayComplete: Boolean(progress?.morningSessionToday && progress.middaySessionToday && progress.eveningSessionToday),
        morningDone: progress?.lastSessionDate === activityDate && progress.morningSessionToday,
        middayDone: progress?.lastSessionDate === activityDate && progress.middaySessionToday,
        eveningDone: progress?.lastSessionDate === activityDate && progress.eveningSessionToday,
        xpEarned: 0,
        bonusXP: 0,
        newXP: progress?.totalXP ?? 0,
        leveledUp: false,
        newLevel: progress?.level ?? "Semence",
        levelName: progress?.level ?? "Semence",
        streak: streak?.currentStreak ?? 0,
        newBadges: [],
      });
    }

    // Create session
    db.prepare(`
      INSERT INTO daily_sessions (id, userId, type, period, activityDate, xpEarned, duration, notes)
      VALUES (?, ?, ?, ?, ?, 15, 120, ?)
    `).run(crypto.randomUUID(), userId, type, resolvedPeriod, activityDate, typeof notes === "string" && notes.trim() ? notes.trim() : null);

    // Classic type is already rewarded via mini-sessions
    if (type === "classic") {
      const progress = db.prepare("SELECT * FROM user_progress WHERE userId = ?").get(userId);
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
        streak: 0,
        newBadges: [],
      });
    }

    let progress = db.prepare("SELECT * FROM user_progress WHERE userId = ?").get(userId);
    if (!progress) {
      db.prepare("INSERT INTO user_progress (id, userId, totalXP, level, versesLearned, sessionsTotal, lingots) VALUES (?, ?, 0, 'Semence', 0, 0, 0)").run(crypto.randomUUID(), userId);
      progress = db.prepare("SELECT * FROM user_progress WHERE userId = ?").get(userId);
    }

    const sameDay = progress.lastSessionDate === activityDate;
    const wasMorningDone = sameDay && progress.morningSessionToday;
    const wasMiddayDone = sameDay && progress.middaySessionToday;
    const wasEveningDone = sameDay && progress.eveningSessionToday;
    const wasDayComplete = wasMorningDone && wasMiddayDone && wasEveningDone;

    const morningDone = resolvedPeriod === "morning" || wasMorningDone;
    const middayDone = resolvedPeriod === "midday" || wasMiddayDone;
    const eveningDone = resolvedPeriod === "evening" || wasEveningDone;
    const dayComplete = morningDone && middayDone && eveningDone;
    const dayJustCompleted = dayComplete && !wasDayComplete;

    db.prepare(`
      UPDATE user_progress SET morningSessionToday = ?, middaySessionToday = ?, eveningSessionToday = ?, lastSessionDate = ?, sessionsTotal = sessionsTotal + 1 WHERE userId = ?
    `).run(morningDone, middayDone, eveningDone, activityDate, userId);

    const baseXPResult = await awardXP(userId, "morning_session");
    let finalXPResult = baseXPResult;
    let bonusXP = 0;
    let currentStreak = 0;

    if (dayJustCompleted) {
      bonusXP = 10;
      finalXPResult = await awardXP(userId, "day_complete_bonus");
      currentStreak = await updateStreak(userId);
    }

    await addXPToLeague(userId, 15 + bonusXP);
    trackEvent(userId, "session_completed", { type, period: resolvedPeriod, xpEarned: 15 + bonusXP, dayComplete });
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
