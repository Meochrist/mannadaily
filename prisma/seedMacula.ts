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

// --- UTILS DE TRANSLITTERATION GRECQUE ---
function transliterateGreek(text: string): string {
  const map: Record<string, string> = {
    'α': 'a', 'β': 'b', 'γ': 'g', 'δ': 'd', 'ε': 'e', 'ζ': 'z', 'η': 'e', 'θ': 'th',
    'ι': 'i', 'κ': 'k', 'λ': 'l', 'μ': 'm', 'ν': 'n', 'ξ': 'x', 'ο': 'o', 'π': 'p',
    'ρ': 'r', 'σ': 's', 'ς': 's', 'τ': 't', 'υ': 'y', 'φ': 'ph', 'χ': 'ch', 'ψ': 'ps',
    'ω': 'o',
    'Α': 'A', 'Β': 'B', 'Γ': 'G', 'Δ': 'D', 'Ε': 'E', 'Ζ': 'Z', 'Η': 'E', 'Θ': 'Th',
    'Ι': 'I', 'Κ': 'K', 'Λ': 'L', 'Μ': 'M', 'N': 'N', 'Ξ': 'X', 'Ο': 'O', 'Π': 'P',
    'Ρ': 'R', 'Σ': 'S', 'Τ': 'T', 'Υ': 'Y', 'Φ': 'Ph', 'Χ': 'Ch', 'Ψ': 'Ps', 'Ω': 'O',
    'ἀ': 'a', 'ἁ': 'ha', 'ἂ': 'a', 'ἃ': 'ha', 'ἄ': 'a', 'ἅ': 'ha', 'ἆ': 'a', 'ἇ': 'ha',
    'ἐ': 'e', 'ἑ': 'he', 'ἒ': 'e', 'ἓ': 'he', 'ἔ': 'e', 'ἕ': 'he',
    'ἠ': 'e', 'ἡ': 'he', 'ἢ': 'e', 'ἣ': 'he', 'ἤ': 'e', 'ἥ': 'he', 'ἦ': 'e', 'ἧ': 'he',
    'ἰ': 'i', 'ἱ': 'hi', 'ἲ': 'i', 'ἳ': 'hi', 'ἴ': 'i', 'ἵ': 'hi', 'ἶ': 'i', 'ἷ': 'hi',
    'ὀ': 'o', 'ὁ': 'ho', '': 'o', 'ὃ': 'ho', 'ὄ': 'o', 'ὅ': 'ho',
    'ὐ': 'y', 'ὑ': 'hy', 'ὒ': 'y', 'ὓ': 'hy', 'ὔ': 'y', 'ὕ': 'hy', 'ὖ': 'y', 'ὗ': 'hy',
    'ὠ': 'o', 'ὡ': 'ho', 'ὢ': 'o', 'ὣ': 'ho', 'ὤ': 'o', 'ὥ': 'ho', 'ὦ': 'o', 'ὧ': 'ho',
    'ά': 'a', 'έ': 'e', 'ή': 'e', 'ί': 'i', 'ό': 'o', 'ύ': 'y', 'ώ': 'o',
    'ὰ': 'a', 'ὲ': 'e', 'ὴ': 'e', 'ὶ': 'i', 'ὸ': 'o', 'ὺ': 'y', 'ὼ': 'o',
    'ᾶ': 'a', 'ῆ': 'e', 'ῖ': 'i', 'ῦ': 'y', 'ῶ': 'o'
  };

  return text.split('').map(char => {
    const mapped = map[char];
    if (mapped) return mapped;
    const normalized = char.normalize('NFD').replace(/[\u0300-\u036f]/g, "");
    return map[normalized] || normalized;
  }).join('');
}

// --- DECODEURS MORPHOLOGIQUES ---
function buildGreekMorphologyDesc(attr: Record<string, string>): string {
  const parts: string[] = [];
  if (attr.class) {
    parts.push(attr.class.charAt(0).toUpperCase() + attr.class.slice(1));
  }
  if (attr.person) parts.push(`${attr.person} person`);
  if (attr.tense) parts.push(attr.tense);
  if (attr.voice) parts.push(attr.voice);
  if (attr.mood) parts.push(attr.mood);
  if (attr.case) parts.push(attr.case);
  if (attr.gender) parts.push(attr.gender);
  if (attr.number) parts.push(attr.number);
  return parts.join(', ');
}

function decodeHebrewMorphology(morph: string): string {
  if (!morph) return "";
  const parts = morph.split('/');
  return parts.map(part => {
    let p = part;
    if (p.startsWith('H')) p = p.substring(1);
    if (p.startsWith('A')) p = p.substring(1);
    if (!p) return "";

    const posChar = p.charAt(0);
    let desc = "";
    switch (posChar) {
      case 'N': desc = "Noun"; break;
      case 'V': desc = "Verb"; break;
      case 'A': desc = "Adjective"; break;
      case 'd': desc = "Definite article"; break;
      case 'p': desc = "Preposition"; break;
      case 'c': desc = "Conjunction"; break;
      case 'T': desc = "Particle"; break;
      case 'R': desc = "Pronoun"; break;
      case 'S': desc = "Suffix"; break;
      default: desc = "Other";
    }

    const details: string[] = [];
    if (posChar === 'V' && p.length >= 3) {
      const stemChar = p.charAt(1);
      const aspectChar = p.charAt(2);
      switch (stemChar) {
        case 'q': details.push("Qal"); break;
        case 'n': details.push("Niphal"); break;
        case 'p': details.push("Piel"); break;
        case 'P': details.push("Pual"); break;
        case 'h': details.push("Hiphil"); break;
        case 'H': details.push("Hophal"); break;
        case 't': details.push("Hithpael"); break;
      }
      switch (aspectChar) {
        case 'p': details.push("Perfect"); break;
        case 'q': details.push("Sequential Perfect"); break;
        case 'i': details.push("Imperfect"); break;
        case 'w': details.push("Wayyiqtol (Sequential Imperfect)"); break;
        case 'h': details.push("Cohortative"); break;
        case 'j': details.push("Jussive"); break;
        case 'v': details.push("Imperative"); break;
        case 'r': details.push("Participle active"); break;
        case 's': details.push("Participle passive"); break;
        case 'a': details.push("Infinitive absolute"); break;
        case 'c': details.push("Infinitive construct"); break;
      }
      if (p.length >= 4) {
        const pers = p.charAt(3);
        if (pers === '1') details.push("1st person");
        if (pers === '2') details.push("2nd person");
        if (pers === '3') details.push("3rd person");
      }
      if (p.length >= 5) {
        const gen = p.charAt(4);
        if (gen === 'm') details.push("masculine");
        if (gen === 'f') details.push("feminine");
        if (gen === 'c') details.push("common");
      }
      if (p.length >= 6) {
        const num = p.charAt(5);
        if (num === 's') details.push("singular");
        if (num === 'p') details.push("plural");
        if (num === 'd') details.push("dual");
      }
    } else if (posChar === 'N' && p.length >= 2) {
      for (let j = 1; j < p.length; j++) {
        const c = p.charAt(j);
        switch (c) {
          case 'c': details.push("common"); break;
          case 'p': details.push("proper"); break;
          case 'm': details.push("masculine"); break;
          case 'f': details.push("feminine"); break;
          case 's': details.push("singular"); break;
          case 'd': details.push("dual"); break;
          case 'p': details.push("plural"); break;
          case 'a': details.push("absolute"); break;
          case 'c': details.push("construct"); break;
        }
      }
    }
    return details.length > 0 ? `${desc} (${details.join(', ')})` : desc;
  }).filter(Boolean).join(' / ');
}

// --- UTILS DE TELECHARGEMENT ---
function downloadData(url: string): Promise<string> {
  return new Promise((resolve, reject) => {
    https.get(url, (res) => {
      if (res.statusCode !== 200) {
        reject(new Error(`HTTP status code ${res.statusCode} for ${url}`));
        return;
      }
      let data = "";
      res.on("data", (chunk) => { data += chunk; });
      res.on("end", () => { resolve(data); });
    }).on("error", reject);
  });
}

// --- PARSING ---
function parseAttributes(attrStr: string): Record<string, string> {
  const attributes: Record<string, string> = {};
  const regex = /(\w+)="([^"]*)"/g;
  let match;
  while ((match = regex.exec(attrStr)) !== null) {
    attributes[match[1]] = match[2];
  }
  return attributes;
}

async function main() {
  console.log("=== Début du Seed Morphologique Macula (Hébreu + Grec) ===\n");

  // 1. SEED GREC : Évangile de Jean (Livre 43)
  console.log("--- PARTIE GRECQUE : Évangile de Jean ---");
  const greekUrl = 'https://raw.githubusercontent.com/Clear-Bible/macula-greek/main/Nestle1904/lowfat/04-john.xml';
  console.log(`Téléchargement de : ${greekUrl}...`);
  
  let greekData: string;
  try {
    greekData = await downloadData(greekUrl);
    console.log("Téléchargement du grec réussi !");
  } catch (err: any) {
    console.error("Échec du téléchargement du grec :", err.message);
    process.exit(1);
  }

  const greekWords: any[] = [];
  const greekWordRegex = /<w\s+([^>]+)>([^<]+)<\/w>/g;
  let greekMatch;
  let greekCount = 0;

  while ((greekMatch = greekWordRegex.exec(greekData)) !== null) {
    const attrStr = greekMatch[1];
    const text = greekMatch[2].trim();
    const attr = parseAttributes(attrStr);

    if (attr.ref) {
      // ref format: JHN 1:1!3
      const refMatch = attr.ref.match(/JHN\s+(\d+):(\d+)!(\d+)/);
      if (refMatch) {
        const chapter = parseInt(refMatch[1], 10);
        const verse = parseInt(refMatch[2], 10);
        const wordPosition = parseInt(refMatch[3], 10);

        let strong = attr.strong || "";
        if (strong && !strong.startsWith('G')) {
          strong = 'G' + strong;
        }

        const morphologyDesc = buildGreekMorphologyDesc(attr);
        const translitteration = transliterateGreek(text);

        greekWords.push({
          book: 43,
          chapter,
          verse,
          wordPosition,
          originalText: text,
          transliteration: translitteration,
          strongNumber: strong || null,
          root: attr.lemma || null,
          morphology: attr.morph || null,
          morphologyDesc: morphologyDesc || null,
          gloss: attr.gloss || null
        });

        greekCount++;
      }
    }
  }

  console.log(`Nombre de mots grecs parsés : ${greekCount}`);
  
  // Insertion en base par lots de 500
  console.log("Insertion des mots grecs en base...");
  let insertedGreek = 0;
  for (let i = 0; i < greekWords.length; i += 500) {
    const batch = greekWords.slice(i, i + 500);
    const result = await prisma.greekWord.createMany({
      data: batch,
      skipDuplicates: true
    });
    insertedGreek += result.count;
  }
  console.log(`✅ ${insertedGreek} mots grecs insérés.`);

  // 2. SEED HÉBREU : Genèse (Livre 1)
  console.log("\n--- PARTIE HÉBRAÏQUE : Genèse ---");
  const hebrewUrl = 'https://raw.githubusercontent.com/openscriptures/morphhb/master/wlc/Gen.xml';
  console.log(`Téléchargement de : ${hebrewUrl}...`);

  let hebrewData: string;
  try {
    hebrewData = await downloadData(hebrewUrl);
    console.log("Téléchargement de l'hébreu réussi !");
  } catch (err: any) {
    console.error("Échec du téléchargement de l'hébreu :", err.message);
    process.exit(1);
  }

  const hebrewWords: any[] = [];
  const verseRegex = /<verse osisID="Gen\.(\d+)\.(\d+)">([\s\S]+?)<\/verse>/g;
  let verseMatch;
  let hebrewCount = 0;

  while ((verseMatch = verseRegex.exec(hebrewData)) !== null) {
    const chapter = parseInt(verseMatch[1], 10);
    const verse = parseInt(verseMatch[2], 10);
    const verseContent = verseMatch[3];

    const wordRegex = /<w\s+([^>]+)>([^<]+)<\/w>/g;
    let wordMatch;
    let position = 1;

    while ((wordMatch = wordRegex.exec(verseContent)) !== null) {
      const attrStr = wordMatch[1];
      const text = wordMatch[2].trim();
      const attr = parseAttributes(attrStr);

      let strong = attr.lemma || "";
      // Nettoyage de lemma pour en faire un Strong hébreu
      // ex: lemma="c/7200" -> H7200, lemma="430" -> H430
      if (strong) {
        const parts = strong.split('/');
        const lastPart = parts[parts.length - 1];
        const numPart = lastPart.replace(/[a-zA-Z]/g, '').trim();
        if (numPart && !isNaN(parseInt(numPart, 10))) {
          strong = 'H' + numPart;
        } else {
          strong = "";
        }
      }

      const morphDesc = decodeHebrewMorphology(attr.morph || "");

      hebrewWords.push({
        book: 1,
        chapter,
        verse,
        wordPosition: position,
        originalText: text,
        transliteration: null, // Translittération hébraïque non MVP
        strongNumber: strong || null,
        root: attr.lemma ? attr.lemma.split('/').pop() : null,
        morphology: attr.morph || null,
        morphologyDesc: morphDesc || null,
        gloss: null // Non disponible dans morphhb direct
      });

      position++;
      hebrewCount++;
    }
  }

  console.log(`Nombre de mots hébreux parsés : ${hebrewCount}`);

  // Insertion en base par lots de 500
  console.log("Insertion des mots hébreux en base...");
  let insertedHebrew = 0;
  for (let i = 0; i < hebrewWords.length; i += 500) {
    const batch = hebrewWords.slice(i, i + 500);
    const result = await prisma.hebrewWord.createMany({
      data: batch,
      skipDuplicates: true
    });
    insertedHebrew += result.count;
  }
  console.log(`✅ ${insertedHebrew} mots hébreux insérés.`);

  console.log("\n==================================================");
  console.log("=== Fin du Seed Macula & MorphHB ===");
  console.log(`Grec (Jean) insérés    : ${insertedGreek}`);
  console.log(`Hébreu (Genèse) insérés : ${insertedHebrew}`);
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
