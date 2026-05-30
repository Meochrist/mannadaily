import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function isBuildTime(): boolean {
  return process.env.NEXT_PHASE === "phase-production-build";
}

export const XP_LEVELS = [
  { xpRequired: 5000, level: 7, name: "Lumière" },
  { xpRequired: 2000, level: 6, name: "Apôtre" },
  { xpRequired: 1000, level: 5, name: "Prophète" },
  { xpRequired: 600, level: 4, name: "Berger" },
  { xpRequired: 300, level: 3, name: "Arbre" },
  { xpRequired: 100, level: 2, name: "Pousse" },
  { xpRequired: 0, level: 1, name: "Semence" },
];

export function getLevelFromXP(xp: number) {
  for (const levelObj of XP_LEVELS) {
    if (xp >= levelObj.xpRequired) {
      return {
        level: levelObj.level,
        name: levelObj.name,
        xpRequired: levelObj.xpRequired,
      };
    }
  }
  return { level: 1, name: "Semence", xpRequired: 0 };
}

export function getXPProgress(xp: number): number {
  const current = getLevelFromXP(xp);
  const nextLevelIndex = XP_LEVELS.findIndex((l) => l.level === current.level) - 1;
  
  if (nextLevelIndex < 0) {
    return 100;
  }
  
  const next = XP_LEVELS[nextLevelIndex];
  const range = next.xpRequired - current.xpRequired;
  if (range <= 0) return 0;
  
  const progress = ((xp - current.xpRequired) / range) * 100;
  return Math.min(100, Math.max(0, Math.round(progress)));
}
