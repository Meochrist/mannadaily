import { auth } from "@/lib/auth";
import { getLeaderboard } from "@/lib/leaderboard";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.id;
    const result = await getLeaderboard(userId);

    return NextResponse.json(result);
  } catch (error: unknown) {
    console.error("Error in leaderboard API route:", error);
    const message = error instanceof Error ? error.message : "Internal Server Error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
