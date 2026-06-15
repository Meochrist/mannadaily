import { db } from "@/lib/db";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const book = searchParams.get("book");
    const chapter = searchParams.get("chapter");
    const verse = searchParams.get("verse");
    const language = searchParams.get("language"); // hebrew / greek

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
      const words = await db.hebrewWord.findMany({
        where: {
          book: bookNum,
          chapter: chapterNum,
          verse: verseNum
        },
        orderBy: {
          wordPosition: "asc"
        }
      });
      return NextResponse.json({ words });
    } else if (language === "greek") {
      const words = await db.greekWord.findMany({
        where: {
          book: bookNum,
          chapter: chapterNum,
          verse: verseNum
        },
        orderBy: {
          wordPosition: "asc"
        }
      });
      return NextResponse.json({ words });
    } else {
      return NextResponse.json({ error: "Invalid language. Must be 'hebrew' or 'greek'" }, { status: 400 });
    }
  } catch (error: any) {
    console.error("Error fetching morphology data:", error);
    return NextResponse.json({ error: "Failed to fetch morphology data" }, { status: 500 });
  }
}
