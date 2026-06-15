import { db } from "@/lib/db";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const verses = await db.bibleVerse.findMany({
      select: {
        translation: true,
      },
      distinct: ["translation"],
      orderBy: {
        translation: "asc",
      },
    });

    const translations = verses.map((v) => v.translation);

    return NextResponse.json({ translations });
  } catch (error: any) {
    console.error("Error fetching translations:", error);
    return NextResponse.json({ error: "Failed to fetch translations" }, { status: 500 });
  }
}
