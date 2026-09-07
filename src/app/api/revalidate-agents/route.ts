import { revalidateTag } from "next/cache";
import { NextResponse } from "next/server";

// Public endpoint — no secret required. Revalidates only the agents-index
// cache tag, which is harmless: worst case a caller triggers a fresh fetch
// from api.zynd.ai. Called by the create flow after a new profile is published.
export async function POST() {
  revalidateTag("agents-index");
  return NextResponse.json({ revalidated: true });
}
