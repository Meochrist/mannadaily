import { NextResponse } from "next/server";
import { initServerDb } from "@/server/db";

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

    const db = initServerDb();

    // Récupérer les références croisées
    const crossRefs = db.prepare(`
      SELECT * FROM cross_references 
      WHERE from_book = ? AND from_chapter = ? AND from_verse = ? 
      ORDER BY votes DESC LIMIT 10
    `).all(fromBook, fromChapter, fromVerse) as any[];

    // Pour chaque référence, récupérer le texte LSG
    const results = await Promise.all(
      crossRefs.map(async (ref) => {
        const bookName = BIBLE_BOOKS_MAP[ref.to_book] || `Livre ${ref.to_book}`;
        const refLabel = ref.to_verse_end
          ? `${bookName} ${ref.to_chapter}:${ref.to_verse}-${ref.to_verse_end}`
          : `${bookName} ${ref.to_chapter}:${ref.to_verse}`;

        // Récupérer les versets associés
        const targetVerses = db.prepare(`
          SELECT text FROM bible_verses 
          WHERE book_number = ? AND chapter = ? AND verse >= ? AND verse <= ? AND translation = 'LSG'
          ORDER BY verse ASC
        `).all(
          ref.to_book,
          ref.to_chapter,
          ref.to_verse,
          ref.to_verse_end || ref.to_verse
        ) as { text: string }[];

        const text = targetVerses.map((v) => v.text).join(" ") || "Texte non trouvé";

        return {
          id: ref.id,
          refLabel,
          toBook: ref.to_book,
          toChapter: ref.to_chapter,
          toVerse: ref.to_verse,
          toVerseEnd: ref.to_verse_end,
          votes: ref.votes,
          text,
        };
      })
    );

    // Retourner le résultat avec en-tête de cache pour 1 heure
    const response = NextResponse.json({ crossRefs: results });
    response.headers.set("Cache-Control", "public, max-age=3600, s-maxage=3600");
    return response;
  } catch (error: unknown) {
    console.error("Error fetching cross references:", error);
    return NextResponse.json({ error: "Failed to fetch cross references" }, { status: 500 });
  }
}
