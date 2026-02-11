import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/api-auth";
import { z } from "zod";

const createSchema = z.object({ name: z.string().min(1) });

export async function GET() {
  const locations = await prisma.location.findMany({ orderBy: { id: "desc" } });
  return NextResponse.json(locations);
}

export async function POST(request: NextRequest) {
  const out = await requireAdmin(request);
  if ("response" in out) return out.response;

  const parsed = createSchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }
  const { name } = parsed.data;
  try {
    const location = await prisma.location.create({ data: { name } });
    return NextResponse.json(location);
  } catch {
    return NextResponse.json({ error: "Location name may already exist" }, { status: 400 });
  }
}
