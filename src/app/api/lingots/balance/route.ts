import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.id;

    // Récupérer le solde de lingots
    const progress = await db.userProgress.findUnique({
      where: { userId },
      select: { lingots: true }
    });

    // Récupérer les streak freezes disponibles
    const freeze = await db.streakFreeze.findUnique({
      where: { userId },
      select: { freezesAvailable: true }
    });

    return NextResponse.json({
      lingots: progress ? progress.lingots : 0,
      freezesAvailable: freeze ? freeze.freezesAvailable : 0
    });
  } catch (error: unknown) {
    console.error("Error in balance API route:", error);
    const message = error instanceof Error ? error.message : "Internal Server Error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
