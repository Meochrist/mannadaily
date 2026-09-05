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
    const { verseId, color } = body;

    if (!verseId || !color) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const allowedColors = ["yellow", "green", "blue", "pink"];
    if (!allowedColors.includes(color)) {
      return NextResponse.json({ error: "Invalid highlight color" }, { status: 400 });
    }

    const db = initServerDb();
    const existing = db.prepare("SELECT id FROM verse_highlights WHERE userId = ? AND verseId = ?").get(userId, verseId);

    if (existing) {
      db.prepare("UPDATE verse_highlights SET color = ? WHERE userId = ? AND verseId = ?").run(color, userId, verseId);
    } else {
      db.prepare("INSERT INTO verse_highlights (id, userId, verseId, color) VALUES (?, ?, ?, ?)").run(crypto.randomUUID(), userId, verseId, color);
    }

    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    console.error("Error upserting highlight:", error);
    return NextResponse.json({ error: "Failed to save highlight" }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const authHeader = req.headers.get("authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const token = authHeader.slice(7);
    const decoded = JSON.parse(atob(token.split(".")[1]));
    const userId = decoded.userId;

    const { searchParams } = new URL(req.url);
    const verseId = searchParams.get("verseId");

    if (!verseId) {
      return NextResponse.json({ error: "Missing verseId parameter" }, { status: 400 });
    }

    const db = initServerDb();
    db.prepare("DELETE FROM verse_highlights WHERE userId = ? AND verseId = ?").run(userId, verseId);

    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    console.error("Error deleting highlight:", error);
    return NextResponse.json({ error: "Failed to delete highlight" }, { status: 500 });
  }
}
