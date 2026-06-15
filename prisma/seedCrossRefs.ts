// Désactiver la vérification stricte SSL pour éviter l'erreur UNABLE_TO_VERIFY_LEAF_SIGNATURE en local
process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";

import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import pg from "pg";
import * as fs from "fs";
import * as path from "path";
import * as https from "https";

// Chargement des variables d'environnement
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
  console.error("Erreur: DATABASE_URL n'est pas définie dans .env ou .env.local");
  process.exit(1);
}

const pool = new pg.Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

// Abréviations officielles utilisées par OpenBible.info
const BOOK_ABBREVIATIONS: Record<string, number> = {
  "Gen": 1, "Exod": 2, "Lev": 3, "Num": 4, "Deut": 5, "Josh": 6, "Judg": 7, "Ruth": 8,
  "1Sam": 9, "2Sam": 10, "1Kgs": 11, "2Kgs": 12, "1Chr": 13, "2Chr": 14, "Ezra": 15, "Neh": 16,
  "Esth": 17, "Job": 18, "Ps": 19, "Prov": 20, "Eccl": 21, "Song": 22, "Isa": 23, "Jer": 24,
  "Lam": 25, "Ezek": 26, "Dan": 27, "Hos": 28, "Joel": 29, "Amos": 30, "Obad": 31, "Jonah": 32,
  "Mic": 33, "Nah": 34, "Hab": 35, "Zeph": 36, "Hag": 37, "Zech": 38, "Mal": 39, "Matt": 40,
  "Mark": 41, "Luke": 42, "John": 43, "Acts": 44, "Rom": 45, "1Cor": 46, "2Cor": 47, "Gal": 48,
  "Eph": 49, "Phil": 50, "Col": 51, "1Thess": 52, "2Thess": 53, "1Tim": 54, "2Tim": 55, "Titus": 56,
  "Phlm": 57, "Heb": 58, "Jas": 59, "1Pet": 60, "2Pet": 61, "1John": 62, "2John": 63, "3John": 64,
  "Jude": 65, "Rev": 66
};

function parseSingleTextVerse(str: string): { book: number; chapter: number; verse: number } | null {
  const parts = str.split('.');
  if (parts.length < 3) return null;
  const bookAbbr = parts[0];
  const book = BOOK_ABBREVIATIONS[bookAbbr];
  if (!book) return null;
  const chapter = parseInt(parts[1], 10);
  const verse = parseInt(parts[2], 10);
  if (isNaN(chapter) || isNaN(verse)) return null;
  return { book, chapter, verse };
}

function parseVerse(str: string): { book: number; chapter: number; verse: number; verseEnd?: number } | null {
  str = str.trim();
  if (!str) return null;

  // Format numérique : 01001001
  if (/^\d{8}$/.test(str)) {
    const book = parseInt(str.substring(0, 2), 10);
    const chapter = parseInt(str.substring(2, 5), 10);
    const verse = parseInt(str.substring(5, 8), 10);
    return { book, chapter, verse };
  }

  // Format textuel avec plage (ex: Prov.8.22-Prov.8.30)
  if (str.includes('-')) {
    const parts = str.split('-');
    const start = parseSingleTextVerse(parts[0]);
    if (!start) return null;
    let verseEnd: number | undefined;
    const end = parseSingleTextVerse(parts[1]);
    if (end) {
      verseEnd = end.verse;
    } else {
      const parsedEndVerse = parseInt(parts[1], 10);
      if (!isNaN(parsedEndVerse)) {
        verseEnd = parsedEndVerse;
      }
    }
    return { ...start, verseEnd };
  }

  return parseSingleTextVerse(str);
}

function downloadData(url: string): Promise<string> {
  return new Promise((resolve, reject) => {
    https.get(url, (res) => {
      if (res.statusCode !== 200) {
        reject(new Error(`HTTP status code ${res.statusCode}`));
        return;
      }
      let data = "";
      res.on("data", (chunk) => { data += chunk; });
      res.on("end", () => { resolve(data); });
    }).on("error", reject);
  });
}

async function main() {
  console.log("=== Début du Seed des Références Croisées Bibliques ===");

  const url = 'https://raw.githubusercontent.com/scrollmapper/bible_databases/master/sources/extras/cross_references.txt';
  console.log(`Téléchargement de : ${url}...`);

  let data: string;
  try {
    data = await downloadData(url);
    console.log("Téléchargement réussi !");
  } catch (error: any) {
    console.error("Échec du téléchargement :", error.message);
    process.exit(1);
  }

  const lines = data.split(/\r?\n/);
  console.log(`Nombre total de lignes chargées : ${lines.length}`);

  let insertedCount = 0;
  let batch: any[] = [];
  const batchSize = 500;
  let lineIndex = 0;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    // Ignorer la ligne d'en-tête
    if (i === 0 && (line.toLowerCase().includes('from') || line.toLowerCase().includes('verse'))) {
      continue;
    }

    const parts = line.split('\t');
    // Si pas de tabulation, essayer la virgule
    const finalParts = parts.length >= 3 ? parts : line.split(',');
    if (finalParts.length < 3) continue;

    const fromStr = finalParts[0];
    const toStr = finalParts[1];
    const votesStr = finalParts[2];

    const fromParsed = parseVerse(fromStr);
    const toParsed = parseVerse(toStr);
    const votes = parseInt(votesStr, 10);

    if (fromParsed && toParsed && !isNaN(votes)) {
      batch.push({
        fromBook: fromParsed.book,
        fromChapter: fromParsed.chapter,
        fromVerse: fromParsed.verse,
        toBook: toParsed.book,
        toChapter: toParsed.chapter,
        toVerse: toParsed.verse,
        toVerseEnd: toParsed.verseEnd || null,
        votes: votes
      });

      lineIndex++;

      if (batch.length >= batchSize) {
        const result = await prisma.crossReference.createMany({
          data: batch,
          skipDuplicates: true
        });
        insertedCount += result.count;
        batch = [];

        if (lineIndex % 10000 === 0) {
          console.log(`Progression : ${lineIndex} lignes traitées, ${insertedCount} références croisées insérées.`);
        }
      }
    }
  }

  // Insérer le reliquat du dernier lot
  if (batch.length > 0) {
    const result = await prisma.crossReference.createMany({
      data: batch,
      skipDuplicates: true
    });
    insertedCount += result.count;
  }

  console.log("\n==================================================");
  console.log("=== Fin du Seed des Références Croisées ===");
  console.log(`Lignes traitées  : ${lineIndex}`);
  console.log(`Entrées insérées : ${insertedCount}`);
  console.log("==================================================");
}

main()
  .catch((e) => {
    console.error("Erreur critique pendant le seed :", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
