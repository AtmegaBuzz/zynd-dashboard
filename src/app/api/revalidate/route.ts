import { revalidatePath } from "next/cache";
import { NextRequest, NextResponse } from "next/server";
import { timingSafeEqual } from "crypto";

const ALLOWED_PATHS = new Set(["/", "/sitemap.xml", "/directory", "/find"]);

function validSecret(incoming: string | null): boolean {
  const expected = process.env.VERCEL_REVALIDATE_SECRET;
  if (!expected || !incoming) return false;
  try {
    const a = Buffer.from(incoming);
    const b = Buffer.from(expected);
    return a.length === b.length && timingSafeEqual(a, b);
  } catch {
    return false;
  }
}

export async function POST(req: NextRequest) {
  if (!validSecret(req.headers.get("x-revalidate-secret"))) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const body = await req.json().catch(() => ({}));
  const paths: string[] = (body.paths ?? []).filter(
    (p: unknown) => typeof p === "string" && ALLOWED_PATHS.has(p)
  );

  for (const path of paths) revalidatePath(path);

  return NextResponse.json({ revalidated: true, paths });
}
