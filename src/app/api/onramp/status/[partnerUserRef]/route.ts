import { NextResponse, type NextRequest } from "next/server";
import crypto from "node:crypto";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import { CdpError, listOnrampTransactions, normaliseStatus, type OnrampTransaction } from "@/lib/cdp";

const MOCK_MODE = process.env.MOCK_ONRAMP === "true";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ partnerUserRef: string }> }
) {
  const { partnerUserRef } = await params;

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const topup = await prisma.topUp.findUnique({ where: { partnerUserRef } });
  if (!topup || topup.userId !== user.id) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  if (MOCK_MODE) {
    // Walk state machine based on row age:
    // 0-5s  → CREATED, 5-15s → IN_PROGRESS, 15s+ → SUCCESS
    const ageMs = Date.now() - topup.createdAt.getTime();
    let nextStatus: "CREATED" | "IN_PROGRESS" | "SUCCESS";
    if (ageMs < 5_000) nextStatus = "CREATED";
    else if (ageMs < 15_000) nextStatus = "IN_PROGRESS";
    else nextStatus = "SUCCESS";

    const fakeHash = topup.txHash ?? `0x${crypto.randomBytes(32).toString("hex")}`;
    if (nextStatus !== topup.status) {
      await prisma.topUp.update({
        where: { id: topup.id },
        data: {
          status: nextStatus,
          txHash: nextStatus === "SUCCESS" ? fakeHash : null,
          cryptoAmount: nextStatus === "SUCCESS" && topup.fiatAmount
            ? Number(topup.fiatAmount) * 0.012 // crude INR→USDC rate
            : topup.cryptoAmount,
        },
      });
    }
    return NextResponse.json({
      partnerUserRef,
      status: nextStatus,
      txHash: nextStatus === "SUCCESS" ? fakeHash : null,
      purchaseAmount: nextStatus === "SUCCESS" ? { value: String(Number(topup.fiatAmount ?? 0) * 0.012), currency: "USDC" } : null,
      paymentTotal: null,
      errorMessage: null,
      mock: true,
    });
  }

  let transactions: OnrampTransaction[];
  try {
    transactions = await listOnrampTransactions(partnerUserRef);
  } catch (err) {
    const status = err instanceof CdpError ? err.status : 500;
    const message = err instanceof CdpError ? err.message : "Failed to fetch onramp status";
    console.error("[onramp/status] CDP error:", err);
    return NextResponse.json({ error: message }, { status });
  }

  const latest = transactions[0];
  const mappedStatus = latest ? normaliseStatus(latest.status) : topup.status;

  if (latest && mappedStatus !== topup.status) {
    const purchase = latest.purchaseAmount ? Number(latest.purchaseAmount.value) : null;
    await prisma.topUp.update({
      where: { id: topup.id },
      data: {
        status: mappedStatus,
        txHash: latest.txHash ?? topup.txHash,
        errorMessage: latest.errorMessage ?? null,
        cryptoAmount: purchase !== null && !Number.isNaN(purchase) ? purchase : topup.cryptoAmount,
      },
    });
  }

  return NextResponse.json({
    partnerUserRef,
    status: mappedStatus,
    txHash: latest?.txHash ?? topup.txHash ?? null,
    purchaseAmount: latest?.purchaseAmount ?? null,
    paymentTotal: latest?.paymentTotal ?? null,
    errorMessage: latest?.errorMessage ?? topup.errorMessage ?? null,
  });
}
