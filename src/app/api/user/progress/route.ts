import { NextResponse } from 'next/server';
import { getServerDb, initServerDb } from '@/server/db';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json({ error: 'userId requis' }, { status: 400 });
    }

    const db = initServerDb();

    const progress = db.prepare('SELECT * FROM user_progress WHERE userId = ?').get(userId);
    const streak = db.prepare('SELECT * FROM streaks WHERE userId = ?').get(userId);
    const user = db.prepare('SELECT id, name, email, meditationProgress FROM users WHERE id = ?').get(userId);

    let meditationProgress = null;
    if (user?.meditationProgress) {
      try {
        meditationProgress = JSON.parse(user.meditationProgress);
      } catch {
        meditationProgress = null;
      }
    }

    return NextResponse.json({
      progress,
      streak,
      meditationProgress,
    });
  } catch (error: unknown) {
    console.error('Error in user progress API:', error);
    const message = error instanceof Error ? error.message : 'Internal Server Error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
