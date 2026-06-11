import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { generateMeditation } from "@/lib/ai";
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
    const { verse, reference, theme, type = "meditation" } = body;

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
