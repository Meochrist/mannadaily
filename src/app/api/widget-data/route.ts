import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { getDailyVerse } from "@/lib/verses";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.id;

    const streak = await db.streak.findUnique({
      where: { userId },
    });

    const progress = await db.userProgress.findUnique({
      where: { userId },
    });

    const verse = getDailyVerse();

    return NextResponse.json({
      streak: {
        currentStreak: streak?.currentStreak ?? 0,
        longestStreak: streak?.longestStreak ?? 0,
      },
      progress: {
        morningSessionToday: (progress as any)?.morningSessionToday ?? false,
        eveningSessionToday: (progress as any)?.eveningSessionToday ?? false,
        dayCompleted: (progress as any)?.dayCompleted ?? false,
      },
      verse: `${verse.text} — ${verse.reference}`,
    });
  } catch (error: unknown) {
    console.error("Error in widget data API:", error);
    const message = error instanceof Error ? error.message : "Internal Server Error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
