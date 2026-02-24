import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  // Block in production (same as admin dashboard)
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json({ error: "Not available in production" }, { status: 403 });
  }

  const { password } = await req.json();

  if (!password) {
    return NextResponse.json({ error: "Missing password" }, { status: 400 });
  }

  if (password !== process.env.APP_SHARED_PASSWORD) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const res = NextResponse.json({ ok: true });

  // sett cookie (samme verdi som passordet, enkelt)
  res.cookies.set("app_auth", password, {
    httpOnly: true,
    secure: true, // Only over HTTPS
    sameSite: 'strict', // CSRF protection
    path: "/",
    maxAge: 60 * 60 * 24 * 30, // 30 dager
  });

  return res;
}
