import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { awardXP, updateStreak, checkAndAwardBadges } from "@/lib/gamification";
import { XP_RULES } from "@/types";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.id;
    const body = await req.json();
    const { type } = body;

    const allowedTypes = ["classic", "thematic", "proclaim", "proclamation"];
    if (!type || !allowedTypes.includes(type)) {
      return NextResponse.json({ error: "Invalid or missing session type" }, { status: 400 });
    }

    const xpEarned = XP_RULES.DAILY_MEDITATION;

    await db.dailySession.create({
      data: {
        userId,
        type,
        xpEarned,
        duration: 120,
      },
    });

    const xpResult = await awardXP(userId, "DAILY_MEDITATION");

    const currentStreak = await updateStreak(userId);

    await db.userProgress.update({
      where: { userId },
      data: {
        sessionsTotal: {
          increment: 1,
        },
      },
    });

    const newBadges = await checkAndAwardBadges(userId);

    return NextResponse.json({
      xpEarned,
      newXP: xpResult.newXP,
      leveledUp: xpResult.leveledUp,
      newLevel: xpResult.newLevel,
      levelName: xpResult.levelName,
      streak: currentStreak,
      newBadges,
    });
  } catch (error: unknown) {
    console.error("Error in session completion API:", error);
    const message = error instanceof Error ? error.message : "Internal Server Error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
