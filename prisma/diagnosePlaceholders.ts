// Diagnostic : combien de versets sont des placeholders "verset de secours" ?
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
  const total = await prisma.bibleVerse.count();
  const placeholders = await prisma.bibleVerse.count({
    where: { text: { contains: "verset de secours" } },
  });

  console.log(`Total versets en base : ${total}`);
  console.log(`Placeholders "verset de secours" : ${placeholders}`);
  console.log(`Vrais versets : ${total - placeholders}`);

  // Grouper les livres affectés
  const affected = await prisma.$queryRaw<{ book: string; bookNumber: number; cnt: bigint }[]>`
    SELECT book, "bookNumber", COUNT(*) as cnt
    FROM "BibleVerse"
    WHERE text LIKE '%verset de secours%'
    GROUP BY book, "bookNumber"
    ORDER BY "bookNumber" ASC
  `;

  console.log(`\nLivres affectés : ${affected.length}`);
  for (const a of affected) {
    console.log(`  ${a.bookNumber}. ${a.book} → ${a.cnt} versets placeholder`);
  }
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); await pool.end(); });
