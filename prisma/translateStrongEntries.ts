/**
 * Pré-traduit en français les entrées Strong les plus fréquentes.
 *
 * Sans ce script, la traduction se fait à la volée au premier clic (2-4 s).
 * En pré-traduisant les mots courants, l'affichage est instantané.
 *
 * Usage :
 *   npm run translate:strong            # 300 entrées les plus courantes
 *   npm run translate:strong -- --all   # tout (long, ~14 000 entrées)
 *   npm run translate:strong -- --limit=1000
 */
process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";

import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import pg from "pg";
import * as fs from "fs";
import * as path from "path";

function loadEnv() {
  for (const file of [".env.local", ".env"]) {
    const p = path.resolve(process.cwd(), file);
    if (!fs.existsSync(p)) continue;
    for (const line of fs.readFileSync(p, "utf-8").split(/\r?\n/)) {
      const t = line.trim();
      if (!t || t.startsWith("#") || !t.includes("=")) continue;
      const i = t.indexOf("=");
      const k = t.substring(0, i).trim();
      let v = t.substring(i + 1).trim();
      if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) v = v.slice(1, -1);
      if (!process.env[k]) process.env[k] = v;
    }
  }
}
loadEnv();

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter: new PrismaPg(pool) });

/**
 * Traduction autonome (pas d'import de src/lib/ai : la résolution ESM/TS
 * diffère entre Next et ts-node). Appelle Gemini puis Groq en secours.
 */
async function translateEntry(
  number: string,
  lemma: string | null,
  transliteration: string | null,
  definition: string | null,
  kjvUsage: string | null
): Promise<{ definitionFr: string; kjvUsageFr: string }> {
  const prompt = `Tu es lexicographe biblique. Traduis en FRANÇAIS cette entrée de la concordance Strong.

Numéro : ${number}
Mot original : ${lemma || "?"}${transliteration ? ` (${transliteration})` : ""}
Définition (anglais) : ${definition || "—"}
Usage dans les traductions (anglais) : ${kjvUsage || "—"}

Réponds EXACTEMENT dans ce format, sans autre texte :
DEFINITION: <la définition traduite en français, claire et fidèle, 1 à 3 phrases>
USAGE: <les mots français correspondants, séparés par des virgules, 3 à 10 termes>

Règles : français naturel, vocabulaire biblique courant, garde les nuances du terme original, n'invente rien.`;

  const parse = (raw: string) => {
    const d = raw.match(/DEFINITION\s*:\s*([\s\S]*?)(?=\nUSAGE\s*:|$)/i);
    const u = raw.match(/USAGE\s*:\s*([\s\S]*)$/i);
    return {
      definitionFr: (d?.[1] || "").trim(),
      kjvUsageFr: (u?.[1] || "").trim(),
    };
  };

  // 1. Gemini
  const geminiKey = process.env.GEMINI_API_KEY;
  if (geminiKey) {
    try {
      const res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${geminiKey}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] }),
        }
      );
      if (res.ok) {
        const data = await res.json();
        const text = data?.candidates?.[0]?.content?.parts?.[0]?.text || "";
        const parsed = parse(text);
        if (parsed.definitionFr) return parsed;
      }
    } catch {
      // on tente Groq
    }
  }

  // 2. Groq en secours
  const groqKey = process.env.GROQ_API_KEY;
  if (groqKey) {
    const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${groqKey}`,
      },
      body: JSON.stringify({
        model: "llama-3.3-70b-versatile",
        messages: [{ role: "user", content: prompt }],
      }),
    });
    if (res.ok) {
      const data = await res.json();
      const text = data?.choices?.[0]?.message?.content || "";
      const parsed = parse(text);
      if (parsed.definitionFr) return parsed;
    }
  }

  throw new Error("Aucun fournisseur IA disponible ou format inattendu");
}

async function main() {
  const all = process.argv.includes("--all");
  const limitArg = process.argv.find((a) => a.startsWith("--limit="));
  const limit = all ? undefined : limitArg ? parseInt(limitArg.split("=")[1], 10) : 300;

  const pending = await prisma.strongEntry.findMany({
    where: { definitionFr: null, definition: { not: null } },
    orderBy: { number: "asc" },
    ...(limit ? { take: limit } : {}),
  });

  console.log(`${pending.length} entrées Strong à traduire.\n`);
  if (pending.length === 0) {
    console.log("Tout est déjà traduit.");
    return;
  }

  let ok = 0;
  let failed = 0;

  for (const [idx, entry] of pending.entries()) {
    try {
      const { definitionFr, kjvUsageFr } = await translateEntry(
        entry.number,
        entry.lemma,
        entry.transliteration,
        entry.definition,
        entry.kjvUsage
      );

      await prisma.strongEntry.update({
        where: { id: entry.id },
        data: {
          definitionFr,
          kjvUsageFr: kjvUsageFr || null,
          translatedAt: new Date(),
        },
      });

      ok++;
      if ((idx + 1) % 10 === 0 || idx === 0) {
        console.log(`[${idx + 1}/${pending.length}] ${entry.number} ✓ ${definitionFr.substring(0, 60)}…`);
      }
    } catch (err: unknown) {
      failed++;
      console.error(`[ERR] ${entry.number} : ${err instanceof Error ? err.message : err}`);
    }

    // Respecter les quotas des fournisseurs IA
    await new Promise((r) => setTimeout(r, 900));
  }

  console.log(`\n=== RÉSUMÉ ===`);
  console.log(`Traduits : ${ok}`);
  console.log(`Échecs   : ${failed}`);

  const remaining = await prisma.strongEntry.count({
    where: { definitionFr: null, definition: { not: null } },
  });
  console.log(`Restant à traduire : ${remaining}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
