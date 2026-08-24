import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { resolveFrToEn } from "@/lib/strongFrIndex";

export const dynamic = "force-dynamic";

/**
 * Recherche d'entrées Strong par mot-clé plutôt que par numéro.
 *
 * L'utilisateur ne connaît pas les codes (H430, G3056...) : il tape un mot
 * ("amour", "lumière", "logos", "elohim") et on lui retourne les entrées
 * correspondantes en cherchant dans la définition, l'usage KJV, la
 * translittération et le lemme original.
 *
 * GET /api/bible/strong/search?q=amour&language=hebrew|greek (language optionnel)
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const rawQuery = (searchParams.get("q") || "").trim();
    const language = searchParams.get("language"); // hebrew | greek | null

    if (rawQuery.length < 2) {
      return NextResponse.json(
        { error: "Requête trop courte (2 caractères minimum)" },
        { status: 400 }
      );
    }

    if (rawQuery.length > 60) {
      return NextResponse.json({ error: "Requête trop longue" }, { status: 400 });
    }

    // Si l'utilisateur tape directement un numéro Strong, on le renvoie tel quel
    const asNumber = rawQuery.toUpperCase().replace(/^([HG])0+(\d+)$/, "$1$2");
    if (/^[HG]\d+$/.test(asNumber)) {
      const direct = await db.strongEntry.findUnique({ where: { number: asNumber } });
      if (direct) {
        return NextResponse.json({ results: [direct], exact: true });
      }
    }

    const languageFilter =
      language === "hebrew" || language === "greek" ? { language } : {};

    // Les définitions Strong sont en anglais : on traduit la requête française
    // en mots-clés anglais. Si le mot est absent de l'index, on cherche brut.
    const enTerms = resolveFrToEn(rawQuery);
    const searchTerms = enTerms.length > 0 ? enTerms : [rawQuery];

    const orConditions = searchTerms.flatMap((term) => [
      { transliteration: { contains: term, mode: "insensitive" as const } },
      { lemma: { contains: term, mode: "insensitive" as const } },
      { kjvUsage: { contains: term, mode: "insensitive" as const } },
      { definition: { contains: term, mode: "insensitive" as const } },
    ]);

    const results = await db.strongEntry.findMany({
      where: {
        ...languageFilter,
        OR: orConditions,
      },
      take: 60,
      orderBy: { number: "asc" },
    });

    // Tri par pertinence : un mot-clé présent dans kjvUsage (usage réel de la
    // traduction) est bien plus pertinent qu'une occurrence noyée dans une
    // longue définition. On privilégie aussi les correspondances de mot entier.
    const primary = searchTerms[0]?.toLowerCase() || "";
    const scored = results.map((entry) => {
      const usage = (entry.kjvUsage || "").toLowerCase();
      const definition = (entry.definition || "").toLowerCase();
      let score = 0;

      for (const term of searchTerms) {
        const t = term.toLowerCase();
        const wordBoundary = new RegExp(`\\b${t.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\b`);

        if (wordBoundary.test(usage)) score += 12;
        else if (usage.includes(t)) score += 6;

        if (wordBoundary.test(definition)) score += 4;
        else if (definition.includes(t)) score += 2;
      }

      // Bonus si le terme principal apparaît en tête de l'usage KJV
      if (primary && usage.startsWith(primary)) score += 8;
      // Malus pour les définitions très longues (souvent des correspondances fortuites)
      if (definition.length > 400) score -= 2;

      return { entry, score };
    });

    const sorted = scored
      .sort((a, b) => b.score - a.score)
      .slice(0, 25)
      .map((s) => s.entry);

    return NextResponse.json({
      results: sorted,
      exact: false,
      translatedFrom: enTerms.length > 0 ? rawQuery : null,
      searchedTerms: searchTerms,
    });
  } catch (error: unknown) {
    console.error("Error searching Strong entries:", error);
    return NextResponse.json(
      { error: "Failed to search Strong entries" },
      { status: 500 }
    );
  }
}
