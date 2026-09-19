import { NextResponse, type NextRequest } from "next/server";
import { SESSION_COOKIE } from "@/lib/auth/constants";

/*
 * Route gate for the authenticated app (frontend spec §3.3): no session cookie
 * on /app/* sends the visitor to the homepage sign-in, remembering where they
 * were headed. Public routes are deliberately outside the matcher (§2.2, §4).
 *
 * This is a first gate, not the security boundary. It checks that the cookie is
 * PRESENT — it cannot cheaply verify a token from the edge — so a stale or
 * forged cookie gets through to the page shell, where the client-side session
 * check (`/api/bff/session`) catches it. Data is protected where it lives:
 * every /me/* endpoint validates the JWT itself.
 *
 * Imports only the constants module: the edge runtime has no Node APIs, and
 * session-cookie.ts is `server-only` with Node dependencies.
 */
export function middleware(request: NextRequest) {
  if (request.cookies.get(SESSION_COOKIE)?.value) return NextResponse.next();

  const { pathname, search } = request.nextUrl;
  const signIn = request.nextUrl.clone();
  signIn.pathname = "/";
  signIn.search = "";
  signIn.searchParams.set("signin", "1");
  signIn.searchParams.set("next", pathname + search);
  return NextResponse.redirect(signIn, 302);
}

export const config = {
  matcher: ["/app/:path*"],
};
