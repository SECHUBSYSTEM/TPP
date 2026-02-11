import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAuth, requireAdmin } from "@/lib/api-auth";
import { canAccessCustomerProfile } from "@/lib/rbac";
import { z } from "zod";

const updateSchema = z.object({
  name: z.string().min(1).optional(),
  email: z.string().email().optional(),
  locationId: z.number().optional(),
});

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const out = await requireAuth(request);
  if ("response" in out) return out.response;
  const id = Number((await params).id);
  if (Number.isNaN(id)) return NextResponse.json({ error: "Invalid id" }, { status: 400 });
  const customer = await prisma.customer.findUnique({
    where: { id },
    include: {
      location: { select: { id: true, name: true } },
      orders: { include: { items: { include: { product: { select: { productLineId: true } } } } } },
    },
  });
  if (!customer) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (!canAccessCustomerProfile(out.session, customer)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  return NextResponse.json(customer);
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const out = await requireAuth(request);
  if ("response" in out) return out.response;
  const id = Number((await params).id);
  if (Number.isNaN(id)) return NextResponse.json({ error: "Invalid id" }, { status: 400 });
  const customer = await prisma.customer.findUnique({
    where: { id },
    select: {
      id: true,
      locationId: true,
      orders: { include: { items: { include: { product: { select: { productLineId: true } } } } } },
    },
  });
  if (!customer) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (!canAccessCustomerProfile(out.session, customer)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const parsed = updateSchema.safeParse(await request.json());
  if (!parsed.success) return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  const updated = await prisma.customer.update({
    where: { id },
    data: parsed.data,
    include: { location: { select: { name: true } } },
  });
  return NextResponse.json(updated);
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const out = await requireAdmin(_request);
  if ("response" in out) return out.response;
  const id = Number((await params).id);
  if (Number.isNaN(id)) return NextResponse.json({ error: "Invalid id" }, { status: 400 });
  try {
    await prisma.customer.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
}
