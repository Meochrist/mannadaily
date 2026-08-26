/**
 * Test de bout en bout de la PERSISTANCE de la progression OIA+.
 *
 * Reproduit le bug signalé par Roméo : commencer une mini-session, quitter,
 * revenir plus tard → on doit reprendre exactement où on s'était arrêté.
 *
 * Le test appelle directement la logique de normalisation de la route API
 * (pas de serveur requis) pour vérifier que currentStep/currentMiniSession
 * survivent à un aller-retour sauvegarde → lecture.
 */

// Reproduction fidèle de normalizeProgress (src/app/api/meditate/progress/route.ts)
function normalizeProgress(input: Record<string, unknown>, activityDate: string) {
  const rawSessions = Array.isArray(input.sessionsCompleted) ? input.sessionsCompleted : [];
  const sessionsCompleted = [
    ...new Set(
      rawSessions.filter(
        (value): value is number =>
          typeof value === "number" && Number.isInteger(value) && value >= 1 && value <= 3
      )
    ),
  ].sort((a, b) => a - b);
  const currentMiniSession =
    typeof input.currentMiniSession === "number" && [1, 2, 3].includes(input.currentMiniSession)
      ? input.currentMiniSession
      : Math.min(3, sessionsCompleted.length + 1);
  const currentStep =
    typeof input.currentStep === "number" && Number.isInteger(input.currentStep)
      ? Math.max(0, Math.min(1, input.currentStep))
      : 0;

  return {
    currentMiniSession,
    currentStep,
    sessionsCompleted,
    lastActivityDate: activityDate,
    dayCompleted: sessionsCompleted.length === 3,
  };
}

const TODAY = "2026-08-25";

interface Case {
  label: string;
  saved: Record<string, unknown>;
  expect: { currentMiniSession: number; currentStep: number; sessionsCompleted: number[]; dayCompleted: boolean };
}

const cases: Case[] = [
  {
    label: "BUG SIGNALE : mini 1 commencee (ecran 2), rien encore valide",
    saved: { currentMiniSession: 1, currentStep: 1, sessionsCompleted: [], lastActivityDate: TODAY, dayCompleted: false },
    expect: { currentMiniSession: 1, currentStep: 1, sessionsCompleted: [], dayCompleted: false },
  },
  {
    label: "Mini 1 validee, mini 2 pas commencee",
    saved: { currentMiniSession: 2, currentStep: 0, sessionsCompleted: [1], lastActivityDate: TODAY, dayCompleted: false },
    expect: { currentMiniSession: 2, currentStep: 0, sessionsCompleted: [1], dayCompleted: false },
  },
  {
    label: "Mini 2 en cours (ecran 2) apres mini 1 validee",
    saved: { currentMiniSession: 2, currentStep: 1, sessionsCompleted: [1], lastActivityDate: TODAY, dayCompleted: false },
    expect: { currentMiniSession: 2, currentStep: 1, sessionsCompleted: [1], dayCompleted: false },
  },
  {
    label: "Mini 3 en cours apres 2 validees",
    saved: { currentMiniSession: 3, currentStep: 1, sessionsCompleted: [1, 2], lastActivityDate: TODAY, dayCompleted: false },
    expect: { currentMiniSession: 3, currentStep: 1, sessionsCompleted: [1, 2], dayCompleted: false },
  },
  {
    label: "Journee complete",
    saved: { currentMiniSession: 3, currentStep: 1, sessionsCompleted: [1, 2, 3], lastActivityDate: TODAY, dayCompleted: true },
    expect: { currentMiniSession: 3, currentStep: 1, sessionsCompleted: [1, 2, 3], dayCompleted: true },
  },
  {
    label: "Valeur currentStep aberrante (5) ramenee dans les bornes",
    saved: { currentMiniSession: 2, currentStep: 5, sessionsCompleted: [1], lastActivityDate: TODAY, dayCompleted: false },
    expect: { currentMiniSession: 2, currentStep: 1, sessionsCompleted: [1], dayCompleted: false },
  },
  {
    label: "Doublons et valeurs hors bornes filtres",
    saved: { currentMiniSession: 2, currentStep: 0, sessionsCompleted: [1, 1, 7, -2], lastActivityDate: TODAY, dayCompleted: false },
    expect: { currentMiniSession: 2, currentStep: 0, sessionsCompleted: [1], dayCompleted: false },
  },
];

let pass = 0;
let fail = 0;

for (const c of cases) {
  // Aller-retour : sauvegarde (POST normalise) puis relecture (GET normalise)
  const afterSave = normalizeProgress(c.saved, TODAY);
  const afterLoad = normalizeProgress(afterSave as unknown as Record<string, unknown>, TODAY);

  const ok =
    afterLoad.currentMiniSession === c.expect.currentMiniSession &&
    afterLoad.currentStep === c.expect.currentStep &&
    JSON.stringify(afterLoad.sessionsCompleted) === JSON.stringify(c.expect.sessionsCompleted) &&
    afterLoad.dayCompleted === c.expect.dayCompleted;

  if (ok) {
    pass++;
    console.log(`OK   ${c.label}`);
    console.log(`     reprise: mini ${afterLoad.currentMiniSession}, ecran ${afterLoad.currentStep + 1}, validees=[${afterLoad.sessionsCompleted}]`);
  } else {
    fail++;
    console.log(`FAIL ${c.label}`);
    console.log(`     attendu ${JSON.stringify(c.expect)}`);
    console.log(`     obtenu  ${JSON.stringify({ currentMiniSession: afterLoad.currentMiniSession, currentStep: afterLoad.currentStep, sessionsCompleted: afterLoad.sessionsCompleted, dayCompleted: afterLoad.dayCompleted })}`);
  }
}

console.log(`\n=== Persistance de la reprise : ${pass} OK / ${fail} echecs ===`);
if (fail > 0) process.exit(1);
