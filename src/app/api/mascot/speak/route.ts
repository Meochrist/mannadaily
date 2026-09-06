import { NextResponse } from "next/server";
import { query } from "@/server/db";
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

    const progress = await query("SELECT * FROM user_progress WHERE userId = $1", [userId]);
    const streak = await query("SELECT * FROM streaks WHERE userId = $1", [userId]);

    if (progress.length > 0) {
      const levelInfo = getLevelFromXP(progress[0].totalXP);
      finalUserState.xp = progress[0].totalXP;
      finalUserState.level = levelInfo.level;
    }

    if (streak.length > 0) {
      finalUserState.streakCount = streak[0].currentStreak;
      
      if (streak[0].lastActivityAt) {
        const lastActivity = new Date(streak[0].lastActivityAt).getTime();
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
