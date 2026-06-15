process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";

import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import pg from "pg";
import * as fs from "fs";
import * as path from "path";
import * as https from "https";

function loadEnv() {
  const envFiles = [".env.local", ".env"];
  for (const file of envFiles) {
    const filePath = path.resolve(process.cwd(), file);
    if (fs.existsSync(filePath)) {
      const content = fs.readFileSync(filePath, "utf-8");
      for (const line of content.split(/\r?\n/)) {
        const trimmed = line.trim();
        if (trimmed && !trimmed.startsWith("#") && trimmed.includes("=")) {
          const firstEq = trimmed.indexOf("=");
          const key = trimmed.substring(0, firstEq).trim();
          let val = trimmed.substring(firstEq + 1).trim();
          if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
            val = val.substring(1, val.length - 1);
          }
          if (!process.env[key]) {
            process.env[key] = val;
          }
        }
      }
    }
  }
}

loadEnv();

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  console.error("Erreur: DATABASE_URL n'est pas définie");
  process.exit(1);
}

const pool = new pg.Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

const BIBLE_BOOKS_MAP: Record<number, string> = {
  1: "Genèse", 2: "Exode", 3: "Lévitique", 4: "Nombres", 5: "Deutéronome",
  6: "Josué", 7: "Juges", 8: "Ruth", 9: "1 Samuel", 10: "2 Samuel",
  11: "1 Rois", 12: "2 Rois", 13: "1 Chroniques", 14: "2 Chroniques",
  15: "Esdras", 16: "Néhémie", 17: "Esther", 18: "Job", 19: "Psaumes",
  20: "Proverbes", 21: "Ecclésiaste", 22: "Cantique des Cantiques",
  23: "Ésaïe", 24: "Jérémie", 25: "Lamentations", 26: "Ézéchiel",
  27: "Daniel", 28: "Osée", 29: "Joël", 30: "Amos", 31: "Abdias",
  32: "Jonas", 33: "Michée", 34: "Nahum", 35: "Habacuc", 36: "Sophonie",
  37: "Aggée", 38: "Zacharie", 39: "Malachie", 40: "Matthieu",
  41: "Marc", 42: "Luc", 43: "Jean", 44: "Actes", 45: "Romains",
  46: "1 Corinthiens", 47: "2 Corinthiens", 48: "Galates", 49: "Éphésiens",
  50: "Philippiens", 51: "Colossiens", 52: "1 Thessaloniciens",
  53: "2 Thessaloniciens", 54: "1 Timothée", 55: "2 Timothée",
  56: "Tite", 57: "Philémon", 58: "Hébreux", 59: "Jacques",
  60: "1 Pierre", 61: "2 Pierre", 62: "1 Jean", 63: "2 Jean",
  64: "3 Jean", 65: "Jude", 66: "Apocalypse"
};

const CHAPTERS_PER_BOOK: Record<number, number> = {
  1: 50, 2: 40, 3: 27, 4: 36, 5: 34, 6: 24, 7: 21, 8: 4, 9: 31, 10: 24,
  11: 22, 12: 25, 13: 29, 14: 36, 15: 10, 16: 13, 17: 10, 18: 42, 19: 150, 20: 31,
  21: 12, 22: 8, 23: 66, 24: 52, 25: 5, 26: 48, 27: 12, 28: 14, 29: 3, 30: 9,
  31: 1, 32: 4, 33: 7, 34: 3, 35: 3, 36: 3, 37: 2, 38: 14, 39: 4, 40: 28,
  41: 16, 42: 24, 43: 21, 44: 28, 45: 16, 46: 16, 47: 13, 48: 6, 49: 6,
  50: 4, 51: 4, 52: 5, 53: 3, 54: 6, 55: 4, 56: 3, 57: 1, 58: 13, 59: 5,
  60: 5, 61: 3, 62: 5, 63: 1, 64: 1, 65: 1, 66: 22
};

interface GetBibleChapter {
  translation: string;
  book_nr: number;
  book_name: string;
  chapter: number;
  verses: Array<{
    chapter: number;
    verse: number;
    name: string;
    text: string;
  }>;
}

function fetchChapter(bookNr: number, chapterNr: number, retries = 3): Promise<GetBibleChapter> {
  const url = `https://api.getbible.net/v2/martin/${bookNr}/${chapterNr}.json`;
  return new Promise((resolve, reject) => {
    const request = () => {
      https.get(url, (res) => {
        if (res.statusCode !== 200) {
          if (retries > 0) {
            setTimeout(() => {
              retries--;
              request();
            }, 1000);
          } else {
            reject(new Error(`HTTP ${res.statusCode} for ${url}`));
          }
          return;
        }
        let data = "";
        res.on("data", (chunk) => { data += chunk; });
        res.on("end", () => {
          try {
            resolve(JSON.parse(data) as GetBibleChapter);
          } catch (e) {
            reject(e);
          }
        });
      }).on("error", (err) => {
        if (retries > 0) {
          setTimeout(() => {
            retries--;
            request();
          }, 1000);
        } else {
          reject(err);
        }
      });
    };
    request();
  });
}

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function main() {
  console.log("=== Début du Seed de la Bible Martin (api.getbible.net/v2/martin) ===");
  console.log("Objectif: ~31 102 versets\n");

  let totalVersesInserted = 0;
  let totalChaptersProcessed = 0;
  let errors: string[] = [];

  for (let bookNr = 1; bookNr <= 66; bookNr++) {
    const bookName = BIBLE_BOOKS_MAP[bookNr];
    const totalChapters = CHAPTERS_PER_BOOK[bookNr];
    const bookVerses: Array<{
      book: string;
      bookNumber: number;
      chapter: number;
      verse: number;
      text: string;
      translation: string;
    }> = [];

    process.stdout.write(`📖 Livre ${bookNr}/66 — ${bookName} (${totalChapters} chapitres)... `);

    // Charger tous les chapitres du livre en parallèle (tranches de 20 max)
    const chapterNumbers = Array.from({ length: totalChapters }, (_, idx) => idx + 1);
    const chunkSize = 20;
    
    for (let c = 0; c < chapterNumbers.length; c += chunkSize) {
      const chunk = chapterNumbers.slice(c, c + chunkSize);
      const results = await Promise.allSettled(
        chunk.map(chapterNr => fetchChapter(bookNr, chapterNr))
      );

      for (let i = 0; i < results.length; i++) {
        const res = results[i];
        const chapterNr = chunk[i];
        if (res.status === "fulfilled") {
          for (const v of res.value.verses) {
            bookVerses.push({
              book: bookName,
              bookNumber: bookNr,
              chapter: chapterNr,
              verse: v.verse,
              text: v.text.trim(),
              translation: "Martin"
            });
          }
          totalChaptersProcessed++;
        } else {
          const msg = `Erreur chapitre ${bookName} ${chapterNr}: ${res.reason?.message || res.reason}`;
          errors.push(msg);
          console.warn(`\n  ⚠️  ${msg}`);
        }
      }
      // Petite pause de politesse entre les tranches
      await sleep(100);
    }

    if (bookVerses.length > 0) {
      // Insérer tous les versets du livre en batchs de 200
      const batchSize = 200;
      let bookInserted = 0;
      for (let i = 0; i < bookVerses.length; i += batchSize) {
        const batch = bookVerses.slice(i, i + batchSize);
        const result = await prisma.bibleVerse.createMany({
          data: batch,
          skipDuplicates: true,
        });
        bookInserted += result.count;
      }
      totalVersesInserted += bookInserted;
      console.log(`✅ ${bookInserted} versets insérés (total: ${totalVersesInserted})`);
    } else {
      console.log("❌ Aucun verset récupéré.");
    }
    
    // Pause de politesse entre les livres
    await sleep(200);
  }

  console.log("\n========================================");
  console.log(`=== Seed de la Bible Martin terminé ! ===`);
  console.log(`📊 Livres traités      : 66`);
  console.log(`📖 Chapitres traités   : ${totalChaptersProcessed}`);
  console.log(`✍️  Versets insérés     : ${totalVersesInserted}`);
  if (errors.length > 0) {
    console.log(`⚠️  Erreurs rencontrées : ${errors.length}`);
    errors.forEach(e => console.log(`   - ${e}`));
  } else {
    console.log(`✅ Aucune erreur`);
  }
  console.log("========================================");
}

main()
  .catch((e) => {
    console.error("Erreur critique durant le seed Martin :", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
