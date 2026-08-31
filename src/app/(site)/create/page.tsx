"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";

import { Navbar } from "@/components/Navbar";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import { CARDS_API } from "@/lib/cards";
import type { AgentProfileCard, OnboardStatus } from "@/lib/cards";

type Phase = "form" | "working" | "review" | "error";

export default function CreateProfilePage() {
  const router = useRouter();
  const [phase, setPhase] = useState<Phase>("form");
  const [jobId, setJobId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [card, setCard] = useState<AgentProfileCard | null>(null);

  const [githubHandle, setGithubHandle] = useState("");
  const [resume, setResume] = useState<File | null>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, []);

  async function startOnboard(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setPhase("working");

    const form = new FormData();
    if (githubHandle.trim()) form.append("github_handle", githubHandle.trim());
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
      <article className="text-white selection:bg-[#5b7cfa]/30 antialiased font-sans pb-32">
        <div className="mx-auto w-full max-w-[720px] px-6 pt-12">
          <header className="mb-12">
            <h1 className="text-4xl font-bold text-white md:text-5xl">
              Create your Zynd profile
            </h1>
            <p className="mt-4 text-lg text-zinc-400">
              Share your GitHub handle or upload a résumé. Zynd scrapes your
              public work and drafts a profile for you to review before anything
              goes live.
            </p>
          </header>

          {phase === "form" && (
            <form onSubmit={startOnboard} className="flex max-w-md flex-col gap-5">
              <Input
                label="GitHub handle"
                value={githubHandle}
                onChange={(e) => setGithubHandle(e.target.value)}
                placeholder="e.g. octocat"
              />
              <div className="flex flex-col gap-1.5">
                <label className="text-sm text-white/50">Résumé (PDF or DOCX, optional)</label>
                <input
                  type="file"
                  accept=".pdf,.docx,application/pdf"
                  onChange={(e) => setResume(e.target.files?.[0] ?? null)}
                  className="border border-white/[0.08] bg-transparent px-3 py-2 text-sm text-white outline-none transition-colors placeholder:text-white/25 focus:border-[#5b7cfa]/40"
                />
              </div>
              <button
                type="submit"
                disabled={!githubHandle.trim() && !resume}
                className="mt-2 inline-flex items-center justify-center rounded-md border border-[#5b7cfa] bg-[#5b7cfa] px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#4a67e0] disabled:cursor-not-allowed disabled:opacity-40"
              >
                Generate profile
              </button>
            </form>
          )}

          {phase === "working" && (
            <div className="rounded-md border border-white/[0.08] bg-white/[0.03] px-4 py-3 text-sm text-zinc-300">
              Scraping and synthesizing your profile… this usually takes a few
              seconds.
            </div>
          )}

          {phase === "error" && (
            <div className="rounded-md border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-red-400">
              {error}{" "}
              <button
                onClick={() => setPhase("form")}
                className="ml-2 inline-flex items-center rounded-md border border-white/15 bg-white/5 px-3 py-1 text-xs font-semibold text-zinc-300 hover:border-white/30 hover:text-white"
              >
                Try again
              </button>
            </div>
          )}

          {phase === "review" && card && (
            <div className="flex max-w-xl flex-col gap-5">
              <div className="rounded-md border border-white/[0.08] bg-white/[0.03] px-4 py-3 text-sm text-zinc-300">
                Review your profile below. Nothing is published until you confirm.
              </div>
              <Input
                label="Name"
                value={card.identity.name}
                onChange={(e) =>
                  updateCard({
                    identity: { ...card.identity, name: e.target.value },
                  })
                }
              />
              <Input
                label="Headline"
                value={card.identity.headline}
                onChange={(e) =>
                  updateCard({
                    identity: { ...card.identity, headline: e.target.value },
                  })
                }
              />
              <Input
                label="Location"
                value={card.identity.location}
                onChange={(e) =>
                  updateCard({
                    identity: { ...card.identity, location: e.target.value },
                  })
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
              <button
                onClick={publish}
                className="mt-2 inline-flex items-center justify-center rounded-md border border-[#5b7cfa] bg-[#5b7cfa] px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#4a67e0]"
              >
                Publish profile
              </button>
              <p className="text-xs text-zinc-500">
                Publishing creates a public page at{" "}
                <span className="text-zinc-300">zynd.ai/profile/&lt;id&gt;</span>{" "}
                and notifies search engines.
              </p>
            </div>
          )}
        </div>
      </article>
    </>
  );
}
