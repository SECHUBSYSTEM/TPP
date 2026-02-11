import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/api-auth";
import { hashPassword } from "@/lib/auth";
import { z } from "zod";
import { Role } from "@prisma/client";

const createUserSchema = z.object({
  username: z.string().min(1),
  name: z.string().optional(),
  password: z.string().min(1),
  role: z.enum(["ADMIN", "LOCATION_MANAGER", "PRODUCT_MANAGER", "CUSTOMER"]),
  locationIds: z.array(z.number()).optional(),
  productLineIds: z.array(z.number()).optional(),
  // When role is CUSTOMER: create linked Customer profile (name, email, location)
  customerName: z.string().min(1).optional(),
  customerEmail: z.string().email().optional(),
  customerLocationId: z.number().optional(),
});

export async function GET(request: NextRequest) {
  const out = await requireAdmin(request);
  if ("response" in out) return out.response;

  const users = await prisma.user.findMany({
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      username: true,
      name: true,
      role: true,
      createdAt: true,
      locationAssignments: { select: { locationId: true, location: { select: { name: true } } } },
      productLineAssignments: { select: { productLineId: true, productLine: { select: { name: true } } } },
      customerProfile: { select: { id: true } },
    },
  });
  return NextResponse.json(users);
}

export async function POST(request: NextRequest) {
  const out = await requireAdmin(request);
  if ("response" in out) return out.response;

  const parsed = createUserSchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid payload", details: parsed.error.flatten() }, { status: 400 });
  }
  const { username, name, password, role, locationIds, productLineIds, customerName, customerEmail, customerLocationId } = parsed.data;

  const existing = await prisma.user.findUnique({ where: { username } });
  if (existing) {
    return NextResponse.json({ error: "Username already exists" }, { status: 400 });
  }

  if (role === "CUSTOMER" && (customerName || customerEmail != null || customerLocationId != null)) {
    if (!customerName?.trim() || !customerEmail?.trim() || customerLocationId == null) {
      return NextResponse.json(
        { error: "For CUSTOMER role, customer name, email, and location are required to link to Customers table." },
        { status: 400 }
      );
    }
  }
  if (role === "LOCATION_MANAGER" && (!locationIds || locationIds.length === 0)) {
    return NextResponse.json(
      { error: "At least one location must be selected for a location manager." },
      { status: 400 }
    );
  }
  if (role === "PRODUCT_MANAGER" && (!productLineIds || productLineIds.length === 0)) {
    return NextResponse.json(
      { error: "At least one product line must be selected for a product manager." },
      { status: 400 }
    );
  }

  const passwordHash = await hashPassword(password);
  const user = await prisma.user.create({
    data: {
      username,
      name: name ?? null,
      passwordHash,
      role: role as Role,
      locationAssignments:
        role === "LOCATION_MANAGER" && locationIds?.length
          ? { create: locationIds.map((locationId) => ({ locationId })) }
          : undefined,
      productLineAssignments:
        role === "PRODUCT_MANAGER" && productLineIds?.length
          ? { create: productLineIds.map((productLineId) => ({ productLineId })) }
          : undefined,
    },
    select: {
      id: true,
      username: true,
      name: true,
      role: true,
      createdAt: true,
    },
  });

  if (role === "CUSTOMER" && customerName?.trim() && customerEmail?.trim() && customerLocationId != null) {
    try {
      await prisma.customer.create({
        data: {
          name: customerName.trim(),
          email: customerEmail.trim(),
          locationId: customerLocationId,
          userId: user.id,
        },
      });
    } catch {
      await prisma.user.delete({ where: { id: user.id } });
      return NextResponse.json({ error: "Customer profile could not be created (email may already exist)." }, { status: 400 });
    }
  }

  return NextResponse.json(user);
}
