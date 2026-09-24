import { LEVELS } from "@/types";

export interface LevelResult {
  level: number;
  name: string;
  xpRequired: number;
  xpNext: number | null;
}

export function getLevelFromXP(xp: number): LevelResult {
  const sortedLevels = [...LEVELS].sort((a, b) => b.level - a.level);
  const currentLevelObj = sortedLevels.find((l) => xp >= l.xpRequired) || LEVELS[0];
  const nextLevelObj = LEVELS.find((l) => l.level === currentLevelObj.level + 1) || null;

  return {
    level: currentLevelObj.level,
    name: currentLevelObj.name,
    xpRequired: currentLevelObj.xpRequired,
    xpNext: nextLevelObj ? nextLevelObj.xpRequired : null,
  };
}

export function getXPProgress(xp: number): number {
  const current = getLevelFromXP(xp);

  if (current.xpNext === null) {
    return 100;
  }

  const range = current.xpNext - current.xpRequired;
  if (range <= 0) return 0;

  const progress = ((xp - current.xpRequired) / range) * 100;
  return Math.min(100, Math.max(0, Math.round(progress)));
}
