// Répare les versets placeholder "verset de secours" avec la Louis Segond 1910
// depuis api.getbible.net (indexée par bookNumber → correspond à notre schéma).
process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";

import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import pg from "pg";
import * as fs from "fs";
import * as path from "path";
import * as https from "https";

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

interface GetBibleChapter {
  book_nr: number;
  book_name: string;
  chapter: number;
  verses: { chapter: number; verse: number; text: string }[];
}

function fetchJSON(url: string): Promise<GetBibleChapter> {
  return new Promise((resolve, reject) => {
    https
      .get(url, { headers: { "User-Agent": "MannaDaily/1.0" } }, (res) => {
        if (res.statusCode !== 200) {
          reject(new Error(`HTTP ${res.statusCode}`));
          return;
        }
        let data = "";
        res.on("data", (c) => (data += c));
        res.on("end", () => {
          try {
            resolve(JSON.parse(data));
          } catch (e) {
            reject(e);
          }
        });
      })
      .on("error", reject);
  });
}

async function main() {
  const dryRun = process.argv.includes("--dry-run");

  const broken = await prisma.bibleVerse.findMany({
    where: { text: { contains: "verset de secours" } },
    orderBy: [{ bookNumber: "asc" }, { chapter: "asc" }, { verse: "asc" }],
  });

  console.log(`${broken.length} versets placeholder détectés.${dryRun ? " (DRY RUN)" : ""}\n`);
  if (broken.length === 0) {
    console.log("Rien à réparer.");
    return;
  }

  // Regrouper par livre+chapitre → 1 appel API par chapitre
  const groups = new Map<string, typeof broken>();
  for (const v of broken) {
    const key = `${v.bookNumber}|${v.chapter}`;
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key)!.push(v);
  }

  console.log(`${groups.size} chapitres à récupérer depuis Louis Segond 1910.\n`);

  let fixed = 0;
  let failed = 0;
  const failures: string[] = [];

  for (const [key, verses] of groups) {
    const [bookNumStr, chapterStr] = key.split("|");
    const bookNumber = parseInt(bookNumStr, 10);
    const chapter = parseInt(chapterStr, 10);
    const bookLabel = verses[0].book;
    const url = `https://api.getbible.net/v2/ls1910/${bookNumber}/${chapter}.json`;

    try {
      const data = await fetchJSON(url);
      const apiVerses = data.verses || [];

      for (const v of verses) {
        const found = apiVerses.find((av) => av.verse === v.verse);
        const clean = found?.text?.trim().replace(/\s+/g, " ");

        if (clean && !clean.includes("verset de secours")) {
          if (!dryRun) {
            await prisma.bibleVerse.update({
              where: { id: v.id },
              data: { text: clean },
            });
          }
          fixed++;
        } else {
          failures.push(`${bookLabel} ${chapter}:${v.verse}`);
          failed++;
        }
      }
      console.log(`[OK] ${bookLabel} ${chapter} → ${verses.length} versets`);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error(`[ERR] ${bookLabel} ${chapter} : ${msg}`);
      failures.push(...verses.map((v) => `${bookLabel} ${chapter}:${v.verse}`));
      failed += verses.length;
    }

    await new Promise((r) => setTimeout(r, 250));
  }

  console.log(`\n=== RÉSUMÉ ===`);
  console.log(`Réparés : ${fixed}`);
  console.log(`Échecs  : ${failed}`);
  if (failures.length > 0) {
    console.log(`\nÉchecs détaillés :`);
    failures.slice(0, 40).forEach((f) => console.log(`  - ${f}`));
    if (failures.length > 40) console.log(`  ... et ${failures.length - 40} autres`);
  }

  if (!dryRun) {
    const remaining = await prisma.bibleVerse.count({
      where: { text: { contains: "verset de secours" } },
    });
    console.log(`\nPlaceholders restants en base : ${remaining}`);
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
