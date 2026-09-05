import { NextResponse } from 'next/server';
import { getServerDb, initServerDb } from '@/server/db';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const book = searchParams.get('book');
    const chapter = searchParams.get('chapter');
    const translation = searchParams.get('translation') || 'LSG';

    if (!book || !chapter) {
      return NextResponse.json({ error: 'book et chapter requis' }, { status: 400 });
    }

    const db = initServerDb();

    const verses = db.prepare(`
      SELECT * FROM bible_verses 
      WHERE book = ? AND chapter = ? AND translation = ?
      ORDER BY verse
    `).all(book, parseInt(chapter), translation);

    return NextResponse.json({ verses });
  } catch (error: unknown) {
    console.error('Error in bible chapter API:', error);
    const message = error instanceof Error ? error.message : 'Internal Server Error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
