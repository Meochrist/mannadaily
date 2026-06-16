import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const userId = session.user.id;

    const body = await req.json();
    const { planId } = body;

    if (!planId) {
      return NextResponse.json({ error: "Missing planId parameter" }, { status: 400 });
    }

    // Vérifier si le plan existe
    const plan = await db.readingPlan.findUnique({
      where: { id: planId }
    });
    if (!plan) {
      return NextResponse.json({ error: "Reading plan not found" }, { status: 404 });
    }

    // Inscrire l'utilisateur
    const enrollment = await db.readingPlanEnrollment.upsert({
      where: {
        userId_planId: { userId, planId }
      },
      update: {
        currentDay: 1,
        completed: false,
        completedAt: null,
        startDate: new Date()
      },
      create: {
        userId,
        planId,
        currentDay: 1,
        completed: false
      }
    });

    // Optionnel : réinitialiser la progression individuelle de ce plan
    await db.readingPlanProgress.deleteMany({
      where: { userId, planId }
    });

    return NextResponse.json({ enrollment });
  } catch (error: any) {
    console.error("Error in POST /api/reading-plans/enroll:", error);
    return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
  }
}
