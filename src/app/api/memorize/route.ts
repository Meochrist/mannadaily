import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET() {
  const session = await auth();
  const userId = session?.user?.id;

  if (!userId) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  try {
    const now = new Date();
    
    // Récupérer les versets dont nextReview est dans le passé ou égal à maintenant
    const memorizations = await db.verseMemorization.findMany({
      where: {
        userId,
        nextReview: {
          lte: now,
        },
      },
      orderBy: {
        nextReview: "asc",
      },
    });

    // Récupérer tous les versets mémorisés pour l'utilisateur (pour le récap/historique)
    const mastered = await db.verseMemorization.findMany({
      where: {
        userId,
        status: "mastered",
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json({ memorizations, mastered });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const session = await auth();
  const userId = session?.user?.id;

  if (!userId) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  try {
    const { reference, verseText } = await request.json();

    if (!reference || !verseText) {
      return NextResponse.json({ error: "Référence et texte requis" }, { status: 400 });
    }

    // Tenter de lier un verseId existant en parsant la référence
    let verseId = "placeholder-id";
    const refRegex = /^(.+?)\s+(\d+)[:v](\d+)$/;
    const match = reference.trim().match(refRegex);
    if (match) {
      const bookName = match[1];
      const chapter = parseInt(match[2], 10);
      const verseNum = parseInt(match[3], 10);

      const dbVerse = await db.verse.findFirst({
        where: {
          book: bookName,
          chapter: chapter,
          verse: verseNum,
        },
      });
      if (dbVerse) {
        verseId = dbVerse.id;
      }
    }

    const memorization = await db.verseMemorization.upsert({
      where: {
        userId_reference: {
          userId,
          reference,
        },
      },
      update: {
        verseText,
        nextReview: new Date(),
        status: "learning",
        repetitions: 0,
        interval: 1,
        easeFactor: 2.5,
      },
      create: {
        userId,
        verseId,
        reference,
        verseText,
        status: "learning",
        nextReview: new Date(),
      },
    });

    return NextResponse.json({ success: true, memorization });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
