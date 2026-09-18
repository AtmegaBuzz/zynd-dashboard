import { NextResponse, type NextRequest } from "next/server";

/**
 * Do not call Supabase from Edge middleware.
 * When supabase.co returns Cloudflare 522, getUser() never finishes and
 * Vercel kills the isolate: 504 MIDDLEWARE_INVOCATION_TIMEOUT.
 * Session refresh stays in server components (getServerAuth / createClient).
 */
export function middleware(_request: NextRequest) {
  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard/:path*", "/auth/callback", "/onboard/:path*"],
};
