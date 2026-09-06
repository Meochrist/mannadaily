import { NextResponse } from "next/server";
import { queryOne, execute } from "@/server/db";

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

    const existing = await queryOne("SELECT id FROM verse_highlights WHERE userId = $1 AND verseId = $2", [userId, verseId]);

    if (existing) {
      await execute("UPDATE verse_highlights SET color = $1 WHERE userId = $2 AND verseId = $3", [color, userId, verseId]);
    } else {
      await execute("INSERT INTO verse_highlights (id, userId, verseId, color) VALUES ($1, $2, $3, $4)", [crypto.randomUUID(), userId, verseId, color]);
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

    await execute("DELETE FROM verse_highlights WHERE userId = $1 AND verseId = $2", [userId, verseId]);

    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    console.error("Error deleting highlight:", error);
    return NextResponse.json({ error: "Failed to delete highlight" }, { status: 500 });
  }
}
