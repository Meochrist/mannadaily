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

// --- LISTE DES LIVRES ---
const otBooks = [
  { file: "Gen.xml", num: 1 },
  { file: "Exod.xml", num: 2 },
  { file: "Lev.xml", num: 3 },
  { file: "Num.xml", num: 4 },
  { file: "Deut.xml", num: 5 },
  { file: "Josh.xml", num: 6 },
  { file: "Judg.xml", num: 7 },
  { file: "Ruth.xml", num: 8 },
  { file: "1Sam.xml", num: 9 },
  { file: "2Sam.xml", num: 10 },
  { file: "1Kgs.xml", num: 11 },
  { file: "2Kgs.xml", num: 12 },
  { file: "1Chr.xml", num: 13 },
  { file: "2Chr.xml", num: 14 },
  { file: "Ezra.xml", num: 15 },
  { file: "Neh.xml", num: 16 },
  { file: "Esth.xml", num: 17 },
  { file: "Job.xml", num: 18 },
  { file: "Ps.xml", num: 19 },
  { file: "Prov.xml", num: 20 },
  { file: "Eccl.xml", num: 21 },
  { file: "Song.xml", num: 22 },
  { file: "Isa.xml", num: 23 },
  { file: "Jer.xml", num: 24 },
  { file: "Lam.xml", num: 25 },
  { file: "Ezek.xml", num: 26 },
  { file: "Dan.xml", num: 27 },
  { file: "Hos.xml", num: 28 },
  { file: "Joel.xml", num: 29 },
  { file: "Amos.xml", num: 30 },
  { file: "Obad.xml", num: 31 },
  { file: "Jonah.xml", num: 32 },
  { file: "Mic.xml", num: 33 },
  { file: "Nah.xml", num: 34 },
  { file: "Hab.xml", num: 35 },
  { file: "Zeph.xml", num: 36 },
  { file: "Hag.xml", num: 37 },
  { file: "Zech.xml", num: 38 },
  { file: "Mal.xml", num: 39 }
];

const ntBooks = [
  { file: "61-Mt-morphgnt.txt", num: 40 },
  { file: "62-Mk-morphgnt.txt", num: 41 },
  { file: "63-Lk-morphgnt.txt", num: 42 },
  { file: "64-Jn-morphgnt.txt", num: 43 },
  { file: "65-Ac-morphgnt.txt", num: 44 },
  { file: "66-Ro-morphgnt.txt", num: 45 },
  { file: "67-1Co-morphgnt.txt", num: 46 },
  { file: "68-2Co-morphgnt.txt", num: 47 },
  { file: "69-Ga-morphgnt.txt", num: 48 },
  { file: "70-Eph-morphgnt.txt", num: 49 },
  { file: "71-Php-morphgnt.txt", num: 50 },
  { file: "72-Col-morphgnt.txt", num: 51 },
  { file: "73-1Th-morphgnt.txt", num: 52 },
  { file: "74-2Th-morphgnt.txt", num: 53 },
  { file: "75-1Ti-morphgnt.txt", num: 54 },
  { file: "76-2Ti-morphgnt.txt", num: 55 },
  { file: "77-Tit-morphgnt.txt", num: 56 },
  { file: "78-Phm-morphgnt.txt", num: 57 },
  { file: "79-Heb-morphgnt.txt", num: 58 },
  { file: "80-Jas-morphgnt.txt", num: 59 },
  { file: "81-1Pe-morphgnt.txt", num: 60 },
  { file: "82-2Pe-morphgnt.txt", num: 61 },
  { file: "83-1Jn-morphgnt.txt", num: 62 },
  { file: "84-2Jn-morphgnt.txt", num: 63 },
  { file: "85-3Jn-morphgnt.txt", num: 64 },
  { file: "86-Jud-morphgnt.txt", num: 65 },
  { file: "87-Re-morphgnt.txt", num: 66 }
];

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
function decodeGreekMorphology(pos: string, parseCode: string): string {
  const details: string[] = [];
  
  const posMap: Record<string, string> = {
    "A-": "Adjective",
    "C-": "Conjunction",
    "D-": "Adverb",
    "I-": "Interjection",
    "N-": "Noun",
    "P-": "Preposition",
    "RA": "Definite Article",
    "RD": "Demonstrative Pronoun",
    "RI": "Interrogative/Indefinite Pronoun",
    "RP": "Personal Pronoun",
    "RR": "Relative Pronoun",
    "V-": "Verb",
    "X-": "Particle"
  };
  
  const posDesc = posMap[pos] || pos;
  details.push(posDesc);

  if (parseCode && parseCode.length >= 8) {
    const p1 = parseCode.charAt(0);
    const p2 = parseCode.charAt(1);
    const p3 = parseCode.charAt(2);
    const p4 = parseCode.charAt(3);
    const p5 = parseCode.charAt(4);
    const p6 = parseCode.charAt(5);
    const p7 = parseCode.charAt(6);
    const p8 = parseCode.charAt(7);

    if (pos === "V-") {
      const tenseMap: Record<string, string> = {
        P: "Present", I: "Imperfect", F: "Future", A: "Aorist", X: "Perfect", Y: "Pluperfect"
      };
      const voiceMap: Record<string, string> = {
        A: "Active", M: "Middle", P: "Passive"
      };
      const moodMap: Record<string, string> = {
        I: "Indicative", D: "Imperative", S: "Subjunctive", O: "Optative", N: "Infinitive", P: "Participle"
      };

      if (p1 !== '-') details.push(`${p1} person`);
      if (tenseMap[p2]) details.push(tenseMap[p2]);
      if (voiceMap[p3]) details.push(voiceMap[p3]);
      if (moodMap[p4]) details.push(moodMap[p4]);

      const numMap: Record<string, string> = { S: "Singular", P: "Plural" };

      if (p4 === 'P') {
        const caseMap: Record<string, string> = { N: "Nominative", G: "Genitive", D: "Dative", A: "Accusative" };
        const genMap: Record<string, string> = { M: "Masculine", F: "Feminine", N: "Neuter" };

        if (caseMap[p5]) details.push(caseMap[p5]);
        if (numMap[p6]) details.push(numMap[p6]);
        if (genMap[p7]) details.push(genMap[p7]);
      } else {
        if (numMap[p5]) details.push(numMap[p5]);
        if (numMap[p6]) details.push(numMap[p6]);
      }
    } else {
      const caseMap: Record<string, string> = { N: "Nominative", G: "Genitive", D: "Dative", A: "Accusative" };
      const numMap: Record<string, string> = { S: "Singular", P: "Plural" };
      const genMap: Record<string, string> = { M: "Masculine", F: "Feminine", N: "Neuter" };
      const degMap: Record<string, string> = { C: "Comparative", S: "Superlative" };

      if (caseMap[p5]) details.push(caseMap[p5]);
      if (numMap[p6]) details.push(numMap[p6]);
      if (genMap[p7]) details.push(genMap[p7]);
      if (degMap[p8]) details.push(degMap[p8]);
    }
  }

  return details.join(", ");
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
  console.log("=== Début du Seed Morphologique Complet (Hébreu + Grec) ===\n");

  let totalOtMots = 0;
  let otBooksSeeded = 0;

  // 1. SEED ANCIEN TESTAMENT (AT)
  console.log("--- PARTIE HÉBRAÏQUE : ANCIEN TESTAMENT (39 Livres) ---");
  for (const book of otBooks) {
    // Éviter le re-seed s'il y a déjà des données pour ce livre
    const existingCount = await prisma.hebrewWord.count({ where: { book: book.num } });
    if (existingCount > 0) {
      console.log(`[AT] ⏩ Livre ${book.file} (${book.num}) déjà présent en base (${existingCount} mots). Saut.`);
      totalOtMots += existingCount;
      otBooksSeeded++;
      continue;
    }

    const url = `https://raw.githubusercontent.com/openscriptures/morphhb/master/wlc/${book.file}`;
    console.log(`[AT] Téléchargement de : ${book.file} (${book.num}/39)...`);
    
    let xmlData: string;
    try {
      xmlData = await downloadData(url);
    } catch (err: any) {
      console.error(`[AT] ⚠️ Saut de ${book.file} (404 ou erreur) :`, err.message);
      await new Promise(resolve => setTimeout(resolve, 100));
      continue;
    }

    try {
      const hebrewWords: any[] = [];
      const verseRegex = /<verse osisID="([^.]+)\.(\d+)\.(\d+)">([\s\S]+?)<\/verse>/g;
      let verseMatch;
      let wordCount = 0;

      while ((verseMatch = verseRegex.exec(xmlData)) !== null) {
        const chapter = parseInt(verseMatch[2], 10);
        const verse = parseInt(verseMatch[3], 10);
        const verseContent = verseMatch[4];

        const wordRegex = /<w\s+([^>]+)>([^<]+)<\/w>/g;
        let wordMatch;
        let position = 1;

        while ((wordMatch = wordRegex.exec(verseContent)) !== null) {
          const attrStr = wordMatch[1];
          const text = wordMatch[2].trim();
          const attr = parseAttributes(attrStr);

          let strong = attr.lemma || "";
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
            book: book.num,
            chapter,
            verse,
            wordPosition: position,
            originalText: text,
            transliteration: null,
            strongNumber: strong || null,
            root: attr.lemma ? attr.lemma.split('/').pop() : null,
            morphology: attr.morph || null,
            morphologyDesc: morphDesc || null,
            gloss: null
          });

          position++;
          wordCount++;
        }
      }

      // Insertion en base par lots de 500
      let inserted = 0;
      for (let i = 0; i < hebrewWords.length; i += 500) {
        const batch = hebrewWords.slice(i, i + 500);
        const result = await prisma.hebrewWord.createMany({
          data: batch,
          skipDuplicates: true
        });
        inserted += result.count;
      }

      console.log(`[AT] ✅ ${book.file} : ${wordCount} mots trouvés, ${inserted} insérés en base.`);
      totalOtMots += inserted;
      otBooksSeeded++;
    } catch (err: any) {
      console.error(`[AT] ❌ Erreur lors du parsing de ${book.file} :`, err.message);
    }

    // Pause de 100ms
    await new Promise(resolve => setTimeout(resolve, 100));
  }

  // 2. SEED NOUVEAU TESTAMENT (NT)
  let totalNtMots = 0;
  let ntBooksSeeded = 0;

  console.log("\n--- PARTIE GRECQUE : NOUVEAU TESTAMENT (27 Livres) ---");
  for (const book of ntBooks) {
    // Éviter le re-seed s'il y a déjà des données pour ce livre
    const existingCount = await prisma.greekWord.count({ where: { book: book.num } });
    if (existingCount > 0) {
      console.log(`[NT] ⏩ Livre ${book.file} (${book.num}) déjà présent en base (${existingCount} mots). Saut.`);
      totalNtMots += existingCount;
      ntBooksSeeded++;
      continue;
    }

    const url = `https://raw.githubusercontent.com/morphgnt/sblgnt/master/${book.file}`;
    console.log(`[NT] Téléchargement de : ${book.file} (${book.num}/66)...`);

    let txtData: string;
    try {
      txtData = await downloadData(url);
    } catch (err: any) {
      console.error(`[NT] ⚠️ Saut de ${book.file} (404 ou erreur) :`, err.message);
      await new Promise(resolve => setTimeout(resolve, 100));
      continue;
    }

    try {
      const greekWords: any[] = [];
      const lines = txtData.split(/\r?\n/);
      let lastRef = "";
      let wordPosition = 1;
      let wordCount = 0;

      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed) continue;

        const parts = trimmed.split(/\s+/);
        if (parts.length < 7) continue;

        const ref = parts[0];
        if (ref !== lastRef) {
          wordPosition = 1;
          lastRef = ref;
        }

        const chapter = parseInt(ref.substring(2, 4), 10);
        const verse = parseInt(ref.substring(4, 6), 10);
        const pos = parts[1];
        const parseCode = parts[2];
        const text = parts[3];
        const lemma = parts[6];

        const morphologyDesc = decodeGreekMorphology(pos, parseCode);
        const translitteration = transliterateGreek(text);

        greekWords.push({
          book: book.num,
          chapter,
          verse,
          wordPosition: wordPosition,
          originalText: text,
          transliteration: translitteration,
          strongNumber: null,
          root: lemma || null,
          morphology: parseCode || null,
          morphologyDesc: morphologyDesc || null,
          gloss: null
        });

        wordPosition++;
        wordCount++;
      }

      // Insertion en base par lots de 500
      let inserted = 0;
      for (let i = 0; i < greekWords.length; i += 500) {
        const batch = greekWords.slice(i, i + 500);
        const result = await prisma.greekWord.createMany({
          data: batch,
          skipDuplicates: true
        });
        inserted += result.count;
      }

      console.log(`[NT] ✅ ${book.file} : ${wordCount} mots trouvés, ${inserted} insérés en base.`);
      totalNtMots += inserted;
      ntBooksSeeded++;
    } catch (err: any) {
      console.error(`[NT] ❌ Erreur lors du parsing de ${book.file} :`, err.message);
    }

    // Pause de 100ms
    await new Promise(resolve => setTimeout(resolve, 100));
  }

  console.log("\n==================================================");
  console.log("=== Résumé du Seed Morphologique Complet ===");
  console.log(`Testament  | Livres seedés | Mots insérés/total`);
  console.log(`-----------|---------------|-------------------`);
  console.log(`AT         | ${otBooksSeeded}/39          | ${totalOtMots}`);
  console.log(`NT         | ${ntBooksSeeded}/27          | ${totalNtMots}`);
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
