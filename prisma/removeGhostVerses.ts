// Supprime les versets fantômes : placeholders sur des chapitres qui n'existent
// pas dans la Bible (ex: Abdias 2, Philémon 2, 2/3 Jean 2, Jude 2).
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
  const dryRun = process.argv.includes("--dry-run");

  const ghosts = await prisma.bibleVerse.findMany({
    where: { text: { contains: "verset de secours" } },
    orderBy: [{ bookNumber: "asc" }, { chapter: "asc" }, { verse: "asc" }],
  });

  console.log(`${ghosts.length} versets fantômes restants.${dryRun ? " (DRY RUN)" : ""}\n`);

  for (const g of ghosts) {
    console.log(`  ${g.book} ${g.chapter}:${g.verse}`);
  }

  if (ghosts.length === 0) {
    console.log("\nRien à supprimer — la Bible est propre.");
    return;
  }

  if (!dryRun) {
    // Supprimer d'abord les dépendances (highlights / notes)
    const ids = ghosts.map((g) => g.id);
    const delHighlights = await prisma.verseHighlight.deleteMany({
      where: { verseId: { in: ids } },
    });
    const delNotes = await prisma.verseNote.deleteMany({
      where: { verseId: { in: ids } },
    });
    const del = await prisma.bibleVerse.deleteMany({
      where: { id: { in: ids } },
    });

    console.log(`\nSupprimés : ${del.count} versets fantômes`);
    console.log(`  (+ ${delHighlights.count} surlignages, ${delNotes.count} notes orphelines)`);

    const remaining = await prisma.bibleVerse.count({
      where: { text: { contains: "verset de secours" } },
    });
    const total = await prisma.bibleVerse.count();
    console.log(`\nPlaceholders restants : ${remaining}`);
    console.log(`Total versets en base : ${total}`);
  }
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
