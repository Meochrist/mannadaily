import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { calculateSM2 } from "@/lib/sm2";
import { awardXP, checkAndAwardBadges } from "@/lib/gamification";
import { addXPToLeague } from "@/lib/leaderboard";
import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  const session = await auth();
  const userId = session?.user?.id;

  if (!userId) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  try {
    const { verseId, quality } = await request.json();

    if (!verseId || quality === undefined || quality < 0 || quality > 5) {
      return NextResponse.json({ error: "Paramètres invalides" }, { status: 400 });
    }

    // Récupérer la mémorisation en cours
    const memorization = await db.verseMemorization.findUnique({
      where: { id: verseId },
    });

    if (!memorization || memorization.userId !== userId) {
      return NextResponse.json({ error: "Fiche de mémorisation introuvable" }, { status: 404 });
    }

    const oldStatus = memorization.status;

    // Calculer le SM2
    const sm2Result = calculateSM2(
      quality,
      memorization.interval,
      memorization.easeFactor,
      memorization.repetitions
    );

    // Déterminer le nouveau statut
    let newStatus = "learning";
    if (sm2Result.repetitions >= 3 || quality === 5) {
      newStatus = "mastered";
    } else if (sm2Result.repetitions > 0) {
      newStatus = "reviewing";
    }

    // Mettre à jour l'entité de mémorisation
    const updatedMemorization = await db.verseMemorization.update({
      where: { id: verseId },
      data: {
        interval: sm2Result.interval,
        easeFactor: sm2Result.easeFactor,
        repetitions: sm2Result.repetitions,
        nextReview: sm2Result.nextReview,
        lastReview: new Date(),
        status: newStatus,
      },
    });

    let xpEarned = 0;
    let leveledUp = false;
    let newLevel = "";
    let newBadges: any[] = [];

    // Si le statut passe à "mastered", on attribue 25 XP
    if (newStatus === "mastered" && oldStatus !== "mastered") {
      xpEarned = 25;
      
      // Mettre à jour les versets appris dans UserProgress
      await db.userProgress.update({
        where: { userId },
        data: {
          versesLearned: {
            increment: 1,
          },
        },
      });

      // Octroyer l'XP et ajouter au classement de la ligue hebdomadaire
      const xpResult = await awardXP(userId, "MEMORIZATION");
      leveledUp = xpResult.leveledUp;
      newLevel = xpResult.levelName;

      await addXPToLeague(userId, xpEarned);

      // Vérifier les badges débloqués
      newBadges = await checkAndAwardBadges(userId);
    }

    return NextResponse.json({
      success: true,
      memorization: updatedMemorization,
      xpEarned,
      leveledUp,
      newLevel,
      newBadges,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
