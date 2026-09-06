import { NextResponse } from "next/server";
import { query } from "@/server/db";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const bookStr = searchParams.get("book");
    const chapterStr = searchParams.get("chapter");
    const verseStr = searchParams.get("verse");

    if (!bookStr || !chapterStr || !verseStr) {
      return NextResponse.json({ error: "Missing required query parameters: book, chapter, verse" }, { status: 400 });
    }

    const book = parseInt(bookStr, 10);
    const chapter = parseInt(chapterStr, 10);
    const verse = parseInt(verseStr, 10);

    if (isNaN(book) || isNaN(chapter) || isNaN(verse)) {
      return NextResponse.json({ error: "Invalid query parameters: book, chapter, and verse must be numbers" }, { status: 400 });
    }

    const commentaries = await query(`
      SELECT * FROM bible_commentaries
      WHERE book = $1 AND chapter = $2 AND (verse = $3 OR verse = 0)
      ORDER BY verse ASC, author ASC
    `, [book, chapter, verse]);

    return NextResponse.json({ commentaries });
  } catch (error: unknown) {
    console.error("Error fetching commentaries:", error);
    return NextResponse.json({ error: "Failed to fetch commentaries" }, { status: 500 });
  }
}