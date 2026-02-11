import { NextRequest, NextResponse } from "next/server";
import { getSessionFromCookie } from "@/lib/auth";

export async function GET(request: NextRequest) {
  const session = await getSessionFromCookie(request.headers.get("cookie"));
  if (!session) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }
  return NextResponse.json({
    userId: session.userId,
    username: session.username,
    role: session.role,
    locationIds: session.locationIds,
    productLineIds: session.productLineIds,
    customerId: session.customerId,
  });
}
