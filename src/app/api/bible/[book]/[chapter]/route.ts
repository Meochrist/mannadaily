import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ book: string; chapter: string }> }
) {
  try {
    const { book, chapter } = await params;
    const decodedBook = decodeURIComponent(book);
    const chapterNum = parseInt(chapter, 10);

    const { searchParams } = new URL(request.url);
    const translation = searchParams.get("translation") || "LSG";

    if (isNaN(chapterNum)) {
      return NextResponse.json({ error: "Invalid chapter number" }, { status: 400 });
    }

    // Récupérer les versets du chapitre
    const verses = await db.bibleVerse.findMany({
      where: {
        book: decodedBook,
        chapter: chapterNum,
        translation,
      },
      orderBy: {
        verse: "asc",
      },
    });

    // Récupérer la session utilisateur s'il est connecté
    const session = await auth();
    const userId = session?.user?.id;

    let highlights: any[] = [];
    let notes: any[] = [];

    if (userId && verses.length > 0) {
      const verseIds = verses.map((v) => v.id);

      // Récupérer les surlignages de l'utilisateur pour ces versets
      highlights = await db.verseHighlight.findMany({
        where: {
          userId,
          verseId: { in: verseIds },
        },
      });

      // Récupérer les notes de l'utilisateur pour ces versets
      notes = await db.verseNote.findMany({
        where: {
          userId,
          verseId: { in: verseIds },
        },
      });
    }

    // Fusionner les surlignages et notes dans chaque verset
    const formattedVerses = verses.map((v) => {
      const h = highlights.find((hl) => hl.verseId === v.id);
      const n = notes.find((nt) => nt.verseId === v.id);

      return {
        id: v.id,
        book: v.book,
        bookNumber: v.bookNumber,
        chapter: v.chapter,
        verse: v.verse,
        text: v.text,
        translation: v.translation,
        highlightColor: h ? h.color : null,
        note: n ? { content: n.content, isVoice: n.isVoice } : null,
      };
    });

    return NextResponse.json({ verses: formattedVerses });
  } catch (error: any) {
    console.error("Error fetching bible chapter:", error);
    return NextResponse.json({ error: "Failed to fetch chapter" }, { status: 500 });
  }
}
