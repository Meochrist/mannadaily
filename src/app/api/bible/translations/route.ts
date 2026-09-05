import { NextResponse } from "next/server";
import { initServerDb } from "@/server/db";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const db = initServerDb();
    const verses = db.prepare("SELECT DISTINCT translation FROM bible_verses ORDER BY translation").all();
    const translations = verses.map((v: any) => v.translation);

    return NextResponse.json({ translations });
  } catch (error: unknown) {
    console.error("Error fetching translations:", error);
    return NextResponse.json({ error: "Failed to fetch translations" }, { status: 500 });
  }
}
