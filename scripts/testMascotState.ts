/**
 * Valide l'escalade psychologique par MINI-SESSION (modèle Duolingo).
 *
 * Principe voulu par Roméo :
 *  - 1 mini-session faite le matin  → la mascotte est CONTENTE et encourage
 *  - le créneau de la mini 2 passe sans retour → elle S'INQUIETE
 *  - idem après 2 mini-sessions
 *  - 3 mini-sessions → CHAMPION DE LA FOI, embrasé pour le Seigneur
 *  - rien du tout    → escalade amical → insistant → inquiet → triste
 */
import { resolveMascotState, TimeOfDay } from "../src/lib/mascotState";

interface Case {
  label: string;
  input: Parameters<typeof resolveMascotState>[0];
  time: TimeOfDay;
  expectMood: string;
  expectCrying?: boolean;
  expectSituation?: string;
}

const cases: Case[] = [
  // ============ 3 MINI-SESSIONS : CHAMPION DE LA FOI ============
  {
    label: "CHAMPION 3/3 le matin",
    input: { sessionsCompletedToday: 3, dayCompleted: true },
    time: "morning",
    expectMood: "celebrating",
    expectCrying: false,
    expectSituation: "day_complete",
  },
  {
    label: "CHAMPION 3/3 le soir",
    input: { sessionsCompletedToday: 3, dayCompleted: true },
    time: "evening",
    expectMood: "celebrating",
    expectCrying: false,
  },
  {
    label: "CHAMPION 3/3 la nuit",
    input: { sessionsCompletedToday: 3, dayCompleted: true },
    time: "night",
    expectMood: "celebrating",
    expectCrying: false,
  },
  {
    label: "BUG SIGNALE : 3/3 + session bonus le soir",
    input: { sessionsCompletedToday: 3, dayCompleted: true, isMeditatingNow: true },
    time: "evening",
    expectMood: "excited",
    expectCrying: false,
    expectSituation: "bonus_session",
  },

  // ============ 1 MINI-SESSION : creneau mini 2 = jusqu'a afternoon ============
  {
    label: "1/3 le MATIN : contente (dans le creneau)",
    input: { sessionsCompletedToday: 1, dayCompleted: false },
    time: "morning",
    expectMood: "happy",
    expectCrying: false,
    expectSituation: "partial_progress",
  },
  {
    label: "1/3 a MIDI : contente, encourage (creneau mini 2 court)",
    input: { sessionsCompletedToday: 1, dayCompleted: false },
    time: "midday",
    expectMood: "happy",
    expectCrying: false,
    expectSituation: "partial_progress",
  },
  {
    label: "1/3 l'APRES-MIDI : contente (dernier moment du creneau)",
    input: { sessionsCompletedToday: 1, dayCompleted: false },
    time: "afternoon",
    expectMood: "happy",
    expectCrying: false,
    expectSituation: "partial_progress",
  },
  {
    label: "1/3 le SOIR : S'INQUIETE (creneau mini 2 depasse)",
    input: { sessionsCompletedToday: 1, dayCompleted: false },
    time: "evening",
    expectMood: "thinking",
    expectCrying: false,
    expectSituation: "partial_overdue",
  },
  {
    label: "1/3 la NUIT : TRISTE (tres en retard)",
    input: { sessionsCompletedToday: 1, dayCompleted: false },
    time: "night",
    expectMood: "sad",
    expectCrying: true,
    expectSituation: "partial_overdue",
  },

  // ============ 2 MINI-SESSIONS : creneau mini 3 = jusqu'a evening ============
  {
    label: "2/3 le MATIN : contente",
    input: { sessionsCompletedToday: 2, dayCompleted: false },
    time: "morning",
    expectMood: "happy",
    expectCrying: false,
    expectSituation: "partial_progress",
  },
  {
    label: "2/3 l'APRES-MIDI : contente",
    input: { sessionsCompletedToday: 2, dayCompleted: false },
    time: "afternoon",
    expectMood: "happy",
    expectCrying: false,
  },
  {
    label: "2/3 le SOIR : encore contente (creneau mini 3 court jusqu'au soir)",
    input: { sessionsCompletedToday: 2, dayCompleted: false },
    time: "evening",
    expectMood: "happy",
    expectCrying: false,
    expectSituation: "partial_progress",
  },
  {
    label: "2/3 la NUIT : TRISTE (creneau mini 3 depasse)",
    input: { sessionsCompletedToday: 2, dayCompleted: false },
    time: "night",
    expectMood: "sad",
    expectCrying: true,
    expectSituation: "partial_overdue",
  },

  // ============ RIEN COMMENCE : escalade complete ============
  {
    label: "0/3 le MATIN : amical",
    input: { sessionsCompletedToday: 0, dayCompleted: false },
    time: "morning",
    expectMood: "happy",
    expectCrying: false,
  },
  {
    label: "0/3 a MIDI : insistant",
    input: { sessionsCompletedToday: 0, dayCompleted: false },
    time: "midday",
    expectMood: "encouraging",
    expectCrying: false,
  },
  {
    label: "0/3 l'APRES-MIDI : inquiet",
    input: { sessionsCompletedToday: 0, dayCompleted: false },
    time: "afternoon",
    expectMood: "thinking",
    expectCrying: false,
  },
  {
    label: "0/3 le SOIR : TRISTE (culpabilite amicale)",
    input: { sessionsCompletedToday: 0, dayCompleted: false },
    time: "evening",
    expectMood: "sad",
    expectCrying: true,
  },
  {
    label: "0/3 la NUIT : dramatique",
    input: { sessionsCompletedToday: 0, dayCompleted: false },
    time: "night",
    expectMood: "sad",
    expectCrying: true,
  },

  // ============ SERIE ============
  {
    label: "Serie en danger a MIDI : TRISTE",
    input: { sessionsCompletedToday: 0, dayCompleted: false, streakCount: 12, inactivityDays: 1 },
    time: "midday",
    expectMood: "sad",
    expectCrying: true,
  },
  {
    label: "Serie sauvee : 1 session apres absence",
    input: { sessionsCompletedToday: 1, dayCompleted: false, streakCount: 5, inactivityDays: 1 },
    time: "evening",
    expectMood: "happy",
    expectCrying: false,
    expectSituation: "streak_saved",
  },
  {
    label: "Palier 7 jours",
    input: { sessionsCompletedToday: 1, dayCompleted: false, streakCount: 7, inactivityDays: 0 },
    time: "midday",
    expectMood: "celebrating",
    expectCrying: false,
  },
];

let pass = 0;
let fail = 0;

for (const c of cases) {
  const s = resolveMascotState(c.input, c.time);
  const moodOk = s.mood === c.expectMood;
  const cryOk =
    c.expectCrying === undefined
      ? true
      : c.expectCrying
      ? s.expression === "crying"
      : s.expression !== "crying";
  const sitOk = c.expectSituation === undefined ? true : s.situation === c.expectSituation;

  if (moodOk && cryOk && sitOk) {
    pass++;
    console.log(`OK   ${c.label}`);
    console.log(`     mood=${s.mood} expr=${s.expression} sit=${s.situation}`);
    console.log(`     "${s.message}"`);
  } else {
    fail++;
    console.log(`FAIL ${c.label}`);
    console.log(`     attendu mood=${c.expectMood} crying=${c.expectCrying} sit=${c.expectSituation}`);
    console.log(`     obtenu  mood=${s.mood} expr=${s.expression} sit=${s.situation}`);
    console.log(`     "${s.message}"`);
  }
}

console.log(`\n=== ${pass} OK / ${fail} echecs ===`);
if (fail > 0) process.exit(1);
