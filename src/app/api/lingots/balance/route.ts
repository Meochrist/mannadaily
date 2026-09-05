import { NextResponse } from "next/server";
import { initServerDb } from "@/server/db";

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

    const db = initServerDb();

    const progress = db.prepare("SELECT lingots FROM user_progress WHERE userId = ?").get(userId) as any;
    const freeze = db.prepare("SELECT freezesAvailable FROM streak_freeze WHERE userId = ?").get(userId) as any;

    return NextResponse.json({
      lingots: progress?.lingots ?? 0,
      freezesAvailable: freeze?.freezesAvailable ?? 0
    });
  } catch (error: unknown) {
    console.error("Error in balance API route:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
