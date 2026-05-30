import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function proxy(request: NextRequest) {
  // En NextAuth v5 (Auth.js), le cookie de session par défaut s'appelle 'authjs.session-token'
  // En production avec HTTPS, il s'appelle '__Secure-authjs.session-token'
  // Nous vérifions également les cookies classiques de la v4 par sécurité
  const token = 
    request.cookies.get("authjs.session-token")?.value || 
    request.cookies.get("__Secure-authjs.session-token")?.value ||
    request.cookies.get("next-auth.session-token")?.value ||
    request.cookies.get("__Secure-next-auth.session-token")?.value;

  const { nextUrl } = request;
  
  const protectedRoutes = ["/dashboard", "/meditate", "/proclaim", "/progress", "/themes"];
  
  const isProtectedRoute = protectedRoutes.some((route) => 
    nextUrl.pathname.startsWith(route)
  );

  if (isProtectedRoute && !token) {
    return NextResponse.redirect(new URL("/login", nextUrl));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/meditate/:path*",
    "/proclaim/:path*",
    "/progress/:path*",
    "/themes/:path*",
  ],
};
