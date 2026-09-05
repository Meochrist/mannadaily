import { NextResponse } from "next/server";
import { query, queryOne } from "@/server/sql";

export async function GET(req: Request, { params }: { params: Promise<{ slug: string }> }) {
  try {
    const { slug } = await params;

    if (!slug) {
      return NextResponse.json({ error: "Missing plan slug" }, { status: 400 });
    }

    const authHeader = req.headers.get("authorization");
    let userId: string | null = null;
    if (authHeader?.startsWith("Bearer ")) {
      const token = authHeader.slice(7);
      const decoded = JSON.parse(atob(token.split(".")[1]));
      userId = decoded.userId;
    }

    const plan = queryOne<any>("SELECT * FROM reading_plans WHERE slug = ?", [slug]);

    if (!plan) {
      return NextResponse.json({ error: "Reading plan not found" }, { status: 404 });
    }

    const days = query<any>("SELECT * FROM reading_plan_days WHERE planId = ? ORDER BY dayNumber ASC", [plan.id]);

    const daysWithReadings = days.map((day: any) => {
      const readings = query<any>("SELECT * FROM reading_plan_readings WHERE dayId = ? ORDER BY id ASC", [day.id]);
      return { ...day, readings };
    });

    const enrollment = userId 
      ? queryOne<any>("SELECT * FROM reading_plan_enrollments WHERE userId = ? AND planId = ?", [userId, plan.id])
      : null;

    return NextResponse.json({ plan: { ...plan, days: daysWithReadings, enrollment } });
  } catch (error: unknown) {
    console.error("Error in GET /api/reading-plans/[slug]:", error);
    return NextResponse.json({ error: "Failed to fetch reading plan" }, { status: 500 });
  }
}
