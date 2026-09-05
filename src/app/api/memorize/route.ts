import { NextRequest, NextResponse } from "next/server";
import { initServerDb } from "@/server/db";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    const authHeader = req.headers.get("authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const token = authHeader.slice(7);
    const decoded = JSON.parse(atob(token.split(".")[1]));
    const userId = decoded.userId;

    const db = initServerDb();
    const now = new Date().toISOString();

    const memorizations = db.prepare(`
      SELECT * FROM verse_memorizations
      WHERE userId = ? AND nextReview <= ?
      ORDER BY nextReview ASC
    `).all(userId, now);

    const mastered = db.prepare(`
      SELECT * FROM verse_memorizations
      WHERE userId = ? AND status = 'mastered'
      ORDER BY createdAt DESC
    `).all(userId);

    return NextResponse.json({ memorizations, mastered });
  } catch (error: unknown) {
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get("authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const token = authHeader.slice(7);
    const decoded = JSON.parse(atob(token.split(".")[1]));
    const userId = decoded.userId;

    const { reference, verseText } = await request.json();

    if (!reference || !verseText) {
      return NextResponse.json({ error: "Référence et texte requis" }, { status: 400 });
    }

    const db = initServerDb();
    const now = new Date().toISOString();

    let verseId = "placeholder-id";
    const refRegex = /^(.+?)\s+(\d+)[:v](\d+)$/;
    const match = reference.trim().match(refRegex);
    if (match) {
      const bookName = match[1];
      const chapter = parseInt(match[2], 10);
      const verseNum = parseInt(match[3], 10);

      const dbVerse = db.prepare("SELECT id FROM verses WHERE book = ? AND chapter = ? AND verse = ?").get(bookName, chapter, verseNum);
      if (dbVerse) {
        verseId = dbVerse.id;
      }
    }

    const existing = db.prepare("SELECT id FROM verse_memorizations WHERE userId = ? AND reference = ?").get(userId, reference);

    if (existing) {
      db.prepare(`
        UPDATE verse_memorizations SET verseText = ?, nextReview = ?, status = 'learning', repetitions = 0, interval = 1, easeFactor = 2.5 WHERE id = ?
      `).run(verseText, now, existing.id);
    } else {
      db.prepare(`
        INSERT INTO verse_memorizations (id, userId, verseId, reference, verseText, status, nextReview) VALUES (?, ?, ?, ?, ?, 'learning', ?)
      `).run(crypto.randomUUID(), userId, verseId, reference, verseText, now);
    }

    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
