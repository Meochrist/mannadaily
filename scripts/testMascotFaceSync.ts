/**
 * Vérifie que le VISAGE DESSINÉ du personnage correspond à l'emoji du message.
 *
 * Roméo : « le visage des mascottes doit avoir l'expression qui correspond
 * aux smileys au début du message ». Chaque personnage possède 4 fichiers
 * SVG d'expression (happy / neutral / sweating / crying) : ce test garantit
 * qu'on choisit le bon.
 */
import { resolveMascotState, TimeOfDay } from "../src/lib/mascotState";

/** Expression SVG attendue pour chaque famille d'emoji. */
const EMOJI_TO_EXPRESSION: Array<{ emojis: string[]; expression: string; label: string }> = [
  { emojis: ["😢", "😭", "💔"], expression: "crying", label: "larmes" },
  { emojis: ["😟", "😥", "😰"], expression: "sweating", label: "inquietude/sueur" },
  { emojis: ["😊", "🙂", "👍", "💪", "🎉", "🏆", "🔥", "🤩", "✨", "🌟", "😌", "🌅", "🕐", "🌛", "💛", "🤔"], expression: "happy_or_neutral", label: "sourire/neutre" },
];

function expectedExpressionFor(message: string): { label: string; expression: string } | null {
  for (const group of EMOJI_TO_EXPRESSION) {
    if (group.emojis.some((e) => message.includes(e))) {
      return { label: group.label, expression: group.expression };
    }
  }
  return null;
}

const scenarios: Array<{ input: Parameters<typeof resolveMascotState>[0]; time: TimeOfDay; label: string }> = [];

const times: TimeOfDay[] = ["morning", "midday", "afternoon", "evening", "night"];

// Toutes les combinaisons realistes : 0 a 3 sessions x 5 moments, avec et sans serie.
for (const t of times) {
  for (const done of [0, 1, 2, 3]) {
    scenarios.push({
      input: { sessionsCompletedToday: done, dayCompleted: done >= 3 },
      time: t,
      label: `${done}/3 ${t}`,
    });
    scenarios.push({
      input: { sessionsCompletedToday: done, dayCompleted: done >= 3, streakCount: 9, inactivityDays: 1 },
      time: t,
      label: `${done}/3 ${t} + serie en danger`,
    });
  }
  // Session bonus
  scenarios.push({
    input: { sessionsCompletedToday: 3, dayCompleted: true, isMeditatingNow: true },
    time: t,
    label: `bonus ${t}`,
  });
}

let pass = 0;
let fail = 0;

for (const s of scenarios) {
  const st = resolveMascotState(s.input, s.time);
  const expected = expectedExpressionFor(st.message);

  if (!expected) {
    console.log(`SKIP ${s.label} — aucun emoji reconnu dans "${st.message}"`);
    continue;
  }

  let ok: boolean;
  if (expected.expression === "happy_or_neutral") {
    // Un message positif ou neutre ne doit JAMAIS pleurer ni suer.
    ok = st.expression === "happy" || st.expression === "neutral";
  } else {
    ok = st.expression === expected.expression;
  }

  if (ok) {
    pass++;
  } else {
    fail++;
    console.log(`FAIL ${s.label}`);
    console.log(`     emoji => ${expected.label} (attendu expression=${expected.expression})`);
    console.log(`     obtenu expression=${st.expression} pose=${st.pose} mood=${st.mood}`);
    console.log(`     "${st.message}"`);
  }
}

console.log(`\n=== Synchro emoji <-> visage dessine : ${pass} OK / ${fail} echecs ===`);
if (fail > 0) process.exit(1);
