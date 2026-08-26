/**
 * Repare les progressions incoherentes en base : currentMiniSession
 * anterieure aux mini-sessions deja validees (bug corrige dans
 * handleNextStep + garde-fou serveur).
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

async function main() {
  const users = await db.user.findMany({
    select: { id: true, email: true, meditationProgress: true },
  });

  let fixed = 0;
  for (const u of users) {
    const mp = u.meditationProgress as Record<string, unknown> | null;
    if (!mp || typeof mp !== "object") continue;

    const sessions = Array.isArray(mp.sessionsCompleted)
      ? (mp.sessionsCompleted as unknown[]).filter(
          (v): v is number => typeof v === "number" && v >= 1 && v <= 3
        )
      : [];
    const mini = typeof mp.currentMiniSession === "number" ? mp.currentMiniSession : 1;
    const minMini = Math.min(3, sessions.length + 1);

    if (mini < minMini) {
      const repaired = {
        ...mp,
        currentMiniSession: minMini,
        currentStep: 0,
        dayCompleted: sessions.length === 3,
      };
      await db.user.update({ where: { id: u.id }, data: { meditationProgress: repaired } });
      console.log(`Repare ${u.email} : mini ${mini} -> ${minMini} (validees=[${sessions}])`);
      fixed++;
    }
  }

  console.log(`\n${users.length} utilisateur(s) inspecte(s), ${fixed} repare(s).`);
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
