"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { User } from "@supabase/supabase-js";

export interface DeveloperInfo {
  developer_id: string;
  public_key: string;
  name: string;
}

export function useAuth() {
  const supabaseRef = useRef(createClient());
  const supabase = supabaseRef.current;

  const [user, setUser] = useState<User | null>(null);
  const [developer, setDeveloper] = useState<DeveloperInfo | null>(null);
  const [ready, setReady] = useState(false);
  const registerAttemptedRef = useRef(false);

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

  // Fetch developer info — auto-register if not found
  useEffect(() => {
    if (!user) {
      setDeveloper(null);
      registerAttemptedRef.current = false;
      return;
    }

    async function fetchOrRegister() {
      try {
        // Try to fetch existing developer key
        const res = await fetch("/api/developer/keys");
        if (res.ok) {
          const data = await res.json();
          if (data) {
            setDeveloper(data);
            return;
          }
        }

        // No key found — auto-register (only once per session)
        if (registerAttemptedRef.current) return;
        registerAttemptedRef.current = true;

        console.log("No developer key found, auto-registering...");
        const regRes = await fetch("/api/developer/register", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name: user?.email ?? "Developer" }),
        });

        if (regRes.ok) {
          const regData = await regRes.json();
          setDeveloper(regData);
        } else {
          const err = await regRes.json().catch(() => ({ error: "Registration failed" }));
          console.error("Developer registration failed:", err.error);
        }
      } catch (err) {
        console.error("Failed to fetch/register developer:", err);
      }
    }

    fetchOrRegister();
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
    registerAttemptedRef.current = false;
  }, [supabase]);

  return {
    ready,
    authenticated: !!user,
    user,
    developer,
    login,
    loginWithGithub,
    logout,
  };
}
