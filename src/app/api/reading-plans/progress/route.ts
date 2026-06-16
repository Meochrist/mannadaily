import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { awardXP } from "@/lib/gamification";
import { addXPToLeague } from "@/lib/leaderboard";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

// GET : Récupère toute la progression de l'utilisateur
export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const userId = session.user.id;

    const progress = await db.readingPlanProgress.findMany({
      where: { userId }
    });

    const enrollments = await db.readingPlanEnrollment.findMany({
      where: { userId },
      include: {
        plan: {
          select: {
            id: true,
            name: true,
            slug: true,
            duration: true
          }
        }
      }
    });

    return NextResponse.json({ progress, enrollments });
  } catch (error: any) {
    console.error("Error in GET /api/reading-plans/progress:", error);
    return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
  }
}

// POST : Marque un jour comme complété
export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const userId = session.user.id;

    const body = await req.json();
    const { planId, dayNumber } = body;

    if (!planId || dayNumber === undefined) {
      return NextResponse.json({ error: "Missing planId or dayNumber parameters" }, { status: 400 });
    }

    const plan = await db.readingPlan.findUnique({
      where: { id: planId }
    });
    if (!plan) {
      return NextResponse.json({ error: "Reading plan not found" }, { status: 404 });
    }

    // Exécuter l'inscription et la mise à jour de progression dans une transaction
    const result = await db.$transaction(async (tx) => {
      // 1. Enregistrer la progression du jour
      const progressEntry = await tx.readingPlanProgress.upsert({
        where: {
          userId_planId_dayNumber: { userId, planId, dayNumber }
        },
        update: {},
        create: {
          userId,
          planId,
          dayNumber
        }
      });

      // 2. Trouver l'inscription
      const enrollment = await tx.readingPlanEnrollment.findUnique({
        where: {
          userId_planId: { userId, planId }
        }
      });

      if (!enrollment) {
        throw new Error("User is not enrolled in this reading plan");
      }

      let nextDay = enrollment.currentDay;
      let completed = enrollment.completed;
      let completedAt = enrollment.completedAt;

      // Faire avancer le currentDay uniquement si le jour complété correspond au jour actuel de l'utilisateur
      if (dayNumber === enrollment.currentDay) {
        if (enrollment.currentDay < plan.duration) {
          nextDay = enrollment.currentDay + 1;
        } else {
          completed = true;
          completedAt = new Date();
        }

        await tx.readingPlanEnrollment.update({
          where: {
            userId_planId: { userId, planId }
          },
          data: {
            currentDay: nextDay,
            completed,
            completedAt
          }
        });
      }

      return { progressEntry, nextDay, completed };
    });

    // 3. Attribuer les XP (+10 XP)
    const xpResult = await awardXP(userId, "READING_PLAN_DAY");
    
    // 4. Ajouter les XP à la ligue
    await addXPToLeague(userId, 10);

    return NextResponse.json({
      success: true,
      currentDay: result.nextDay,
      completed: result.completed,
      xpEarned: 10,
      newXP: xpResult.newXP,
      leveledUp: xpResult.leveledUp,
      newLevel: xpResult.newLevel,
      levelName: xpResult.levelName
    });
  } catch (error: any) {
    console.error("Error in POST /api/reading-plans/progress:", error);
    return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
  }
}
