/**
 * Feature flags — Lancement production.
 *
 * Seules les fonctionnalités listées dans PUBLIC_ROUTES sont visibles/accessibles
 * aux utilisateurs. Les autres restent pleinement fonctionnelles mais réservées
 * aux comptes admin (variable d'env ADMIN_EMAILS, séparés par des virgules).
 *
 * Source unique de vérité : utilisée par le middleware, le layout (navigation)
 * et les gardes de page.
 */

// Routes visibles par tous les utilisateurs connectés
export const PUBLIC_ROUTES = [
  "/dashboard",
  "/meditate",
  "/bible",
  "/my-meditations",
] as const;

// Routes cachées au public (admin uniquement)
export const ADMIN_ONLY_ROUTES = [
  "/reading-plans",
  "/proclaim",
  "/themes",
  "/leaderboard",
  "/progress",
  "/memorize",
  "/shop",
] as const;

/** Emails autorisés à voir les fonctionnalités cachées. */
export function getAdminEmails(): string[] {
  const raw = process.env.ADMIN_EMAILS || "";
  return raw
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
}

/** Un email est-il admin ? */
export function isAdminEmail(email?: string | null): boolean {
  if (!email) return false;
  const admins = getAdminEmails();
  if (admins.length === 0) return false;
  return admins.includes(email.toLowerCase());
}

/**
 * La route est-elle publique ?
 * `/profile` et les routes hors app-shell restent toujours accessibles.
 */
export function isPublicRoute(pathname: string): boolean {
  // Profil toujours accessible (paramètres de compte)
  if (pathname.startsWith("/profile")) return true;
  return PUBLIC_ROUTES.some(
    (route) => pathname === route || pathname.startsWith(`${route}/`)
  );
}

/** La route est-elle réservée aux admins ? */
export function isAdminOnlyRoute(pathname: string): boolean {
  return ADMIN_ONLY_ROUTES.some(
    (route) => pathname === route || pathname.startsWith(`${route}/`)
  );
}

/** Cette route est-elle accessible pour cet utilisateur ? */
export function canAccessRoute(pathname: string, email?: string | null): boolean {
  if (!isAdminOnlyRoute(pathname)) return true;
  return isAdminEmail(email);
}
