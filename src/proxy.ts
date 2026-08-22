import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { decode } from "next-auth/jwt";

/**
 * Proxy (ex-middleware) — protection auth + feature flags de lancement.
 *
 * 1. Routes protégées : redirige vers /login si non connecté.
 * 2. Routes cachées (non encore publiques) : accessibles uniquement aux emails
 *    listés dans ADMIN_EMAILS. Les autres utilisateurs sont renvoyés au dashboard.
 */

// Routes nécessitant une session
const PROTECTED_ROUTES = [
  "/dashboard",
  "/meditate",
  "/bible",
  "/my-meditations",
  "/profile",
  "/reading-plans",
  "/proclaim",
  "/themes",
  "/leaderboard",
  "/progress",
  "/memorize",
  "/shop",
];

// Routes cachées au public pendant le lancement (admin uniquement)
const ADMIN_ONLY_ROUTES = [
  "/reading-plans",
  "/proclaim",
  "/themes",
  "/leaderboard",
  "/progress",
  "/memorize",
  "/shop",
];

function matches(pathname: string, routes: string[]): boolean {
  return routes.some(
    (route) => pathname === route || pathname.startsWith(`${route}/`)
  );
}

function getAdminEmails(): string[] {
  return (process.env.ADMIN_EMAILS || "")
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
}

export async function proxy(request: NextRequest) {
  const { nextUrl } = request;
  const { pathname } = nextUrl;

  const rawToken =
    request.cookies.get("authjs.session-token")?.value ||
    request.cookies.get("__Secure-authjs.session-token")?.value ||
    request.cookies.get("next-auth.session-token")?.value ||
    request.cookies.get("__Secure-next-auth.session-token")?.value;

  // 1. Auth : route protégée sans session → login
  if (matches(pathname, PROTECTED_ROUTES) && !rawToken) {
    return NextResponse.redirect(new URL("/login", nextUrl));
  }

  // 2. Feature flag : route cachée → admin uniquement
  if (matches(pathname, ADMIN_ONLY_ROUTES)) {
    const admins = getAdminEmails();

    // Aucun admin configuré → tout le monde est bloqué (fail-safe)
    if (admins.length === 0) {
      return NextResponse.redirect(new URL("/dashboard", nextUrl));
    }

    let email: string | undefined;
    try {
      const decoded = await decode({
        token: rawToken,
        secret: process.env.NEXTAUTH_SECRET || "",
        salt: request.cookies.has("__Secure-authjs.session-token")
          ? "__Secure-authjs.session-token"
          : "authjs.session-token",
      });
      email = (decoded?.email as string | undefined)?.toLowerCase();
    } catch {
      email = undefined;
    }

    if (!email || !admins.includes(email)) {
      return NextResponse.redirect(new URL("/dashboard", nextUrl));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/meditate/:path*",
    "/bible/:path*",
    "/my-meditations/:path*",
    "/profile/:path*",
    "/reading-plans/:path*",
    "/proclaim/:path*",
    "/themes/:path*",
    "/leaderboard/:path*",
    "/progress/:path*",
    "/memorize/:path*",
    "/shop/:path*",
  ],
};
