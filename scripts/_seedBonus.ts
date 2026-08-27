process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import pg from "pg";
import bcrypt from "bcryptjs";
import * as fs from "fs";
import * as path from "path";
for (const f of [".env.local", ".env"]) {
  const p = path.join(process.cwd(), f);
  if (!fs.existsSync(p)) continue;
  for (const line of fs.readFileSync(p, "utf-8").split("\n")) {
    const m = line.match(/^\s*([A-Z_][A-Z0-9_]*)\s*=\s*(.*)\s*$/i);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["\']|["\']$/g, "");
  }
}
const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
const db = new PrismaClient({ adapter: new PrismaPg(pool) });

async function main() {
  const today = new Date().toISOString().slice(0, 10);
  const hashed = await bcrypt.hash("TestBonus2026!", 10);
  const progress = {
    currentMiniSession: 3, currentStep: 1,
    sessionsCompleted: [1, 2, 3], lastActivityDate: today, dayCompleted: true,
  };
  const user = await db.user.upsert({
    where: { email: "qa-bonus@mannadaily.test" },
    update: { meditationProgress: progress, password: hashed, onboardingCompleted: true },
    create: { email: "qa-bonus@mannadaily.test", name: "QA Bonus", password: hashed, meditationProgress: progress, onboardingCompleted: true },
    select: { id: true, email: true, meditationProgress: true },
  });
  console.log("Utilisateur :", user.email);
  console.log("Progression  :", JSON.stringify(user.meditationProgress));
  console.log("Mot de passe: TestBonus2026!");
}
main().catch(e => console.error(e.message)).finally(async () => { await db.$disconnect(); await pool.end(); });
