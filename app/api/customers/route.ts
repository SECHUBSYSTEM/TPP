import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAuth, requireAdmin } from "@/lib/api-auth";
import { customerScopeWhere } from "@/lib/rbac";
import { z } from "zod";

const createSchema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
  locationId: z.number(),
  userId: z.number().optional(),
});

export async function GET(request: NextRequest) {
  const out = await requireAuth(request);
  if ("response" in out) return out.response;
  const where = customerScopeWhere(out.session);
  const customers = await prisma.customer.findMany({
    where,
    include: { location: { select: { name: true } } },
    orderBy: { id: "desc" },
  });
  return NextResponse.json(customers);
}

export async function POST(request: NextRequest) {
  const out = await requireAdmin(request);
  if ("response" in out) return out.response;

  const parsed = createSchema.safeParse(await request.json());
  if (!parsed.success) return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  const { name, email, locationId, userId } = parsed.data;
  try {
    const customer = await prisma.customer.create({
      data: { name, email, locationId, userId: userId ?? undefined },
      include: { location: { select: { name: true } } },
    });
    return NextResponse.json(customer);
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Email may already exist" }, { status: 400 });
  }
}
