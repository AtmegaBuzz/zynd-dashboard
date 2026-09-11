import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  // Preferred: the destination set in the `zynd_next` cookie before OAuth
  // started. Fallback: `?next=` query param. Either way, only allow
  // same-origin relative paths — an absolute value (e.g.
  // `?next=http://localhost:3000`) must never bounce users off the
  // production origin right after signing in.
  const rawNext = request.cookies.get("zynd_next")?.value ?? searchParams.get("next") ?? "/dashboard";
  const next =
    rawNext.startsWith("/") && !rawNext.startsWith("//") && !rawNext.includes("\\")
      ? rawNext
      : "/dashboard";

  if (code) {
    const response = NextResponse.redirect(`${origin}${next}`);
    response.cookies.delete("zynd_next");

    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return request.cookies.getAll();
          },
          setAll(cookiesToSet: { name: string; value: string; options?: Record<string, unknown> }[]) {
            cookiesToSet.forEach(({ name, value, options }) =>
              response.cookies.set(name, value, options)
            );
          },
        },
      }
    );

    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      return response;
    }
  }

  const failure = NextResponse.redirect(`${origin}/auth?error=auth_callback_failed`);
  failure.cookies.delete("zynd_next");
  return failure;
}
