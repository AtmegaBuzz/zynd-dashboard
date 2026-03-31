import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";

const REGISTRY_URL = process.env.AGENTDNS_REGISTRY_URL;

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError) {
    console.error("[zns/verify POST] Auth error:", authError.message);
  }

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!REGISTRY_URL) {
    return NextResponse.json({ error: "Registry not configured" }, { status: 500 });
  }

  let body: { handle: string; method: string; proof: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  if (!body.handle || !body.method || !body.proof) {
    return NextResponse.json({ error: "handle, method, and proof are required" }, { status: 400 });
  }

  if (body.method !== "dns" && body.method !== "github") {
    return NextResponse.json({ error: "method must be 'dns' or 'github'" }, { status: 400 });
  }

  // Verify the user owns this handle
  const devKey = await prisma.developerKey.findUnique({
    where: { userId: user.id },
    select: { developerId: true },
  });

  if (!devKey) {
    return NextResponse.json({ error: "Developer not registered" }, { status: 404 });
  }

  try {
    const res = await fetch(`${REGISTRY_URL}/v1/handles/${encodeURIComponent(body.handle)}/verify`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        method: body.method,
        proof: body.proof,
      }),
    });

    const responseText = await res.text();
    if (!res.ok) {
      console.error("[zns/verify POST] Registry error:", res.status, responseText);
      let errMsg = "Verification failed";
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

    return NextResponse.json(data);
  } catch (err) {
    console.error("[zns/verify POST] Error:", (err as Error).message);
    return NextResponse.json({ error: "Failed to verify handle" }, { status: 502 });
  }
}
