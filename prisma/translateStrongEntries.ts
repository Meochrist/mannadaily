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

async function main() {
  const all = process.argv.includes("--all");
  const limitArg = process.argv.find((a) => a.startsWith("--limit="));
  const limit = all ? undefined : limitArg ? parseInt(limitArg.split("=")[1], 10) : 300;

  const { translateStrongEntry } = await import("../src/lib/ai");

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
      const { definitionFr, kjvUsageFr } = await translateStrongEntry(
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
