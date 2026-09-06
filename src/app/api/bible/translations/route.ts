import { NextResponse } from "next/server";
import { query } from "@/server/db";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const verses = await query("SELECT DISTINCT translation FROM bible_verses ORDER BY translation");
    const translations = verses.map((v: any) => v.translation);

    return NextResponse.json({ translations });
  } catch (error: unknown) {
    console.error("Error fetching translations:", error);
    return NextResponse.json({ error: "Failed to fetch translations" }, { status: 500 });
  }
}