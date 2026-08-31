"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";

import { Navbar } from "@/components/Navbar";
import { CARDS_API } from "@/lib/cards";
import type { AgentProfileCard, OnboardStatus } from "@/lib/cards";

type Phase = "form" | "working" | "review" | "error";

const INPUT =
  "w-full rounded-lg border border-white/10 bg-white/[0.04] px-3.5 py-2.5 text-sm text-white outline-none transition placeholder:text-white/25 focus:border-[#5b7cfa]/60 focus:bg-white/[0.06]";

const LABEL = "block text-sm font-medium text-white/60 mb-1.5";

function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className={LABEL}>{label}</label>
      {children}
      {hint && <p className="mt-1 text-xs text-white/25">{hint}</p>}
    </div>
  );
}

export default function CreateProfilePage() {
  const router = useRouter();
  const [phase, setPhase] = useState<Phase>("form");
  const [jobId, setJobId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [card, setCard] = useState<AgentProfileCard | null>(null);

  const [githubHandle, setGithubHandle] = useState("");
  const [websiteUrl, setWebsiteUrl] = useState("");
  const [linktreeUrl, setLinktreeUrl] = useState("");
  const [socialUrl, setSocialUrl] = useState("");
  const [portfolioUrl, setPortfolioUrl] = useState("");
  const [resume, setResume] = useState<File | null>(null);

  const fileRef = useRef<HTMLInputElement>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => () => { if (pollRef.current) clearInterval(pollRef.current); }, []);

  const hasSource =
    githubHandle.trim() ||
    websiteUrl.trim() ||
    linktreeUrl.trim() ||
    socialUrl.trim() ||
    portfolioUrl.trim() ||
    resume;

  async function startOnboard(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setPhase("working");

    const form = new FormData();
    if (githubHandle.trim()) form.append("github_handle", githubHandle.trim());
    if (websiteUrl.trim()) form.append("website_url", websiteUrl.trim());
    if (linktreeUrl.trim()) form.append("linktree_url", linktreeUrl.trim());
    if (socialUrl.trim()) form.append("social_url", socialUrl.trim());
    if (portfolioUrl.trim()) form.append("portfolio_url", portfolioUrl.trim());
    if (resume) form.append("resume", resume);

    try {
      const res = await fetch(`${CARDS_API}/onboard/start`, { method: "POST", body: form });
      if (!res.ok) throw new Error((await res.text()) || `Status ${res.status}`);
      const data = await res.json();
      setJobId(data.job_id);
      pollRef.current = setInterval(() => pollJob(data.job_id), 1500);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to start");
      setPhase("error");
    }
  }

  async function pollJob(id: string) {
    try {
      const res = await fetch(`${CARDS_API}/onboard/${id}`);
      if (!res.ok) return;
      const status: OnboardStatus = await res.json();
      if (status.status === "ready" && status.card) {
        if (pollRef.current) clearInterval(pollRef.current);
        setCard(status.card);
        setPhase("review");
      } else if (status.status === "error") {
        if (pollRef.current) clearInterval(pollRef.current);
        setError(status.error || "Unknown error");
        setPhase("error");
      }
    } catch { /* transient */ }
  }

  async function publish() {
    if (!card || !jobId) return;
    setError(null);
    try {
      const res = await fetch(`${CARDS_API}/onboard/${jobId}/publish`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ card }),
      });
      if (!res.ok) throw new Error((await res.text()) || `Status ${res.status}`);
      const published = await res.json();
      router.push(`/profile/${published.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to publish");
      setPhase("error");
    }
  }

  function updateCard(patch: Partial<AgentProfileCard>) {
    setCard((prev) => (prev ? { ...prev, ...patch } : prev));
  }

  return (
    <>
      <Navbar />
      <main className="min-h-screen text-white antialiased pb-32">
        <div className="mx-auto max-w-lg px-6 pt-16">

          {/* Header — div not h1, avoids global h1 { font-size: 6rem } override */}
          <div className="mb-8">
            <span className="mb-4 inline-flex items-center gap-2 rounded-full border border-[#5b7cfa]/30 bg-[#5b7cfa]/10 px-3 py-1 text-xs font-medium text-[#5b7cfa]">
              <span className="h-1.5 w-1.5 rounded-full bg-[#5b7cfa]" />
              Publicly visible · Discoverable by AI
            </span>
            <div className="mt-3 text-[1.75rem] font-bold leading-snug tracking-tight text-white">
              Create your Agent Profile Card
            </div>
            <p className="mt-2 text-sm leading-relaxed text-white/40">
              Publishes at{" "}
              <code className="rounded bg-white/[0.06] px-1.5 py-0.5 text-[0.8em] text-white/60">
                zynd.ai/profile/you
              </code>{" "}
              — findable by people and AI agents worldwide. You review before anything goes live.
            </p>
          </div>

          {phase === "form" && (
            <form onSubmit={startOnboard} className="flex flex-col gap-4">

              <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-4">
                <p className="mb-4 text-xs font-semibold uppercase tracking-widest text-white/30">
                  Add your sources — fill in any or all
                </p>
                <div className="flex flex-col gap-4">

                  <Field label="GitHub handle">
                    <div className="relative">
                      <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-sm text-white/25">@</span>
                      <input
                        type="text"
                        value={githubHandle}
                        onChange={(e) => setGithubHandle(e.target.value)}
                        placeholder="octocat"
                        className={INPUT + " pl-7"}
                      />
                    </div>
                  </Field>

                  <Field label="Website URL" hint="Your personal or company site">
                    <input
                      type="url"
                      value={websiteUrl}
                      onChange={(e) => setWebsiteUrl(e.target.value)}
                      placeholder="https://yoursite.com"
                      className={INPUT}
                    />
                  </Field>

                  <Field label="Linktree URL">
                    <input
                      type="url"
                      value={linktreeUrl}
                      onChange={(e) => setLinktreeUrl(e.target.value)}
                      placeholder="https://linktr.ee/you"
                      className={INPUT}
                    />
                  </Field>

                  <Field label="Social profile URL" hint="Twitter/X, LinkedIn, Bluesky, etc.">
                    <input
                      type="url"
                      value={socialUrl}
                      onChange={(e) => setSocialUrl(e.target.value)}
                      placeholder="https://x.com/you"
                      className={INPUT}
                    />
                  </Field>

                  <Field label="Portfolio URL" hint="Dribbble, Behance, personal portfolio">
                    <input
                      type="url"
                      value={portfolioUrl}
                      onChange={(e) => setPortfolioUrl(e.target.value)}
                      placeholder="https://portfolio.com/you"
                      className={INPUT}
                    />
                  </Field>

                  <Field
                    label={`Résumé${resume ? ` — ${resume.name}` : ""}`}
                    hint="PDF or DOCX"
                  >
                    <button
                      type="button"
                      onClick={() => fileRef.current?.click()}
                      className="flex w-full items-center gap-2.5 rounded-lg border border-white/10 bg-white/[0.04] px-3.5 py-2.5 text-sm text-white/30 transition hover:border-white/20 hover:text-white/50"
                    >
                      <svg className="h-4 w-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5m-13.5-9L12 3m0 0 4.5 4.5M12 3v13.5" />
                      </svg>
                      {resume ? (
                        <span className="truncate text-white/60">{resume.name}</span>
                      ) : (
                        "Choose file"
                      )}
                    </button>
                    <input
                      ref={fileRef}
                      type="file"
                      accept=".pdf,.docx,application/pdf"
                      onChange={(e) => setResume(e.target.files?.[0] ?? null)}
                      className="hidden"
                    />
                  </Field>

                </div>
              </div>

              <button
                type="submit"
                disabled={!hasSource}
                className="flex w-full items-center justify-center gap-2 rounded-lg bg-[#5b7cfa] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#4a67e0] disabled:cursor-not-allowed disabled:opacity-30"
              >
                Generate my profile card
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" />
                </svg>
              </button>

              {!hasSource && (
                <p className="text-center text-xs text-white/25">Fill in at least one source above</p>
              )}
            </form>
          )}

          {phase === "working" && (
            <div className="flex items-center gap-3 rounded-xl border border-white/[0.06] bg-white/[0.02] px-4 py-4 text-sm text-white/50">
              <span className="h-4 w-4 flex-shrink-0 animate-spin rounded-full border-2 border-white/10 border-t-[#5b7cfa]" />
              Scraping your sources and building your profile — takes 10–20 seconds.
            </div>
          )}

          {phase === "error" && (
            <div className="flex items-start justify-between gap-4 rounded-xl border border-red-500/20 bg-red-500/[0.05] px-4 py-4 text-sm text-red-400">
              <span>{error}</span>
              <button
                onClick={() => setPhase("form")}
                className="flex-shrink-0 rounded border border-white/10 bg-white/[0.05] px-3 py-1 text-xs font-semibold text-white/60 hover:text-white"
              >
                Try again
              </button>
            </div>
          )}

          {phase === "review" && card && (
            <div className="flex flex-col gap-4">
              <div className="rounded-xl border border-[#5b7cfa]/20 bg-[#5b7cfa]/[0.05] px-4 py-3 text-sm text-white/50">
                Review your card — nothing publishes until you confirm.
              </div>

              {(
                [
                  { label: "Name", value: card.identity.name, set: (v: string) => updateCard({ identity: { ...card.identity, name: v } }) },
                  { label: "Headline", value: card.identity.headline, set: (v: string) => updateCard({ identity: { ...card.identity, headline: v } }) },
                  { label: "Location", value: card.identity.location, set: (v: string) => updateCard({ identity: { ...card.identity, location: v } }) },
                ] as const
              ).map(({ label, value, set }) => (
                <Field key={label} label={label}>
                  <input
                    type="text"
                    value={value}
                    onChange={(e) => set(e.target.value)}
                    className={INPUT}
                  />
                </Field>
              ))}

              <Field label="Summary">
                <textarea
                  rows={4}
                  value={card.summary}
                  onChange={(e) => updateCard({ summary: e.target.value })}
                  className={INPUT + " resize-none"}
                />
              </Field>

              <Field label="Citation snippet">
                <textarea
                  rows={2}
                  value={card.citation_snippet}
                  onChange={(e) => updateCard({ citation_snippet: e.target.value })}
                  className={INPUT + " resize-none"}
                />
              </Field>

              <Field label="Skills" hint="One per line">
                <textarea
                  rows={4}
                  value={card.skills.map((s) => s.name).join("\n")}
                  onChange={(e) =>
                    updateCard({
                      skills: e.target.value
                        .split("\n")
                        .map((n) => n.trim())
                        .filter(Boolean)
                        .map((name, i) =>
                          card.skills[i] ?? { name, level: "intermediate", evidence_count: 0 }
                        ),
                    })
                  }
                  className={INPUT + " resize-none"}
                />
              </Field>

              <button
                onClick={publish}
                className="flex w-full items-center justify-center gap-2 rounded-lg bg-[#5b7cfa] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#4a67e0]"
              >
                Publish my profile card
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" />
                </svg>
              </button>
              <p className="text-center text-xs text-white/25">
                Creates a public page at zynd.ai/profile/&lt;id&gt; and notifies search engines.
              </p>
            </div>
          )}
        </div>
      </main>
    </>
  );
}
