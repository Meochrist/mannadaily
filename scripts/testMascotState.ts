/**
 * Vérifie que resolveMascotState ne produit jamais de contradiction
 * entre l'humeur affichée et le message.
 */
import { resolveMascotState, TimeOfDay } from "../src/lib/mascotState";

interface Case {
  label: string;
  input: Parameters<typeof resolveMascotState>[0];
  time: TimeOfDay;
  expectMood: string;
  expectNotCrying?: boolean;
}

const cases: Case[] = [
  {
    label: "LE BUG SIGNALE : 3 sessions faites + session bonus le soir",
    input: { sessionsCompletedToday: 3, dayCompleted: true, isMeditatingNow: true },
    time: "evening",
    expectMood: "excited",
    expectNotCrying: true,
  },
  {
    label: "3 sessions faites, sur le tableau de bord le soir",
    input: { sessionsCompletedToday: 3, dayCompleted: true },
    time: "evening",
    expectMood: "celebrating",
    expectNotCrying: true,
  },
  {
    label: "Rien commence le soir (ancien bug : etait 'sad')",
    input: { sessionsCompletedToday: 0, dayCompleted: false },
    time: "evening",
    expectMood: "encouraging",
    expectNotCrying: true,
  },
  {
    label: "Rien commence l'apres-midi (ancien bug : etait 'sad')",
    input: { sessionsCompletedToday: 0, dayCompleted: false },
    time: "afternoon",
    expectMood: "encouraging",
    expectNotCrying: true,
  },
  {
    label: "2 sessions sur 3 le matin",
    input: { sessionsCompletedToday: 2, dayCompleted: false },
    time: "morning",
    expectMood: "happy",
    expectNotCrying: true,
  },
  {
    label: "Serie en danger : streak 5, inactif 1 jour, 0 session",
    input: { sessionsCompletedToday: 0, dayCompleted: false, streakCount: 5, inactivityDays: 1 },
    time: "evening",
    expectMood: "sad",
  },
  {
    label: "Serie sauvee : streak 5, inactif 1 jour, 1 session faite",
    input: { sessionsCompletedToday: 1, dayCompleted: false, streakCount: 5, inactivityDays: 1 },
    time: "evening",
    expectMood: "happy",
    expectNotCrying: true,
  },
  {
    label: "Palier de serie : 7 jours, actif",
    input: { sessionsCompletedToday: 1, dayCompleted: false, streakCount: 7, inactivityDays: 0 },
    time: "midday",
    expectMood: "celebrating",
    expectNotCrying: true,
  },
  {
    label: "Meditation en cours, aucune session validee",
    input: { sessionsCompletedToday: 0, dayCompleted: false, isMeditatingNow: true },
    time: "morning",
    expectMood: "thinking",
    expectNotCrying: true,
  },
  {
    label: "Nuit sans session",
    input: { sessionsCompletedToday: 0, dayCompleted: false },
    time: "night",
    expectMood: "sleeping",
    expectNotCrying: true,
  },
];

let pass = 0;
let fail = 0;

for (const c of cases) {
  const s = resolveMascotState(c.input, c.time);
  const moodOk = s.mood === c.expectMood;
  const cryOk = c.expectNotCrying ? s.expression !== "crying" : true;

  if (moodOk && cryOk) {
    pass++;
    console.log(`OK   ${c.label}`);
    console.log(`     mood=${s.mood} pose=${s.pose} expr=${s.expression}`);
    console.log(`     "${s.message}"`);
  } else {
    fail++;
    console.log(`FAIL ${c.label}`);
    console.log(`     attendu mood=${c.expectMood}, obtenu mood=${s.mood} expr=${s.expression}`);
    console.log(`     "${s.message}"`);
  }
}

console.log(`\n=== ${pass} OK / ${fail} echecs ===`);
if (fail > 0) process.exit(1);
