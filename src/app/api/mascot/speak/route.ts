import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
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

    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const finalUserState: UserState = {
      streakCount: 0,
      hasMissedADay: false,
      xp: 0,
      level: 1,
    };

    if (session?.user) {
      const userId = session.user.id;

      // Recherche des infos de progression et de streak de l'utilisateur connecté
      const [progress, streak] = await Promise.all([
        db.userProgress.findUnique({ where: { userId } }),
        db.streak.findUnique({ where: { userId } }),
      ]);

      if (progress) {
        const levelInfo = getLevelFromXP(progress.totalXP);
        finalUserState.xp = progress.totalXP;
        finalUserState.level = levelInfo.level;
      }

      if (streak) {
        finalUserState.streakCount = streak.currentStreak;
        
        // Calcul pour savoir s'il a raté un jour
        // Si la dernière activité remonte à plus de 36 heures, on considère qu'il a raté un jour
        if (streak.lastActivityAt) {
          const lastActivity = new Date(streak.lastActivityAt).getTime();
          const now = Date.now();
          const hoursSinceLastActivity = (now - lastActivity) / (1000 * 60 * 60);
          finalUserState.hasMissedADay = hoursSinceLastActivity > 36;
        }
      }
    }

    // L'état de progression provient exclusivement de la base de données.
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
    const message = error instanceof Error ? (error instanceof Error ? error.message : "") : "Internal Server Error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
