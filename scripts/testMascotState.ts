/**
 * Valide l'escalade psychologique (modèle Duolingo) ET la synchronisation
 * message/visage.
 *
 * Deux exigences simultanées :
 *  1. La mascotte DOIT être triste quand l'utilisateur néglige sa méditation
 *     (culpabilité amicale = levier de rétention).
 *  2. Le visage DOIT correspondre au ton du message (pas de larmes sur
 *     des félicitations, pas de sourire sur un reproche).
 */
import { resolveMascotState, TimeOfDay } from "../src/lib/mascotState";

interface Case {
  label: string;
  input: Parameters<typeof resolveMascotState>[0];
  time: TimeOfDay;
  expectMood: string;
  /** Le visage doit-il pleurer ? true = obligatoire, false = interdit */
  expectCrying?: boolean;
}

const cases: Case[] = [
  // ---- SYNCHRONISATION : les félicitations ne pleurent jamais ----
  {
    label: "BUG SIGNALE : 3 sessions faites + session bonus le soir",
    input: { sessionsCompletedToday: 3, dayCompleted: true, isMeditatingNow: true },
    time: "evening",
    expectMood: "excited",
    expectCrying: false,
  },
  {
    label: "3 sessions faites, tableau de bord le soir",
    input: { sessionsCompletedToday: 3, dayCompleted: true },
    time: "evening",
    expectMood: "celebrating",
    expectCrying: false,
  },
  {
    label: "Journee complete la nuit",
    input: { sessionsCompletedToday: 3, dayCompleted: true },
    time: "night",
    expectMood: "celebrating",
    expectCrying: false,
  },
  {
    label: "Palier de serie : 7 jours",
    input: { sessionsCompletedToday: 1, dayCompleted: false, streakCount: 7, inactivityDays: 0 },
    time: "midday",
    expectMood: "celebrating",
    expectCrying: false,
  },
  {
    label: "Serie sauvee : revenu apres absence",
    input: { sessionsCompletedToday: 1, dayCompleted: false, streakCount: 5, inactivityDays: 1 },
    time: "evening",
    expectMood: "happy",
    expectCrying: false,
  },

  // ---- ESCALADE : rien commence, la pression monte avec l'heure ----
  {
    label: "ESCALADE 1/5 - rien commence le MATIN : amical",
    input: { sessionsCompletedToday: 0, dayCompleted: false },
    time: "morning",
    expectMood: "happy",
    expectCrying: false,
  },
  {
    label: "ESCALADE 2/5 - rien commence a MIDI : insistant",
    input: { sessionsCompletedToday: 0, dayCompleted: false },
    time: "midday",
    expectMood: "encouraging",
    expectCrying: false,
  },
  {
    label: "ESCALADE 3/5 - rien commence l'APRES-MIDI : inquiet",
    input: { sessionsCompletedToday: 0, dayCompleted: false },
    time: "afternoon",
    expectMood: "thinking",
    expectCrying: false,
  },
  {
    label: "ESCALADE 4/5 - rien commence le SOIR : TRISTE (culpabilite)",
    input: { sessionsCompletedToday: 0, dayCompleted: false },
    time: "evening",
    expectMood: "sad",
    expectCrying: true,
  },
  {
    label: "ESCALADE 5/5 - rien commence la NUIT : dramatique",
    input: { sessionsCompletedToday: 0, dayCompleted: false },
    time: "night",
    expectMood: "sad",
    expectCrying: true,
  },

  // ---- SERIE EN DANGER : le levier le plus fort ----
  {
    label: "Serie en danger le MATIN : alerte mais pas encore de larmes",
    input: { sessionsCompletedToday: 0, dayCompleted: false, streakCount: 12, inactivityDays: 1 },
    time: "morning",
    expectMood: "encouraging",
    expectCrying: false,
  },
  {
    label: "Serie en danger a MIDI : TRISTE",
    input: { sessionsCompletedToday: 0, dayCompleted: false, streakCount: 12, inactivityDays: 1 },
    time: "midday",
    expectMood: "sad",
    expectCrying: true,
  },
  {
    label: "Serie en danger le SOIR : TRISTE (dramatique)",
    input: { sessionsCompletedToday: 0, dayCompleted: false, streakCount: 12, inactivityDays: 1 },
    time: "evening",
    expectMood: "sad",
    expectCrying: true,
  },

  // ---- PROGRESSION PARTIELLE ----
  {
    label: "2 sessions sur 3 le matin : content",
    input: { sessionsCompletedToday: 2, dayCompleted: false },
    time: "morning",
    expectMood: "happy",
    expectCrying: false,
  },
  {
    label: "2 sessions sur 3 le soir : preoccupe (pas fini)",
    input: { sessionsCompletedToday: 2, dayCompleted: false },
    time: "evening",
    expectMood: "thinking",
    expectCrying: false,
  },

  // ---- EN COURS DE MEDITATION ----
  {
    label: "Meditation en cours, rien encore valide",
    input: { sessionsCompletedToday: 0, dayCompleted: false, isMeditatingNow: true },
    time: "afternoon",
    expectMood: "thinking",
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

  if (moodOk && cryOk) {
    pass++;
    console.log(`OK   ${c.label}`);
    console.log(`     mood=${s.mood} pose=${s.pose} expr=${s.expression}`);
    console.log(`     "${s.message}"`);
  } else {
    fail++;
    console.log(`FAIL ${c.label}`);
    console.log(`     attendu mood=${c.expectMood} crying=${c.expectCrying}`);
    console.log(`     obtenu  mood=${s.mood} expr=${s.expression}`);
    console.log(`     "${s.message}"`);
  }
}

console.log(`\n=== ${pass} OK / ${fail} echecs ===`);
if (fail > 0) process.exit(1);
