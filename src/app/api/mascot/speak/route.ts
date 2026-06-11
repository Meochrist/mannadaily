import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { getMascotReply, UserState } from "@/lib/mascots";
import { getLevelFromXP } from "@/lib/gamification";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const { character, theme, userState: clientUserState } = body;

    if (!character) {
      return NextResponse.json(
        { error: "Le paramètre 'character' est requis (ex: manny, samson, esther, gedeon, noe)." },
        { status: 400 }
      ) ;
    }

    // Récupération de l'authentification
    const session = await auth();
    let finalUserState: UserState = {
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

    // Si le client a fourni des données spécifiques, elles écrasent les données de la base de données
    // (Utile pour tester des états spécifiques ou pour les utilisateurs invités)
    if (clientUserState) {
      finalUserState = {
        ...finalUserState,
        ...clientUserState,
      };
    }

    // Appel du service de génération de réplique de la mascotte
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
    const message = error instanceof Error ? error.message : "Internal Server Error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
