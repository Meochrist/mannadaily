import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { 
  generateMeditation, 
  generatePersonalizedSummary, 
  generatePersonalizedPrayer,
  generateBibleChat,
  generateCommentary
} from "@/lib/ai";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

function parseReference(ref: string) {
  const parts = ref.trim().split(" ");
  if (parts.length < 2) return { book: ref, chapter: 1, verse: 1 };
  
  const lastPart = parts[parts.length - 1];
  const book = parts.slice(0, parts.length - 1).join(" ");
  
  const numbers = lastPart.split(":");
  const chapter = parseInt(numbers[0], 10) || 1;
  const verse = parseInt(numbers[1], 10) || 1;
  
  return { book, chapter, verse };
}

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { verse, reference, theme, type = "meditation", answers, question, verseContext } = body;

    // Prise en charge du commentaire IA
    if (type === "commentary") {
      if (!verse || !reference) {
        return NextResponse.json({ error: "Missing required verse or reference fields for commentary" }, { status: 400 });
      }
      const { book, chapter, verse: verseNumber } = parseReference(reference);
      
      const bibleVerse = await db.bibleVerse.findFirst({
        where: {
          book,
          chapter,
          verse: verseNumber
        }
      });
      const bookNumber = bibleVerse?.bookNumber || 1;

      const commentaryText = await generateCommentary(book, chapter, verseNumber, verse);

      const createdCommentary = await db.bibleCommentary.create({
        data: {
          book: bookNumber,
          chapter,
          verse: verseNumber,
          author: "MannaDaily AI",
          content: commentaryText,
          language: "fr"
        }
      });

      return NextResponse.json({ commentary: createdCommentary });
    }

    // Prise en charge du chat biblique
    if (type === "bible_chat") {
      if (!question || !verseContext) {
        return NextResponse.json({ error: "Missing required question or verseContext fields for bible_chat" }, { status: 400 });
      }
      const answerText = await generateBibleChat(question, verseContext);
      return NextResponse.json({ answer: answerText });
    }

    // Prise en charge du résumé personnalisé
    if (type === "summary") {
      if (!answers) {
        return NextResponse.json({ error: "Missing required answers field for summary" }, { status: 400 });
      }
      const summaryText = await generatePersonalizedSummary(answers);
      return NextResponse.json({ summary: summaryText });
    }

    // Prise en charge de la prière personnalisée
    if (type === "prayer_personal") {
      if (!verse || !answers) {
        return NextResponse.json({ error: "Missing required verse or answers fields for personalized prayer" }, { status: 400 });
      }
      const prayerText = await generatePersonalizedPrayer(answers, verse);
      return NextResponse.json({ meditation: prayerText });
    }

    if (!verse || !reference || !theme) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const { book, chapter, verse: verseNumber } = parseReference(reference);

    const dbVerse = await db.verse.upsert({
      where: {
        book_chapter_verse_translation: {
          book,
          chapter,
          verse: verseNumber,
          translation: "LSG",
        },
      },
      update: {},
      create: {
        book,
        chapter,
        verse: verseNumber,
        text: verse,
        translation: "LSG",
      },
    });

    const meditationText = await generateMeditation(verse, reference, theme, type);

    // On ne sauvegarde dans l'historique d'étude que la méditation classique de base
    if (type === "meditation") {
      await db.meditation.create({
        data: {
          verseId: dbVerse.id,
          content: meditationText,
        },
      });
    }

    return NextResponse.json({ meditation: meditationText });
  } catch (error: unknown) {
    console.error("Error in meditation generation API:", error);
    const message = error instanceof Error ? error.message : "Internal Server Error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
