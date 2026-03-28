"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { AccentCorners } from "@/components/ui/AccentCorners";
import { GridTripod } from "@/components/ui/GridTripod";
import { Input } from "@/components/ui/Input";

const ROLES = [
  { value: "developer", label: "Developer", description: "Building agents and tools" },
  { value: "student", label: "Student", description: "Learning and experimenting" },
  { value: "researcher", label: "Researcher", description: "AI/ML research" },
  { value: "enterprise", label: "Enterprise", description: "Building for an organization" },
  { value: "other", label: "Other", description: "Something else" },
];

export default function OnboardSetupPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  // Form fields
  const [name, setName] = useState("");
  const [username, setUsername] = useState("");
  const [role, setRole] = useState("");

  // Username availability
  const [usernameStatus, setUsernameStatus] = useState<
    "idle" | "checking" | "available" | "taken"
  >("idle");
  const [usernameError, setUsernameError] = useState("");
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  // Check if user is authenticated
  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) {
        router.push("/auth");
        return;
      }
      // Pre-fill name from Google profile
      const meta = user.user_metadata;
      if (meta?.full_name) setName(meta.full_name);
      else if (meta?.name) setName(meta.name);
      setLoading(false);
    });
  }, [router]);

  // Debounced username availability check
  const checkUsername = useCallback((value: string) => {
    if (debounceRef.current) clearTimeout(debounceRef.current);

    if (!value || value.length < 3) {
      setUsernameStatus("idle");
      setUsernameError("");
      return;
    }

    setUsernameStatus("checking");
    setUsernameError("");

    debounceRef.current = setTimeout(async () => {
      try {
        const res = await fetch(
          `/api/developer/username-check?username=${encodeURIComponent(value)}`
        );
        const data = await res.json();
        if (data.available) {
          setUsernameStatus("available");
          setUsernameError("");
        } else {
          setUsernameStatus("taken");
          setUsernameError(data.reason || "Username is not available");
        }
      } catch {
        setUsernameStatus("idle");
        setUsernameError("Failed to check availability");
      }
    }, 400);
  }, []);

  const handleUsernameChange = (value: string) => {
    // Force lowercase, strip invalid chars
    const cleaned = value.toLowerCase().replace(/[^a-z0-9-]/g, "");
    setUsername(cleaned);
    checkUsername(cleaned);
  };

  const handleSubmit = async () => {
    setError("");

    if (!name.trim()) {
      setError("Name is required");
      return;
    }
    if (!username || username.length < 3) {
      setError("Username must be at least 3 characters");
      return;
    }
    if (usernameStatus !== "available") {
      setError("Please choose an available username");
      return;
    }
    if (!role) {
      setError("Please select your role");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/developer/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim(), username, role }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({ error: "Registration failed" }));
        setError(data.error || "Registration failed");
        setSubmitting(false);
        return;
      }

      // Success — redirect to dashboard
      router.push("/dashboard");
    } catch (err) {
      setError("Something went wrong. Please try again.");
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-black">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-white/10 border-t-[var(--color-accent)]" />
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-black">
      <div className="padding-global">
        <div className="container">
          <div
            className="relative flex min-h-screen items-center justify-center"
            style={{ paddingTop: "1.5rem", paddingBottom: "4rem" }}
          >
            <div className="w-full max-w-lg">
              <div
                className="solution-card-wrap"
                style={{ position: "relative", top: "auto", padding: 0 }}
              >
                <div
                  className="solution-card"
                  style={{
                    display: "block",
                    gridTemplateColumns: "none",
                    minHeight: "auto",
                    gap: 0,
                    padding: 0,
                    position: "relative",
                    zIndex: 5,
                    backgroundColor: "transparent",
                    border: "none",
                    borderRadius: 0,
                  }}
                >
                  <div style={{ padding: "2.5rem" }}>
                    {/* Header */}
                    <div className="mb-8 text-center">
                      <p
                        style={{
                          fontSize: "clamp(1.5rem, 3vw, 2rem)",
                          fontWeight: 700,
                          color: "white",
                          margin: 0,
                          lineHeight: 1.2,
                        }}
                      >
                        Set up your{" "}
                        <span style={{ color: "var(--color-accent)" }}>identity</span>
                      </p>
                      <p className="mt-2 text-sm text-white/40">
                        Your username becomes your permanent developer identity
                      </p>
                    </div>

                    {/* Form */}
                    <div className="flex flex-col gap-5">
                      {/* Name */}
                      <Input
                        label="Display Name"
                        placeholder="Alice Johnson"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                      />

                      {/* Username */}
                      <div className="flex flex-col gap-1.5">
                        <label className="text-sm text-white/50">
                          Username{" "}
                          <span className="text-white/25">(permanent, cannot be changed)</span>
                        </label>
                        <div className="relative">
                          <input
                            className={`w-full border bg-transparent px-3 py-2 text-sm text-white outline-none transition-colors placeholder:text-white/25 ${
                              usernameStatus === "taken"
                                ? "border-red-500/40 focus:border-red-500"
                                : usernameStatus === "available"
                                  ? "border-emerald-500/40 focus:border-emerald-500"
                                  : "border-white/[0.08] focus:border-[var(--color-accent)]/40"
                            }`}
                            placeholder="acme-corp"
                            value={username}
                            onChange={(e) => handleUsernameChange(e.target.value)}
                            maxLength={40}
                          />
                          {/* Status indicator */}
                          <div className="absolute right-3 top-1/2 -translate-y-1/2">
                            {usernameStatus === "checking" && (
                              <div className="h-4 w-4 animate-spin rounded-full border-2 border-white/10 border-t-[var(--color-accent)]" />
                            )}
                            {usernameStatus === "available" && (
                              <svg className="h-4 w-4 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                              </svg>
                            )}
                            {usernameStatus === "taken" && (
                              <svg className="h-4 w-4 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                              </svg>
                            )}
                          </div>
                        </div>
                        {usernameError && (
                          <p className="text-xs text-red-400">{usernameError}</p>
                        )}
                        {usernameStatus === "available" && (
                          <p className="text-xs text-emerald-400">Username is available</p>
                        )}
                      </div>

                      {/* Role */}
                      <div className="flex flex-col gap-1.5">
                        <label className="text-sm text-white/50">Who are you?</label>
                        <div className="grid grid-cols-1 gap-2">
                          {ROLES.map((r) => (
                            <button
                              key={r.value}
                              type="button"
                              onClick={() => setRole(r.value)}
                              className={`flex items-center gap-3 border px-4 py-3 text-left text-sm transition-all ${
                                role === r.value
                                  ? "border-[var(--color-accent)]/40 bg-[var(--color-accent)]/10 text-white"
                                  : "border-white/[0.08] bg-transparent text-white/60 hover:border-white/20 hover:text-white"
                              }`}
                            >
                              <div
                                className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border ${
                                  role === r.value
                                    ? "border-[var(--color-accent)] bg-[var(--color-accent)]"
                                    : "border-white/20"
                                }`}
                              >
                                {role === r.value && (
                                  <div className="h-2 w-2 rounded-full bg-white" />
                                )}
                              </div>
                              <div>
                                <div className="font-medium">{r.label}</div>
                                <div className="text-xs text-white/40">{r.description}</div>
                              </div>
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Error */}
                      {error && (
                        <p className="text-center text-sm text-red-400">{error}</p>
                      )}

                      {/* Submit */}
                      <button
                        onClick={handleSubmit}
                        disabled={submitting || usernameStatus !== "available" || !name.trim() || !role}
                        className="mt-2 w-full bg-[var(--color-accent)] py-3.5 text-sm font-bold text-white transition-all hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-40"
                      >
                        {submitting ? (
                          <span className="flex items-center justify-center gap-2">
                            <div className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                            Creating identity...
                          </span>
                        ) : (
                          "Create Developer Identity"
                        )}
                      </button>

                      <p className="text-center text-xs text-white/25">
                        Your username will be part of your agent URLs and cannot be changed later.
                      </p>
                    </div>
                  </div>
                </div>
                <div className="accent-border-overlay" />
                <div className="accent-background" />
                <div className="events-none absolute">
                  <AccentCorners />
                </div>
                <GridTripod corner="left-top-corner" />
                <GridTripod corner="right-top-corner" />
                <GridTripod corner="left-bottom-corner" />
                <GridTripod corner="right-bottom-corner" />
                <div className="main-hero-bottom-line" />
                <div className="main-hero-top-line" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
