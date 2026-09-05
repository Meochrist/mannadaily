import { NextResponse } from "next/server";
import { initServerDb } from "@/server/db";

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

    const db = initServerDb();

    const plan = db.prepare("SELECT id FROM reading_plans WHERE id = ?").get(planId);
    if (!plan) {
      return NextResponse.json({ error: "Reading plan not found" }, { status: 404 });
    }

    const now = new Date().toISOString();
    const existing = db.prepare("SELECT id FROM reading_plan_enrollments WHERE userId = ? AND planId = ?").get(userId, planId);

    if (existing) {
      db.prepare(`
        UPDATE reading_plan_enrollments SET currentDay = 1, completed = 0, completedAt = NULL, startDate = ? WHERE userId = ? AND planId = ?
      `).run(now, userId, planId);
    } else {
      db.prepare(`
        INSERT INTO reading_plan_enrollments (id, userId, planId, currentDay, completed, startDate) VALUES (?, ?, ?, 1, 0, ?)
      `).run(crypto.randomUUID(), userId, planId, now);
    }

    db.prepare("DELETE FROM reading_plan_progress WHERE userId = ? AND planId = ?").run(userId, planId);

    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    console.error("Error in POST /api/reading-plans/enroll:", error);
    return NextResponse.json({ error: "Failed to enroll" }, { status: 500 });
  }
}
