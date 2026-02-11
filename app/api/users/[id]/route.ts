import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/api-auth";
import { hashPassword } from "@/lib/auth";
import { z } from "zod";
import { Role } from "@prisma/client";

const updateSchema = z.object({
  username: z.string().min(1).optional(),
  name: z.string().optional(),
  password: z.string().min(1).optional(),
  role: z.enum(["ADMIN", "LOCATION_MANAGER", "PRODUCT_MANAGER", "CUSTOMER"]).optional(),
  locationIds: z.array(z.number()).optional(),
  productLineIds: z.array(z.number()).optional(),
});

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const out = await requireAdmin(request);
  if ("response" in out) return out.response;
  const id = Number((await params).id);
  if (Number.isNaN(id)) return NextResponse.json({ error: "Invalid id" }, { status: 400 });
  const user = await prisma.user.findUnique({
    where: { id },
    select: {
      id: true,
      username: true,
      name: true,
      role: true,
      createdAt: true,
      locationAssignments: { select: { locationId: true } },
      productLineAssignments: { select: { productLineId: true } },
      customerProfile: { select: { id: true } },
    },
  });
  if (!user) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(user);
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const out = await requireAdmin(request);
  if ("response" in out) return out.response;
  const id = Number((await params).id);
  if (Number.isNaN(id)) return NextResponse.json({ error: "Invalid id" }, { status: 400 });
  const parsed = updateSchema.safeParse(await request.json());
  if (!parsed.success) return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  const data = parsed.data;

  const existing = await prisma.user.findUnique({ where: { id }, select: { role: true } });
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });
  const effectiveRole = (data.role ?? existing.role) as string;
  if (effectiveRole === "LOCATION_MANAGER" && data.locationIds !== undefined && data.locationIds.length === 0) {
    return NextResponse.json(
      { error: "At least one location must be selected for a location manager." },
      { status: 400 }
    );
  }
  if (effectiveRole === "PRODUCT_MANAGER" && data.productLineIds !== undefined && data.productLineIds.length === 0) {
    return NextResponse.json(
      { error: "At least one product line must be selected for a product manager." },
      { status: 400 }
    );
  }

  const updateData: {
    username?: string;
    name?: string | null;
    passwordHash?: string;
    role?: Role;
    locationAssignments?: { deleteMany: object; create: { locationId: number }[] };
    productLineAssignments?: { deleteMany: object; create: { productLineId: number }[] };
  } = {};
  if (data.username != null) updateData.username = data.username;
  if (data.name !== undefined) updateData.name = data.name || null;
  if (data.password != null) updateData.passwordHash = await hashPassword(data.password);
  if (data.role != null) updateData.role = data.role as Role;
  if (data.locationIds != null) {
    updateData.locationAssignments = {
      deleteMany: {},
      create: data.locationIds.map((locationId) => ({ locationId })),
    };
  }
  if (data.productLineIds != null) {
    updateData.productLineAssignments = {
      deleteMany: {},
      create: data.productLineIds.map((productLineId) => ({ productLineId })),
    };
  }
  try {
    const user = await prisma.user.update({
      where: { id },
      data: updateData,
      select: { id: true, username: true, name: true, role: true, createdAt: true },
    });
    return NextResponse.json(user);
  } catch {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
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
    await prisma.$transaction(async (tx) => {
      // If this user has a linked Customer profile, delete that customer (and their orders) so they no longer show in Customers list
      const linkedCustomer = await tx.customer.findUnique({ where: { userId: id }, select: { id: true } });
      if (linkedCustomer) {
        const orderIds = await tx.order
          .findMany({ where: { customerId: linkedCustomer.id }, select: { id: true } })
          .then((rows: { id: number }[]) => rows.map((r) => r.id));
        if (orderIds.length > 0) await tx.orderItem.deleteMany({ where: { orderId: { in: orderIds } } });
        await tx.order.deleteMany({ where: { customerId: linkedCustomer.id } });
        await tx.customer.delete({ where: { id: linkedCustomer.id } });
      }
      // Unlink customers managed by this user
      await tx.customer.updateMany({ where: { managerId: id }, data: { managerId: null } });
      // Unlink orders managed by this user
      await tx.order.updateMany({ where: { managerId: id }, data: { managerId: null } });
      // Remove manager assignments
      await tx.locationManagerAssignment.deleteMany({ where: { userId: id } });
      await tx.productManagerAssignment.deleteMany({ where: { userId: id } });
      await tx.user.delete({ where: { id } });
    });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
}
