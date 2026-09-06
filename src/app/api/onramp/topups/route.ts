import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const topups = await prisma.topUp.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
    take: 20,
    select: {
      id: true,
      partnerUserRef: true,
      destinationAddress: true,
      entityId: true,
      network: true,
      asset: true,
      fiatCurrency: true,
      fiatAmount: true,
      cryptoAmount: true,
      status: true,
      txHash: true,
      createdAt: true,
    },
  });

  return NextResponse.json({
    topups: topups.map((t) => ({
      ...t,
      fiatAmount: t.fiatAmount?.toString() ?? null,
      cryptoAmount: t.cryptoAmount?.toString() ?? null,
      createdAt: t.createdAt.toISOString(),
    })),
  });
}
