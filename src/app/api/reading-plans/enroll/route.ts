import { NextResponse } from "next/server";
import { query, queryOne, execute } from "@/server/db";

export const dynamic = "force-dynamic";

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
    const { planId } = body;

    if (!planId) {
      return NextResponse.json({ error: "Missing planId parameter" }, { status: 400 });
    }

    const plan = await queryOne("SELECT id FROM reading_plans WHERE id = $1", [planId]);
    if (!plan) {
      return NextResponse.json({ error: "Reading plan not found" }, { status: 404 });
    }

    const now = new Date().toISOString();
    const existing = await queryOne("SELECT id FROM reading_plan_enrollments WHERE userId = $1 AND planId = $2", [userId, planId]);

    if (existing) {
      await execute(`
        UPDATE reading_plan_enrollments SET currentDay = 1, completed = 0, completedAt = NULL, startDate = $1 WHERE userId = $2 AND planId = $3
      `, [now, userId, planId]);
    } else {
      await execute(`
        INSERT INTO reading_plan_enrollments (id, userId, planId, currentDay, completed, startDate) VALUES ($1, $2, $3, 1, 0, $4)
      `, [crypto.randomUUID(), userId, planId, now]);
    }

    await execute("DELETE FROM reading_plan_progress WHERE userId = $1 AND planId = $2", [userId, planId]);

    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    console.error("Error in POST /api/reading-plans/enroll:", error);
    return NextResponse.json({ error: "Failed to enroll" }, { status: 500 });
  }
}
