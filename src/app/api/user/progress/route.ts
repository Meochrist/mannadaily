import { NextResponse } from 'next/server';
import { queryOne } from '@/server/db';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json({ error: 'userId requis' }, { status: 400 });
    }

    const progress = await queryOne('SELECT * FROM user_progress WHERE userId = $1', [userId]);
    const streak = await queryOne('SELECT * FROM streaks WHERE userId = $1', [userId]);
    const user = await queryOne<{ id: string; name: string; email: string; meditationProgress: string }>(
      'SELECT id, name, email, meditationProgress FROM users WHERE id = $1',
      [userId]
    );

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