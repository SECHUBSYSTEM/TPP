import { NextResponse } from "next/server";
import { COOKIE_NAME, getSessionCookieConfig } from "@/lib/auth";

export async function POST() {
  const res = NextResponse.json({ ok: true });
  const { name, options } = getSessionCookieConfig();
  res.cookies.set(name, "", { ...options, maxAge: 0 });
  return res;
}
