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
    const { verseId, color } = body;

    if (!verseId || !color) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const allowedColors = ["yellow", "green", "blue", "pink"];
    if (!allowedColors.includes(color)) {
      return NextResponse.json({ error: "Invalid highlight color" }, { status: 400 });
    }

    const highlight = await db.verseHighlight.upsert({
      where: {
        userId_verseId: {
          userId,
          verseId,
        },
      },
      update: {
        color,
      },
      create: {
        userId,
        verseId,
        color,
      },
    });

    return NextResponse.json({ highlight });
  } catch (error: any) {
    console.error("Error upserting highlight:", error);
    return NextResponse.json({ error: "Failed to save highlight" }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const session = await auth();
    const userId = session?.user?.id;

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const verseId = searchParams.get("verseId");

    if (!verseId) {
      return NextResponse.json({ error: "Missing verseId parameter" }, { status: 400 });
    }

    try {
      await db.verseHighlight.delete({
        where: {
          userId_verseId: {
            userId,
            verseId,
          },
        },
      });
    } catch (dbErr: any) {
      // Si le highlight n'existait pas, on ignore l'erreur
      if (dbErr.code !== "P2025") {
        throw dbErr;
      }
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Error deleting highlight:", error);
    return NextResponse.json({ error: "Failed to delete highlight" }, { status: 500 });
  }
}
