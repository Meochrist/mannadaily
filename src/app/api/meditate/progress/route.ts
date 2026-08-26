import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { awardXP, updateStreak } from "@/lib/gamification";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

const today = () => new Date().toISOString().slice(0, 10);
const emptyProgress = (date: string) => ({
  currentMiniSession: 1,
  currentStep: 0,
  sessionsCompleted: [] as number[],
  lastActivityDate: date,
  dayCompleted: false,
});

function isProgress(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function normalizeProgress(input: Record<string, unknown>, activityDate: string) {
  const rawSessions = Array.isArray(input.sessionsCompleted) ? input.sessionsCompleted : [];
  const sessionsCompleted = [...new Set(rawSessions.filter((value): value is number =>
    typeof value === "number" && Number.isInteger(value) && value >= 1 && value <= 3
  ))].sort((a, b) => a - b);
  // currentStep vaut 0 ou 1 dans le flux OIA+ (2 écrans par mini-session).
  // Le borner à 7 laissait passer des valeurs impossibles ; on garde
  // fidèlement l'étape en cours pour pouvoir reprendre au bon endroit.
  const rawStep = typeof input.currentStep === "number" && Number.isInteger(input.currentStep)
    ? Math.max(0, Math.min(1, input.currentStep))
    : 0;

  // GARDE-FOU : la position courante ne peut pas être ANTÉRIEURE aux
  // mini-sessions déjà validées. Un état incohérent (« mini 1 » alors que
  // [1,2] sont faites) renvoyait l'utilisateur au tout début de sa journée.
  // La position minimale légitime est donc « première mini non validée ».
  const minMiniSession = Math.min(3, sessionsCompleted.length + 1);
  const rawMini = typeof input.currentMiniSession === "number" && [1, 2, 3].includes(input.currentMiniSession)
    ? input.currentMiniSession
    : minMiniSession;
  const currentMiniSession = Math.max(rawMini, minMiniSession);
  // Si le garde-fou a fait avancer la position, on repart au 1er écran
  // de cette mini-session plutôt que d'hériter d'une étape sans rapport.
  const currentStep = currentMiniSession === rawMini ? rawStep : 0;

  return {
    currentMiniSession,
    currentStep,
    sessionsCompleted,
    lastActivityDate: activityDate,
    dayCompleted: sessionsCompleted.length === 3,
  };
}

export async function GET() {
  try {
    const session = await auth();
    const userId = session?.user?.id;
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const activityDate = today();
    const user = await db.user.findUnique({ where: { id: userId }, select: { meditationProgress: true } });
    if (!user || !isProgress(user.meditationProgress)) {
      return NextResponse.json({ progress: emptyProgress(activityDate) });
    }

    if (user.meditationProgress.lastActivityDate !== activityDate) {
      const reset = emptyProgress(activityDate);
      await db.user.update({ where: { id: userId }, data: { meditationProgress: reset } });
      return NextResponse.json({ progress: reset });
    }

    return NextResponse.json({ progress: normalizeProgress(user.meditationProgress, activityDate) });
  } catch (error) {
    console.error("Error in GET meditate progress:", error);
    return NextResponse.json({ error: "Unable to load meditation progress" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await auth();
    const userId = session?.user?.id;
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const contentLength = Number(req.headers.get("content-length") || 0);
    if (contentLength > 32_000) return NextResponse.json({ error: "Payload too large" }, { status: 413 });

    const body = await req.json();
    if (!isProgress(body?.progress)) {
      return NextResponse.json({ error: "Missing progress object" }, { status: 400 });
    }

    const activityDate = today();
    const requested = normalizeProgress(body.progress, activityDate);
    const claim = body.claimXPForSession;
    if (claim !== undefined && (!Number.isInteger(claim) || claim < 1 || claim > 3)) {
      return NextResponse.json({ error: "Invalid mini-session" }, { status: 400 });
    }

    const currentUser = await db.user.findUnique({ where: { id: userId }, select: { meditationProgress: true } });
    const existing = isProgress(currentUser?.meditationProgress) && currentUser.meditationProgress.lastActivityDate === activityDate
      ? normalizeProgress(currentUser.meditationProgress, activityDate)
      : emptyProgress(activityDate);

    let shouldAward = false;
    if (claim !== undefined) {
      if (!requested.sessionsCompleted.includes(claim)) {
        return NextResponse.json({ error: "The claimed mini-session is not completed" }, { status: 400 });
      }
      if (existing.sessionsCompleted.includes(claim)) {
        return NextResponse.json({ success: true, alreadyClaimed: true, progress: existing, xpResult: null, streak: 0 });
      }
      const prerequisites = claim === 1 ? [] : claim === 2 ? [1] : [1, 2];
      if (!prerequisites.every((item) => existing.sessionsCompleted.includes(item))) {
        return NextResponse.json({ error: "Mini-sessions must be completed in order" }, { status: 409 });
      }
      const newSessions = [...existing.sessionsCompleted, claim].sort((a, b) => a - b);
      if (newSessions.some((value) => !requested.sessionsCompleted.includes(value)) || newSessions.length !== requested.sessionsCompleted.length) {
        return NextResponse.json({ error: "Invalid progress transition" }, { status: 409 });
      }
      shouldAward = true;
    }

    const updatedUser = await db.user.update({
      where: { id: userId },
      data: { meditationProgress: requested },
      select: { meditationProgress: true },
    });

    let xpResult = null;
    let streak = 0;
    if (shouldAward) {
      const action = claim === 1 ? "meditation_mini_1" : claim === 2 ? "meditation_mini_2" : "meditation_mini_3";
      xpResult = await awardXP(userId, action);
      // Update streak on every claim — updateStreak has built-in same-day dedup
      streak = await updateStreak(userId);
    }

    return NextResponse.json({ success: true, alreadyClaimed: false, progress: updatedUser.meditationProgress, xpResult, streak });
  } catch (error) {
    console.error("Error in POST meditate progress:", error);
    return NextResponse.json({ error: "Unable to save meditation progress" }, { status: 500 });
  }
}
