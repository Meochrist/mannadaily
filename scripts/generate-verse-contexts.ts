/**
 * Script de génération des contextes historiques verset par verset.
 * 
 * Usage : npx tsx scripts/generate-verse-contexts.ts [--resume]
 * 
 * - Parcourt tous les versets de la Bible (table BibleVerse)
 * - Pour chaque verset, génère un contexte historique via l'IA
 * - Sauvegarde incrémentale dans src/data/verse-contexts.json
 * - Progression sauvegardée dans scripts/.verse-contexts-progress.json
 * - Ctrl+C pour arrêter, relancer avec --resume pour continuer
 */

import { PrismaClient } from "@prisma/client";
import * as fs from "fs";
import * as path from "path";

// === Configuration ===
const OUTPUT_FILE = path.resolve(__dirname, "../src/data/verse-contexts.json");
const PROGRESS_FILE = path.resolve(__dirname, ".verse-contexts-progress.json");
const BATCH_SIZE = 5; // Versets traités entre chaque sauvegarde
const DELAY_MS = 500; // Pause entre chaque verset (respect des rate limits)

// === Types ===
interface VerseContexts {
  [reference: string]: string;
}

interface Progress {
  lastBook: string;
  lastChapter: number;
  lastVerse: number;
  totalProcessed: number;
  totalVerses: number;
  startedAt: string;
  errors: string[];
}

// === Providers IA (même stack que l'app) ===
async function callGemini(prompt: string): Promise<string> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error("GEMINI_API_KEY not set");
  
  const { GoogleGenerativeAI } = await import("@google/generative-ai");
  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
  const result = await model.generateContent(prompt);
  const text = result.response.text();
  if (!text) throw new Error("Gemini returned empty text");
  return text.trim();
}

async function callGroq(prompt: string): Promise<string> {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) throw new Error("GROQ_API_KEY not set");
  
  const { default: Groq } = await import("groq-sdk");
  const groq = new Groq({ apiKey });
  const chatCompletion = await groq.chat.completions.create({
    messages: [{ role: "user", content: prompt }],
    model: "llama-3.3-70b-versatile",
  });
  const text = chatCompletion.choices[0]?.message?.content || "";
  if (!text) throw new Error("Groq returned empty text");
  return text.trim();
}

async function callGitHub(prompt: string): Promise<string> {
  const apiKey = process.env.GITHUB_TOKEN;
  if (!apiKey) throw new Error("GITHUB_TOKEN not set");
  
  const { default: OpenAI } = await import("openai");
  const openai = new OpenAI({
    apiKey,
    baseURL: "https://models.inference.ai.azure.com",
  });
  const response = await openai.chat.completions.create({
    messages: [{ role: "user", content: prompt }],
    model: "gpt-4o",
  });
  const text = response.choices[0]?.message?.content || "";
  if (!text) throw new Error("GitHub Models returned empty text");
  return text.trim();
}

async function generateVerseContext(
  reference: string,
  verseText: string,
  bookName: string,
  chapter: number,
  verse: number
): Promise<string> {
  const prompt = `Génère le contexte historique et culturel en français (2-3 phrases) pour ce passage biblique : ${reference} "${verseText}"

Structure : Précise qui a écrit le passage (si connu), à quelle époque, à quel peuple/personne ce message était originellement destiné, et quel problème ou situation ce texte adressait.
Style : historique, simple et éclairant. Prose fluide sans titres ni numéros. Maximum 150 mots.`;

  // Triple fallback : Gemini → Groq → GitHub Models
  try {
    return await callGemini(prompt);
  } catch (err) {
    console.warn(`  Gemini failed for ${reference}, trying Groq...`, (err as Error).message?.slice(0, 80));
    try {
      return await callGroq(prompt);
    } catch (groqErr) {
      console.warn(`  Groq failed for ${reference}, trying GitHub...`, (groqErr as Error).message?.slice(0, 80));
      return await callGitHub(prompt);
    }
  }
}

// === Helpers ===
function loadJSON<T>(filePath: string, fallback: T): T {
  try {
    if (fs.existsSync(filePath)) {
      return JSON.parse(fs.readFileSync(filePath, "utf-8"));
    }
  } catch {}
  return fallback;
}

function saveJSON(filePath: string, data: unknown): void {
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2), "utf-8");
}

// === Main ===
async function main() {
  const resume = process.argv.includes("--resume");
  const prisma = new PrismaClient();

  console.log("📖 Génération des contextes verset par verset");
  console.log(`   Sortie : ${OUTPUT_FILE}`);
  console.log("   Mode :", resume ? "REPRISE" : "NOUVEAU");
  console.log("   Ctrl+C pour arrêter\n");

  // Charger l'existant
  const contexts: VerseContexts = resume ? loadJSON(OUTPUT_FILE, {}) : {};
  const progress: Progress = resume
    ? loadJSON(PROGRESS_FILE, {
        lastBook: "", lastChapter: 0, lastVerse: 0,
        totalProcessed: Object.keys(contexts).length,
        totalVerses: 0, startedAt: new Date().toISOString(), errors: [],
      })
    : {
        lastBook: "", lastChapter: 0, lastVerse: 0,
        totalProcessed: 0, totalVerses: 0,
        startedAt: new Date().toISOString(), errors: [],
      };

  // Compter le total de versets (premier run)
  if (progress.totalVerses === 0) {
    progress.totalVerses = await prisma.bibleVerse.count();
    console.log(`   Total versets en base : ${progress.totalVerses.toLocaleString()}\n`);
  }

  // Récupérer tous les livres dans l'ordre
  const books = await prisma.bibleVerse.findMany({
    select: { book: true, bookNumber: true },
    distinct: ["book"],
    orderBy: { bookNumber: "asc" },
  });

  let foundResumePoint = !resume;
  let batchCount = 0;

  for (const { book: bookName } of books) {
    if (!foundResumePoint && bookName !== progress.lastBook) continue;

    const chapters = await prisma.bibleVerse.findMany({
      where: { book: bookName },
      select: { chapter: true },
      distinct: ["chapter"],
      orderBy: { chapter: "asc" },
    });

    for (const { chapter } of chapters) {
      // Skip jusqu'au point de reprise
      if (!foundResumePoint) {
        if (bookName === progress.lastBook && chapter < progress.lastChapter) continue;
      }

      const verses = await prisma.bibleVerse.findMany({
        where: { book: bookName, chapter },
        select: { verse: true, text: true },
        orderBy: { verse: "asc" },
      });

      for (const { verse, text } of verses) {
        if (!foundResumePoint) {
          if (bookName === progress.lastBook && chapter === progress.lastChapter && verse <= progress.lastVerse) continue;
          foundResumePoint = true;
          console.log(`▶ Reprise à ${bookName} ${chapter}:${verse}`);
        }

        const reference = `${bookName} ${chapter}:${verse}`;

        // Skip si déjà généré
        if (contexts[reference]) {
          progress.lastBook = bookName;
          progress.lastChapter = chapter;
          progress.lastVerse = verse;
          continue;
        }

        // Générer
        try {
          process.stdout.write(`  ${reference}... `);
          const context = await generateVerseContext(reference, text, bookName, chapter, verse);
          contexts[reference] = context;
          progress.totalProcessed++;
          batchCount++;
          console.log("✓");

          // Pause entre les versets
          await new Promise(r => setTimeout(r, DELAY_MS));
        } catch (err) {
          const msg = `${reference}: ${(err as Error).message}`;
          console.log(`✗ ${msg}`);
          progress.errors.push(msg);
        }

        // Sauvegarde périodique
        if (batchCount >= BATCH_SIZE) {
          progress.lastBook = bookName;
          progress.lastChapter = chapter;
          progress.lastVerse = verse;
          saveJSON(OUTPUT_FILE, contexts);
          saveJSON(PROGRESS_FILE, progress);
          const pct = ((progress.totalProcessed / progress.totalVerses) * 100).toFixed(1);
          console.log(`  💾 Sauvegardé — ${progress.totalProcessed.toLocaleString()}/${progress.totalVerses.toLocaleString()} (${pct}%)`);
          batchCount = 0;
        }
      }
    }
  }

  // Sauvegarde finale
  saveJSON(OUTPUT_FILE, contexts);
  saveJSON(PROGRESS_FILE, progress);

  console.log(`\n✅ Terminé ! ${progress.totalProcessed.toLocaleString()} contextes générés.`);
  console.log(`   Erreurs : ${progress.errors.length}`);
  if (progress.errors.length > 0) {
    console.log(`   Détail : ${progress.errors.slice(0, 10).join(", ")}`);
  }

  await prisma.$disconnect();
}

main().catch((err) => {
  console.error("Fatal:", err);
  process.exit(1);
});
