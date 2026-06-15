// Désactiver la vérification SSL en local
process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";

import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import pg from "pg";
import * as fs from "fs";
import * as path from "path";
import * as https from "https";

// Charger les variables d'environnement manuellement
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
          if (!process.env[key]) process.env[key] = val;
        }
      }
    }
  }
}

loadEnv();

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  console.error("DATABASE_URL non définie");
  process.exit(1);
}

const pool = new pg.Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

// Télécharger le texte brut depuis une URL
function fetchText(url: string): Promise<string> {
  return new Promise((resolve, reject) => {
    https.get(url, (res) => {
      if (res.statusCode !== 200) {
        reject(new Error(`HTTP ${res.statusCode} for ${url}`));
        return;
      }
      let data = "";
      res.on("data", (chunk) => { data += chunk; });
      res.on("end", () => resolve(data));
    }).on("error", reject);
  });
}

// Parser le fichier JS Strong -> extrait le JSON entre { et le dernier }
function parseStrongJS(jsContent: string): Record<string, any> {
  // Trouver le début de l'objet JSON (après "= {")
  const jsonStart = jsContent.indexOf("= {") + 2;
  // Trouver la fin : "module.exports" ou le dernier ";"
  let jsonEnd = jsContent.lastIndexOf("};");
  if (jsonEnd < 0) jsonEnd = jsContent.length;
  else jsonEnd += 1; // inclure le }

  const jsonStr = jsContent.substring(jsonStart, jsonEnd).trim();
  return JSON.parse(jsonStr);
}

async function seedLanguage(
  url: string,
  language: "hebrew" | "greek",
  prefix: "H" | "G"
) {
  console.log(`\n📥 Téléchargement ${language.toUpperCase()} depuis : ${url}`);
  const jsContent = await fetchText(url);
  console.log(`   Fichier téléchargé (${Math.round(jsContent.length / 1024)} KB)`);

  const dict = parseStrongJS(jsContent);
  const keys = Object.keys(dict);
  console.log(`   ${keys.length} entrées trouvées (${keys[0]} → ${keys[keys.length - 1]})`);
  console.log(`   Exemples: ${JSON.stringify(dict[keys[0]]).substring(0, 150)}`);

  // Préparer les entrées
  const entries = keys.map(number => {
    const entry = dict[number];
    return {
      number,
      language,
      lemma: entry.lemma || null,
      transliteration: entry.xlit || null,
      pronunciation: entry.pron || null,
      definition: entry.strongs_def || entry.def || null,
      kjvUsage: entry.kjv_def || entry.kjv || null,
    };
  });

  // Insérer en batchs de 500
  const batchSize = 500;
  let inserted = 0;
  for (let i = 0; i < entries.length; i += batchSize) {
    const batch = entries.slice(i, i + batchSize);
    const result = await prisma.strongEntry.createMany({
      data: batch,
      skipDuplicates: true,
    });
    inserted += result.count;
    process.stdout.write(`\r   Inséré : ${inserted}/${entries.length}`);
  }
  console.log(`\n✅ ${language.toUpperCase()} : ${inserted} entrées insérées`);
  return inserted;
}

async function main() {
  console.log("=== Début du Seed de la Concordance Strong ===");
  console.log("Source: github.com/openscriptures/strongs\n");

  const hebrewUrl = "https://raw.githubusercontent.com/openscriptures/strongs/master/hebrew/strongs-hebrew-dictionary.js";
  const greekUrl = "https://raw.githubusercontent.com/openscriptures/strongs/master/greek/strongs-greek-dictionary.js";

  let totalInserted = 0;

  try {
    const hebrew = await seedLanguage(hebrewUrl, "hebrew", "H");
    totalInserted += hebrew;
  } catch (err: any) {
    console.error(`❌ Erreur Hébreu: ${err.message}`);
  }

  try {
    const greek = await seedLanguage(greekUrl, "greek", "G");
    totalInserted += greek;
  } catch (err: any) {
    console.error(`❌ Erreur Grec: ${err.message}`);
  }

  console.log("\n========================================");
  console.log("=== Seed Concordance Strong terminé ! ===");
  console.log(`✍️  Total entrées insérées : ${totalInserted}`);
  console.log("   (Hébreu : ~8674 entrées + Grec : ~5624 entrées)");
  console.log("========================================");
}

main()
  .catch((e) => {
    console.error("Erreur critique :", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
