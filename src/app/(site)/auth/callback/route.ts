import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import type { Session } from "@supabase/supabase-js";

import { lookupMyCardHandle } from "@/lib/cards";
import { prisma } from "@/lib/prisma";
import { safeNextPath } from "@/lib/auth/next-cookie";
import { destinationAfterLogin } from "@/lib/auth/post-login";

async function lookupCardAndDeveloper(session: Session | null): Promise<{
  cardHandle: string | null;
  cardLookupFailed: boolean;
  hasDeveloperUsername: boolean;
}> {
  let cardHandle: string | null = null;
  let cardLookupFailed = false;
  if (session?.access_token) {
    const mine = await lookupMyCardHandle(session.access_token);
    cardHandle = mine.handle;
    cardLookupFailed = mine.failed;
  }

  let hasDeveloperUsername = false;
  if (session?.user?.id) {
    try {
      const dev = await prisma.developerKey.findUnique({
        where: { userId: session.user.id },
        select: { username: true },
      });
      hasDeveloperUsername = Boolean(dev?.username);
    } catch (err) {
      console.error("[auth/callback] developer lookup failed:", err);
    }
  }

  return { cardHandle, cardLookupFailed, hasDeveloperUsername };
}

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const cookieNext = safeNextPath(request.cookies.get("zynd_next")?.value);
  const queryNext = safeNextPath(searchParams.get("next"));
  const intent = request.cookies.get("zynd_intent")?.value;

  const clearAuthCookies = (res: NextResponse) => {
    res.cookies.delete("zynd_next");
    res.cookies.delete("zynd_intent");
  };

  if (!code) {
    const failure = NextResponse.redirect(`${origin}/auth?error=auth_callback_failed`);
    clearAuthCookies(failure);
    return failure;
  }

  const pending: { name: string; value: string; options?: Record<string, unknown> }[] = [];
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet: { name: string; value: string; options?: Record<string, unknown> }[]) {
          pending.push(...cookiesToSet);
        },
      },
    },
  );

  const { error } = await supabase.auth.exchangeCodeForSession(code);
  if (error) {
    const failure = NextResponse.redirect(`${origin}/auth?error=auth_callback_failed`);
    clearAuthCookies(failure);
    return failure;
  }

  const { data: { session } } = await supabase.auth.getSession();
  const lookup = await lookupCardAndDeveloper(session);
  const next = destinationAfterLogin({
    cookieNext,
    queryNext,
    intent,
    ...lookup,
  });
  const response = NextResponse.redirect(`${origin}${next}`);
  pending.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
  clearAuthCookies(response);
  return response;
}
