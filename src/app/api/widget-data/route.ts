import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { getDailyVerse } from "@/lib/verses";
import { getMascotState } from "@/lib/mascots";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

function isProgress(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.id;

    const streak = await db.streak.findUnique({
      where: { userId },
    });

    const verse = getDailyVerse();

    // Récupérer la progression unifiée
    const user = await db.user.findUnique({
      where: { id: userId },
      select: { meditationProgress: true },
    });

    const today = new Date().toISOString().split("T")[0];
    let meditationProgress = null;
    let sessionsCompleted = 0;
    let dayCompleted = false;

    if (user?.meditationProgress && isProgress(user.meditationProgress)) {
      const mp = user.meditationProgress;
      if (mp.lastActivityDate === today) {
        meditationProgress = mp;
        const sessions = Array.isArray(mp.sessionsCompleted) ? mp.sessionsCompleted : [];
        sessionsCompleted = sessions.length;
        dayCompleted = mp.dayCompleted === true || sessionsCompleted === 3;
      }
    }

    // Calculer l'humeur de la mascotte
    const mascotState = getMascotState(meditationProgress as any);

    return NextResponse.json({
      streak: {
        currentStreak: streak?.currentStreak ?? 0,
        longestStreak: streak?.longestStreak ?? 0,
      },
      verse: `${verse.text} — ${verse.reference}`,
      sessionsCompleted,
      dayCompleted,
      mood: mascotState.mood,
      message: mascotState.message,
    });
  } catch (error: unknown) {
    console.error("Error in widget data API:", error);
    const message = error instanceof Error ? error.message : "Internal Server Error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
