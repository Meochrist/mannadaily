import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { getDailyVerse } from "@/lib/verses";
import { resolveMascotState } from "@/lib/mascotState";
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

    // Récupérer la progression unifiée + timezone
    const user = await db.user.findUnique({
      where: { id: userId },
      select: { meditationProgress: true, timezoneOffset: true },
    });

    // Heure locale de l'utilisateur
    const nowUTC = new Date();
    const nowLocal = new Date(nowUTC.getTime() + (user?.timezoneOffset ?? 0) * 60000);
    const hourLocal = nowLocal.getUTCHours();
    const minuteLocal = nowLocal.getUTCMinutes();
    const todayLocal = nowLocal.toISOString().split("T")[0];

    let sessionsCompleted = 0;
    let dayCompleted = false;

    if (user?.meditationProgress && isProgress(user.meditationProgress)) {
      const mp = user.meditationProgress;
      if (mp.lastActivityDate === todayLocal) {
        const sessions = Array.isArray(mp.sessionsCompleted) ? mp.sessionsCompleted : [];
        sessionsCompleted = sessions.length;
        dayCompleted = mp.dayCompleted === true || sessionsCompleted === 3;
      }
    }

    // Calculer l'humeur de la mascotte
    const mascotState = resolveMascotState({
      sessionsCompletedToday: sessionsCompleted,
      dayCompleted,
      streakCount: streak?.currentStreak ?? 0,
      inactivityDays: 0,
      isMeditatingNow: sessionsCompleted >= 3,
    });

    // Déterminer la mascotte selon l'heure locale
    let widgetMascot = "abraham";
    if (hourLocal >= 11 && hourLocal < 14) widgetMascot = "gedeon";
    else if (hourLocal >= 14 && hourLocal < 18) widgetMascot = "esther";
    else if (hourLocal >= 18 && hourLocal < 22) widgetMascot = "noe";
    else widgetMascot = hourLocal % 2 === 0 ? "manny" : "samson";

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
      hour: hourLocal,
      minute: minuteLocal,
    });
  } catch (error: unknown) {
    console.error("Error in widget data API:", error);
    const message = error instanceof Error ? error.message : "Internal Server Error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
