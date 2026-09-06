import { NextResponse } from "next/server";
import { query, queryOne } from "@/server/db";

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

    const plans = await query("SELECT * FROM reading_plans ORDER BY duration ASC");

    const plansWithEnrollment = await Promise.all(plans.map(async (plan: any) => {
      const enrollment = userId 
        ? await queryOne("SELECT * FROM reading_plan_enrollments WHERE userId = $1 AND planId = $2", [userId, plan.id])
        : null;
      return { ...plan, enrollment };
    }));

    return NextResponse.json({ plans: plansWithEnrollment });
  } catch (error: unknown) {
    console.error("Error in GET /api/reading-plans:", error);
    return NextResponse.json({ error: "Failed to fetch reading plans" }, { status: 500 });
  }
}
