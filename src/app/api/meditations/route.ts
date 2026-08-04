import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.id;
    const { searchParams } = new URL(req.url);
    const sessionId = searchParams.get("sessionId");

    // Single session view
    if (sessionId) {
      const s = await db.dailySession.findFirst({
        where: { id: sessionId, userId },
        select: {
          id: true,
          type: true,
          period: true,
          xpEarned: true,
          duration: true,
          notes: true,
          createdAt: true,
        },
      });

      if (!s) {
        return NextResponse.json({ error: "Session not found" }, { status: 404 });
      }

      return NextResponse.json(s);
    }

    // List all sessions
    const sessions = await db.dailySession.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        type: true,
        period: true,
        xpEarned: true,
        duration: true,
        notes: true,
        createdAt: true,
      },
    });

    return NextResponse.json({ sessions });
  } catch (error: unknown) {
    console.error("Error fetching meditations:", error);
    const message = error instanceof Error ? error.message : "Internal Server Error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
