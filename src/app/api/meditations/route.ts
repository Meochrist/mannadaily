import { NextResponse } from "next/server";
import { query, queryOne, execute } from "@/server/db";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    const authHeader = req.headers.get("authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const token = authHeader.slice(7);
    const decoded = JSON.parse(atob(token.split(".")[1]));
    const userId = decoded.userId;

    const { searchParams } = new URL(req.url);
    const sessionId = searchParams.get("sessionId");

    if (sessionId) {
      const s = await query(`
        SELECT id, type, period, xpEarned, duration, notes, createdAt 
        FROM daily_sessions WHERE id = $1 AND userId = $2
      `, [sessionId, userId]);

      if (s.length === 0) {
        return NextResponse.json({ error: "Session not found" }, { status: 404 });
      }

      return NextResponse.json(s[0]);
    }

    const sessions = await query(`
      SELECT id, type, period, xpEarned, duration, notes, createdAt 
      FROM daily_sessions WHERE userId = $1 ORDER BY createdAt DESC
    `, [userId]);

    return NextResponse.json({ sessions });
  } catch (error: unknown) {
    console.error("Error fetching meditations:", error);
    const message = error instanceof Error ? error.message : "Internal Server Error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
