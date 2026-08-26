export {}; // module isolé — évite les collisions de portée globale entre scripts
/**
 * Reproduit FIDELEMENT le useEffect de chargement de /meditate pour
 * identifier pourquoi la reprise repart du debut.
 *
 * On simule localStorage + l'API et on rejoue les scenarios d'entree
 * reels (liens du tableau de bord, de la carte, acces direct).
 */

const TODAY = new Date().toISOString().split("T")[0];

// ---- Simulation de localStorage ----
const store: Record<string, string> = {};
const localStorageMock = {
  getItem: (k: string) => store[k] ?? null,
  setItem: (k: string, v: string) => { store[k] = v; },
  removeItem: (k: string) => { delete store[k]; },
};

interface Progress {
  currentMiniSession: number;
  currentStep: number;
  sessionsCompleted: number[];
  lastActivityDate: string;
  dayCompleted: boolean;
}

// ---- normalizeProgress : copie de la route API (avec garde-fou) ----
function normalizeProgress(input: Record<string, unknown>, activityDate: string): Progress {
  const rawSessions = Array.isArray(input.sessionsCompleted) ? input.sessionsCompleted : [];
  const sessionsCompleted = [...new Set(rawSessions.filter(
    (v): v is number => typeof v === "number" && Number.isInteger(v) && v >= 1 && v <= 3
  ))].sort((a, b) => a - b);
  const rawStep = typeof input.currentStep === "number" && Number.isInteger(input.currentStep)
    ? Math.max(0, Math.min(1, input.currentStep)) : 0;
  const minMini = Math.min(3, sessionsCompleted.length + 1);
  const rawMini = typeof input.currentMiniSession === "number" && [1, 2, 3].includes(input.currentMiniSession)
    ? input.currentMiniSession : minMini;
  const currentMiniSession = Math.max(rawMini, minMini);
  const currentStep = currentMiniSession === rawMini ? rawStep : 0;
  return { currentMiniSession, currentStep, sessionsCompleted, lastActivityDate: activityDate, dayCompleted: sessionsCompleted.length === 3 };
}

// ---- La "base de donnees" ----
let dbProgress: Progress | null = null;

function apiGet(): Progress | null {
  if (!dbProgress) return null;
  if (dbProgress.lastActivityDate !== TODAY) return null;
  return normalizeProgress(dbProgress as unknown as Record<string, unknown>, TODAY);
}

// ---- loadFromSessionStorage (desormais localStorage) ----
function loadFromLocal(): Progress | null {
  const saved = localStorageMock.getItem("manna_meditate_progress");
  if (!saved) return null;
  try {
    const parsed = JSON.parse(saved);
    if (parsed.lastActivityDate !== TODAY) return null;
    return parsed;
  } catch { return null; }
}

// ---- Reproduction du useEffect de chargement ----
interface LoadResult {
  miniSession: number;
  step: number;
  sessions: number[];
  isDayDone: boolean;
  path: string;
}

function loadProgress(urlParams: Record<string, string>): LoadResult {
  const fresh = urlParams.fresh === "true";
  const today = TODAY;

  const local = loadFromLocal();
  const sameDayLocal = local && local.lastActivityDate === today ? local : null;
  const stored = sameDayLocal ?? apiGet();
  const sameDay = stored && stored.lastActivityDate === today ? stored : null;
  const doneToday = sameDay && Array.isArray(sameDay.sessionsCompleted) ? sameDay.sessionsCompleted : [];
  const dayIsComplete = Boolean(sameDay?.dayCompleted) || doneToday.length >= 3;

  const dayInProgress =
    !dayIsComplete &&
    Boolean(sameDay) &&
    (doneToday.length > 0 ||
      (sameDay!.currentMiniSession ?? 1) > 1 ||
      (sameDay!.currentStep ?? 0) > 0);

  if (fresh && !dayInProgress) {
    return { miniSession: 1, step: 0, sessions: doneToday, isDayDone: false, path: "RESET (fresh, journee non entamee)" };
  }

  if (sameDay) {
    if (sameDay.dayCompleted) {
      return { miniSession: sameDay.currentMiniSession, step: sameDay.currentStep, sessions: sameDay.sessionsCompleted, isDayDone: true, path: "ECRAN JOURNEE TERMINEE" };
    }
    return { miniSession: sameDay.currentMiniSession, step: sameDay.currentStep, sessions: sameDay.sessionsCompleted, isDayDone: false, path: "REPRISE" };
  }

  return { miniSession: 1, step: 0, sessions: [], isDayDone: false, path: "AUCUN ETAT -> depart a zero" };
}

// ---- SCENARIOS ----
console.log(`Date du test : ${TODAY}\n`);

interface Scenario {
  label: string;
  db: Progress | null;
  local: Progress | null;
  url: Record<string, string>;
  expectMini: number;
  expectStep: number;
}

const inProgressMini2: Progress = {
  currentMiniSession: 2, currentStep: 1, sessionsCompleted: [1],
  lastActivityDate: TODAY, dayCompleted: false,
};

const scenarios: Scenario[] = [
  {
    label: "Bouton tableau de bord (text+reference+theme, SANS fresh) — onglet ferme, localStorage vide",
    db: inProgressMini2, local: null,
    url: { period: "midday", text: "Le%20verset", reference: "Jean%203:16", theme: "amour" },
    expectMini: 2, expectStep: 1,
  },
  {
    label: "Bouton tableau de bord — localStorage encore present",
    db: inProgressMini2, local: inProgressMini2,
    url: { period: "midday", text: "Le%20verset", reference: "Jean%203:16", theme: "amour" },
    expectMini: 2, expectStep: 1,
  },
  {
    label: "Acces direct /meditate (aucun parametre)",
    db: inProgressMini2, local: null,
    url: {},
    expectMini: 2, expectStep: 1,
  },
  {
    label: "BUG SIGNALE : lien CARTE (fresh=true) avec mini 1 DEJA finie -> doit REPRENDRE",
    db: inProgressMini2, local: null,
    url: { text: "Autre", pathId: "foi", level: "3", fresh: "true" },
    expectMini: 2, expectStep: 1,
  },
  {
    label: "Lien CARTE (fresh=true) journee NON entamee -> reset legitime",
    db: null, local: null,
    url: { text: "Autre", pathId: "foi", level: "3", fresh: "true" },
    expectMini: 1, expectStep: 0,
  },
  {
    label: "Lien CARTE (fresh=true) journee COMPLETE -> nouveau verset bonus",
    db: { currentMiniSession: 3, currentStep: 1, sessionsCompleted: [1, 2, 3], lastActivityDate: TODAY, dayCompleted: true },
    local: null,
    url: { text: "Autre", pathId: "foi", level: "3", fresh: "true" },
    expectMini: 1, expectStep: 0,
  },
  {
    label: "Lien CARTE (fresh=true) mini 1 entamee (ecran 2) mais rien valide -> REPRENDRE",
    db: { currentMiniSession: 1, currentStep: 1, sessionsCompleted: [], lastActivityDate: TODAY, dayCompleted: false },
    local: null,
    url: { text: "Autre", pathId: "foi", fresh: "true" },
    expectMini: 1, expectStep: 1,
  },
  {
    label: "Etat corrompu en base (mini 1 alors que [1,2] validees)",
    db: { currentMiniSession: 1, currentStep: 1, sessionsCompleted: [1, 2], lastActivityDate: TODAY, dayCompleted: false },
    local: null,
    url: { period: "evening", text: "Le%20verset", reference: "Jean%203:16", theme: "amour" },
    expectMini: 3, expectStep: 0,
  },
  {
    label: "Progression de la VEILLE en base — doit repartir a zero",
    db: { currentMiniSession: 2, currentStep: 1, sessionsCompleted: [1], lastActivityDate: "2020-01-01", dayCompleted: false },
    local: null,
    url: { period: "morning", text: "Le%20verset", reference: "Jean%203:16", theme: "amour" },
    expectMini: 1, expectStep: 0,
  },
];

let pass = 0, fail = 0;

for (const s of scenarios) {
  dbProgress = s.db;
  for (const k of Object.keys(store)) delete store[k];
  if (s.local) localStorageMock.setItem("manna_meditate_progress", JSON.stringify(s.local));

  const r = loadProgress(s.url);
  const ok = r.miniSession === s.expectMini && r.step === s.expectStep;

  if (ok) { pass++; console.log(`OK   ${s.label}`); }
  else { fail++; console.log(`FAIL ${s.label}`); }
  console.log(`     -> mini ${r.miniSession}, ecran ${r.step + 1}, validees=[${r.sessions}]  [${r.path}]`);
  if (!ok) console.log(`     attendu: mini ${s.expectMini}, ecran ${s.expectStep + 1}`);
  console.log();
}

console.log(`=== ${pass} OK / ${fail} echecs ===`);
if (fail > 0) process.exit(1);
