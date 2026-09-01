import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { getDailyVerse } from "@/lib/verses";
import { resolveMascotState } from "@/lib/mascotState";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

function isProgress(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

// Messages génériques par heure (mode anonyme)
function getAnonymousMessage(hourLocal: number, minuteLocal: number): { mood: string; message: string } {
  if (hourLocal >= 6 && hourLocal < 11) {
    const messages = [
      { mood: "encouraging", message: "Bonjour ! Prêt pour la Parole du jour ?" },
      { mood: "happy", message: "Un nouveau jour commence. La Parole t'attend !" },
      { mood: "thinking", message: "Le matin est parfait pour méditer..." },
    ];
    return messages[Math.floor(minuteLocal / 20) % messages.length];
  } else if (hourLocal >= 11 && hourLocal < 14) {
    const messages = [
      { mood: "worried", message: "Il est midi... Tu n'as pas encore médité ?" },
      { mood: "encouraging", message: "Prends 10 minutes pour la Parole !" },
      { mood: "sad", message: "La Parole est restée fermée ce matin..." },
    ];
    return messages[Math.floor(minuteLocal / 20) % messages.length];
  } else if (hourLocal >= 14 && hourLocal < 18) {
    const messages = [
      { mood: "sad", message: "L'après-midi avance et la Parole t'attend toujours..." },
      { mood: "worried", message: "N'oublie pas ta méditation du jour !" },
      { mood: "disappointed", message: "Tu as passé toute la journée sans méditer ?" },
    ];
    return messages[Math.floor(minuteLocal / 20) % messages.length];
  } else if (hourLocal >= 18 && hourLocal < 22) {
    const messages = [
      { mood: "panicked", message: "Le soir tombe ! Il faut méditer MAINTENANT !" },
      { mood: "scared", message: "Il reste peu de temps avant minuit..." },
      { mood: "angry", message: "TU ME BRISES LE CŒUR ! MÉDITE !" },
    ];
    return messages[Math.floor(minuteLocal / 20) % messages.length];
  } else {
    return { mood: "sleeping", message: "Bonne nuit ! Demain est un nouveau jour." };
  }
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

    const verse = getDailyVerse();
    const nowUTC = new Date();
    const hourLocal = nowUTC.getUTCHours();
    const minuteLocal = nowUTC.getUTCMinutes();

    // Mode authentifié
    if (userId) {
      const streak = await db.streak.findUnique({
        where: { userId },
      });

      const user = await db.user.findUnique({
        where: { id: userId },
        select: { meditationProgress: true, timezoneOffset: true },
      });

      const nowLocal = new Date(nowUTC.getTime() + (user?.timezoneOffset ?? 0) * 60000);
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

      const mascotState = resolveMascotState({
        sessionsCompletedToday: sessionsCompleted,
        dayCompleted,
        streakCount: streak?.currentStreak ?? 0,
        inactivityDays: 0,
        isMeditatingNow: sessionsCompleted >= 3,
      });

      let widgetMascot = "abraham";
      const h = nowLocal.getUTCHours();
      if (h >= 11 && h < 14) widgetMascot = "gedeon";
      else if (h >= 14 && h < 18) widgetMascot = "esther";
      else if (h >= 18 && h < 22) widgetMascot = "noe";
      else widgetMascot = h % 2 === 0 ? "manny" : "samson";

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
        hour: h,
        minute: nowLocal.getUTCMinutes(),
        authenticated: true,
      });
    }

    // Mode anonyme (pas d'auth) → données basées sur l'heure UTC
    const anon = getAnonymousMessage(hourLocal, minuteLocal);
    return NextResponse.json({
      streak: { currentStreak: 0, longestStreak: 0 },
      verse: `${verse.text} — ${verse.reference}`,
      sessionsCompleted: 0,
      dayCompleted: false,
      mascot: hourLocal >= 18 ? "noe" : hourLocal >= 14 ? "esther" : hourLocal >= 11 ? "gedeon" : "abraham",
      mood: anon.mood,
      message: anon.message,
      hour: hourLocal,
      minute: minuteLocal,
      authenticated: false,
    });
  } catch (error: unknown) {
    console.error("Error in widget data API:", error);
    const message = error instanceof Error ? error.message : "Internal Server Error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
