import { NextResponse, type NextRequest } from "next/server";
import { createPublicClient, http, isAddress, formatUnits, erc20Abi, getAddress } from "viem";
import { base, mainnet } from "viem/chains";

const USDC_BY_NETWORK = {
  base: "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913", // Circle USDC, Base mainnet
  ethereum: "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48", // Circle USDC, Ethereum mainnet
} as const;

type NetworkKey = keyof typeof USDC_BY_NETWORK;

const RPC_BY_NETWORK: Record<NetworkKey, string> = {
  base: process.env.BASE_RPC_URL || "https://mainnet.base.org",
  ethereum: process.env.ETHEREUM_RPC_URL || "https://eth.llamarpc.com",
};

const CHAIN_BY_NETWORK = { base, ethereum: mainnet };

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const address = searchParams.get("address");
  const network = (searchParams.get("network") ?? "base") as NetworkKey;

  if (!address || !isAddress(address)) {
    return NextResponse.json({ error: "address query param required" }, { status: 400 });
  }
  if (!USDC_BY_NETWORK[network]) {
    return NextResponse.json({ error: "network must be base or ethereum" }, { status: 400 });
  }

  const client = createPublicClient({
    chain: CHAIN_BY_NETWORK[network],
    transport: http(RPC_BY_NETWORK[network]),
  });

  try {
    const raw = await client.readContract({
      address: USDC_BY_NETWORK[network],
      abi: erc20Abi,
      functionName: "balanceOf",
      args: [getAddress(address)],
    });

    return NextResponse.json(
      {
        address: getAddress(address),
        network,
        asset: "USDC",
        raw: raw.toString(),
        formatted: formatUnits(raw, 6),
      },
      { headers: { "Cache-Control": "public, max-age=5, s-maxage=5" } }
    );
  } catch (err) {
    console.error("[wallet/balance] RPC error:", err);
    return NextResponse.json({ error: "Failed to read balance" }, { status: 502 });
  }
}
