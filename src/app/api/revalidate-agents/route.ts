import { revalidateTag } from "next/cache";
import { NextRequest, NextResponse } from "next/server";

// Lightweight shared token — NEXT_PUBLIC_ so the create page (client component)
// can read it without an extra API hop. Not a true secret (it's in the JS
// bundle), but it prevents trivial automated hammering. Vercel also deduplicates
// concurrent revalidations so the upstream fetch to api.zynd.ai is only made
// once per stale window regardless of call volume.
export async function POST(req: NextRequest) {
  const token = process.env.NEXT_PUBLIC_REVALIDATE_AGENTS_TOKEN;
  if (token) {
    const incoming = req.headers.get("x-revalidate-token");
    if (incoming !== token) {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }
  }
  revalidateTag("agents-index");
  return NextResponse.json({ revalidated: true });
}
