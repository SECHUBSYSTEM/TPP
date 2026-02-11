import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/api-auth";
import { z } from "zod";

const createSchema = z.object({ name: z.string().min(1) });

export async function GET() {
  const productLines = await prisma.productLine.findMany({
    orderBy: { id: "desc" },
    include: { _count: { select: { products: true } } },
  });
  return NextResponse.json(productLines);
}

export async function POST(request: NextRequest) {
  const out = await requireAdmin(request);
  if ("response" in out) return out.response;

  const parsed = createSchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }
  try {
    const productLine = await prisma.productLine.create({ data: { name: parsed.data.name } });
    return NextResponse.json(productLine);
  } catch {
    return NextResponse.json({ error: "Product line name may already exist" }, { status: 400 });
  }
}
