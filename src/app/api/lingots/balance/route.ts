import { NextResponse } from "next/server";
import { query } from "@/server/db";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    const authHeader = req.headers.get("authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const token = authHeader.slice(7);
    const decoded = JSON.parse(atob(token.split(".")[1]));
    const userId = decoded.userId;

    const progress = await query("SELECT lingots FROM user_progress WHERE userId = $1", [userId]);
    const freeze = await query("SELECT freezesAvailable FROM streak_freeze WHERE userId = $1", [userId]);

    return NextResponse.json({
      lingots: progress[0]?.lingots ?? 0,
      freezesAvailable: freeze[0]?.freezesAvailable ?? 0
    });
  } catch (error: unknown) {
    console.error("Error in balance API route:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
