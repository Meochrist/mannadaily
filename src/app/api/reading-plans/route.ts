import { NextResponse } from "next/server";
import { initServerDb } from "@/server/db";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    const authHeader = req.headers.get("authorization");
    let userId: string | null = null;
    
    if (authHeader?.startsWith("Bearer ")) {
      const token = authHeader.slice(7);
      const decoded = JSON.parse(atob(token.split(".")[1]));
      userId = decoded.userId;
    }

    const db = initServerDb();
    const plans = db.prepare("SELECT * FROM reading_plans ORDER BY duration ASC").all();

    const plansWithEnrollment = plans.map((plan: any) => {
      const enrollment = userId 
        ? db.prepare("SELECT * FROM reading_plan_enrollments WHERE userId = ? AND planId = ?").get(userId, plan.id)
        : null;
      return { ...plan, enrollment };
    });

    return NextResponse.json({ plans: plansWithEnrollment });
  } catch (error: unknown) {
    console.error("Error in GET /api/reading-plans:", error);
    return NextResponse.json({ error: "Failed to fetch reading plans" }, { status: 500 });
  }
}
