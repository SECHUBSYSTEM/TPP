import { NextRequest, NextResponse } from "next/server";
import { getSessionFromCookie } from "@/lib/auth";
import type { SessionPayload } from "@/lib/auth";

/**
 * Returns session from request cookie or null. Use in API routes.
 */
export async function getSession(request: NextRequest): Promise<SessionPayload | null> {
  return getSessionFromCookie(request.headers.get("cookie"));
}

/**
 * Returns session or sends 401 and null. Use when route requires auth.
 */
export async function requireAuth(
  request: NextRequest
): Promise<{ session: SessionPayload } | { response: NextResponse }> {
  const session = await getSession(request);
  if (!session) {
    return { response: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) };
  }
  return { session };
}

/**
 * Returns session or 401, and ensures role is ADMIN. Use for admin-only routes.
 */
export async function requireAdmin(
  request: NextRequest
): Promise<{ session: SessionPayload } | { response: NextResponse }> {
  const out = await requireAuth(request);
  if ("response" in out) return out;
  if (out.session.role !== "ADMIN") {
    return { response: NextResponse.json({ error: "Forbidden" }, { status: 403 }) };
  }
  return out;
}
