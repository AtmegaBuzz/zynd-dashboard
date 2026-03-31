import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import { decryptPrivateKey } from "@/lib/pki";
import crypto from "crypto";

const REGISTRY_URL = process.env.AGENTDNS_REGISTRY_URL;

async function getDeveloperKey(userId: string) {
  return prisma.developerKey.findUnique({
    where: { userId },
    select: {
      developerId: true,
      publicKey: true,
      privateKeyEnc: true,
    },
  });
}

export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError) {
    console.error("[zns/handles GET] Auth error:", authError.message);
  }

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!REGISTRY_URL) {
    return NextResponse.json({ error: "Registry not configured" }, { status: 500 });
  }

  const devKey = await getDeveloperKey(user.id);
  if (!devKey) {
    return NextResponse.json({ error: "Developer not registered" }, { status: 404 });
  }

  try {
    const res = await fetch(`${REGISTRY_URL}/v1/developers/${encodeURIComponent(devKey.developerId)}`);
    if (!res.ok) {
      if (res.status === 404) {
        return NextResponse.json(null, { status: 200 });
      }
      const text = await res.text();
      console.error("[zns/handles GET] Registry error:", res.status, text);
      return NextResponse.json({ error: "Registry error" }, { status: res.status });
    }

    const data = await res.json();

    if (!data.dev_handle) {
      return NextResponse.json(null, { status: 200 });
    }

    return NextResponse.json({
      handle: data.dev_handle,
      verified: data.dev_handle_verified ?? false,
      verification_method: data.verification_method ?? null,
      verification_proof: data.verification_proof ?? null,
      public_key: data.public_key,
    });
  } catch (err) {
    console.error("[zns/handles GET] Error:", (err as Error).message);
    return NextResponse.json({ error: "Failed to fetch handle" }, { status: 502 });
  }
}

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError) {
    console.error("[zns/handles POST] Auth error:", authError.message);
  }

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!REGISTRY_URL) {
    return NextResponse.json({ error: "Registry not configured" }, { status: 500 });
  }

  let body: { handle: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  if (!body.handle) {
    return NextResponse.json({ error: "handle is required" }, { status: 400 });
  }

  const devKey = await getDeveloperKey(user.id);
  if (!devKey) {
    return NextResponse.json({ error: "Developer not registered" }, { status: 404 });
  }

  if (!devKey.privateKeyEnc) {
    return NextResponse.json({ error: "Private key not found" }, { status: 500 });
  }

  // Decrypt private key and sign
  let signature: string;
  try {
    const rawPrivKeyB64 = decryptPrivateKey(devKey.privateKeyEnc);
    // Go's ed25519.PrivateKey is 64 bytes: 32-byte seed || 32-byte public key
    const privKeyBytes = Buffer.from(rawPrivKeyB64, "base64");

    // The payload to sign (matches agent-dns server.go handleClaimHandle)
    // Note: JSON.stringify with sorted keys is not guaranteed — Go uses sorted map keys
    // The server signs: json.Marshal(map[string]string{handle, developer_id, public_key})
    // Go's json.Marshal sorts map keys alphabetically, so order is: developer_id, handle, public_key
    const signable = JSON.stringify({
      developer_id: devKey.developerId,
      handle: body.handle,
      public_key: devKey.publicKey,
    });

    // Build PKCS8 DER wrapper for Ed25519 seed (first 32 bytes of 64-byte key)
    // PKCS8 header for Ed25519: 302e020100300506032b657004220420 (16 bytes) + 32-byte seed
    const seed = privKeyBytes.subarray(0, 32);
    const pkcs8Header = Buffer.from("302e020100300506032b657004220420", "hex");
    const pkcs8Der = Buffer.concat([pkcs8Header, seed]);

    const privKeyObj = crypto.createPrivateKey({
      key: pkcs8Der,
      format: "der",
      type: "pkcs8",
    });

    const sigBuffer = crypto.sign(null, Buffer.from(signable, "utf8"), privKeyObj);
    signature = "ed25519:" + sigBuffer.toString("base64");
  } catch (err) {
    console.error("[zns/handles POST] Signing error:", (err as Error).message);
    return NextResponse.json({ error: "Failed to sign request" }, { status: 500 });
  }

  try {
    const res = await fetch(`${REGISTRY_URL}/v1/handles`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        handle: body.handle,
        developer_id: devKey.developerId,
        public_key: devKey.publicKey,
        signature,
      }),
    });

    const responseText = await res.text();
    if (!res.ok) {
      console.error("[zns/handles POST] Registry error:", res.status, responseText);
      let errMsg = "Registry error";
      try {
        const errData = JSON.parse(responseText);
        errMsg = errData.error || errMsg;
      } catch {
        errMsg = responseText || errMsg;
      }
      return NextResponse.json({ error: errMsg }, { status: res.status });
    }

    let data;
    try {
      data = JSON.parse(responseText);
    } catch {
      data = { message: responseText };
    }

    return NextResponse.json(data, { status: 201 });
  } catch (err) {
    console.error("[zns/handles POST] Error:", (err as Error).message);
    return NextResponse.json({ error: "Failed to claim handle" }, { status: 502 });
  }
}
