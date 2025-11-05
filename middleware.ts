// middleware.ts
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const PUBLIC_PATHS = ["/login", "/api/auth/login", "/favicon.ico", "/_next"];

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // la login og next-assets være åpne
  if (PUBLIC_PATHS.some((p) => pathname.startsWith(p))) {
    return NextResponse.next();
  }

  const cookie = req.cookies.get("app_auth");

  // hvis cookie finnes og stemmer → ok
  if (cookie && cookie.value === process.env.APP_SHARED_PASSWORD) {
    return NextResponse.next();
  }

  // ellers: redirect til /login
  const loginUrl = new URL("/login", req.url);
  return NextResponse.redirect(loginUrl);
}

// hvilke paths som skal gå via middleware
export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
