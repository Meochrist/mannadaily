import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET(req: Request, { params }: { params: Promise<{ slug: string }> }) {
  let slug = "";
  try {
    const session = await auth();
    const userId = session?.user?.id;
    const resolvedParams = await params;
    slug = resolvedParams.slug;

    if (!slug) {
      return NextResponse.json({ error: "Missing plan slug" }, { status: 400 });
    }

    const plan = await db.readingPlan.findUnique({
      where: { slug },
      include: {
        days: {
          orderBy: { dayNumber: "asc" },
          include: {
            readings: {
              orderBy: { id: "asc" }
            }
          }
        },
        enrollments: userId ? {
          where: { userId }
        } : false
      }
    });

    if (!plan) {
      return NextResponse.json({ error: "Reading plan not found" }, { status: 404 });
    }

    return NextResponse.json({ plan });
  } catch (error: any) {
    console.error(`Error in GET /api/reading-plans/${slug}:`, error);
    return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
  }
}
