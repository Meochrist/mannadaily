import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { translateStrongEntry } from "@/lib/ai";

export const dynamic = "force-dynamic";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ number: string }> }
) {
  try {
    const { number } = await params;

    // Normaliser : H001 -> H1, G001 -> G1, etc.
    const normalized = number.toUpperCase().replace(/^([HG])0+(\d+)$/, "$1$2");

    const entry = await db.strongEntry.findUnique({
      where: { number: normalized },
    });

    if (!entry) {
      return NextResponse.json(
        { error: `Entrée Strong "${normalized}" introuvable` },
        { status: 404 }
      );
    }

    // Traduction française : générée une seule fois puis mise en cache en base.
    let translated = entry;
    if (!entry.definitionFr && entry.definition) {
      try {
        const { definitionFr, kjvUsageFr } = await translateStrongEntry(
          entry.number,
          entry.lemma,
          entry.transliteration,
          entry.definition,
          entry.kjvUsage
        );

        translated = await db.strongEntry.update({
          where: { id: entry.id },
          data: {
            definitionFr,
            kjvUsageFr: kjvUsageFr || null,
            translatedAt: new Date(),
          },
        });
      } catch (translationError) {
        // La traduction échoue → on renvoie l'entrée anglaise sans bloquer.
        console.warn(
          `Traduction FR indisponible pour ${normalized}:`,
          translationError instanceof Error ? translationError.message : translationError
        );
      }
    }

    return new NextResponse(JSON.stringify(translated), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        // Cache 24h — données statiques
        "Cache-Control": "public, max-age=86400, s-maxage=86400",
      },
    });
  } catch (error: unknown) {
    console.error("Error fetching Strong entry:", error);
    return NextResponse.json(
      { error: "Failed to fetch Strong entry" },
      { status: 500 }
    );
  }
}
