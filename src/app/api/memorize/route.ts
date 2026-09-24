import { NextRequest, NextResponse } from "next/server";
import { query, queryOne, execute } from "@/server/db";

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

    const now = new Date().toISOString();

    const memorizations = await query(`
      SELECT * FROM verse_memorizations
      WHERE userId = $1 AND nextReview <= $2
      ORDER BY nextReview ASC
    `, [userId, now]);

    const mastered = await query(`
      SELECT * FROM verse_memorizations
      WHERE userId = $1 AND status = 'mastered'
      ORDER BY createdAt DESC
    `, [userId]);

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

    const now = new Date().toISOString();

    let verseId = "placeholder-id";
    const refRegex = /^(.+?)\s+(\d+)[:v](\d+)$/;
    const match = reference.trim().match(refRegex);
    if (match) {
      const bookName = match[1];
      const chapter = parseInt(match[2], 10);
      const verseNum = parseInt(match[3], 10);

      const dbVerse = await queryOne("SELECT id FROM verses WHERE book = $1 AND chapter = $2 AND verse = $3", [bookName, chapter, verseNum]);
      if (dbVerse) {
        verseId = dbVerse.id;
      }
    }

    const existing = await queryOne("SELECT id FROM verse_memorizations WHERE userId = $1 AND reference = $2", [userId, reference]);

    if (existing) {
      await execute(`
        UPDATE verse_memorizations SET verseText = $1, nextReview = $2, status = 'learning', repetitions = 0, interval = 1, easeFactor = 2.5 WHERE id = $3
      `, [verseText, now, existing.id]);
    } else {
      await execute(`
        INSERT INTO verse_memorizations (id, userId, verseId, reference, verseText, status, nextReview) VALUES ($1, $2, $3, $4, $5, 'learning', $6)
      `, [crypto.randomUUID(), userId, verseId, reference, verseText, now]);
    }

    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
