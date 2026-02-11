import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/api-auth";
import { z } from "zod";

const createSchema = z.object({
  name: z.string().min(1),
  category: z.string().min(1),
  price: z.number().positive(),
  productLineId: z.number(),
});

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const productLineIdParam = searchParams.get("productLineId");
  const where =
    productLineIdParam != null && !Number.isNaN(Number(productLineIdParam))
      ? { productLineId: Number(productLineIdParam) }
      : {};
  const products = await prisma.product.findMany({
    where,
    include: { productLine: { select: { name: true } } },
    orderBy: { id: "desc" },
  });
  return NextResponse.json(products);
}

export async function POST(request: NextRequest) {
  const out = await requireAdmin(request);
  if ("response" in out) return out.response;

  const parsed = createSchema.safeParse(await request.json());
  if (!parsed.success) return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  const product = await prisma.product.create({
    data: {
      name: parsed.data.name,
      category: parsed.data.category,
      price: parsed.data.price,
      productLineId: parsed.data.productLineId,
    },
    include: { productLine: { select: { name: true } } },
  });
  return NextResponse.json(product);
}
