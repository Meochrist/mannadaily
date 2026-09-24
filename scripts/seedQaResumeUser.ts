/**
 * Cree un utilisateur de test avec une progression EN COURS, pour reproduire
 * le bug de reprise dans un vrai navigateur.
 */
process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import pg from "pg";
import bcrypt from "bcryptjs";
import * as fs from "fs";
import * as path from "path";

function loadEnv() {
  for (const f of [".env.local", ".env"]) {
    const p = path.join(process.cwd(), f);
    if (!fs.existsSync(p)) continue;
    for (const line of fs.readFileSync(p, "utf-8").split("\n")) {
      const m = line.match(/^\s*([A-Z_][A-Z0-9_]*)\s*=\s*(.*)\s*$/i);
      if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, "");
    }
  }
}
loadEnv();

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
const db = new PrismaClient({ adapter: new PrismaPg(pool) });

const EMAIL = "qa-resume@mannadaily.test";
const PASSWORD = "TestResume2026!";

async function main() {
  const today = new Date().toISOString().slice(0, 10);
  const hashed = await bcrypt.hash(PASSWORD, 10);

  // Progression EN COURS : mini 2, ecran 2, mini 1 validee
  const progress = {
    currentMiniSession: 2,
    currentStep: 1,
    sessionsCompleted: [1],
    lastActivityDate: today,
    dayCompleted: false,
  };

  const user = await db.user.upsert({
    where: { email: EMAIL },
    update: { meditationProgress: progress, password: hashed },
    create: {
      email: EMAIL,
      name: "QA Resume",
      password: hashed,
      meditationProgress: progress,
    },
    select: { id: true, email: true, meditationProgress: true },
  });

  console.log(`Utilisateur de test : ${user.email}`);
  console.log(`Mot de passe        : ${PASSWORD}`);
  console.log(`Progression posee   : ${JSON.stringify(user.meditationProgress)}`);
  console.log(`\nATTENDU a l'ouverture de /meditate : mini-session 2, ecran 2 (etape 4/6)`);
}

main()
  .catch((e) => { console.error("Erreur :", e.message); process.exit(1); })
  .finally(async () => { await db.$disconnect(); await pool.end(); });
