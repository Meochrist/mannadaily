import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Routes nécessitant une session
const PROTECTED_ROUTES = [
  '/dashboard',
  '/meditate',
  '/bible',
  '/my-meditations',
  '/profile',
  '/reading-plans',
  '/proclaim',
  '/themes',
  '/leaderboard',
  '/progress',
  '/memorize',
  '/shop',
];

// Routes admin uniquement
const ADMIN_ONLY_ROUTES = [
  '/reading-plans',
  '/proclaim',
  '/themes',
  '/leaderboard',
  '/progress',
  '/memorize',
  '/shop',
];

function matches(pathname: string, routes: string[]): boolean {
  return routes.some(
    (route) => pathname === route || pathname.startsWith(`${route}/`)
  );
}

function getAdminEmails(): string[] {
  return (process.env.ADMIN_EMAILS || '')
    .split(',')
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
}

// Décoder un JWT simple (HS256)
function decodeToken(token: string): { userId: string; email: string; exp: number } | null {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    
    const payload = JSON.parse(atob(parts[1]));
    if (payload.exp < Math.floor(Date.now() / 1000)) return null;
    
    return { userId: payload.userId, email: payload.email, exp: payload.exp };
  } catch {
    return null;
  }
}

export async function proxy(request: NextRequest) {
  const { nextUrl } = request;
  const { pathname } = nextUrl;

  // Récupérer le token depuis le cookie
  const rawToken = request.cookies.get('mannadaily_token')?.value;

  // 1. Auth : route protégée sans session → login
  if (matches(pathname, PROTECTED_ROUTES) && !rawToken) {
    return NextResponse.redirect(new URL('/login', nextUrl));
  }

  // 2. Feature flag : route cachée → admin uniquement
  if (matches(pathname, ADMIN_ONLY_ROUTES)) {
    const admins = getAdminEmails();

    if (admins.length === 0) {
      return NextResponse.redirect(new URL('/dashboard', nextUrl));
    }

    let email: string | undefined;
    if (rawToken) {
      const decoded = decodeToken(rawToken);
      email = decoded?.email?.toLowerCase();
    }

    if (!email || !admins.includes(email)) {
      return NextResponse.redirect(new URL('/dashboard', nextUrl));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/dashboard/:path*',
    '/meditate/:path*',
    '/bible/:path*',
    '/my-meditations/:path*',
    '/profile/:path*',
    '/reading-plans/:path*',
    '/proclaim/:path*',
    '/themes/:path*',
    '/leaderboard/:path*',
    '/progress/:path*',
    '/memorize/:path*',
    '/shop/:path*',
  ],
};
