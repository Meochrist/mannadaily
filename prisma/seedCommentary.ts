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

interface GenerationResult {
  text: string;
  provider: "Gemini" | "Groq" | "GitHub";
}

async function generateAIChapterCommentary(book: string, chapter: number): Promise<GenerationResult> {
  const prompt = `Génère un commentaire biblique en français (100-120 mots) pour ${book} chapitre ${chapter}.
Thème central, contexte historique, application pratique.
Style Matthew Henry. Prose fluide sans titres.`;

  // Fallback 1 : Gemini
  try {
    const apiKey = process.env.GEMINI_API_KEY;
    if (apiKey) {
      const genAI = new GoogleGenerativeAI(apiKey);
      const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
      const result = await model.generateContent(prompt);
      const respText = result.response.text();
      if (respText && respText.trim()) {
        return { text: respText.trim(), provider: "Gemini" };
      }
    }
  } catch (err: any) {
    console.warn(`[Seed] ⚠️ Gemini a échoué pour ${book} ${chapter}: ${err.message}`);
    if (err.message?.includes("429") || err.status === 429) {
      console.log("[Seed] Quota Gemini atteint. Pause de 4s...");
      await new Promise(resolve => setTimeout(resolve, 4000));
    }
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
        return { text: respText.trim(), provider: "Groq" };
      }
    }
  } catch (err: any) {
    console.warn(`[Seed] ⚠️ Groq a échoué pour ${book} ${chapter}: ${err.message}`);
    if (err.message?.includes("429") || err.status === 429) {
      console.log("[Seed] Quota Groq atteint. Pause de 2s...");
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
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
        return { text: respText.trim(), provider: "GitHub" };
      }
    }
  } catch (err: any) {
    console.error(`[Seed] ❌ GitHub Models a échoué pour ${book} ${chapter}: ${err.message}`);
    if (err.message?.includes("429") || err.status === 429) {
      console.log("[Seed] Quota GitHub atteint. Pause de 6s...");
      await new Promise(resolve => setTimeout(resolve, 6000));
    }
  }

  throw new Error("Tous les fournisseurs d'IA ont échoué.");
}

async function main() {
  console.log("=== Début du Seed Commentaires de Chapitres (Toute la Bible) ===\n");

  // 1. Récupérer les livres déjà en base
  const existingBooks = await prisma.bibleCommentary.findMany({
    distinct: ['book'],
    select: { book: true },
  });
  const coveredBookIds = new Set(existingBooks.map(b => b.book));
  console.log(`Livres déjà couverts (${coveredBookIds.size}) :`, Array.from(coveredBookIds));

  // Récupérer tous les chapitres distincts dans BibleVerse
  const allChapters = await prisma.bibleVerse.findMany({
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

  // Calculer le total des chapitres par livre pour un affichage précis
  const totalChaptersPerBook: Record<number, number> = {};
  for (const ch of allChapters) {
    totalChaptersPerBook[ch.bookNumber] = (totalChaptersPerBook[ch.bookNumber] || 0) + 1;
  }

  // Filtrer pour ne garder que les chapitres des livres non encore couverts
  const chapters = allChapters.filter(ch => !coveredBookIds.has(ch.bookNumber));
  console.log(`Nombre de chapitres restant à seeder : ${chapters.length}`);

  let insertedCount = 0;

  for (const ch of chapters) {
    const totalChaptersInThisBook = totalChaptersPerBook[ch.bookNumber];

    // Vérifier à nouveau par mesure d'idempotence
    const existing = await prisma.bibleCommentary.findFirst({
      where: {
        book: ch.bookNumber,
        chapter: ch.chapter,
        verse: 0,
        author: "Matthew Henry (IA)"
      }
    });

    if (existing) {
      continue;
    }

    try {
      const result = await generateAIChapterCommentary(ch.book, ch.chapter);
      
      await prisma.bibleCommentary.create({
        data: {
          book: ch.bookNumber,
          chapter: ch.chapter,
          verse: 0,
          author: "Matthew Henry (IA)",
          content: result.text,
          language: "fr"
        }
      });
      insertedCount++;
      console.log(`Livre ${ch.bookNumber}/66 - Chapitre ${ch.chapter}/${totalChaptersInThisBook} - [${result.provider}]`);
    } catch (err: any) {
      console.error(`❌ Échec pour Livre ${ch.bookNumber}/66 (${ch.book}) Chapitre ${ch.chapter} : ${err.message}`);
    }

    // Pause de 300ms entre chaque requête
    await new Promise(resolve => setTimeout(resolve, 300));
  }

  console.log("\n==================================================");
  console.log("=== Fin du Seed Commentaires ===");
  console.log(`Total insérés : ${insertedCount}`);
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
