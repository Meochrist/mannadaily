import { NextResponse } from "next/server";
import { query, queryOne } from "@/server/db";
import { resolveFrToEn } from "@/lib/strongFrIndex";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const rawQuery = (searchParams.get("q") || "").trim();
    const language = searchParams.get("language");

    if (rawQuery.length < 2) {
      return NextResponse.json({ error: "Requête trop courte (2 caractères minimum)" }, { status: 400 });
    }

    if (rawQuery.length > 60) {
      return NextResponse.json({ error: "Requête trop longue" }, { status: 400 });
    }

    // Si l'utilisateur tape directement un numéro Strong
    const asNumber = rawQuery.toUpperCase().replace(/^([HG])0+(\d+)$/, "$1$2");
    if (/^[HG]\d+$/.test(asNumber)) {
      const direct = await queryOne("SELECT * FROM strong_entries WHERE number = $1", [asNumber]);
      if (direct) {
        return NextResponse.json({ results: [direct], exact: true });
      }
    }

    // Traduire la requête française en mots-clés anglais
    const enTerms = resolveFrToEn(rawQuery);
    const searchTerms = enTerms.length > 0 ? enTerms : [rawQuery];

    // Construire la requête SQL avec paramètres dynamiques
    const conditions: string[] = [];
    const params: any[] = [];
    let paramIndex = 1;

    // Filtre langue
    if (language === "hebrew" || language === "greek") {
      conditions.push(`language = $${paramIndex++}`);
      params.push(language);
    }

    // Conditions de recherche
    for (const term of searchTerms) {
      conditions.push(`(transliteration ILIKE $${paramIndex} OR lemma ILIKE $${paramIndex} OR kjv_usage ILIKE $${paramIndex} OR definition ILIKE $${paramIndex})`);
      params.push(`%${term}%`);
      paramIndex++;
    }

    // Recherche dans les traductions françaises
    conditions.push(`(definition_fr ILIKE $${paramIndex} OR kjv_usage_fr ILIKE $${paramIndex})`);
    params.push(`%${rawQuery}%`);
    paramIndex++;

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";
    const sql = `SELECT * FROM strong_entries ${whereClause} ORDER BY number ASC LIMIT 60`;

    const results = await query(sql, params);

    // Tri par pertinence
    const primary = searchTerms[0]?.toLowerCase() || "";
    const scored = results.map((entry: any) => {
      const usage = (entry.kjv_usage || "").toLowerCase();
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

      if (primary && usage.startsWith(primary)) score += 8;

      const usageFr = (entry.kjv_usage_fr || "").toLowerCase();
      const definitionFr = (entry.definition_fr || "").toLowerCase();
      const q = rawQuery.toLowerCase();
      if (usageFr.includes(q)) score += 20;
      if (definitionFr.includes(q)) score += 10;

      if (definition.length > 400) score -= 2;

      return { entry, score };
    });

    const scoredArray = Array.isArray(scored) ? scored : [];
    const sorted = scoredArray
      .sort((a: any, b: any) => b.score - a.score)
      .slice(0, 25)
      .map((s: any) => s.entry);

    return NextResponse.json({
      results: sorted,
      exact: false,
      translatedFrom: enTerms.length > 0 ? rawQuery : null,
      searchedTerms: searchTerms,
    });
  } catch (error: unknown) {
    console.error("Error searching Strong entries:", error);
    return NextResponse.json({ error: "Failed to search Strong entries" }, { status: 500 });
  }
}
