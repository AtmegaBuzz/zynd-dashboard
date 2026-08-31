"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";

import { Navbar } from "@/components/Navbar";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import { CARDS_API } from "@/lib/cards";
import type { AgentProfileCard, OnboardStatus } from "@/lib/cards";

type Phase = "form" | "working" | "review" | "error";

const SOURCE_TAGS = [
  { label: "GitHub", meta: "@handle" },
  { label: "Website", meta: "URL" },
  { label: "Linktree", meta: "URL" },
  { label: "Social profile", meta: "URL" },
  { label: "Portfolio", meta: "URL" },
  { label: "Résumé", meta: "PDF / DOCX" },
] as const;

const INPUT_CLASS =
  "w-full rounded-md border border-white/[0.08] bg-transparent px-3 py-2.5 text-sm text-white outline-none transition-colors placeholder:text-white/20 focus:border-[#5b7cfa]/50 focus:ring-1 focus:ring-[#5b7cfa]/20";

function ArrowRight() {
  return (
    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" />
    </svg>
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
  const [resume, setResume] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, []);

  const hasSource = githubHandle.trim() || websiteUrl.trim() || resume;

  async function startOnboard(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setPhase("working");

    const form = new FormData();
    if (githubHandle.trim()) form.append("github_handle", githubHandle.trim());
    if (websiteUrl.trim()) form.append("website_url", websiteUrl.trim());
    if (resume) form.append("resume", resume);

    try {
      const res = await fetch(`${CARDS_API}/onboard/start`, {
        method: "POST",
        body: form,
      });
      if (!res.ok) {
        const detail = await res.text();
        throw new Error(detail || `Request failed with status ${res.status}`);
      }
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
    } catch {
      /* transient poll failure; keep polling */
    }
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
      if (!res.ok) {
        const detail = await res.text();
        throw new Error(detail || `Request failed with status ${res.status}`);
      }
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
      <article className="text-white antialiased pb-32">
        <div className="mx-auto w-full max-w-[660px] px-6 pt-16 md:pt-24">

          {/* Hero */}
          <header className="mb-10">
            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-[#5b7cfa]/25 bg-[#5b7cfa]/10 px-3 py-1">
              <span className="h-1.5 w-1.5 rounded-full bg-[#5b7cfa]" />
              <span className="text-xs font-medium tracking-wide text-[#5b7cfa]">
                Publicly visible · Discoverable by AI
              </span>
            </div>
            <h1 className="text-[2rem] font-bold leading-tight tracking-tight text-white md:text-[2.5rem]">
              Create your Agent Profile Card
            </h1>
            <p className="mt-3 max-w-[520px] text-base leading-relaxed text-zinc-400">
              Your card publishes at{" "}
              <code className="rounded bg-white/[0.06] px-1.5 py-0.5 font-mono text-[0.8em] text-zinc-200">
                zynd.ai/profile/you
              </code>{" "}
              — visible to people and findable by AI agents, ChatGPT, and search
              engines worldwide. You review everything before it goes live.
            </p>
          </header>

          {/* Supported sources */}
          <div className="mb-8 rounded-xl border border-white/[0.06] bg-white/[0.02] px-4 py-4">
            <p className="mb-3 text-[11px] font-semibold uppercase tracking-widest text-zinc-600">
              Sources we build from
            </p>
            <div className="flex flex-wrap gap-2">
              {SOURCE_TAGS.map(({ label, meta }) => (
                <span
                  key={label}
                  className="inline-flex items-center gap-1.5 rounded-full border border-white/[0.07] bg-white/[0.03] px-3 py-1 text-xs text-zinc-400"
                >
                  {label}
                  <span className="text-zinc-600">{meta}</span>
                </span>
              ))}
            </div>
          </div>

          {/* Form phase */}
          {phase === "form" && (
            <form onSubmit={startOnboard} className="flex flex-col gap-5">
              <Input
                label="GitHub handle"
                value={githubHandle}
                onChange={(e) => setGithubHandle(e.target.value)}
                placeholder="octocat"
              />

              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium text-white/70">
                  Website, portfolio, or social URL
                </label>
                <input
                  type="url"
                  value={websiteUrl}
                  onChange={(e) => setWebsiteUrl(e.target.value)}
                  placeholder="https://linktree.com/you"
                  className={INPUT_CLASS}
                />
                <p className="text-xs text-zinc-600">
                  Any public URL — personal site, Linktree, portfolio, Twitter/X,
                  LinkedIn
                </p>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium text-white/70">
                  Résumé{" "}
                  <span className="font-normal text-zinc-600">(PDF or DOCX, optional)</span>
                </label>
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="flex items-center gap-3 rounded-md border border-white/[0.08] bg-transparent px-3 py-2.5 text-sm text-left transition-colors hover:border-white/15"
                >
                  <svg
                    className="h-4 w-4 flex-shrink-0 text-zinc-600"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={1.5}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5m-13.5-9L12 3m0 0 4.5 4.5M12 3v13.5"
                    />
                  </svg>
                  <span className={resume ? "text-white/80" : "text-white/25"}>
                    {resume ? resume.name : "Choose file"}
                  </span>
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".pdf,.docx,application/pdf"
                  onChange={(e) => setResume(e.target.files?.[0] ?? null)}
                  className="hidden"
                />
              </div>

              <div className="pt-1">
                <button
                  type="submit"
                  disabled={!hasSource}
                  className="inline-flex w-full items-center justify-center gap-2 rounded-md border border-[#5b7cfa] bg-[#5b7cfa] px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-[#4a67e0] disabled:cursor-not-allowed disabled:opacity-35"
                >
                  Generate my profile card
                  <ArrowRight />
                </button>
                {!hasSource && (
                  <p className="mt-2 text-center text-xs text-zinc-600">
                    Add at least one source above to continue
                  </p>
                )}
              </div>
            </form>
          )}

          {/* Working phase */}
          {phase === "working" && (
            <div className="flex items-center gap-3 rounded-xl border border-white/[0.06] bg-white/[0.02] px-4 py-4 text-sm text-zinc-300">
              <span className="h-4 w-4 flex-shrink-0 animate-spin rounded-full border-2 border-white/15 border-t-[#5b7cfa]" />
              Scraping your sources and synthesizing your profile — usually takes
              10–20 seconds.
            </div>
          )}

          {/* Error phase */}
          {phase === "error" && (
            <div className="flex items-start justify-between gap-4 rounded-xl border border-red-500/30 bg-red-500/[0.06] px-4 py-4 text-sm text-red-400">
              <span>{error}</span>
              <button
                onClick={() => setPhase("form")}
                className="flex-shrink-0 rounded border border-white/10 bg-white/[0.05] px-3 py-1 text-xs font-semibold text-zinc-300 hover:border-white/20 hover:text-white"
              >
                Try again
              </button>
            </div>
          )}

          {/* Review phase */}
          {phase === "review" && card && (
            <div className="flex flex-col gap-5">
              <div className="rounded-xl border border-[#5b7cfa]/20 bg-[#5b7cfa]/[0.06] px-4 py-3 text-sm text-zinc-300">
                Review your card — nothing publishes until you confirm.
              </div>
              <Input
                label="Name"
                value={card.identity.name}
                onChange={(e) =>
                  updateCard({ identity: { ...card.identity, name: e.target.value } })
                }
              />
              <Input
                label="Headline"
                value={card.identity.headline}
                onChange={(e) =>
                  updateCard({ identity: { ...card.identity, headline: e.target.value } })
                }
              />
              <Input
                label="Location"
                value={card.identity.location}
                onChange={(e) =>
                  updateCard({ identity: { ...card.identity, location: e.target.value } })
                }
              />
              <Textarea
                label="Summary"
                rows={4}
                value={card.summary}
                onChange={(e) => updateCard({ summary: e.target.value })}
              />
              <Textarea
                label="Citation snippet"
                rows={2}
                value={card.citation_snippet}
                onChange={(e) => updateCard({ citation_snippet: e.target.value })}
              />
              <Textarea
                label="Skills (one per line)"
                rows={4}
                value={card.skills.map((s) => s.name).join("\n")}
                onChange={(e) =>
                  updateCard({
                    skills: e.target.value
                      .split("\n")
                      .map((n) => n.trim())
                      .filter(Boolean)
                      .map((name, i) =>
                        card.skills[i] ?? {
                          name,
                          level: "intermediate",
                          evidence_count: 0,
                        },
                      ),
                  })
                }
              />
              <div className="pt-1">
                <button
                  onClick={publish}
                  className="inline-flex w-full items-center justify-center gap-2 rounded-md border border-[#5b7cfa] bg-[#5b7cfa] px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-[#4a67e0]"
                >
                  Publish my profile card
                  <ArrowRight />
                </button>
                <p className="mt-2 text-center text-xs text-zinc-600">
                  Creates a public page at{" "}
                  <span className="text-zinc-500">zynd.ai/profile/&lt;id&gt;</span>{" "}
                  and notifies search engines.
                </p>
              </div>
            </div>
          )}
        </div>
      </article>
    </>
  );
}
