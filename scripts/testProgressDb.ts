/**
 * Test REEL de la persistance en base : ecrit une progression pour un
 * utilisateur, la relit, et verifie qu'elle survit.
 *
 * Reproduit exactement ce que fait l'API POST puis GET /api/meditate/progress.
 */
process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import pg from "pg";
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

const today = () => new Date().toISOString().slice(0, 10);

async function main() {
  const email = process.env.ADMIN_EMAILS?.split(",")[0]?.trim() || "romeovodounon1@gmail.com";
  const user = await db.user.findUnique({ where: { email }, select: { id: true, meditationProgress: true } });

  if (!user) {
    console.log(`Utilisateur ${email} introuvable.`);
    return;
  }

  console.log(`Utilisateur : ${email}`);
  console.log(`Progression ACTUELLE en base :`);
  console.log(`  ${JSON.stringify(user.meditationProgress)}`);
  console.log(`  (aujourd'hui = ${today()})\n`);

  const before = user.meditationProgress;

  // Simule : mini-session 1, ecran 2, rien encore valide
  const inProgress = {
    currentMiniSession: 1,
    currentStep: 1,
    sessionsCompleted: [] as number[],
    lastActivityDate: today(),
    dayCompleted: false,
  };

  console.log("ECRITURE d'une mini-session en cours (mini 1, ecran 2)...");
  await db.user.update({ where: { id: user.id }, data: { meditationProgress: inProgress } });

  const reread = await db.user.findUnique({ where: { id: user.id }, select: { meditationProgress: true } });
  const after = reread?.meditationProgress as Record<string, unknown> | null;
  console.log(`RELECTURE : ${JSON.stringify(after)}`);

  const ok =
    after &&
    after.currentMiniSession === 1 &&
    after.currentStep === 1 &&
    Array.isArray(after.sessionsCompleted) &&
    after.sessionsCompleted.length === 0 &&
    after.lastActivityDate === today();

  console.log(ok ? "\nOK : la base conserve bien la mini-session en cours." : "\nECHEC : la base ne conserve pas l'etat.");

  // Restauration de l'etat initial pour ne rien casser
  await db.user.update({
    where: { id: user.id },
    data: { meditationProgress: before === null ? undefined : (before as object) },
  });
  console.log("Etat initial restaure.");
}

main()
  .catch((e) => {
    console.error("Erreur :", e.message);
    process.exit(1);
  })
  .finally(async () => {
    await db.$disconnect();
    await pool.end();
  });
