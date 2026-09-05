import { NextResponse } from "next/server";
import { initServerDb } from "@/server/db";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const authHeader = req.headers.get("authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const token = authHeader.slice(7);
    const decoded = JSON.parse(atob(token.split(".")[1]));
    const userId = decoded.userId;

    const body = await req.json();
    const { verseId, content, isVoice = false } = body;

    if (!verseId || content === undefined) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const db = initServerDb();

    // Si le contenu est vide, supprimer la note
    if (content.trim() === "") {
      db.prepare("DELETE FROM verse_notes WHERE userId = ? AND verseId = ?").run(userId, verseId);
      return NextResponse.json({ success: true, message: "Note deleted" });
    }

    // Upsert la note
    const existing = db.prepare("SELECT id FROM verse_notes WHERE userId = ? AND verseId = ?").get(userId, verseId);
    const now = new Date().toISOString();

    if (existing) {
      db.prepare("UPDATE verse_notes SET content = ?, isVoice = ?, updatedAt = ? WHERE userId = ? AND verseId = ?")
        .run(content, isVoice ? 1 : 0, now, userId, verseId);
    } else {
      db.prepare("INSERT INTO verse_notes (id, userId, verseId, content, isVoice, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, ?, ?)")
        .run(crypto.randomUUID(), userId, verseId, content, isVoice ? 1 : 0, now, now);
    }

    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    console.error("Error saving verse note:", error);
    return NextResponse.json({ error: "Failed to save note" }, { status: 500 });
  }
}

export async function GET(req: Request) {
  try {
    const authHeader = req.headers.get("authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const token = authHeader.slice(7);
    const decoded = JSON.parse(atob(token.split(".")[1]));
    const userId = decoded.userId;

    const db = initServerDb();
    const notes = db.prepare(`
      SELECT vn.*, bv.book, bv.chapter, bv.verse, bv.text as verseText, bv.translation
      FROM verse_notes vn
      JOIN bible_verses bv ON vn.verseId = bv.id
      WHERE vn.userId = ?
      ORDER BY vn.createdAt DESC
    `).all(userId);

    return NextResponse.json({ notes });
  } catch (error: unknown) {
    console.error("Error fetching notes:", error);
    return NextResponse.json({ error: "Failed to fetch notes" }, { status: 500 });
  }
}
