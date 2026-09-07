import { revalidatePath } from "next/cache";
import { NextRequest, NextResponse } from "next/server";

// Lightweight shared token — NEXT_PUBLIC_ so the create page (client component)
// can read it without an extra API hop. Not a true secret (it's in the JS
// bundle), but it prevents trivial automated hammering.
export async function POST(req: NextRequest) {
  const token = process.env.NEXT_PUBLIC_REVALIDATE_AGENTS_TOKEN;
  if (token) {
    const incoming = req.headers.get("x-revalidate-token");
    if (incoming !== token) {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }
  }
  revalidatePath("/registry");
  return NextResponse.json({ revalidated: true });
}
