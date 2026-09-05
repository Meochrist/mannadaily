import { NextResponse } from "next/server";
import { initServerDb } from "@/server/db";
import { getMascotReply, UserState } from "@/lib/mascots";
import { getLevelFromXP } from "@/lib/gamification";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    if (JSON.stringify(body).length > 8_000) {
      return NextResponse.json({ error: "Payload too large" }, { status: 413 });
    }
    const { character, theme } = body;

    if (typeof character !== "string" || character.length > 32) {
      return NextResponse.json(
        { error: "Le paramètre 'character' est requis et invalide." },
        { status: 400 }
      );
    }
    if (theme !== undefined && (typeof theme !== "string" || theme.length > 64)) {
      return NextResponse.json({ error: "Invalid theme" }, { status: 400 });
    }

    const authHeader = req.headers.get("authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const token = authHeader.slice(7);
    const decoded = JSON.parse(atob(token.split(".")[1]));
    const userId = decoded.userId;

    const finalUserState: UserState = {
      streakCount: 0,
      hasMissedADay: false,
      xp: 0,
      level: 1,
    };

    const db = initServerDb();
    const progress = db.prepare("SELECT * FROM user_progress WHERE userId = ?").get(userId);
    const streak = db.prepare("SELECT * FROM streaks WHERE userId = ?").get(userId);

    if (progress) {
      const levelInfo = getLevelFromXP(progress.totalXP);
      finalUserState.xp = progress.totalXP;
      finalUserState.level = levelInfo.level;
    }

    if (streak) {
      finalUserState.streakCount = streak.currentStreak;
      
      if (streak.lastActivityAt) {
        const lastActivity = new Date(streak.lastActivityAt).getTime();
        const now = Date.now();
        const hoursSinceLastActivity = (now - lastActivity) / (1000 * 60 * 60);
        finalUserState.hasMissedADay = hoursSinceLastActivity > 36;
      }
    }

    const result = await getMascotReply(character, theme || "general", finalUserState);

    return NextResponse.json({
      character,
      theme: theme || "general",
      reply: result.text,
      mood: result.mood,
      userStateEvaluated: finalUserState,
      provider: result.provider,
    });
  } catch (error: unknown) {
    console.error("Error generating mascot speech:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
