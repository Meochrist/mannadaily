import { auth } from "@/lib/auth";
import { isAdminEmail } from "@/lib/features";
import { redirect } from "next/navigation";

/**
 * Garde serveur pour les pages réservées aux admins pendant le lancement.
 * À appeler en tête de chaque page cachée.
 *
 * - Non connecté  → /login
 * - Connecté mais non-admin → /dashboard (la fonctionnalité n'existe pas pour lui)
 * - Admin → laisse passer et renvoie la session
 */
export async function requireAdminFeature() {
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/login");
  }

  if (!isAdminEmail(session.user.email)) {
    redirect("/dashboard");
  }

  return session;
}
