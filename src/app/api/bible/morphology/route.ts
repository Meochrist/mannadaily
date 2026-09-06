import { NextResponse } from "next/server";
import { query } from "@/server/db";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const book = searchParams.get("book");
    const chapter = searchParams.get("chapter");
    const verse = searchParams.get("verse");
    const language = searchParams.get("language");

    if (!book || !chapter || !verse || !language) {
      return NextResponse.json({ error: "Missing parameters" }, { status: 400 });
    }

    const bookNum = parseInt(book, 10);
    const chapterNum = parseInt(chapter, 10);
    const verseNum = parseInt(verse, 10);

    if (isNaN(bookNum) || isNaN(chapterNum) || isNaN(verseNum)) {
      return NextResponse.json({ error: "Invalid book, chapter or verse format" }, { status: 400 });
    }

    if (language === "hebrew") {
      const words = await query(`
        SELECT * FROM hebrew_words
        WHERE book = $1 AND chapter = $2 AND verse = $3
        ORDER BY wordPosition ASC
      `, [bookNum, chapterNum, verseNum]);
      return NextResponse.json({ words });
    } else if (language === "greek") {
      const words = await query(`
        SELECT * FROM greek_words
        WHERE book = $1 AND chapter = $2 AND verse = $3
        ORDER BY wordPosition ASC
      `, [bookNum, chapterNum, verseNum]);
      return NextResponse.json({ words });
    } else {
      return NextResponse.json({ error: "Invalid language. Must be 'hebrew' or 'greek'" }, { status: 400 });
    }
  } catch (error: unknown) {
    console.error("Error fetching morphology data:", error);
    return NextResponse.json({ error: "Failed to fetch morphology data" }, { status: 500 });
  }
}