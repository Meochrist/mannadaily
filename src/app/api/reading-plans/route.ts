import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const session = await auth();
    const userId = session?.user?.id;

    const plans = await db.readingPlan.findMany({
      include: {
        enrollments: userId ? {
          where: { userId }
        } : false
      },
      orderBy: {
        duration: "asc"
      }
    });

    return NextResponse.json({ plans });
  } catch (error: any) {
    console.error("Error in GET /api/reading-plans:", error);
    return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
  }
}
