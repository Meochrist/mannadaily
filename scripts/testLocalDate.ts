export {}; // module isolé

/**
 * Verifie que la date du jour est calculee dans le fuseau de l'utilisateur
 * et non en UTC — cause du reset de progression apres rechargement.
 */
import { dateStrForOffset, offsetFromHeaders } from "../src/lib/localDate";

interface Case {
  label: string;
  utc: string;          // instant UTC
  offsetMin: number | null;  // getTimezoneOffset() du client
  expected: string;
}

// Rappel : getTimezoneOffset() vaut -60 pour UTC+1 (Benin), +300 pour UTC-5 (New York)
const cases: Case[] = [
  {
    label: "Benin (UTC+1) le 26 a 23h30 local = 22h30 UTC",
    utc: "2026-08-26T22:30:00Z",
    offsetMin: -60,
    expected: "2026-08-26",
  },
  {
    label: "BUG : Benin (UTC+1) le 27 a 00h30 local = 23h30 UTC le 26",
    utc: "2026-08-26T23:30:00Z",
    offsetMin: -60,
    expected: "2026-08-27", // en UTC on aurait eu 2026-08-26 -> journee perdue
  },
  {
    label: "Benin (UTC+1) le 26 a 08h00 local",
    utc: "2026-08-26T07:00:00Z",
    offsetMin: -60,
    expected: "2026-08-26",
  },
  {
    label: "New York (UTC-5) le 26 a 21h00 local = 02h00 UTC le 27",
    utc: "2026-08-27T02:00:00Z",
    offsetMin: 300,
    expected: "2026-08-26", // en UTC on aurait eu 2026-08-27 -> journee avancee a tort
  },
  {
    label: "Tokyo (UTC+9) le 27 a 07h00 local = 22h00 UTC le 26",
    utc: "2026-08-26T22:00:00Z",
    offsetMin: -540,
    expected: "2026-08-27",
  },
  {
    label: "France (UTC+1) le 27 a 01h00 local = 00h00 UTC le 27",
    utc: "2026-08-27T00:00:00Z",
    offsetMin: -60,
    expected: "2026-08-27",
  },
  {
    label: "France ete (UTC+2) le 27 a 01h00 local = 23h00 UTC le 26",
    utc: "2026-08-26T23:00:00Z",
    offsetMin: -120,
    expected: "2026-08-27",
  },
  {
    label: "Inde (UTC+5:30) le 27 a 05h00 local = 23h30 UTC le 26",
    utc: "2026-08-26T23:30:00Z",
    offsetMin: -330,
    expected: "2026-08-27",
  },
  {
    label: "Nouvelle-Zelande (UTC+12) le 27 a 12h00 local = 00h00 UTC",
    utc: "2026-08-27T00:00:00Z",
    offsetMin: -720,
    expected: "2026-08-27",
  },
  {
    label: "Hawaii (UTC-10) le 26 a 14h00 local = 00h00 UTC le 27",
    utc: "2026-08-27T00:00:00Z",
    offsetMin: 600,
    expected: "2026-08-26",
  },
  {
    label: "En-tete absent -> repli UTC",
    utc: "2026-08-26T23:30:00Z",
    offsetMin: null,
    expected: "2026-08-26",
  },
];

let pass = 0, fail = 0;

for (const c of cases) {
  const got = dateStrForOffset(c.offsetMin, new Date(c.utc));
  const utcNaive = new Date(c.utc).toISOString().slice(0, 10);
  if (got === c.expected) {
    pass++;
    console.log(`OK   ${c.label}`);
    console.log(`     date locale=${got}  (UTC naif aurait donne ${utcNaive})`);
  } else {
    fail++;
    console.log(`FAIL ${c.label}`);
    console.log(`     attendu=${c.expected} obtenu=${got}`);
  }
}

// Validation des en-tetes
const hdrOk = offsetFromHeaders(new Headers({ "x-tz-offset": "-60" })) === -60;
const hdrAbsent = offsetFromHeaders(new Headers()) === null;
const hdrInvalide = offsetFromHeaders(new Headers({ "x-tz-offset": "99999" })) === null;

for (const [label, ok] of [
  ["Lecture en-tete valide (-60)", hdrOk],
  ["En-tete absent -> null", hdrAbsent],
  ["En-tete hors bornes -> null", hdrInvalide],
] as Array<[string, boolean]>) {
  if (ok) { pass++; console.log(`OK   ${label}`); }
  else { fail++; console.log(`FAIL ${label}`); }
}

console.log(`\n=== Fuseau horaire : ${pass} OK / ${fail} echecs ===`);
if (fail > 0) process.exit(1);
