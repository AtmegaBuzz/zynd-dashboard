"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { User } from "@supabase/supabase-js";

export interface DeveloperInfo {
  developer_id: string;
  public_key: string;
  name: string;
  username?: string;
  role?: string;
  country?: string;
}

export function useAuth() {
  const supabaseRef = useRef(createClient());
  const supabase = supabaseRef.current;

  const [user, setUser] = useState<User | null>(null);
  const [developer, setDeveloper] = useState<DeveloperInfo | null>(null);
  const [ready, setReady] = useState(false);
  const [needsOnboarding, setNeedsOnboarding] = useState(false);

  // Get initial session and listen for changes
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      setReady(true);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      setReady(true);
    });

    return () => subscription.unsubscribe();
  }, [supabase]);

  // Fetch developer info — check if onboarding is needed
  useEffect(() => {
    if (!user) {
      setDeveloper(null);
      setNeedsOnboarding(false);
      return;
    }

    async function fetchDeveloper() {
      try {
        const res = await fetch("/api/developer/keys");
        if (res.ok) {
          const data = await res.json();
          if (data) {
            setDeveloper(data);
            // If developer exists but has no username, they need onboarding
            if (!data.username) {
              setNeedsOnboarding(true);
            }
            return;
          }
        }
        // No developer key at all — needs onboarding
        setNeedsOnboarding(true);
      } catch (err) {
        console.error("Failed to fetch developer:", err);
        setNeedsOnboarding(true);
      }
    }

    fetchDeveloper();
  }, [user]);

  const login = useCallback(() => {
    supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${window.location.origin}/auth/callback` },
    });
  }, [supabase]);

  const loginWithGithub = useCallback(() => {
    supabase.auth.signInWithOAuth({
      provider: "github",
      options: { redirectTo: `${window.location.origin}/auth/callback` },
    });
  }, [supabase]);

  const logout = useCallback(async () => {
    await supabase.auth.signOut();
    setUser(null);
    setDeveloper(null);
    setNeedsOnboarding(false);
  }, [supabase]);

  return {
    ready,
    authenticated: !!user,
    user,
    developer,
    needsOnboarding,
    login,
    loginWithGithub,
    logout,
  };
}
