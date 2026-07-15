import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { awardXP, updateStreak } from "@/lib/gamification";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.id;
    const user = await db.user.findUnique({
      where: { id: userId },
      select: { meditationProgress: true }
    });

    const todayStr = new Date().toISOString().split("T")[0];
    const defaultProgress = {
      currentMiniSession: 1,
      currentStep: 0,
      sessionsCompleted: [],
      lastActivityDate: todayStr,
      dayCompleted: false
    };

    if (!user || !user.meditationProgress) {
      return NextResponse.json({ progress: defaultProgress });
    }

    const progress = user.meditationProgress as any;

    // Si c'est un nouveau jour, réinitialiser la progression
    if (progress.lastActivityDate !== todayStr) {
      await db.user.update({
        where: { id: userId },
        data: { meditationProgress: defaultProgress }
      });
      return NextResponse.json({ progress: defaultProgress });
    }

    return NextResponse.json({ progress });
  } catch (error: any) {
    console.error("Error in GET meditate progress:", error);
    return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.id;
    const body = await req.json();
    const { progress, claimXPForSession } = body;

    if (!progress) {
      return NextResponse.json({ error: "Missing progress object" }, { status: 400 });
    }

    // Enregistrer la progression
    const updatedUser = await db.user.update({
      where: { id: userId },
      data: { meditationProgress: progress },
      select: { meditationProgress: true }
    });

    let xpResult = null;
    let streak = 0;
    if (claimXPForSession) {
      let action: "meditation_mini_1" | "meditation_mini_2" | "meditation_mini_3" | null = null;
      if (claimXPForSession === 1) action = "meditation_mini_1";
      else if (claimXPForSession === 2) action = "meditation_mini_2";
      else if (claimXPForSession === 3) action = "meditation_mini_3";

      if (action) {
        xpResult = await awardXP(userId, action);
      }

      // Si la 3ème mini-session vient d'être complétée, la journée est terminée → maj du streak
      if (claimXPForSession === 3) {
        streak = await updateStreak(userId);
      }
    }

    return NextResponse.json({
      success: true,
      progress: updatedUser.meditationProgress,
      xpResult,
      streak,
    });
  } catch (error: any) {
    console.error("Error in POST meditate progress:", error);
    return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
  }
}
