"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";

export function DeveloperGate({ children }: { children: React.ReactNode }) {
  const { ready, needsOnboarding } = useAuth();
  const pathname = usePathname();

  useEffect(() => {
    if (!ready || !needsOnboarding) return;
    const next = pathname && pathname.startsWith("/") ? pathname : "/dashboard";
    window.location.replace(`/onboard/setup?next=${encodeURIComponent(next)}`);
  }, [ready, needsOnboarding, pathname]);

  if (!ready || needsOnboarding) {
    return (
      <div className="dashboard-page" style={{ padding: "48px 24px", color: "rgba(246,246,246,0.6)" }}>
        Redirecting to developer setup…
      </div>
    );
  }

  return children;
}
