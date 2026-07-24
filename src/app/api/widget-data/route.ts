import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { getDailyVerse } from "@/lib/verses";
import { getMascotState } from "@/lib/mascots";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

function isProgress(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export async function GET(req: Request) {
  try {
    let userId: string | undefined;

    // Try cookie-based auth first
    const session = await auth();
    if (session?.user?.id) {
      userId = session.user.id;
    } else {
      // Fallback: token-based auth for widget
      const authHeader = req.headers.get("authorization");
      if (authHeader?.startsWith("Bearer ")) {
        const token = authHeader.slice(7);
        const user = await db.user.findFirst({
          where: { widgetToken: token },
          select: { id: true },
        });
        if (user) userId = user.id;
      }
    }

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

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

    // Déterminer la mascotte selon l'heure
    const hour = new Date().getHours();
    let widgetMascot = "abraham";
    if (hour >= 11 && hour < 14) widgetMascot = "gedeon";
    else if (hour >= 14 && hour < 18) widgetMascot = "esther";
    else if (hour >= 18 || hour < 5) widgetMascot = "noe";

    return NextResponse.json({
      streak: {
        currentStreak: streak?.currentStreak ?? 0,
        longestStreak: streak?.longestStreak ?? 0,
      },
      verse: `${verse.text} — ${verse.reference}`,
      sessionsCompleted,
      dayCompleted,
      mascot: widgetMascot,
      mood: mascotState.mood,
      message: mascotState.message,
    });
  } catch (error: unknown) {
    console.error("Error in widget data API:", error);
    const message = error instanceof Error ? error.message : "Internal Server Error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
