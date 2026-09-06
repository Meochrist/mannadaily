import { NextResponse } from "next/server";
import { query, queryOne, execute } from "@/server/db";
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

    const progress = await query("SELECT * FROM reading_plan_progress WHERE userId = $1", [userId]);
    const enrollments = await query(`
      SELECT rpe.*, rp.name, rp.slug, rp.duration
      FROM reading_plan_enrollments rpe
      JOIN reading_plans rp ON rpe.planId = rp.id
      WHERE rpe.userId = $1
    `, [userId]);

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

    const plan = await queryOne("SELECT * FROM reading_plans WHERE id = $1", [planId]);
    if (!plan) {
      return NextResponse.json({ error: "Reading plan not found" }, { status: 404 });
    }

    const existing = await queryOne("SELECT id FROM reading_plan_progress WHERE userId = $1 AND planId = $2 AND dayNumber = $3", [userId, planId, dayNumber]);
    if (!existing) {
      await execute("INSERT INTO reading_plan_progress (id, userId, planId, dayNumber) VALUES ($1, $2, $3, $4)", [crypto.randomUUID(), userId, planId, dayNumber]);
    }

    const enrollment = await queryOne("SELECT * FROM reading_plan_enrollments WHERE userId = $1 AND planId = $2", [userId, planId]);

    if (!enrollment) {
      return NextResponse.json({ error: "User is not enrolled in this reading plan" }, { status: 400 });
    }

    let nextDay = enrollment.currentDay;
    let completed = enrollment.completed;
    let completedAt = enrollment.completedAt;

    if (dayNumber === enrollment.currentDay) {
      if (enrollment.currentDay < plan.duration) {
        nextDay = enrollment.currentDay + 1;
      } else {
        completed = 1;
        completedAt = new Date().toISOString();
      }

      await execute("UPDATE reading_plan_enrollments SET currentDay = $1, completed = $2, completedAt = $3 WHERE userId = $4 AND planId = $5", [nextDay, completed, completedAt, userId, planId]);
    }

    const xpResult = await awardXP(userId, "READING_PLAN_DAY");
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
