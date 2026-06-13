import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const session = await auth();
    const userId = session?.user?.id;

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { verseId, content, isVoice = false } = body;

    if (!verseId || content === undefined) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // Si le contenu de la note est vide, on supprime la note
    if (content.trim() === "") {
      try {
        await db.verseNote.delete({
          where: {
            userId_verseId: {
              userId,
              verseId,
            },
          },
        });
        return NextResponse.json({ success: true, message: "Note deleted" });
      } catch (dbErr: any) {
        if (dbErr.code !== "P2025") {
          throw dbErr;
        }
        return NextResponse.json({ success: true, message: "No note to delete" });
      }
    }

    const note = await db.verseNote.upsert({
      where: {
        userId_verseId: {
          userId,
          verseId,
        },
      },
      update: {
        content,
        isVoice,
      },
      create: {
        userId,
        verseId,
        content,
        isVoice,
      },
    });

    return NextResponse.json({ note });
  } catch (error: any) {
    console.error("Error saving verse note:", error);
    return NextResponse.json({ error: "Failed to save note" }, { status: 500 });
  }
}

export async function GET() {
  try {
    const session = await auth();
    const userId = session?.user?.id;

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const notes = await db.verseNote.findMany({
      where: {
        userId,
      },
      include: {
        verse: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json({ notes });
  } catch (error: any) {
    console.error("Error fetching notes:", error);
    return NextResponse.json({ error: "Failed to fetch notes" }, { status: 500 });
  }
}
