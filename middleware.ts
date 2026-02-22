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

  // Old API routes: still require cookie auth (backward compat)
  if (pathname.startsWith("/api/")) {
    const cookie = req.cookies.get("app_auth");
    if (cookie && cookie.value === process.env.APP_SHARED_PASSWORD) {
      return NextResponse.next();
    }
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // All page routes: pass through – Supabase client-side auth handles gating
  return NextResponse.next();
}

// hvilke paths som skal gå via middleware
export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
