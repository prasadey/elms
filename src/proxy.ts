import { NextRequest, NextResponse } from "next/server";

// Fast UX-level gate: redirect to /login when no session cookie is present.
// This is a convenience redirect only — it does NOT run in the Node.js
// runtime and must never be treated as the authorization boundary. The real,
// authoritative checks (session validity, role, and record ownership) run
// server-side on every page and server action via `auth()` from src/auth.ts,
// per PRD 9.4 ("Authorisation on every request").
const PUBLIC_PATHS = ["/login", "/api/auth", "/robots.txt", "/favicon.ico"];

function hasSessionCookie(req: NextRequest): boolean {
  return Boolean(
    req.cookies.get("authjs.session-token") ||
      req.cookies.get("__Secure-authjs.session-token")
  );
}

export function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;

  if (PUBLIC_PATHS.some((p) => pathname === p || pathname.startsWith(p + "/"))) {
    return NextResponse.next();
  }

  if (!hasSessionCookie(req)) {
    const loginUrl = new URL("/login", req.url);
    loginUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|.*\\.png$|.*\\.svg$).*)"],
};
