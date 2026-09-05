import { NextResponse } from "next/server";
import { initServerDb } from "@/server/db";
import { awardXP } from "@/lib/gamification";
import { addXPToLeague } from "@/lib/leaderboard";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    const authHeader = req.headers.get("authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const token = authHeader.slice(7);
    const decoded = JSON.parse(atob(token.split(".")[1]));
    const userId = decoded.userId;

    const db = initServerDb();
    const progress = db.prepare("SELECT * FROM reading_plan_progress WHERE userId = ?").all(userId);
    const enrollments = db.prepare(`
      SELECT rpe.*, rp.name, rp.slug, rp.duration
      FROM reading_plan_enrollments rpe
      JOIN reading_plans rp ON rpe.planId = rp.id
      WHERE rpe.userId = ?
    `).all(userId);

    return NextResponse.json({ progress, enrollments });
  } catch (error: unknown) {
    console.error("Error in GET /api/reading-plans/progress:", error);
    return NextResponse.json({ error: "Failed to fetch progress" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const authHeader = req.headers.get("authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const token = authHeader.slice(7);
    const decoded = JSON.parse(atob(token.split(".")[1]));
    const userId = decoded.userId;

    const body = await req.json();
    const { planId, dayNumber } = body;

    if (!planId || dayNumber === undefined) {
      return NextResponse.json({ error: "Missing planId or dayNumber parameters" }, { status: 400 });
    }

    const db = initServerDb();

    const plan = db.prepare("SELECT * FROM reading_plans WHERE id = ?").get(planId);
    if (!plan) {
      return NextResponse.json({ error: "Reading plan not found" }, { status: 404 });
    }

    // 1. Enregistrer la progression du jour
    const existing = db.prepare("SELECT id FROM reading_plan_progress WHERE userId = ? AND planId = ? AND dayNumber = ?").get(userId, planId, dayNumber);
    if (!existing) {
      db.prepare("INSERT INTO reading_plan_progress (id, userId, planId, dayNumber) VALUES (?, ?, ?, ?)").run(crypto.randomUUID(), userId, planId, dayNumber);
    }

    // 2. Trouver l'inscription
    const enrollment = db.prepare("SELECT * FROM reading_plan_enrollments WHERE userId = ? AND planId = ?").get(userId, planId);

    if (!enrollment) {
      return NextResponse.json({ error: "User is not enrolled in this reading plan" }, { status: 400 });
    }

    let nextDay = enrollment.currentDay;
    let completed = enrollment.completed;
    let completedAt = enrollment.completedAt;

    // Faire avancer le currentDay uniquement si le jour complété correspond au jour actuel
    if (dayNumber === enrollment.currentDay) {
      if (enrollment.currentDay < plan.duration) {
        nextDay = enrollment.currentDay + 1;
      } else {
        completed = 1;
        completedAt = new Date().toISOString();
      }

      db.prepare("UPDATE reading_plan_enrollments SET currentDay = ?, completed = ?, completedAt = ? WHERE userId = ? AND planId = ?")
        .run(nextDay, completed, completedAt, userId, planId);
    }

    // 3. Attribuer les XP (+10 XP)
    const xpResult = await awardXP(userId, "READING_PLAN_DAY");
    
    // 4. Ajouter les XP à la ligue
    await addXPToLeague(userId, 10);

    return NextResponse.json({
      success: true,
      currentDay: nextDay,
      completed: !!completed,
      xpEarned: 10,
      newXP: xpResult.newXP,
      leveledUp: xpResult.leveledUp,
      newLevel: xpResult.newLevel,
      levelName: xpResult.levelName
    });
  } catch (error: unknown) {
    console.error("Error in POST /api/reading-plans/progress:", error);
    return NextResponse.json({ error: "Failed to update progress" }, { status: 500 });
  }
}
