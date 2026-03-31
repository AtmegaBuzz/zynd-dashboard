"use client";

import { useState, useEffect, useCallback } from "react";
import { AtSign, CheckCircle, Globe, Github, AlertCircle } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { Badge } from "@/components/ui/Badge";
import { Input } from "@/components/ui/Input";
import { Skeleton } from "@/components/ui/Skeleton";

interface HandleData {
  handle: string;
  verified: boolean;
  verification_method: string | null;
  verification_proof: string | null;
  public_key: string;
}

type VerifyMethod = "dns" | "github";

export default function HandlesPage() {
  const { authenticated } = useAuth();
  const [handleData, setHandleData] = useState<HandleData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Claim form
  const [claimHandle, setClaimHandle] = useState("");
  const [claiming, setClaiming] = useState(false);
  const [claimError, setClaimError] = useState<string | null>(null);

  // Verify form
  const [verifyMethod, setVerifyMethod] = useState<VerifyMethod>("dns");
  const [verifyProof, setVerifyProof] = useState("");
  const [verifying, setVerifying] = useState(false);
  const [verifyError, setVerifyError] = useState<string | null>(null);
  const [verifySuccess, setVerifySuccess] = useState<string | null>(null);

  const fetchHandle = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/zns/handles");
      if (res.ok) {
        const data = await res.json();
        setHandleData(data);
        setError(null);
      } else if (res.status === 404) {
        setHandleData(null);
        setError(null);
      } else {
        const d = await res.json();
        setError(d.error || "Failed to load handle");
      }
    } catch (err) {
      setError("Failed to load handle");
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!authenticated) return;
    fetchHandle();
  }, [authenticated, fetchHandle]);

  async function handleClaim(e: React.FormEvent) {
    e.preventDefault();
    if (!claimHandle.trim()) return;
    setClaiming(true);
    setClaimError(null);
    try {
      const res = await fetch("/api/zns/handles", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ handle: claimHandle.trim() }),
      });
      const data = await res.json();
      if (!res.ok) {
        setClaimError(data.error || "Failed to claim handle");
      } else {
        setClaimHandle("");
        await fetchHandle();
      }
    } catch {
      setClaimError("Failed to claim handle");
    } finally {
      setClaiming(false);
    }
  }

  async function handleVerify(e: React.FormEvent) {
    e.preventDefault();
    if (!handleData || !verifyProof.trim()) return;
    setVerifying(true);
    setVerifyError(null);
    setVerifySuccess(null);
    try {
      const res = await fetch("/api/zns/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          handle: handleData.handle,
          method: verifyMethod,
          proof: verifyProof.trim(),
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setVerifyError(data.error || "Verification failed");
      } else {
        setVerifySuccess(data.message || "Handle verified successfully");
        setVerifyProof("");
        await fetchHandle();
      }
    } catch {
      setVerifyError("Failed to verify handle");
    } finally {
      setVerifying(false);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl sm:text-2xl font-bold text-white">Handles</h2>
        <p className="mt-1 text-sm text-white/40">
          Your Zynd Naming Service developer handle
        </p>
      </div>

      {/* Current Handle Card */}
      <div className="rounded border border-white/10 bg-white/[0.02]">
        <div className="border-b border-white/10 px-5 py-4">
          <h3 className="text-sm font-medium uppercase tracking-wider text-white/50">
            Developer Handle
          </h3>
        </div>

        {loading ? (
          <div className="space-y-3 p-5">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-6 w-48" />
          </div>
        ) : error ? (
          <div className="p-5">
            <div className="flex items-center gap-2 border border-red-500/20 bg-red-500/[0.06] px-4 py-3 text-red-400">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span className="text-sm">{error}</span>
            </div>
          </div>
        ) : handleData ? (
          <div className="px-5 py-5">
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-2 border border-[var(--color-accent)]/20 bg-[var(--color-accent)]/[0.06] px-4 py-2">
                <AtSign className="h-5 w-5 text-[var(--color-accent)]" />
                <span className="font-mono text-lg font-semibold text-white">
                  {handleData.handle}
                </span>
              </div>
              {handleData.verified ? (
                <Badge variant="active">
                  <CheckCircle className="mr-1 h-3 w-3" />
                  Verified
                </Badge>
              ) : (
                <Badge variant="inactive">Unverified</Badge>
              )}
              {handleData.verification_method && (
                <Badge variant="default">{handleData.verification_method}</Badge>
              )}
            </div>
            {handleData.verification_proof && (
              <p className="mt-3 text-sm text-white/40">
                Verified via:{" "}
                <span className="font-mono text-white/60">{handleData.verification_proof}</span>
              </p>
            )}
            <div className="mt-4 border border-white/[0.05] bg-white/[0.01] px-4 py-3">
              <div className="text-[11px] uppercase tracking-wider text-white/30 mb-1">FQAN prefix</div>
              <code className="font-mono text-sm text-white/60">
                {typeof window !== "undefined" ? window.location.hostname : "registry.zynd.ai"}/
                <span className="text-[var(--color-accent)]">{handleData.handle}</span>/
                <span className="text-white/30">{"<agent-name>"}</span>
              </code>
            </div>
          </div>
        ) : (
          /* No handle — show claim form */
          <div className="p-5">
            <p className="mb-4 text-sm text-white/50">
              You don&apos;t have a handle yet. Claim one to register agent names under your identity.
            </p>
            <form onSubmit={handleClaim} className="flex flex-col gap-4 sm:flex-row sm:items-end">
              <div className="flex-1">
                <Input
                  label="Handle"
                  placeholder="e.g. acme-corp"
                  value={claimHandle}
                  onChange={(e) => setClaimHandle(e.target.value)}
                  error={claimError ?? undefined}
                  disabled={claiming}
                  autoComplete="off"
                  spellCheck={false}
                />
              </div>
              <button
                type="submit"
                disabled={claiming || !claimHandle.trim()}
                className="flex min-h-[44px] cursor-pointer items-center gap-2 border border-[var(--color-accent)]/20 bg-[var(--color-accent)]/[0.06] px-5 py-2 text-sm font-medium text-[var(--color-accent)] transition-colors hover:bg-[var(--color-accent)]/[0.12] disabled:cursor-not-allowed disabled:opacity-50"
              >
                {claiming ? (
                  <>
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-[var(--color-accent)]/30 border-t-[var(--color-accent)]" />
                    Claiming...
                  </>
                ) : (
                  <>
                    <AtSign className="h-4 w-4" />
                    Claim Handle
                  </>
                )}
              </button>
            </form>
            <p className="mt-3 text-xs text-white/25">
              Handles must be lowercase, 3–32 characters, using only letters, numbers, and hyphens.
            </p>
          </div>
        )}
      </div>

      {/* Verify Handle Section — only show if handle exists and not verified */}
      {handleData && !handleData.verified && (
        <div className="rounded border border-white/10 bg-white/[0.02]">
          <div className="border-b border-white/10 px-5 py-4">
            <h3 className="text-sm font-medium uppercase tracking-wider text-white/50">
              Verify Handle
            </h3>
          </div>
          <div className="p-5 space-y-5">
            <p className="text-sm text-white/40">
              Prove ownership of your handle by verifying it via DNS or GitHub. Verified handles
              display a checkmark and receive higher trust scores.
            </p>

            {/* Method selector */}
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => { setVerifyMethod("dns"); setVerifyProof(""); setVerifyError(null); }}
                className={`flex min-h-[44px] items-center gap-2 px-4 py-2 text-sm transition-colors border ${
                  verifyMethod === "dns"
                    ? "border-[var(--color-accent)]/30 bg-[var(--color-accent)]/[0.06] text-[var(--color-accent)]"
                    : "border-white/10 text-white/50 hover:text-white hover:bg-white/[0.03]"
                }`}
              >
                <Globe className="h-4 w-4" />
                DNS
              </button>
              <button
                type="button"
                onClick={() => { setVerifyMethod("github"); setVerifyProof(""); setVerifyError(null); }}
                className={`flex min-h-[44px] items-center gap-2 px-4 py-2 text-sm transition-colors border ${
                  verifyMethod === "github"
                    ? "border-[var(--color-accent)]/30 bg-[var(--color-accent)]/[0.06] text-[var(--color-accent)]"
                    : "border-white/10 text-white/50 hover:text-white hover:bg-white/[0.03]"
                }`}
              >
                <Github className="h-4 w-4" />
                GitHub
              </button>
            </div>

            {/* Instructions */}
            {verifyMethod === "dns" ? (
              <div className="border border-white/[0.08] bg-white/[0.02] p-4 space-y-2">
                <div className="text-xs font-medium uppercase tracking-wider text-white/40">
                  DNS Verification Instructions
                </div>
                <p className="text-sm text-white/50">
                  Add a TXT record to your domain at:
                </p>
                <code className="block border border-white/10 bg-black px-3 py-2 font-mono text-xs text-[var(--color-accent)]">
                  _zynd-verify.{"<your-domain>"}
                </code>
                <p className="text-sm text-white/50">
                  Set the value to your developer public key:
                </p>
                <code className="block border border-white/10 bg-black px-3 py-2 font-mono text-xs text-white/60 break-all">
                  {handleData.public_key}
                </code>
                <p className="text-xs text-white/30 mt-2">
                  DNS propagation may take up to 48 hours. Enter your domain name below to verify.
                </p>
              </div>
            ) : (
              <div className="border border-white/[0.08] bg-white/[0.02] p-4 space-y-2">
                <div className="text-xs font-medium uppercase tracking-wider text-white/40">
                  GitHub Verification Instructions
                </div>
                <p className="text-sm text-white/50">
                  Enter your GitHub username to link your handle to your GitHub identity.
                  This records your claim and sets the verification method to GitHub.
                </p>
                <p className="text-xs text-white/30">
                  Your developer handle will be associated with your GitHub account.
                </p>
              </div>
            )}

            {/* Verify form */}
            <form onSubmit={handleVerify} className="flex flex-col gap-4 sm:flex-row sm:items-end">
              <div className="flex-1">
                <Input
                  label={verifyMethod === "dns" ? "Domain Name" : "GitHub Username"}
                  placeholder={verifyMethod === "dns" ? "e.g. acme-corp.com" : "e.g. acme-corp"}
                  value={verifyProof}
                  onChange={(e) => setVerifyProof(e.target.value)}
                  error={verifyError ?? undefined}
                  disabled={verifying}
                  autoComplete="off"
                  spellCheck={false}
                />
              </div>
              <button
                type="submit"
                disabled={verifying || !verifyProof.trim()}
                className="flex min-h-[44px] cursor-pointer items-center gap-2 border border-[var(--color-accent)]/20 bg-[var(--color-accent)]/[0.06] px-5 py-2 text-sm font-medium text-[var(--color-accent)] transition-colors hover:bg-[var(--color-accent)]/[0.12] disabled:cursor-not-allowed disabled:opacity-50"
              >
                {verifying ? (
                  <>
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-[var(--color-accent)]/30 border-t-[var(--color-accent)]" />
                    Verifying...
                  </>
                ) : (
                  <>
                    <CheckCircle className="h-4 w-4" />
                    Verify
                  </>
                )}
              </button>
            </form>

            {verifySuccess && (
              <div className="flex items-center gap-2 border border-[#00FF66]/20 bg-[#00FF66]/[0.06] px-4 py-3 text-[#00FF66]">
                <CheckCircle className="h-4 w-4 shrink-0" />
                <span className="text-sm">{verifySuccess}</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Already verified */}
      {handleData?.verified && (
        <div className="rounded border border-[#00FF66]/20 bg-[#00FF66]/[0.04] px-5 py-4">
          <div className="flex items-center gap-3">
            <CheckCircle className="h-5 w-5 text-[#00FF66] shrink-0" />
            <div>
              <div className="text-sm font-medium text-[#00FF66]">Handle Verified</div>
              <div className="text-xs text-[#00FF66]/60 mt-0.5">
                Verified via {handleData.verification_method}
                {handleData.verification_proof ? ` (${handleData.verification_proof})` : ""}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
