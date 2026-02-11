import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import {
  verifyPassword,
  createToken,
  getSessionCookieConfig,
  type SessionPayload,
} from "@/lib/auth";
import { z } from "zod";

const bodySchema = z.object({
  username: z.string().min(1),
  password: z.string().min(1),
});

export async function POST(request: NextRequest) {
  const parsed = bodySchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid username or password" }, { status: 400 });
  }
  const { username, password } = parsed.data;

  const user = await prisma.user.findUnique({
    where: { username },
    include: {
      locationAssignments: { select: { locationId: true } },
      productLineAssignments: { select: { productLineId: true } },
      customerProfile: { select: { id: true } },
    },
  });

  if (!user || !(await verifyPassword(password, user.passwordHash))) {
    return NextResponse.json({ error: "Invalid username or password" }, { status: 401 });
  }

  const payload: SessionPayload = {
    userId: user.id,
    username: user.username,
    role: user.role,
    locationIds: user.locationAssignments.map((a: { locationId: number }) => a.locationId),
    productLineIds: user.productLineAssignments.map((a: { productLineId: number }) => a.productLineId),
    customerId: user.customerProfile?.id ?? null,
  };

  const token = await createToken(payload);
  const { name, options } = getSessionCookieConfig();

  const res = NextResponse.json({ user: { id: user.id, username: user.username, role: user.role } });
  res.cookies.set(name, token, options);
  return res;
}
