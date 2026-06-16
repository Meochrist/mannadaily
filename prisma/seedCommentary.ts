// Désactiver la vérification stricte SSL pour les connexions sortantes HTTPS
process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";

import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import pg from "pg";
import * as fs from "fs";
import * as path from "path";
import * as https from "https";
import { GoogleGenerativeAI } from "@google/generative-ai";
import Groq from "groq-sdk";
import OpenAI from "openai";

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

function testUrl(url: string): Promise<number> {
  return new Promise((resolve) => {
    const opts = { headers: { 'User-Agent': 'Node' } };
    https.get(url, opts, (res) => {
      resolve(res.statusCode || 0);
      res.destroy();
    }).on("error", () => {
      resolve(0);
    });
  });
}

async function generateAIChapterCommentary(book: string, chapter: number): Promise<string> {
  const prompt = `Génère un commentaire biblique en français (120-150 mots) pour ${book} chapitre ${chapter}.
Résume le thème central, le contexte historique et l'application spirituelle principale.
Style : Matthew Henry, profond et pratique. Pas de titres ni de numéros.`;

  // Fallback 1 : Gemini
  try {
    const apiKey = process.env.GEMINI_API_KEY;
    if (apiKey) {
      const genAI = new GoogleGenerativeAI(apiKey);
      const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
      const result = await model.generateContent(prompt);
      const respText = result.response.text();
      if (respText && respText.trim()) {
        return respText.trim();
      }
    }
  } catch (err: any) {
    console.warn(`[Seed] ⚠️ Gemini a échoué pour ${book} ${chapter}, tentative avec Groq... (${err.message})`);
  }

  // Fallback 2 : Groq
  try {
    const apiKey = process.env.GROQ_API_KEY;
    if (apiKey) {
      const groq = new Groq({ apiKey });
      const chatCompletion = await groq.chat.completions.create({
        messages: [{ role: "user", content: prompt }],
        model: "llama-3.3-70b-versatile",
      });
      const respText = chatCompletion.choices[0]?.message?.content || "";
      if (respText && respText.trim()) {
        return respText.trim();
      }
    }
  } catch (err: any) {
    console.warn(`[Seed] ⚠️ Groq a échoué pour ${book} ${chapter}, tentative avec GitHub Models... (${err.message})`);
  }

  // Fallback 3 : GitHub Models
  try {
    const apiKey = process.env.GITHUB_TOKEN;
    if (apiKey) {
      const openai = new OpenAI({
        apiKey,
        baseURL: "https://models.inference.ai.azure.com",
      });
      const response = await openai.chat.completions.create({
        messages: [{ role: "user", content: prompt }],
        model: "gpt-4o",
      });
      const respText = response.choices[0]?.message?.content || "";
      if (respText && respText.trim()) {
        return respText.trim();
      }
    }
  } catch (err: any) {
    console.error(`[Seed] ❌ Tous les fournisseurs d'IA ont échoué pour ${book} ${chapter} (${err.message})`);
  }

  throw new Error("Impossible de générer le commentaire. Tous les fournisseurs d'IA ont échoué.");
}

async function main() {
  console.log("=== Début du Seed Commentaires de Chapitres (Toute la Bible) ===\n");

  // PARTIE 1 : Test des sources
  console.log("--- PARTIE 1 : Test des sources disponibles ---");
  const source1Url = "https://api.getbible.net/v2/commentary/";
  const source2Url = "https://raw.githubusercontent.com/scrollmapper/bible_databases/master/txt/commentary-mhc.txt";

  const status1 = await testUrl(source1Url);
  console.log(`Source 1 (GBible Commentary API) → Statut: ${status1}`);
  
  const status2 = await testUrl(source2Url);
  console.log(`Source 2 (Scrollmapper MHC TXT)  → Statut: ${status2}`);

  console.log("\n--- PARTIE 2 : Génération IA des commentaires de chapitres ---");

  // Récupérer tous les chapitres distincts dans BibleVerse
  const chapters = await prisma.bibleVerse.findMany({
    select: {
      bookNumber: true,
      book: true,
      chapter: true
    },
    distinct: ['bookNumber', 'chapter'],
    orderBy: [
      { bookNumber: 'asc' },
      { chapter: 'asc' }
    ]
  });

  console.log(`Nombre total de chapitres trouvés : ${chapters.length}`);

  // Calculer le total des chapitres par livre pour un affichage précis
  const totalChaptersPerBook: Record<number, number> = {};
  for (const ch of chapters) {
    totalChaptersPerBook[ch.bookNumber] = (totalChaptersPerBook[ch.bookNumber] || 0) + 1;
  }

  let insertedCount = 0;
  let skippedCount = 0;

  for (const ch of chapters) {
    const totalChaptersInThisBook = totalChaptersPerBook[ch.bookNumber];
    const progressLabel = `Livre ${ch.bookNumber}/66 (${ch.book}), Chapitre ${ch.chapter}/${totalChaptersInThisBook}`;

    // Vérifier si le commentaire existe déjà
    const existing = await prisma.bibleCommentary.findFirst({
      where: {
        book: ch.bookNumber,
        chapter: ch.chapter,
        verse: 0,
        author: "Matthew Henry (IA)"
      }
    });

    if (existing) {
      skippedCount++;
      if (skippedCount % 50 === 0) {
        console.log(`[Seed] ${skippedCount} chapitres déjà commentés. Progression : ${progressLabel}`);
      }
      continue;
    }

    try {
      console.log(`Génération pour : ${progressLabel}...`);
      const text = await generateAIChapterCommentary(ch.book, ch.chapter);
      
      if (text) {
        await prisma.bibleCommentary.create({
          data: {
            book: ch.bookNumber,
            chapter: ch.chapter,
            verse: 0,
            author: "Matthew Henry (IA)",
            content: text,
            language: "fr"
          }
        });
        insertedCount++;
        console.log(`✅ Commentaire inséré pour : ${progressLabel}`);
      }
    } catch (err: any) {
      console.error(`❌ Échec pour : ${progressLabel} :`, err.message);
    }

    // Pause de 200ms entre chaque requête (respecte les quotas)
    await new Promise(resolve => setTimeout(resolve, 200));
  }

  console.log("\n==================================================");
  console.log("=== Fin du Seed Commentaires ===");
  console.log(`Total insérés : ${insertedCount}`);
  console.log(`Total ignorés (déjà existants) : ${skippedCount}`);
  console.log("==================================================");
}

main()
  .catch((e) => {
    console.error("Erreur critique durant le seed :", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
