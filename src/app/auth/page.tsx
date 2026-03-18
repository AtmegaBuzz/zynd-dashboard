"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { AccentCorners } from "@/components/ui/AccentCorners";
import { GridTripod } from "@/components/ui/GridTripod";
import { useAuth } from "@/hooks/useAuth";

export default function AuthPage() {
  const router = useRouter();
  const { ready, authenticated, registryToken, login } = useAuth();

  useEffect(() => {
    if (ready && authenticated && registryToken) {
      router.push("/dashboard");
    }
  }, [ready, authenticated, registryToken, router]);

  useEffect(() => {
    if (ready && !authenticated) {
      login();
    }
  }, [ready, authenticated, login]);

  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-black">
        <div className="padding-global">
          <div className="container">
            <div
              className="relative flex min-h-[calc(100vh-4rem)] items-center justify-center"
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
                          Welcome to{" "}
                          <span style={{ color: "var(--color-accent)" }}>
                            ZyndAI
                          </span>
                        </p>
                        <p className="mt-2 text-sm text-white/40">
                          Sign in with Google, X, email, or your wallet
                        </p>
                      </div>

                      <div className="flex flex-col items-center gap-4 py-8">
                        {!ready ? (
                          <div className="flex items-center gap-2 text-white/40">
                            <div className="h-4 w-4 animate-spin rounded-full border-2 border-white/10 border-t-[var(--color-accent)]" />
                            Loading...
                          </div>
                        ) : authenticated && registryToken ? (
                          <p className="text-sm text-white/60">
                            Redirecting to dashboard...
                          </p>
                        ) : (
                          <button
                            onClick={login}
                            className="flex w-full items-center justify-center gap-2 bg-[var(--color-accent)] py-3.5 text-sm font-bold text-white transition-all hover:brightness-110"
                          >
                            Sign In
                          </button>
                        )}
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

              <div className="middle-hero-right-second-line is-hide-mb" />
              <div className="middle-hero-second-line is-hide-mb" />
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
