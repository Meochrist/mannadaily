import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    const authHeader = req.headers.get("authorization");
    const cronSecret = process.env.CRON_SECRET;

    // Si CRON_SECRET n'est pas défini, on refuse par sécurité
    if (!cronSecret) {
      console.error("CRON_SECRET env variable is not configured");
      return NextResponse.json({ error: "Unauthorized - Cron secret not configured" }, { status: 401 });
    }

    if (!authHeader || authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    console.log("Daily reminder cron executed");

    return NextResponse.json({ 
      success: true, 
      message: "Cron executed" 
    });
  } catch (error: unknown) {
    console.error("Error executing daily reminder cron:", error);
    const message = error instanceof Error ? error.message : "Internal Server Error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
