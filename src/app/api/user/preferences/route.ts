import { NextResponse } from "next/server";
import { initServerDb } from "@/server/db";

export const dynamic = "force-dynamic";

// Décoder un JWT simple
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

export async function POST(req: Request) {
  try {
    // Auth JWT
    const authHeader = req.headers.get("authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const token = authHeader.slice(7);
    const decoded = decodeToken(token);
    if (!decoded?.userId) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 });
    }

    const userId = decoded.userId;
    const body = await req.json();
    const { readingReminders, notificationTime, favoriteMascot, onboardingCompleted } = body;

    const db = initServerDb();
    const updates: string[] = [];
    const params: any[] = [];

    if (readingReminders !== undefined) {
      updates.push("readingReminders = ?");
      params.push(Boolean(readingReminders) ? 1 : 0);
    }

    if (onboardingCompleted !== undefined) {
      updates.push("onboardingCompleted = ?");
      params.push(Boolean(onboardingCompleted) ? 1 : 0);
    }

    if (favoriteMascot !== undefined) {
      updates.push("favoriteMascot = ?");
      params.push(favoriteMascot);
    }

    if (notificationTime !== undefined) {
      const allowedTimes = ["07:00", "12:00", "19:00", "21:00"];
      if (allowedTimes.includes(notificationTime)) {
        updates.push("notificationTime = ?");
        params.push(notificationTime);
      } else {
        return NextResponse.json({ error: "Heure de notification invalide" }, { status: 400 });
      }
    }

    if (updates.length === 0) {
      return NextResponse.json({ error: "Aucune mise à jour" }, { status: 400 });
    }

    updates.push("updatedAt = ?");
    params.push(new Date().toISOString());
    params.push(userId);

    db.prepare(`UPDATE users SET ${updates.join(", ")} WHERE id = ?`).run(...params);

    const updatedUser = db.prepare(`
      SELECT id, readingReminders, notificationTime, onboardingCompleted, favoriteMascot 
      FROM users WHERE id = ?
    `).get(userId);

    return NextResponse.json({ success: true, user: updatedUser });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Internal Server Error";
    console.error("Error in POST /api/user/preferences:", error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function GET(req: Request) {
  try {
    // Auth JWT
    const authHeader = req.headers.get("authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const token = authHeader.slice(7);
    const decoded = decodeToken(token);
    if (!decoded?.userId) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 });
    }

    const userId = decoded.userId;
    const db = initServerDb();

    const user = db.prepare(`
      SELECT readingReminders, notificationTime, onboardingCompleted, favoriteMascot 
      FROM users WHERE id = ?
    `).get(userId);

    if (!user) {
      return NextResponse.json({ error: "Utilisateur non trouvé" }, { status: 404 });
    }

    return NextResponse.json({ preferences: user });
  } catch (error: unknown) {
    console.error("Error in GET /api/user/preferences:", error instanceof Error ? error.message : error);
    return NextResponse.json({ error: error instanceof Error ? error.message : "Internal Server Error" }, { status: 500 });
  }
}
