import { NextResponse } from "next/server";
import { query } from "@/server/db";
import { getDailyVerse } from "@/lib/verses";
import { resolveMascotState } from "@/lib/mascotState";

export const dynamic = "force-dynamic";

function isProgress(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

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

function decodeToken(token: string): { userId: string; email: string; exp: number } | null {
  try {
    const parts = token.split(".");
    if (parts.length !== 3) return null;
    const payload = JSON.parse(atob(parts[1]));
    if (payload.exp < Math.floor(Date.now() / 1000)) return null;
    return { userId: payload.userId, email: payload.email, exp: payload.exp };
  } catch {
    return null;
  }
}

export async function GET(req: Request) {
  try {
    let userId: string | undefined;

    const authHeader = req.headers.get("authorization");
    if (authHeader?.startsWith("Bearer ")) {
      const token = authHeader.slice(7);
      const decoded = decodeToken(token);
      if (decoded?.userId) {
        userId = decoded.userId;
      }
    }

    const verse = getDailyVerse();
    const nowUTC = new Date();
    const hourLocal = nowUTC.getUTCHours();
    const minuteLocal = nowUTC.getUTCMinutes();

    if (userId) {
      const streak = await query("SELECT * FROM streaks WHERE userId = $1", [userId]);
      const user = await query("SELECT meditationProgress, timezoneOffset FROM users WHERE id = $1", [userId]);

      const nowLocal = new Date(nowUTC.getTime() + (user[0]?.timezoneOffset ?? 0) * 60000);
      const todayLocal = nowLocal.toISOString().split("T")[0];

      let sessionsCompleted = 0;
      let dayCompleted = false;

      if (user[0]?.meditationProgress) {
        try {
          const mp = JSON.parse(user[0].meditationProgress);
          if (isProgress(mp) && mp.lastActivityDate === todayLocal) {
            const sessions = Array.isArray(mp.sessionsCompleted) ? mp.sessionsCompleted : [];
            sessionsCompleted = sessions.length;
            dayCompleted = mp.dayCompleted === true || sessionsCompleted === 3;
          }
        } catch {
          // ignore
        }
      }

      const mascotState = resolveMascotState({
        sessionsCompletedToday: sessionsCompleted,
        dayCompleted,
        streakCount: streak[0]?.currentStreak ?? 0,
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
          currentStreak: streak[0]?.currentStreak ?? 0,
          longestStreak: streak[0]?.longestStreak ?? 0,
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
