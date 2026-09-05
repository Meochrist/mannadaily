import { NextResponse } from 'next/server';
import { awardXP, updateStreak } from '@/lib/gamification';
import { dateStrForOffset, offsetFromHeaders } from '@/lib/localDate';
import { getServerDb, initServerDb } from '@/server/db';

export const dynamic = 'force-dynamic';

const todayFor = (headers: Headers) => dateStrForOffset(offsetFromHeaders(headers));
const emptyProgress = (date: string) => ({
  currentMiniSession: 1,
  currentStep: 0,
  sessionsCompleted: [] as number[],
  lastActivityDate: date,
  dayCompleted: false,
});

function isProgress(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function normalizeProgress(input: Record<string, unknown>, activityDate: string) {
  const rawSessions = Array.isArray(input.sessionsCompleted) ? input.sessionsCompleted : [];
  const sessionsCompleted = [...new Set(rawSessions.filter((value): value is number =>
    typeof value === 'number' && Number.isInteger(value) && value >= 1 && value <= 3
  ))].sort((a, b) => a - b);
  const rawStep = typeof input.currentStep === 'number' && Number.isInteger(input.currentStep)
    ? Math.max(0, Math.min(1, input.currentStep))
    : 0;
  const minMiniSession = Math.min(3, sessionsCompleted.length + 1);
  const rawMini = typeof input.currentMiniSession === 'number' && [1, 2, 3].includes(input.currentMiniSession)
    ? input.currentMiniSession
    : minMiniSession;
  const currentMiniSession = Math.max(rawMini, minMiniSession);
  const currentStep = currentMiniSession === rawMini ? rawStep : 0;

  return {
    currentMiniSession,
    currentStep,
    sessionsCompleted,
    lastActivityDate: activityDate,
    dayCompleted: sessionsCompleted.length === 3,
    verseReference: typeof input.verseReference === 'string' ? input.verseReference : undefined,
  };
}

export async function GET(req: Request) {
  try {
    const authHeader = req.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.slice(7);
    const decoded = JSON.parse(atob(token.split('.')[1]));
    const userId = decoded.userId;

    const activityDate = todayFor(req.headers);
    const db = initServerDb();
    
    const user = db.prepare('SELECT meditationProgress FROM users WHERE id = ?').get(userId) as any;
    if (!user || !isProgress(user.meditationProgress)) {
      return NextResponse.json({ progress: emptyProgress(activityDate) });
    }

    if (user.meditationProgress.lastActivityDate !== activityDate) {
      return NextResponse.json({ progress: emptyProgress(activityDate) });
    }

    return NextResponse.json({ progress: normalizeProgress(user.meditationProgress, activityDate) });
  } catch (error) {
    console.error('Error in GET meditate progress:', error);
    return NextResponse.json({ error: 'Unable to load meditation progress' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const authHeader = req.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.slice(7);
    const decoded = JSON.parse(atob(token.split('.')[1]));
    const userId = decoded.userId;

    const contentLength = Number(req.headers.get('content-length') || 0);
    if (contentLength > 32_000) return NextResponse.json({ error: 'Payload too large' }, { status: 413 });

    const body = await req.json();
    if (!isProgress(body?.progress)) {
      return NextResponse.json({ error: 'Missing progress object' }, { status: 400 });
    }

    const activityDate = todayFor(req.headers);
    const requested = normalizeProgress(body.progress, activityDate);
    const claim = body.claimXPForSession;
    if (claim !== undefined && (!Number.isInteger(claim) || claim < 1 || claim > 3)) {
      return NextResponse.json({ error: 'Invalid mini-session' }, { status: 400 });
    }

    const db = initServerDb();
    const currentUser = db.prepare('SELECT meditationProgress FROM users WHERE id = ?').get(userId) as any;
    const existing = isProgress(currentUser?.meditationProgress) && currentUser.meditationProgress.lastActivityDate === activityDate
      ? normalizeProgress(currentUser.meditationProgress, activityDate)
      : emptyProgress(activityDate);

    let shouldAward = false;
    if (claim !== undefined) {
      if (!requested.sessionsCompleted.includes(claim)) {
        return NextResponse.json({ error: 'The claimed mini-session is not completed' }, { status: 400 });
      }
      if (existing.sessionsCompleted.includes(claim)) {
        return NextResponse.json({ success: true, alreadyClaimed: true, progress: existing, xpResult: null, streak: 0 });
      }
      const prerequisites = claim === 1 ? [] : claim === 2 ? [1] : [1, 2];
      if (!prerequisites.every((item) => existing.sessionsCompleted.includes(item))) {
        return NextResponse.json({ error: 'Mini-sessions must be completed in order' }, { status: 409 });
      }
      const newSessions = [...existing.sessionsCompleted, claim].sort((a, b) => a - b);
      if (newSessions.some((value) => !requested.sessionsCompleted.includes(value)) || newSessions.length !== requested.sessionsCompleted.length) {
        return NextResponse.json({ error: 'Invalid progress transition' }, { status: 409 });
      }
      shouldAward = true;
    }

    db.prepare('UPDATE users SET meditationProgress = ? WHERE id = ?').run(JSON.stringify(requested), userId);

    let xpResult = null;
    let streak = 0;
    if (shouldAward) {
      const action = claim === 1 ? 'meditation_mini_1' : claim === 2 ? 'meditation_mini_2' : 'meditation_mini_3';
      xpResult = await awardXP(userId, action);
      streak = await updateStreak(userId);
    }

    return NextResponse.json({ success: true, alreadyClaimed: false, progress: requested, xpResult, streak });
  } catch (error) {
    console.error('Error in POST meditate progress:', error);
    return NextResponse.json({ error: 'Unable to save meditation progress' }, { status: 500 });
  }
}
