import { NextResponse } from "next/server";
import { buyStreakFreeze } from "@/lib/gamification";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const authHeader = req.headers.get("authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const token = authHeader.slice(7);
    const decoded = JSON.parse(atob(token.split(".")[1]));
    const userId = decoded.userId;

    const result = await buyStreakFreeze(userId);
    return NextResponse.json(result);
  } catch (error: unknown) {
    console.error("Error in buy-freeze API route:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
