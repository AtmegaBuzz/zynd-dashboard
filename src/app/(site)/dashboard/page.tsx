"use client";

import Link from "next/link";
import { useAuth } from "@/hooks/useAuth";
import { useMyCard } from "@/hooks/useMyCard";

export default function DashboardPage() {
  const { ready, user, developer, needsOnboarding } = useAuth();
  const { ready: cardReady, handle } = useMyCard();

  if (!ready || !cardReady) {
    return (
      <div className="dashboard-page" style={{ padding: "48px 24px", color: "rgba(246,246,246,0.6)" }}>
        Loading…
      </div>
    );
  }

  if (needsOnboarding) {
    return (
      <div className="dashboard-page">
        <div className="dashboard-header">
          <div>
            <h1>Welcome to Zynd</h1>
            <p>Your account is signed in. Pick up your living profile, or set up developer API keys when you need them.</p>
          </div>
        </div>
        <div className="dashboard-grid-2col">
          <div className="dashboard-card">
            <h2>Living profile</h2>
            <p style={{ color: "rgba(246,246,246,0.7)", fontSize: "14px", lineHeight: 1.6 }}>
              {handle
                ? "Your profile card is live. Open it to view or edit."
                : "Create a living profile from GitHub, LinkedIn, X, and your site."}
            </p>
            <Link
              href={handle ? `/p/${encodeURIComponent(handle)}` : "/create"}
              style={{
                display: "inline-block", marginTop: "16px", padding: "10px 16px",
                background: "#8B5CF6", color: "#fff", borderRadius: "8px",
                fontWeight: 600, fontSize: "14px", textDecoration: "none",
              }}
            >
              {handle ? "Open my profile →" : "Create a profile →"}
            </Link>
          </div>
          <div className="dashboard-card">
            <h2>Developer API</h2>
            <p style={{ color: "rgba(246,246,246,0.7)", fontSize: "14px", lineHeight: 1.6 }}>
              Need keys, entities, wallet, or the CLI? Set a developer username first. This is optional if you only want a profile card.
            </p>
            <Link
              href="/onboard/setup?next=/dashboard"
              style={{
                display: "inline-block", marginTop: "16px", padding: "10px 16px",
                border: "1px solid rgba(139,92,246,0.4)", color: "#c4b5fd",
                borderRadius: "8px", fontWeight: 600, fontSize: "14px", textDecoration: "none",
              }}
            >
              Set up API keys →
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard-page">
      <div className="dashboard-header">
        <div>
          <h1>Developer Identity</h1>
          <p>Your ZyndAI developer profile and credentials</p>
        </div>
      </div>

      <div className="dashboard-grid-2col">
        <div className="dashboard-card">
          <h2>Profile</h2>
          <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            <div>
              <label className="dashboard-label">Display Name</label>
              <p style={{ margin: "8px 0 0 0", fontSize: "16px", fontWeight: 500 }}>
                {developer?.name || "—"}
              </p>
            </div>
            <div>
              <label className="dashboard-label">Username</label>
              <p style={{ margin: "8px 0 0 0", fontSize: "16px", fontWeight: 500 }}>
                @{developer?.username || "—"}
              </p>
            </div>
            <div>
              <label className="dashboard-label">Email</label>
              <p style={{ margin: "8px 0 0 0", fontSize: "16px", fontWeight: 500 }}>
                {user?.email}
              </p>
            </div>
            <div>
              <label className="dashboard-label">Role</label>
              <p style={{ margin: "8px 0 0 0" }}>
                {developer?.role ? (
                  <span className="dashboard-badge badge-active">{developer.role}</span>
                ) : "—"}
              </p>
            </div>
          </div>
        </div>

        <div className="dashboard-card">
          <h2>Developer ID</h2>
          <div style={{
            padding: "16px",
            backgroundColor: "rgba(139, 92, 246, 0.05)",
            border: "1px solid rgba(139, 92, 246, 0.15)",
            borderRadius: "6px",
            fontFamily: "monospace",
            fontSize: "12px",
            color: "rgba(246, 246, 246, 0.8)",
            wordBreak: "break-all" as const,
            marginBottom: "16px",
          }}>
            {developer?.developer_id || "—"}
          </div>
          <p style={{ fontSize: "12px", color: "rgba(246, 246, 246, 0.6)" }}>
            Use this ID to authenticate requests to the ZyndAI API.
          </p>
        </div>
      </div>

      <div className="dashboard-card">
        <h2>API Credentials</h2>
        {developer?.public_key ? (
          <div>
            <div className="dashboard-form-group">
              <label className="dashboard-label">Public Key</label>
              <div style={{
                background: "rgba(139, 92, 246, 0.05)",
                border: "1px solid rgba(139, 92, 246, 0.15)",
                borderRadius: "6px",
                padding: "12px",
                fontFamily: "monospace",
                fontSize: "11px",
                color: "rgba(246, 246, 246, 0.8)",
                wordBreak: "break-all" as const,
                maxHeight: "120px",
                overflow: "auto",
              }}>
                {developer.public_key}
              </div>
            </div>
            <div style={{
              padding: "16px",
              backgroundColor: "rgba(59, 130, 246, 0.1)",
              border: "1px solid rgba(59, 130, 246, 0.2)",
              borderRadius: "6px",
              fontSize: "13px",
              color: "rgba(246, 246, 246, 0.8)",
            }}>
              <strong>Security Notice:</strong> Your private key is encrypted and stored securely.
            </div>
          </div>
        ) : (
          <p style={{ color: "rgba(246, 246, 246, 0.6)" }}>
            API credentials will be generated once you create your first entity.
          </p>
        )}
      </div>

      <div className="dashboard-card">
        <h2>Quick Links</h2>
        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
          gap: "16px",
        }}>
          {[
            { href: "/registry", label: "Browse Agents" },
            { href: "/dashboard/entities", label: "My Entities" },
          ].map((link) => (
            <a key={link.href} href={link.href} style={{
              display: "block", padding: "16px",
              background: "rgba(139, 92, 246, 0.1)",
              border: "1px solid rgba(139, 92, 246, 0.2)",
              borderRadius: "6px", color: "var(--color-accent)",
              textDecoration: "none", fontWeight: 500, fontSize: "14px",
              textAlign: "center", transition: "all 0.2s",
            }}>
              {link.label}
            </a>
          ))}
        </div>
      </div>

      <div className="dashboard-card">
        <h2>Getting Started</h2>
        <ol style={{
          marginTop: "12px", paddingLeft: "20px",
          fontSize: "14px", lineHeight: 1.8,
          color: "rgba(246, 246, 246, 0.7)",
        }}>
          <li>Create your first entity from the Entities page</li>
          <li>Get your public & private keys from your entity settings</li>
          <li>Use your credentials to authenticate API requests</li>
          <li>Deploy your entity and start earning from interactions</li>
        </ol>
      </div>
    </div>
  );
}
