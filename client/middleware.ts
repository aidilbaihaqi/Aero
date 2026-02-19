import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

/**
 * Next.js Middleware — Route protection.
 *
 * Strategy: Check for `refresh_token` cookie as a proxy for auth state.
 * (Access token is in localStorage — not available in middleware.)
 *
 * - If no refresh_token and accessing protected routes → redirect to /login
 * - If refresh_token and accessing /login → redirect to /dashboard
 */
export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const refreshToken = request.cookies.get("refresh_token")?.value;

  // Public paths that don't need auth
  const publicPaths = ["/login"];
  const isPublicPath = publicPaths.some((p) => pathname.startsWith(p));

  // Static/API paths — always allow
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/api") ||
    pathname.includes(".")
  ) {
    return NextResponse.next();
  }

  // No token + protected route → redirect to login
  if (!refreshToken && !isPublicPath) {
    const loginUrl = new URL("/login", request.url);
    return NextResponse.redirect(loginUrl);
  }

  // Has token + accessing login → redirect to dashboard
  if (refreshToken && isPublicPath) {
    const dashboardUrl = new URL("/dashboard", request.url);
    return NextResponse.redirect(dashboardUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
