import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAuth, requireAdmin } from "@/lib/api-auth";
import { canAccessOrder } from "@/lib/rbac";
import { z } from "zod";

const updateSchema = z.object({ status: z.string().min(1).optional() });

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const out = await requireAuth(request);
  if ("response" in out) return out.response;
  const id = Number((await params).id);
  if (Number.isNaN(id)) return NextResponse.json({ error: "Invalid id" }, { status: 400 });
  const order = await prisma.order.findUnique({
    where: { id },
    include: {
      customer: { include: { location: { select: { name: true } } } },
      items: { include: { product: { include: { productLine: { select: { name: true } } } } } },
    },
  });
  if (!order) return NextResponse.json({ error: "Not found" }, { status: 404 });
  const orderForCheck = {
    customerId: order.customerId,
    customer: { locationId: order.customer.locationId },
    items: order.items.map((i: { product: { productLineId: number } }) => ({ product: { productLineId: i.product.productLineId } })),
  };
  if (!canAccessOrder(out.session, orderForCheck)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  return NextResponse.json(order);
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const out = await requireAuth(request);
  if ("response" in out) return out.response;
  const id = Number((await params).id);
  if (Number.isNaN(id)) return NextResponse.json({ error: "Invalid id" }, { status: 400 });
  const order = await prisma.order.findUnique({
    where: { id },
    include: {
      customer: { select: { locationId: true } },
      items: { select: { product: { select: { productLineId: true } } } },
    },
  });
  if (!order) return NextResponse.json({ error: "Not found" }, { status: 404 });
  const orderForCheck = {
    customerId: order.customerId,
    customer: { locationId: order.customer.locationId },
    items: order.items.map((i: { product: { productLineId: number } }) => ({ product: { productLineId: i.product.productLineId } })),
  };
  if (!canAccessOrder(out.session, orderForCheck)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const parsed = updateSchema.safeParse(await request.json());
  if (!parsed.success) return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  const updated = await prisma.order.update({
    where: { id },
    data: parsed.data,
    include: {
      customer: { select: { name: true } },
      items: { include: { product: { select: { name: true } } } },
    },
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
    await prisma.order.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
}
