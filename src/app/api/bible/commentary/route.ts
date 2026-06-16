import { db } from "@/lib/db";
import { NextResponse } from "next/server";

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

    const commentaries = await db.bibleCommentary.findMany({
      where: {
        book,
        chapter,
        OR: [
          { verse },
          { verse: 0 }
        ]
      },
      orderBy: [
        { verse: "asc" },
        { author: "asc" }
      ]
    });

    return NextResponse.json({ commentaries });
  } catch (error: any) {
    console.error("Error fetching commentaries:", error);
    return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
  }
}
