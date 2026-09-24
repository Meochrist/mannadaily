// Désactiver la vérification stricte SSL pour les connexions sortantes HTTPS
process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";

import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import pg from "pg";
import * as fs from "fs";
import * as path from "path";

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

interface BookInfo {
  name: string;
  bookNumber: number;
  chapters: number;
}

const BIBLE_BOOKS: BookInfo[] = [
  { name: "Genèse", bookNumber: 1, chapters: 50 },
  { name: "Exode", bookNumber: 2, chapters: 40 },
  { name: "Lévitique", bookNumber: 3, chapters: 27 },
  { name: "Nombres", bookNumber: 4, chapters: 36 },
  { name: "Deutéronome", bookNumber: 5, chapters: 34 },
  { name: "Josué", bookNumber: 6, chapters: 24 },
  { name: "Juges", bookNumber: 7, chapters: 21 },
  { name: "Ruth", bookNumber: 8, chapters: 4 },
  { name: "1 Samuel", bookNumber: 9, chapters: 31 },
  { name: "2 Samuel", bookNumber: 10, chapters: 24 },
  { name: "1 Rois", bookNumber: 11, chapters: 22 },
  { name: "2 Rois", bookNumber: 12, chapters: 25 },
  { name: "1 Chroniques", bookNumber: 13, chapters: 29 },
  { name: "2 Chroniques", bookNumber: 14, chapters: 36 },
  { name: "Esdras", bookNumber: 15, chapters: 10 },
  { name: "Néhémie", bookNumber: 16, chapters: 13 },
  { name: "Esther", bookNumber: 17, chapters: 10 },
  { name: "Job", bookNumber: 18, chapters: 42 },
  { name: "Psaumes", bookNumber: 19, chapters: 150 },
  { name: "Proverbes", bookNumber: 20, chapters: 31 },
  { name: "Ecclésiaste", bookNumber: 21, chapters: 12 },
  { name: "Cantique des Cantiques", bookNumber: 22, chapters: 8 },
  { name: "Ésaïe", bookNumber: 23, chapters: 66 },
  { name: "Jérémie", bookNumber: 24, chapters: 52 },
  { name: "Lamentations", bookNumber: 25, chapters: 5 },
  { name: "Ézéchiel", bookNumber: 26, chapters: 48 },
  { name: "Daniel", bookNumber: 27, chapters: 12 },
  { name: "Osée", bookNumber: 28, chapters: 14 },
  { name: "Joël", bookNumber: 29, chapters: 3 },
  { name: "Amos", bookNumber: 30, chapters: 9 },
  { name: "Abdias", bookNumber: 31, chapters: 1 },
  { name: "Jonas", bookNumber: 32, chapters: 4 },
  { name: "Michée", bookNumber: 33, chapters: 7 },
  { name: "Nahum", bookNumber: 34, chapters: 3 },
  { name: "Habacuc", bookNumber: 35, chapters: 3 },
  { name: "Sophonie", bookNumber: 36, chapters: 3 },
  { name: "Aggée", bookNumber: 37, chapters: 2 },
  { name: "Zacharie", bookNumber: 38, chapters: 14 },
  { name: "Malachie", bookNumber: 39, chapters: 4 },
  { name: "Matthieu", bookNumber: 40, chapters: 28 },
  { name: "Marc", bookNumber: 41, chapters: 16 },
  { name: "Luc", bookNumber: 42, chapters: 24 },
  { name: "Jean", bookNumber: 43, chapters: 21 },
  { name: "Actes", bookNumber: 44, chapters: 28 },
  { name: "Romains", bookNumber: 45, chapters: 16 },
  { name: "1 Corinthiens", bookNumber: 46, chapters: 16 },
  { name: "2 Corinthiens", bookNumber: 47, chapters: 13 },
  { name: "Galates", bookNumber: 48, chapters: 6 },
  { name: "Éphésiens", bookNumber: 49, chapters: 6 },
  { name: "Philippiens", bookNumber: 50, chapters: 4 },
  { name: "Colossiens", bookNumber: 51, chapters: 4 },
  { name: "1 Thessaloniciens", bookNumber: 52, chapters: 5 },
  { name: "2 Thessaloniciens", bookNumber: 53, chapters: 3 },
  { name: "1 Timothée", bookNumber: 54, chapters: 6 },
  { name: "2 Timothée", bookNumber: 55, chapters: 4 },
  { name: "Tite", bookNumber: 56, chapters: 3 },
  { name: "Philémon", bookNumber: 57, chapters: 1 },
  { name: "Hébreux", bookNumber: 58, chapters: 13 },
  { name: "Jacques", bookNumber: 59, chapters: 5 },
  { name: "1 Pierre", bookNumber: 60, chapters: 5 },
  { name: "2 Pierre", bookNumber: 61, chapters: 3 },
  { name: "1 Jean", bookNumber: 62, chapters: 5 },
  { name: "2 Jean", bookNumber: 63, chapters: 1 },
  { name: "3 Jean", bookNumber: 64, chapters: 1 },
  { name: "Jude", bookNumber: 65, chapters: 1 },
  { name: "Apocalypse", bookNumber: 66, chapters: 22 }
];

async function clearPlanIfExists(slug: string) {
  const plan = await prisma.readingPlan.findUnique({ where: { slug } });
  if (plan) {
    console.log(`[Seed] Nettoyage du plan existant: ${slug}...`);
    const days = await prisma.readingPlanDay.findMany({ where: { planId: plan.id } });
    const dayIds = days.map(d => d.id);
    
    // Supprimer les lectures
    await prisma.readingPlanReading.deleteMany({ where: { dayId: { in: dayIds } } });
    // Supprimer les jours
    await prisma.readingPlanDay.deleteMany({ where: { planId: plan.id } });
    // Supprimer les inscriptions
    await prisma.readingPlanEnrollment.deleteMany({ where: { planId: plan.id } });
    // Supprimer le plan
    await prisma.readingPlan.delete({ where: { id: plan.id } });
  }
}

async function createPlanWithDaysAndReadings(
  name: string,
  slug: string,
  description: string,
  duration: number,
  category: string,
  planDays: any[]
) {
  await clearPlanIfExists(slug);
  console.log(`[Seed] Création du plan '${name}'...`);
  
  // 1. Créer le plan
  const plan = await prisma.readingPlan.create({
    data: { name, slug, description, duration, category }
  });

  // 2. Créer les jours en masse (createMany)
  const daysData = planDays.map(d => ({
    planId: plan.id,
    dayNumber: d.dayNumber,
    title: d.title
  }));
  await prisma.readingPlanDay.createMany({
    data: daysData
  });

  // 3. Récupérer les jours créés pour associer les lectures
  const createdDays = await prisma.readingPlanDay.findMany({
    where: { planId: plan.id }
  });

  // 4. Préparer les lectures
  const readingsData: any[] = [];
  for (const d of planDays) {
    const dbDay = createdDays.find(cd => cd.dayNumber === d.dayNumber);
    if (dbDay) {
      for (const r of d.readings) {
        readingsData.push({
          dayId: dbDay.id,
          book: r.book,
          bookNumber: r.bookNumber,
          chapter: r.chapter
        });
      }
    }
  }

  // 5. Insérer les lectures par lots de 500 (createMany)
  for (let i = 0; i < readingsData.length; i += 500) {
    const batch = readingsData.slice(i, i + 500);
    await prisma.readingPlanReading.createMany({
      data: batch
    });
  }

  console.log(`✅ Plan '${name}' créé avec ${planDays.length} jours et ${readingsData.length} lectures.`);
}

async function main() {
  console.log("=== Début du Seed des Plans de Lecture (Optimisé par Lots) ===\n");

  const otBooks = BIBLE_BOOKS.filter(b => b.bookNumber <= 39);
  const ntBooks = BIBLE_BOOKS.filter(b => b.bookNumber >= 40);

  const otChapters: { book: string; bookNumber: number; chapter: number }[] = [];
  for (const b of otBooks) {
    for (let c = 1; c <= b.chapters; c++) {
      otChapters.push({ book: b.name, bookNumber: b.bookNumber, chapter: c });
    }
  }

  const ntChapters: { book: string; bookNumber: number; chapter: number }[] = [];
  for (const b of ntBooks) {
    for (let c = 1; c <= b.chapters; c++) {
      ntChapters.push({ book: b.name, bookNumber: b.bookNumber, chapter: c });
    }
  }

  console.log(`Données de base: ${otChapters.length} chapitres AT, ${ntChapters.length} chapitres NT.`);

  // --- PLAN 1 : Bible en 1 an (365 jours) ---
  const plan1Slug = "bible-1-an";
  const plan1Days: any[] = [];
  for (let d = 1; d <= 365; d++) {
    const readings: any[] = [];
    const otStart = Math.floor((d - 1) * otChapters.length / 365);
    const otEnd = Math.floor(d * otChapters.length / 365);
    for (let i = otStart; i < otEnd; i++) {
      readings.push(otChapters[i]);
    }
    const ntStart = Math.floor((d - 1) * ntChapters.length / 365);
    const ntEnd = Math.floor(d * ntChapters.length / 365);
    for (let i = ntStart; i < ntEnd; i++) {
      readings.push(ntChapters[i]);
    }
    plan1Days.push({
      dayNumber: d,
      title: `Jour ${d}`,
      readings
    });
  }
  await createPlanWithDaysAndReadings(
    "La Bible en 1 an",
    plan1Slug,
    "Lisez toute la Bible en 365 jours en combinant chaque jour des portions de l'Ancien et du Nouveau Testament.",
    365,
    "full_bible",
    plan1Days
  );

  // --- PLAN 2 : Nouveau Testament en 90 jours ---
  const plan2Slug = "nt-90-jours";
  const plan2Days: any[] = [];
  for (let d = 1; d <= 90; d++) {
    const readings: any[] = [];
    const start = Math.floor((d - 1) * ntChapters.length / 90);
    const end = Math.floor(d * ntChapters.length / 90);
    for (let i = start; i < end; i++) {
      readings.push(ntChapters[i]);
    }
    plan2Days.push({
      dayNumber: d,
      title: `Jour ${d}`,
      readings
    });
  }
  await createPlanWithDaysAndReadings(
    "Nouveau Testament en 90 jours",
    plan2Slug,
    "Une immersion de 3 mois pour lire l'intégralité du Nouveau Testament.",
    90,
    "nt_only",
    plan2Days
  );

  // --- PLAN 3 : Psaumes en 30 jours ---
  const plan3Slug = "psaumes-30-jours";
  const psalmsChapters: { book: string; bookNumber: number; chapter: number }[] = [];
  for (let c = 1; c <= 150; c++) {
    psalmsChapters.push({ book: "Psaumes", bookNumber: 19, chapter: c });
  }
  const plan3Days: any[] = [];
  for (let d = 1; d <= 30; d++) {
    const readings: any[] = [];
    const start = Math.floor((d - 1) * 150 / 30);
    const end = Math.floor(d * 150 / 30);
    for (let i = start; i < end; i++) {
      readings.push(psalmsChapters[i]);
    }
    plan3Days.push({
      dayNumber: d,
      title: `Jour ${d}`,
      readings
    });
  }
  await createPlanWithDaysAndReadings(
    "Les Psaumes en 30 jours",
    plan3Slug,
    "Lisez les 150 Psaumes en un mois (5 psaumes par jour) pour enrichir votre vie de prière.",
    30,
    "psalms",
    plan3Days
  );

  // --- PLAN 4 : Bible en 6 mois (180 jours) ---
  const plan4Slug = "bible-6-mois";
  const plan4Days: any[] = [];
  for (let d = 1; d <= 180; d++) {
    const readings: any[] = [];
    const otStart = Math.floor((d - 1) * otChapters.length / 180);
    const otEnd = Math.floor(d * otChapters.length / 180);
    for (let i = otStart; i < otEnd; i++) {
      readings.push(otChapters[i]);
    }
    const ntStart = Math.floor((d - 1) * ntChapters.length / 180);
    const ntEnd = Math.floor(d * ntChapters.length / 180);
    for (let i = ntStart; i < ntEnd; i++) {
      readings.push(ntChapters[i]);
    }
    plan4Days.push({
      dayNumber: d,
      title: `Jour ${d}`,
      readings
    });
  }
  await createPlanWithDaysAndReadings(
    "La Bible en 6 mois",
    plan4Slug,
    "Un plan intensif pour lire toute la Bible en un semestre.",
    180,
    "full_bible",
    plan4Days
  );

  console.log("\n=== Fin du Seed des Plans de Lecture ===");
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
