import { NextResponse, type NextRequest } from "next/server";
import { isAddress, getAddress } from "viem";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import { CdpError, createOnrampSession, type OnrampNetwork } from "@/lib/cdp";

const SUPPORTED_NETWORKS: OnrampNetwork[] = ["base", "ethereum"];
const SUPPORTED_FIAT = new Set(["INR", "USD", "EUR", "GBP"]);

// CDP "trial mode" / sandbox: any partnerUserRef prefixed with "sandbox-"
// runs through Coinbase test rails without moving real funds. Toggle via env.
const SANDBOX_MODE = process.env.CDP_ONRAMP_SANDBOX === "true";
// MOCK_ONRAMP=true bypasses CDP entirely. Used to exercise the full UI +
// DB + polling loop while waiting for Onramp access approval. Mock status
// route walks CREATED → IN_PROGRESS → SUCCESS over ~30s.
const MOCK_MODE = process.env.MOCK_ONRAMP === "true";

interface SessionRequest {
  destinationAddress?: string;
  network?: string;
  fiatCurrency?: string;
  fiatAmount?: number;
  cryptoAmount?: number;
  paymentMethod?: string;
  country?: string;
  subdivision?: string;
}

function getClientIp(req: NextRequest): string | null {
  const forwarded = req.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0].trim();
  return req.headers.get("x-real-ip");
}

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  let body: SessionRequest;
  try {
    body = (await req.json()) as SessionRequest;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const rawAddress = body.destinationAddress?.trim();
  if (!rawAddress || !isAddress(rawAddress)) {
    return NextResponse.json({ error: "destinationAddress must be a valid 0x EVM address" }, { status: 400 });
  }
  const destinationAddress = getAddress(rawAddress) as `0x${string}`;

  const network = (body.network ?? "base").toLowerCase();
  if (!SUPPORTED_NETWORKS.includes(network as OnrampNetwork)) {
    return NextResponse.json({ error: `network must be one of ${SUPPORTED_NETWORKS.join(", ")}` }, { status: 400 });
  }

  const fiatCurrency = (body.fiatCurrency ?? "INR").toUpperCase();
  if (!SUPPORTED_FIAT.has(fiatCurrency)) {
    return NextResponse.json({ error: `fiatCurrency must be one of ${[...SUPPORTED_FIAT].join(", ")}` }, { status: 400 });
  }

  if (body.fiatAmount && body.cryptoAmount) {
    return NextResponse.json({ error: "Specify fiatAmount OR cryptoAmount, not both" }, { status: 400 });
  }
  if (body.fiatAmount !== undefined && (body.fiatAmount <= 0 || !Number.isFinite(body.fiatAmount))) {
    return NextResponse.json({ error: "fiatAmount must be a positive number" }, { status: 400 });
  }
  if (body.cryptoAmount !== undefined && (body.cryptoAmount <= 0 || !Number.isFinite(body.cryptoAmount))) {
    return NextResponse.json({ error: "cryptoAmount must be a positive number" }, { status: 400 });
  }

  // Verify destination is owned by the caller.
  const devKey = await prisma.developerKey.findUnique({
    where: { userId: user.id },
    select: { evmAddress: true },
  });
  const ownEvm = devKey?.evmAddress ? getAddress(devKey.evmAddress) : null;

  let entityId: string | null = null;
  if (ownEvm !== destinationAddress) {
    const entity = await prisma.entity.findFirst({
      where: {
        userId: user.id,
        walletAddress: { equals: destinationAddress, mode: "insensitive" },
      },
      select: { entityId: true },
    });
    if (!entity) {
      return NextResponse.json(
        { error: "destinationAddress does not belong to this user" },
        { status: 403 }
      );
    }
    entityId = entity.entityId;
  }

  const partnerUserRef = `${SANDBOX_MODE ? "sandbox-" : ""}${crypto.randomUUID()}`;

  const topup = await prisma.topUp.create({
    data: {
      userId: user.id,
      destinationAddress,
      entityId,
      partnerUserRef,
      network,
      asset: "USDC",
      fiatCurrency,
      fiatAmount: body.fiatAmount ?? null,
      cryptoAmount: body.cryptoAmount ?? null,
    },
  });

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? new URL(req.url).origin;
  const redirectUrl = `${appUrl}/dashboard/wallet?topup=${partnerUserRef}`;
  const clientIp = getClientIp(req);

  if (MOCK_MODE) {
    const mockUrl = `${appUrl}/api/onramp/mock?partnerUserRef=${partnerUserRef}`;
    await prisma.topUp.update({
      where: { id: topup.id },
      data: { onrampUrl: mockUrl },
    });
    return NextResponse.json({ partnerUserRef, onrampUrl: mockUrl, mock: true });
  }

  try {
    const { session } = await createOnrampSession({
      destinationAddress,
      destinationNetwork: network as OnrampNetwork,
      purchaseCurrency: "USDC",
      paymentCurrency: fiatCurrency,
      paymentAmount: body.fiatAmount ? String(body.fiatAmount) : undefined,
      purchaseAmount: body.cryptoAmount ? String(body.cryptoAmount) : undefined,
      country: body.country,
      subdivision: body.subdivision,
      partnerUserRef,
      redirectUrl,
      clientIp: clientIp ?? undefined,
    });

    await prisma.topUp.update({
      where: { id: topup.id },
      data: { onrampUrl: session.onrampUrl },
    });

    return NextResponse.json({
      partnerUserRef,
      onrampUrl: session.onrampUrl,
    });
  } catch (err) {
    const message = err instanceof CdpError ? err.message : "Failed to create onramp session";
    const status = err instanceof CdpError ? err.status : 500;
    await prisma.topUp.update({
      where: { id: topup.id },
      data: { status: "FAILED", errorMessage: message },
    });
    console.error("[onramp/session] CDP error:", err);
    return NextResponse.json({ error: message }, { status });
  }
}
