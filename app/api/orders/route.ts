import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAuth } from "@/lib/api-auth";
import { orderScopeWhere } from "@/lib/rbac";
import { z } from "zod";

const createOrderSchema = z.object({
  customerId: z.number().optional(),
  items: z.array(z.object({ productId: z.number(), quantity: z.number().int().positive() })),
});

type CreateOrderItemInput = z.infer<typeof createOrderSchema>["items"][number];
type OrderItemWithPrice = CreateOrderItemInput & { unitPrice: number };

export async function GET(request: NextRequest) {
  const out = await requireAuth(request);
  if ("response" in out) return out.response;
  const where = orderScopeWhere(out.session);
  const orders = await prisma.order.findMany({
    where,
    include: {
      customer: { select: { id: true, name: true, email: true, location: { select: { name: true } } } },
      items: { include: { product: { select: { name: true, price: true, productLine: { select: { name: true } } } } } },
    },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json(orders);
}

export async function POST(request: NextRequest) {
  const out = await requireAuth(request);
  if ("response" in out) return out.response;
  const parsed = createOrderSchema.safeParse(await request.json());
  if (!parsed.success) return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  const { customerId: bodyCustomerId, items } = parsed.data;

  let customerId = bodyCustomerId;
  if (out.session.role === "CUSTOMER") {
    if (bodyCustomerId != null && bodyCustomerId !== out.session.customerId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    customerId = out.session.customerId ?? undefined;
    if (customerId == null) return NextResponse.json({ error: "No customer profile linked" }, { status: 400 });
  }
  if (customerId == null) return NextResponse.json({ error: "customerId required" }, { status: 400 });

  const products = await prisma.product.findMany({
    where: { id: { in: items.map((i: CreateOrderItemInput) => i.productId) } },
    select: { id: true, price: true },
  });
  type ProductIdPrice = (typeof products)[number];
  const productMap = new Map<number, ProductIdPrice>(products.map((p: ProductIdPrice) => [p.id, p]));
  let totalAmount = 0;
  const itemData: OrderItemWithPrice[] = items.map((i: CreateOrderItemInput) => {
    const product = productMap.get(i.productId);
    if (!product) throw new Error(`Product ${i.productId} not found`);
    const unitPrice = Number(product.price);
    totalAmount += unitPrice * i.quantity;
    return { productId: i.productId, quantity: i.quantity, unitPrice };
  });

  const order = await prisma.order.create({
    data: {
      customerId,
      totalAmount,
      status: "PENDING",
      items: {
        create: itemData.map((i: OrderItemWithPrice) => ({ ...i, unitPrice: i.unitPrice })),
      },
    },
    include: {
      customer: { select: { name: true, email: true } },
      items: { include: { product: { select: { name: true } } } },
    },
  });
  return NextResponse.json(order);
}
