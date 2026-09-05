import { NextResponse } from "next/server";
import { initServerDb } from "@/server/db";

export const dynamic = "force-dynamic";

// Décoder un JWT simple
function decodeToken(token: string): { userId: string; email: string; exp: number } | null {
  try {
    const parts = token.split(".");
    if (parts.length !== 3) return null;
    const payload = JSON.parse(atob(parts[1]));
    if (payload.exp < Math.floor(Date.now() / 1000)) return null;
    return { userId: payload.userId, email: payload.email, exp: payload.exp };
  } catch {
    return null;
  }
}

export async function GET(req: Request) {
  try {
    // Auth JWT
    const authHeader = req.headers.get("authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const token = authHeader.slice(7);
    const decoded = decodeToken(token);
    if (!decoded?.userId) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 });
    }

    const userId = decoded.userId;
    const { searchParams } = new URL(req.url);
    const sessionId = searchParams.get("sessionId");

    const db = initServerDb();

    // Single session view
    if (sessionId) {
      const s = db.prepare(`
        SELECT id, type, period, xpEarned, duration, notes, createdAt 
        FROM daily_sessions WHERE id = ? AND userId = ?
      `).get(sessionId, userId);

      if (!s) {
        return NextResponse.json({ error: "Session not found" }, { status: 404 });
      }

      return NextResponse.json(s);
    }

    // List all sessions
    const sessions = db.prepare(`
      SELECT id, type, period, xpEarned, duration, notes, createdAt 
      FROM daily_sessions WHERE userId = ? ORDER BY createdAt DESC
    `).all(userId);

    return NextResponse.json({ sessions });
  } catch (error: unknown) {
    console.error("Error fetching meditations:", error);
    const message = error instanceof Error ? error.message : "Internal Server Error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
