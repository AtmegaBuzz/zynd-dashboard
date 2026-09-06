import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";

const VALID_ROLES = new Set(["", "developer", "student", "researcher", "enterprise", "other"]);

interface ProfilePatch {
  name?: string;
  role?: string;
  country?: string;
}

export async function PATCH(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  let body: ProfilePatch;
  try {
    body = (await req.json()) as ProfilePatch;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const data: { name?: string; role?: string | null; country?: string | null } = {};

  if (body.name !== undefined) {
    const trimmed = body.name.trim();
    if (!trimmed) return NextResponse.json({ error: "name cannot be empty" }, { status: 400 });
    if (trimmed.length > 100) return NextResponse.json({ error: "name too long" }, { status: 400 });
    data.name = trimmed;
  }

  if (body.role !== undefined) {
    if (!VALID_ROLES.has(body.role)) {
      return NextResponse.json({ error: "Invalid role" }, { status: 400 });
    }
    data.role = body.role || null;
  }

  if (body.country !== undefined) {
    const trimmed = body.country.trim();
    if (trimmed.length > 100) return NextResponse.json({ error: "country too long" }, { status: 400 });
    data.country = trimmed || null;
  }

  if (Object.keys(data).length === 0) {
    return NextResponse.json({ error: "Nothing to update" }, { status: 400 });
  }

  try {
    const updated = await prisma.developerKey.update({
      where: { userId: user.id },
      data,
      select: { name: true, role: true, country: true, username: true, developerId: true },
    });
    return NextResponse.json({
      name: updated.name,
      role: updated.role,
      country: updated.country,
      username: updated.username,
      developer_id: updated.developerId,
    });
  } catch (err) {
    console.error("[developer/profile] update error:", err);
    return NextResponse.json({ error: "Developer profile not found" }, { status: 404 });
  }
}
