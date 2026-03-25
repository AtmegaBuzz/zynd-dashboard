import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError) {
    console.error("[developer/keys] Auth error:", authError.message);
  }

  if (!user) {
    console.error("[developer/keys] No user in session");
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  console.log("[developer/keys] Looking up keys for user:", user.id);

  const devKey = await prisma.developerKey.findUnique({
    where: { userId: user.id },
    select: { developerId: true, publicKey: true, name: true },
  });

  if (!devKey) {
    console.log("[developer/keys] No key found for user:", user.id);
    return NextResponse.json(null, { status: 404 });
  }

  console.log("[developer/keys] Found key:", devKey.developerId);

  return NextResponse.json({
    developer_id: devKey.developerId,
    public_key: devKey.publicKey,
    name: devKey.name,
  });
}
