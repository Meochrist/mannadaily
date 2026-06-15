import { db } from "@/lib/db";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

const BIBLE_BOOKS_MAP: Record<number, string> = {
  1: "Genèse", 2: "Exode", 3: "Lévitique", 4: "Nombres", 5: "Deutéronome",
  6: "Josué", 7: "Juges", 8: "Ruth", 9: "1 Samuel", 10: "2 Samuel",
  11: "1 Rois", 12: "2 Rois", 13: "1 Chroniques", 14: "2 Chroniques",
  15: "Esdras", 16: "Néhémie", 17: "Esther", 18: "Job", 19: "Psaumes",
  20: "Proverbes", 21: "Ecclésiaste", 22: "Cantique des Cantiques",
  23: "Ésaïe", 24: "Jérémie", 25: "Lamentations", 26: "Ézéchiel",
  27: "Daniel", 28: "Osée", 29: "Joël", 30: "Amos", 31: "Abdias",
  32: "Jonas", 33: "Michée", 34: "Nahum", 35: "Habacuc", 36: "Sophonie",
  37: "Aggée", 38: "Zacharie", 39: "Malachie", 40: "Matthieu",
  41: "Marc", 42: "Luc", 43: "Jean", 44: "Actes", 45: "Romains",
  46: "1 Corinthiens", 47: "2 Corinthiens", 48: "Galates", 49: "Éphésiens",
  50: "Philippiens", 51: "Colossiens", 52: "1 Thessaloniciens",
  53: "2 Thessaloniciens", 54: "1 Timothée", 55: "2 Timothée",
  56: "Tite", 57: "Philémon", 58: "Hébreux", 59: "Jacques",
  60: "1 Pierre", 61: "2 Pierre", 62: "1 Jean", 63: "2 Jean",
  64: "3 Jean", 65: "Jude", 66: "Apocalypse"
};

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const book = searchParams.get("book");
    const chapter = searchParams.get("chapter");
    const verse = searchParams.get("verse");

    if (!book || !chapter || !verse) {
      return NextResponse.json({ error: "Missing book, chapter, or verse parameters" }, { status: 400 });
    }

    const fromBook = parseInt(book, 10);
    const fromChapter = parseInt(chapter, 10);
    const fromVerse = parseInt(verse, 10);

    if (isNaN(fromBook) || isNaN(fromChapter) || isNaN(fromVerse)) {
      return NextResponse.json({ error: "Invalid parameters format" }, { status: 400 });
    }

    // Récupérer les 10 références croisées les plus votées
    const crossRefs = await db.crossReference.findMany({
      where: {
        fromBook,
        fromChapter,
        fromVerse,
      },
      orderBy: {
        votes: "desc",
      },
      take: 10,
    });

    // Pour chaque référence, récupérer le texte LSG
    const results = await Promise.all(
      crossRefs.map(async (ref) => {
        const bookName = BIBLE_BOOKS_MAP[ref.toBook] || `Livre ${ref.toBook}`;
        const refLabel = ref.toVerseEnd
          ? `${bookName} ${ref.toChapter}:${ref.toVerse}-${ref.toVerseEnd}`
          : `${bookName} ${ref.toChapter}:${ref.toVerse}`;

        // Récupérer les versets associés
        const targetVerses = await db.bibleVerse.findMany({
          where: {
            bookNumber: ref.toBook,
            chapter: ref.toChapter,
            verse: ref.toVerseEnd
              ? { gte: ref.toVerse, lte: ref.toVerseEnd }
              : ref.toVerse,
            translation: "LSG",
          },
          orderBy: {
            verse: "asc",
          },
        });

        const text = targetVerses.map((v) => v.text).join(" ") || "Texte non trouvé";

        return {
          id: ref.id,
          refLabel,
          toBook: ref.toBook,
          toChapter: ref.toChapter,
          toVerse: ref.toVerse,
          toVerseEnd: ref.toVerseEnd,
          votes: ref.votes,
          text,
        };
      })
    );

    // Retourner le résultat avec en-tête de cache pour 1 heure (3600 secondes)
    const response = NextResponse.json({ crossRefs: results });
    response.headers.set("Cache-Control", "public, max-age=3600, s-maxage=3600");
    return response;
  } catch (error: any) {
    console.error("Error fetching cross references:", error);
    return NextResponse.json({ error: "Failed to fetch cross references" }, { status: 500 });
  }
}
