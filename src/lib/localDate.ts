/**
 * SOURCE UNIQUE DE VÉRITÉ POUR LA DATE DU JOUR (progression quotidienne).
 *
 * Pourquoi ce module existe :
 * `new Date().toISOString().slice(0, 10)` renvoie la date **UTC**. Pour un
 * utilisateur en UTC+1 (Bénin), la journée « change » à 01:00 heure locale,
 * et sur Vercel (serveur en UTC) le client et le serveur pouvaient calculer
 * deux dates différentes pour le même instant. Résultat : la progression du
 * jour était considérée comme « celle d'hier » et remise à zéro alors que
 * l'utilisateur venait de méditer.
 *
 * On calcule donc la date dans le fuseau de l'utilisateur, transmise par le
 * client via l'en-tête `x-tz-offset` (minutes, comme getTimezoneOffset()).
 */

/** Date locale du navigateur au format YYYY-MM-DD. */
export function localDateStr(d: Date = new Date()): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

/**
 * Date du jour vue depuis un fuseau donné.
 * @param offsetMinutes valeur de Date.prototype.getTimezoneOffset() du client
 *                      (UTC+1 → -60). Absent/invalide → UTC.
 */
export function dateStrForOffset(offsetMinutes: number | null | undefined, now: Date = new Date()): string {
  const offset = typeof offsetMinutes === "number" && Number.isFinite(offsetMinutes) ? offsetMinutes : 0;
  // getTimezoneOffset() est négatif à l'est de Greenwich : on le soustrait.
  const shifted = new Date(now.getTime() - offset * 60_000);
  return shifted.toISOString().slice(0, 10);
}

/** Lit l'offset du fuseau client depuis les en-têtes d'une requête. */
export function offsetFromHeaders(headers: Headers): number | null {
  const raw = headers.get("x-tz-offset");
  if (raw === null) return null;
  const parsed = Number.parseInt(raw, 10);
  // Bornes larges : les fuseaux réels vont de -14h à +14h.
  if (!Number.isFinite(parsed) || Math.abs(parsed) > 14 * 60) return null;
  return parsed;
}

/** En-têtes à joindre aux requêtes client pour transmettre le fuseau. */
export function tzHeaders(): Record<string, string> {
  if (typeof window === "undefined") return {};
  return { "x-tz-offset": String(new Date().getTimezoneOffset()) };
}
