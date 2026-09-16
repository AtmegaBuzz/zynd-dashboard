"use client";

import { useState, useCallback, useRef } from "react";
import Link from "next/link";
import { BadgeCheck, Globe, Pencil, X, Check, Loader2, RefreshCw, Zap } from "lucide-react";
import { type AgentProfileCard, updateCard, CARDS_API } from "@/lib/cards";
import { createClient } from "@/lib/supabase/client";
import { ContributionHeatmap } from "../contribution-heatmap";
import { CountUp } from "../count-up";

/* ─── helpers (mirrored from public page) ───────────────────────────────── */

function isBlank(s: string | null | undefined): boolean {
  if (!s) return true;
  const low = s.toLowerCase().trim();
  return low === "" || low === "n/a" || low === "not specified" || low === "unknown" || low === "none";
}

function safeUrl(url: string | null | undefined): string | null {
  if (!url) return null;
  try {
    const { protocol } = new URL(url);
    return protocol === "http:" || protocol === "https:" ? url : null;
  } catch {
    return null;
  }
}

function compact(n: number): string {
  if (n >= 1000) return `${(n / 1000).toFixed(1).replace(/\.0$/, "")}k`;
  return String(n);
}

function githubAvatar(url: string | null | undefined, size = 400): string | null {
  const safe = safeUrl(url);
  if (!safe) return null;
  try {
    const { hostname, pathname } = new URL(safe);
    if (!/(^|\.)github\.com$/i.test(hostname)) return null;
    const [user, ...rest] = pathname.split("/").filter(Boolean);
    if (!user || rest.length > 0) return null;
    return `https://github.com/${encodeURIComponent(user)}.png?size=${size}`;
  } catch {
    return null;
  }
}

function usernameFromUrl(url: string | null | undefined): string | null {
  if (!url) return null;
  return url.replace(/\/+$/, "").split("/").pop() || null;
}

const LEVEL_META: Record<string, { label: string; bar: string; bars: number }> = {
  expert:       { label: "Expert",    bar: "#F59E0B", bars: 4 },
  advanced:     { label: "Advanced",  bar: "#7B72E9", bars: 3 },
  intermediate: { label: "Mid",       bar: "#0EA5E9", bars: 2 },
  beginner:     { label: "Beginner",  bar: "#10B981", bars: 1 },
};
const levelMeta = (l: string) => LEVEL_META[l.toLowerCase()] ?? LEVEL_META.intermediate;

const SKILL_ACCENTS: Record<string, string> = {
  rust: "#F97316", "c++": "#0070BA", python: "#0284C7", go: "#14B8A6",
  pytorch: "#E11D48", kubernetes: "#6366F1",
};
const skillAccent = (name: string) => SKILL_ACCENTS[name.trim().toLowerCase()] ?? "#7B72E9";

const OBSESSION_CARDS: {
  key: "connect_with" | "love_talking_about" | "working_on";
  label: string;
  card: string;
  chip: string;
}[] = [
  { key: "love_talking_about", label: "Love Talking About", card: "bg-[#a7f3d0] text-[#064e3b]", chip: "bg-white/60 text-[#064e3b] border border-white/50" },
  { key: "working_on",         label: "Working On",         card: "bg-[#fde68a] text-[#78350f]", chip: "bg-white/60 text-[#78350f] border border-white/50" },
  { key: "connect_with",       label: "Connect With",       card: "bg-[#7B72E9] text-white",     chip: "bg-white/15 text-white border border-white/25" },
];

/* ─── glyphs ──────────────────────────────────────────────────────────────── */

function GithubGlyph({ size = 16 }: { size?: number }) {
  return (
    <svg className="fill-current" style={{ width: size, height: size }} viewBox="0 0 24 24" aria-hidden>
      <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z" />
    </svg>
  );
}

function XGlyph({ size = 14 }: { size?: number }) {
  return (
    <svg className="fill-current" style={{ width: size, height: size }} viewBox="0 0 24 24" aria-hidden>
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
    </svg>
  );
}

function LinkedinGlyph({ size = 16 }: { size?: number }) {
  return (
    <svg className="fill-current" style={{ width: size, height: size }} viewBox="0 0 24 24" aria-hidden>
      <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z" />
    </svg>
  );
}

const LINK_LABELS: Record<string, string> = {
  github: "GitHub", x: "X", twitter: "X", linkedin: "LinkedIn",
  website: "Website", portfolio: "Portfolio",
};
function linkLabel(platform: string) {
  return LINK_LABELS[platform.toLowerCase()] ?? platform.charAt(0).toUpperCase() + platform.slice(1);
}
function LinkGlyph({ platform, size = 15 }: { platform: string; size?: number }) {
  const key = platform.toLowerCase();
  if (key === "github") return <GithubGlyph size={size} />;
  if (key === "x" || key === "twitter") return <XGlyph size={size - 1} />;
  if (key === "linkedin") return <LinkedinGlyph size={size} />;
  return <Globe style={{ width: size, height: size }} strokeWidth={2} aria-hidden />;
}

/* ─── reusable edit sub-components ──────────────────────────────────────── */

function TagInput({
  tags, onChange, placeholder, colorClass,
}: {
  tags: string[];
  onChange: (tags: string[]) => void;
  placeholder?: string;
  colorClass?: string;
}) {
  const [input, setInput] = useState("");
  function add() {
    const v = input.trim();
    if (v && !tags.includes(v)) onChange([...tags, v]);
    setInput("");
  }
  return (
    <div className="flex flex-wrap gap-1.5">
      {tags.map((t) => (
        <span key={t} className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[12px] font-medium ${colorClass ?? "bg-white/20 text-inherit border border-white/30"}`}>
          {t}
          <button type="button" onClick={() => onChange(tags.filter((x) => x !== t))} className="opacity-70 hover:opacity-100 ml-0.5">
            <X size={10} />
          </button>
        </span>
      ))}
      <input
        value={input}
        onChange={(e) => setInput(e.target.value)}
        onKeyDown={(e) => { if (e.key === "Enter" || e.key === ",") { e.preventDefault(); add(); } }}
        onBlur={add}
        placeholder={placeholder ?? "Add…"}
        className="bg-transparent border-b border-current/30 outline-none text-[12px] px-1 py-0.5 min-w-[80px] placeholder:opacity-40"
      />
    </div>
  );
}

function SaveBar({ onSave, onCancel, saving }: { onSave: () => void; onCancel: () => void; saving: boolean }) {
  return (
    <div className="flex gap-2 mt-4 pt-3 border-t border-current/15">
      <button
        type="button"
        onClick={onSave}
        disabled={saving}
        className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-white/20 hover:bg-white/30 border border-white/30 text-[12px] font-mono font-semibold transition-colors disabled:opacity-60"
      >
        {saving ? <Loader2 size={12} className="animate-spin" /> : <Check size={12} />}
        Save
      </button>
      <button
        type="button"
        onClick={onCancel}
        className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full hover:bg-white/10 border border-white/20 text-[12px] font-mono transition-colors"
      >
        <X size={12} /> Cancel
      </button>
    </div>
  );
}

function SaveBarDark({ onSave, onCancel, saving }: { onSave: () => void; onCancel: () => void; saving: boolean }) {
  return (
    <div className="flex gap-2 mt-4 pt-3 border-t border-gray-100">
      <button
        type="button"
        onClick={onSave}
        disabled={saving}
        className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-[#7B72E9] hover:bg-[#6c64d8] text-white text-[12px] font-mono font-semibold transition-colors disabled:opacity-60"
      >
        {saving ? <Loader2 size={12} className="animate-spin" /> : <Check size={12} />}
        Save
      </button>
      <button
        type="button"
        onClick={onCancel}
        className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full border border-gray-200 hover:bg-gray-50 text-[#0B0B0B] text-[12px] font-mono transition-colors"
      >
        <X size={12} /> Cancel
      </button>
    </div>
  );
}

/* Absolute pencil button shown on hover */
function EditBtn({ onClick, light = false }: { onClick: () => void; light?: boolean }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`absolute top-4 right-4 z-10 opacity-0 group-hover:opacity-100 transition-opacity inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-mono font-semibold shadow-sm
        ${light
          ? "bg-white/20 border border-white/30 text-white hover:bg-white/35"
          : "bg-white border border-gray-200 text-[#0B0B0B] hover:bg-[#7B72E9] hover:text-white hover:border-[#7B72E9]"
        }`}
    >
      <Pencil size={10} />
      Edit
    </button>
  );
}

/* ─── main component ─────────────────────────────────────────────────────── */

interface Props {
  initialCard: AgentProfileCard;
  handle: string;
  token: string;
}

export function EditProfileClient({ initialCard, handle, token }: Props) {
  const [draft, setDraft] = useState<AgentProfileCard>(initialCard);
  const [editingSection, setEditingSection] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [memoryStatus, setMemoryStatus] = useState<"idle" | "loading" | "connected" | "disconnected">("idle");
  const [memoryFacts, setMemoryFacts] = useState<Array<Record<string, unknown>>>(
    (initialCard.zynd_memory ?? []) as Array<Record<string, unknown>>
  );

  // Handle change state
  const [handleInput, setHandleInput] = useState(handle);
  const [handleAvailable, setHandleAvailable] = useState<boolean | null>(null);
  const [handleChecking, setHandleChecking] = useState(false);
  const handleCheckRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const isEditing = (s: string) => editingSection === s;
  const startEdit = (s: string) => setEditingSection(s);
  const cancelEdit = () => setEditingSection(null);

  async function save(updated: AgentProfileCard) {
    setSaving(true);
    const result = await updateCard(handle, updated, token);
    if (result) {
      setDraft(result);
      setEditingSection(null);
    }
    setSaving(false);
  }

  async function syncMemory() {
    setMemoryStatus("loading");
    try {
      const res = await fetch(`${CARDS_API}/cards/by-handle/${encodeURIComponent(handle)}/refresh-memory`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.zynd_memory && data.zynd_memory.length > 0) {
        setMemoryFacts(data.zynd_memory);
        setDraft((prev) => ({ ...prev, zynd_memory: data.zynd_memory }));
        setMemoryStatus("connected");
      } else {
        setMemoryStatus("disconnected");
      }
    } catch {
      setMemoryStatus("disconnected");
    }
  }

  function onHandleChange(val: string) {
    const slug = val.toLowerCase().replace(/[^a-z0-9-]/g, "").slice(0, 30);
    setHandleInput(slug);
    setHandleAvailable(null);
    if (handleCheckRef.current) clearTimeout(handleCheckRef.current);
    if (slug.length < 2) return;
    setHandleChecking(true);
    handleCheckRef.current = setTimeout(async () => {
      try {
        const res = await fetch(`${CARDS_API}/cards/handle-available/${encodeURIComponent(slug)}`);
        const data = await res.json();
        setHandleAvailable(data.available);
      } catch {
        setHandleAvailable(null);
      }
      setHandleChecking(false);
    }, 400);
  }

  async function saveHandle() {
    if (!handleAvailable || handleInput === handle) { cancelEdit(); return; }
    setSaving(true);
    try {
      const res = await fetch(`${CARDS_API}/cards/by-handle/${encodeURIComponent(handle)}`, {
        method: "PATCH",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ ...draft, new_handle: handleInput }),
      });
      if (res.ok) {
        window.location.href = `/p/${handleInput}/edit`;
      }
    } catch { /* non-fatal */ }
    setSaving(false);
  }

  async function uploadAvatar(file: File): Promise<string | null> {
    try {
      const supabase = createClient();
      const ext = file.name.split(".").pop() ?? "jpg";
      const path = `avatars/${handle}-${Date.now()}.${ext}`;
      const { error } = await supabase.storage.from("avatars").upload(path, file, { upsert: true });
      if (error) return URL.createObjectURL(file);
      const { data } = supabase.storage.from("avatars").getPublicUrl(path);
      return data.publicUrl;
    } catch {
      return URL.createObjectURL(file);
    }
  }

  /* ── derive view data ─────────────────────────────────────────────────── */
  const { identity } = draft;
  const avatarUrl = safeUrl(identity.avatar_url) ?? githubAvatar(identity.links?.github);
  const verified = draft.review?.status === "human_approved";
  const skills = draft.skills.slice().sort((a, b) => b.evidence_count - a.evidence_count);
  const nameParts = (identity.name || "").trim().split(/\s+/);
  const nameLines = nameParts.length > 1 ? [nameParts.slice(0, -1).join(" "), nameParts[nameParts.length - 1]] : nameParts;
  const initials = (identity.name || "?").split(/\s+/).map((p) => p[0]).filter(Boolean).slice(0, 2).join("").toUpperCase();
  const links = Object.entries(identity.links ?? {})
    .map(([p, u]) => [p, safeUrl(u)] as const)
    .filter((e): e is readonly [string, string] => e[1] !== null);
  const syncedAt = (() => {
    const d = new Date(draft.updated_at);
    return Number.isNaN(d.getTime()) ? null : d.toLocaleDateString("en-US", { month: "short", year: "numeric" }).toUpperCase();
  })();
  const obsessionSources: Record<(typeof OBSESSION_CARDS)[number]["key"], string[]> = {
    connect_with: draft.connect_with,
    love_talking_about: draft.love_talking_about,
    working_on: draft.working_on,
  };
  const obsessions = OBSESSION_CARDS.filter((row) => obsessionSources[row.key].length > 0 || isEditing("obsessions")).map((row) => ({
    ...row, items: obsessionSources[row.key],
  }));
  const linkedinHandle = usernameFromUrl(identity.links?.linkedin);
  const linkedinUrl = safeUrl(identity.links?.linkedin);
  const githubHandle = usernameFromUrl(identity.links?.github) || handle;
  const githubUrl = safeUrl(identity.links?.github);
  const xUrl = safeUrl(identity.links?.x);
  const showLinkedin = !!(linkedinHandle || draft.linkedin_stats?.connections != null);
  const showX = !!(draft.x_stats?.handle || identity.links?.x);
  const showGithub = !!(identity.links?.github || draft.github_stats || draft.contribution_stats);
  const contributions = draft.contribution_stats ?? null;

  const factText = (fact: Record<string, unknown>): string | null => {
    for (const key of ["content", "value", "text", "description", "fact", "summary"]) {
      if (typeof fact[key] === "string" && (fact[key] as string).trim()) return fact[key] as string;
    }
    return null;
  };

  /* ── section edit states ─────────────────────────────────────────────── */

  // Hero local state
  const [heroName, setHeroName] = useState(identity.name);
  const [heroHeadline, setHeroHeadline] = useState(identity.headline);
  const [heroLocation, setHeroLocation] = useState(identity.location);
  const [heroAvatar, setHeroAvatar] = useState(identity.avatar_url);
  const [heroLinks, setHeroLinks] = useState<[string, string][]>(
    Object.entries(identity.links ?? {}).map(([p, u]) => [p, u as string])
  );
  const [heroAvatarUploading, setHeroAvatarUploading] = useState(false);
  const avatarFileRef = useRef<HTMLInputElement>(null);

  function startEditHero() {
    setHeroName(draft.identity.name);
    setHeroHeadline(draft.identity.headline);
    setHeroLocation(draft.identity.location);
    setHeroAvatar(draft.identity.avatar_url);
    setHeroLinks(Object.entries(draft.identity.links ?? {}).map(([p, u]) => [p, u as string]));
    startEdit("hero");
  }

  async function saveHero() {
    const linksObj = Object.fromEntries(heroLinks.filter(([p, u]) => p.trim() && u.trim()));
    await save({
      ...draft,
      identity: { ...draft.identity, name: heroName, headline: heroHeadline, location: heroLocation, avatar_url: heroAvatar, links: linksObj },
    });
  }

  // Summary local state
  const [sumText, setSumText] = useState(draft.summary);
  const [sumAvail, setSumAvail] = useState(draft.availability);
  const [sumIndustries, setSumIndustries] = useState(draft.industries);

  function startEditSummary() {
    setSumText(draft.summary);
    setSumAvail(draft.availability);
    setSumIndustries(draft.industries);
    startEdit("summary");
  }

  async function saveSummary() {
    await save({ ...draft, summary: sumText, availability: sumAvail, industries: sumIndustries });
  }

  // Obsessions local state
  const [obsWorking, setObsWorking] = useState(draft.working_on);
  const [obsConnect, setObsConnect] = useState(draft.connect_with);
  const [obsTalking, setObsTalking] = useState(draft.love_talking_about);

  function startEditObsessions() {
    setObsWorking(draft.working_on);
    setObsConnect(draft.connect_with);
    setObsTalking(draft.love_talking_about);
    startEdit("obsessions");
  }

  async function saveObsessions() {
    await save({ ...draft, working_on: obsWorking, connect_with: obsConnect, love_talking_about: obsTalking });
  }

  // Skills local state
  const [skillList, setSkillList] = useState(draft.skills);
  const [newSkillName, setNewSkillName] = useState("");
  const [newSkillLevel, setNewSkillLevel] = useState("intermediate");

  function startEditSkills() {
    setSkillList(draft.skills);
    setNewSkillName("");
    startEdit("skills");
  }

  async function saveSkills() {
    await save({ ...draft, skills: skillList });
  }

  // Calendly local state
  const [calendlyInput, setCalendlyInput] = useState(draft.calendly_url ?? "");

  function startEditCalendly() {
    setCalendlyInput(draft.calendly_url ?? "");
    startEdit("calendly");
  }

  async function saveCalendly() {
    await save({ ...draft, calendly_url: calendlyInput.trim() || null });
  }

  /* ─────────────────────────────────────────────────────────────────────── */

  const SOCIAL_CARD_H = 360;
  const SOCIAL_POST_ROW_H = 84;

  return (
    <>
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      {/* eslint-disable-next-line @next/next/no-page-custom-font */}
      <link
        href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;600;700&family=Geist:wght@300;400;500;600;700&family=Geist+Mono:wght@400;500;600;700&display=swap"
        rel="stylesheet"
      />
      <style>{`
        .pf-bento { letter-spacing: normal; line-height: 1.5; }
        .pf-bento h2 { font-family: 'Space Grotesk', sans-serif !important; text-transform: none !important; letter-spacing: normal !important; }
        .pf-bento.font-sans, .pf-bento .font-sans { font-family: 'Geist', sans-serif !important; }
        .pf-bento .font-mono { font-family: 'Geist Mono', monospace !important; }
        .pf-bento .font-display { font-family: 'Space Grotesk', sans-serif !important; }
        .pf-bento a { color: inherit; text-decoration: none; }
        .pf-bento a:hover { text-decoration: underline; }
        .pf-bento .pf-c-dark { color: #0B0B0B; }
        .pf-bento .pf-c-muted { color: #8E8E88; }
        .pf-bento .tc { position: relative; }
        .pf-bento .tc::before { content: ''; position: absolute; top: 12px; left: 12px; width: 8px; height: 8px; border-top: 1px solid #d4d4d8; border-left: 1px solid #d4d4d8; }
        .pf-bento .tc::after  { content: ''; position: absolute; top: 12px; right: 12px; width: 8px; height: 8px; border-top: 1px solid #d4d4d8; border-right: 1px solid #d4d4d8; }
        .pf-bento.zd-canvas { background-color: #f4f4f5; background-attachment: fixed; }
        .edit-input { background: rgba(255,255,255,0.1); border: 1px solid rgba(255,255,255,0.25); border-radius: 8px; padding: 6px 10px; outline: none; font-size: 13px; width: 100%; }
        .edit-input:focus { border-color: rgba(255,255,255,0.55); }
        .edit-input-dark { background: #f9f9f9; border: 1px solid #e5e5e5; border-radius: 8px; padding: 6px 10px; outline: none; font-size: 13px; width: 100%; color: #0B0B0B; }
        .edit-input-dark:focus { border-color: #7B72E9; }
        .edit-label { font-size: 10px; font-family: 'Geist Mono', monospace; text-transform: uppercase; letter-spacing: 0.08em; opacity: 0.6; margin-bottom: 3px; display: block; }
      `}</style>

      <div className="pf-bento zd-canvas font-sans antialiased w-full min-h-screen flex flex-col selection:bg-[#7B72E9] selection:text-white px-4 sm:px-10 md:px-16 lg:px-24 xl:px-32">
        <main className="w-full max-w-[1440px] mx-auto py-8 sm:py-12 flex-1">

          {/* ── EDIT MODE HEADER ─────────────────────────────────────────── */}
          <header className="flex flex-col sm:flex-row justify-between items-center mb-8 gap-3 font-mono">
            <div className="flex items-center gap-2 text-[12px] text-[#8E8E88]">
              <span className="w-2 h-2 rounded-full bg-[#7B72E9] inline-block flex-shrink-0" />
              <Link href="/directory" className="pf-c-muted hover:text-[#0B0B0B]">Zynd</Link>
              <span>/</span>
              <Link href={`/p/${handle}`} className="pf-c-muted hover:text-[#0B0B0B]">@{handle}</Link>
              <span>/</span>
              <span className="font-semibold text-[#0B0B0B]">edit</span>
            </div>
            <div className="flex items-center gap-2 flex-wrap justify-end">
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/20 text-[11px] font-semibold text-amber-600">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-500 flex-shrink-0" />
                EDIT_MODE
              </span>
              <Link
                href={`/p/${handle}`}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full border border-gray-200 bg-white font-mono text-[12px] font-semibold text-[#0B0B0B] hover:bg-gray-50 transition-colors"
              >
                View live →
              </Link>
            </div>
          </header>

          {/* hover hint */}
          <div className="mb-6 px-4 py-2.5 rounded-xl bg-[#7B72E9]/8 border border-[#7B72E9]/15 font-mono text-[11px] text-[#7B72E9] font-semibold flex items-center gap-2">
            <Pencil size={11} />
            Hover any card to reveal the edit button. Changes save instantly to your live profile.
          </div>

          {/* ── MAIN BENTO GRID ────────────────────────────────────────── */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-4 lg:gap-6 auto-rows-min">

            {/* ─ ROW 1: HERO ────────────────────────────────────────────── */}

            {/* Purple Hero — edit mode or view mode */}
            <div className="col-span-12 lg:col-span-4 relative group">
              {isEditing("hero") ? (
                <div className="bg-[#7B72E9] text-white rounded-[32px] p-8 flex flex-col shadow-sm">
                  <div className="text-[10px] font-mono uppercase tracking-widest text-white/60 mb-4">Editing Identity</div>

                  {/* Avatar */}
                  <div className="flex items-center gap-3 mb-5">
                    <div className="w-16 h-16 rounded-full border-2 border-white/30 overflow-hidden flex items-center justify-center bg-[#8b5cf6] flex-shrink-0">
                      {heroAvatar ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={heroAvatar} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <span className="font-display text-xl font-bold text-white">{initials}</span>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => avatarFileRef.current?.click()}
                          disabled={heroAvatarUploading}
                          className="text-[11px] font-mono px-3 py-1 rounded-full bg-white/20 border border-white/30 hover:bg-white/30 transition-colors disabled:opacity-50"
                        >
                          {heroAvatarUploading ? "Uploading…" : "Upload photo"}
                        </button>
                      </div>
                      <input
                        ref={avatarFileRef}
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={async (e) => {
                          const file = e.target.files?.[0];
                          if (!file) return;
                          setHeroAvatarUploading(true);
                          const url = await uploadAvatar(file);
                          if (url) setHeroAvatar(url);
                          setHeroAvatarUploading(false);
                        }}
                      />
                      <input
                        value={heroAvatar}
                        onChange={(e) => setHeroAvatar(e.target.value)}
                        placeholder="Or paste image URL…"
                        className="edit-input mt-1.5 text-[11px]"
                      />
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div>
                      <span className="edit-label text-white/60">Full Name</span>
                      <input value={heroName} onChange={(e) => setHeroName(e.target.value)} className="edit-input font-display text-lg font-bold" placeholder="Your name" />
                    </div>
                    <div>
                      <span className="edit-label text-white/60">Headline</span>
                      <input value={heroHeadline} onChange={(e) => setHeroHeadline(e.target.value)} className="edit-input" placeholder="Role / what you do" />
                    </div>
                    <div>
                      <span className="edit-label text-white/60">Location</span>
                      <input value={heroLocation} onChange={(e) => setHeroLocation(e.target.value)} className="edit-input" placeholder="City, Country" />
                    </div>

                    {/* Links editor */}
                    <div>
                      <span className="edit-label text-white/60">Social Links</span>
                      <div className="space-y-1.5">
                        {heroLinks.map(([p, u], i) => (
                          <div key={i} className="flex gap-1.5">
                            <input
                              value={p}
                              onChange={(e) => { const n = [...heroLinks]; n[i] = [e.target.value, u]; setHeroLinks(n); }}
                              placeholder="platform"
                              className="edit-input w-[90px] flex-shrink-0 text-[11px]"
                            />
                            <input
                              value={u}
                              onChange={(e) => { const n = [...heroLinks]; n[i] = [p, e.target.value]; setHeroLinks(n); }}
                              placeholder="https://…"
                              className="edit-input flex-1 text-[11px]"
                            />
                            <button type="button" onClick={() => setHeroLinks(heroLinks.filter((_, j) => j !== i))} className="text-white/60 hover:text-white px-1">
                              <X size={12} />
                            </button>
                          </div>
                        ))}
                        <button
                          type="button"
                          onClick={() => setHeroLinks([...heroLinks, ["", ""]])}
                          className="text-[11px] font-mono text-white/60 hover:text-white transition-colors"
                        >
                          + Add link
                        </button>
                      </div>
                    </div>
                  </div>

                  <SaveBar onSave={saveHero} onCancel={cancelEdit} saving={saving} />
                </div>
              ) : (
                <div className="bg-[#7B72E9] text-white rounded-[32px] p-8 flex flex-col justify-between shadow-sm relative overflow-hidden h-full">
                  <EditBtn onClick={startEditHero} light />
                  {verified && (
                    <div className="absolute top-5 right-5 z-20 inline-flex items-center gap-1.5 pl-2 pr-2.5 py-1 rounded-full bg-black/25 backdrop-blur-sm border border-white/20">
                      <BadgeCheck size={14} className="text-[#FBC46A]" />
                      <span className="font-mono text-[10px] font-bold uppercase tracking-wider text-white">Verified</span>
                    </div>
                  )}
                  <div>
                    <div className="w-20 h-20 rounded-full border-2 border-white/30 mb-5 overflow-hidden flex items-center justify-center bg-[#8b5cf6]">
                      {avatarUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={avatarUrl} alt={identity.name} className="w-full h-full object-cover" />
                      ) : (
                        <span className="font-display text-2xl font-bold text-white">{initials}</span>
                      )}
                    </div>
                    <p className="text-white/70 text-sm mb-1 font-mono">I&apos;m,</p>
                    <h2 className="font-display text-[44px]! font-bold! leading-[1.05]! tracking-tight! text-white! text-left">
                      {nameLines.map((line, i) => (
                        <span key={i}>{line}{i === 0 && nameLines.length > 1 && <br />}</span>
                      ))}
                    </h2>
                    {!isBlank(identity.headline) && (
                      <p className="text-white/90 font-medium mt-2 text-[13px] leading-snug">{identity.headline}</p>
                    )}
                    {links.length > 0 && (
                      <div className="mt-4 flex flex-wrap gap-2">
                        {links.map(([platform, url]) => (
                          <a key={platform} href={url} target="_blank" rel="noreferrer"
                            className="inline-flex w-8 h-8 rounded-full items-center justify-center bg-white/15 border border-white/20 text-white hover:bg-white/25 transition-colors flex-shrink-0"
                            title={linkLabel(platform)}
                          >
                            <LinkGlyph platform={platform} size={15} />
                          </a>
                        ))}
                      </div>
                    )}
                  </div>
                  <div className="mt-8 pt-4 border-t border-white/10 text-xs text-white/70 font-mono">
                    {syncedAt && !isBlank(identity.location) ? (
                      <span>Updated {syncedAt} · {identity.location}</span>
                    ) : syncedAt ? (
                      <span>Updated {syncedAt}</span>
                    ) : !isBlank(identity.location) ? (
                      <span>{identity.location}</span>
                    ) : (
                      <span className="opacity-40">No location set</span>
                    )}
                  </div>
                  <div className="absolute -right-20 -bottom-20 w-80 h-80 bg-white/10 rounded-full blur-3xl pointer-events-none" />
                </div>
              )}
            </div>

            {/* Right column */}
            <div className="col-span-12 lg:col-span-8 flex flex-col gap-4 lg:gap-6 overflow-hidden">

              {/* Dossier Summary */}
              <div className="relative group">
                {isEditing("summary") ? (
                  <div className="bg-white rounded-[32px] p-6 sm:p-8 shadow-sm border border-gray-100 tc flex-1 flex flex-col">
                    <div className="text-[10px] font-mono uppercase tracking-widest text-[#8E8E88] mb-4">Editing Summary</div>
                    <div className="space-y-3 flex-1">
                      <div>
                        <span className="edit-label">Summary</span>
                        <textarea
                          value={sumText}
                          onChange={(e) => setSumText(e.target.value)}
                          rows={5}
                          placeholder="Write your professional summary…"
                          className="edit-input-dark resize-none"
                        />
                      </div>
                      <div>
                        <span className="edit-label">Availability</span>
                        <input value={sumAvail} onChange={(e) => setSumAvail(e.target.value)} placeholder="e.g. Full-time, Consulting, Freelance" className="edit-input-dark" />
                      </div>
                      <div>
                        <span className="edit-label">Industries (press Enter to add)</span>
                        <div className="p-2 border border-gray-200 rounded-xl bg-gray-50 min-h-[44px]">
                          <TagInput
                            tags={sumIndustries}
                            onChange={setSumIndustries}
                            placeholder="Add industry…"
                            colorClass="bg-gray-100 text-[#0B0B0B] border border-gray-200"
                          />
                        </div>
                      </div>
                    </div>
                    <SaveBarDark onSave={saveSummary} onCancel={cancelEdit} saving={saving} />
                  </div>
                ) : (
                  <div className="bg-white rounded-[32px] p-6 sm:p-8 shadow-sm border border-gray-100 tc flex-1 flex flex-col justify-between">
                    <EditBtn onClick={startEditSummary} />
                    <div>
                      <div className="flex justify-between items-center mb-4 text-xs font-mono uppercase tracking-widest text-[#8E8E88]">
                        <span>Dossier Summary</span>
                        {verified && <span className="text-[#0B0B0B] font-bold">Zynd Verified</span>}
                      </div>
                      {!isBlank(draft.summary) ? (
                        <p className="text-[#2A2A2A] text-[15px] leading-relaxed">{draft.summary}</p>
                      ) : (
                        <p className="text-[#8E8E88] text-[14px] italic">No summary yet — click Edit to add one.</p>
                      )}
                    </div>
                    {(draft.industries.length > 0 || !isBlank(draft.availability)) && (
                      <div className="mt-auto pt-4 border-t border-gray-100 flex flex-wrap gap-1.5 font-mono text-[11px]">
                        {draft.industries.map((tag) => (
                          <span key={tag} className="px-2.5 py-1 rounded-md bg-gray-100 text-[#0B0B0B] font-medium">{tag}</span>
                        ))}
                        {!isBlank(draft.availability) && (
                          <span className="px-2.5 py-1 rounded-md bg-[#7B72E9]/10 text-[#7B72E9] font-semibold">Open to {draft.availability}</span>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Obsession Tiles */}
              <div className="relative group">
                {isEditing("obsessions") ? (
                  <div className="bg-white rounded-[32px] p-6 shadow-sm border border-gray-100">
                    <div className="text-[10px] font-mono uppercase tracking-widest text-[#8E8E88] mb-4">Editing Interests & Goals</div>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      {/* Love talking about */}
                      <div className="rounded-[20px] bg-[#a7f3d0] text-[#064e3b] p-4">
                        <div className="text-[10px] font-mono uppercase tracking-widest opacity-60 mb-2">Love Talking About</div>
                        <TagInput
                          tags={obsTalking}
                          onChange={setObsTalking}
                          placeholder="Topic…"
                          colorClass="bg-white/60 text-[#064e3b] border border-white/50"
                        />
                      </div>
                      {/* Working on */}
                      <div className="rounded-[20px] bg-[#fde68a] text-[#78350f] p-4">
                        <div className="text-[10px] font-mono uppercase tracking-widest opacity-60 mb-2">Working On</div>
                        <TagInput
                          tags={obsWorking}
                          onChange={setObsWorking}
                          placeholder="Project…"
                          colorClass="bg-white/60 text-[#78350f] border border-white/50"
                        />
                      </div>
                      {/* Connect with */}
                      <div className="rounded-[20px] bg-[#7B72E9] text-white p-4">
                        <div className="text-[10px] font-mono uppercase tracking-widest opacity-60 mb-2">Connect With</div>
                        <TagInput
                          tags={obsConnect}
                          onChange={setObsConnect}
                          placeholder="Person type…"
                          colorClass="bg-white/15 text-white border border-white/25"
                        />
                      </div>
                    </div>
                    <SaveBarDark onSave={saveObsessions} onCancel={cancelEdit} saving={saving} />
                  </div>
                ) : obsessions.length > 0 ? (
                  <div className="relative">
                    <EditBtn onClick={startEditObsessions} />
                    <div
                      className="grid gap-4 auto-rows-fr"
                      style={{ gridTemplateColumns: `repeat(${Math.min(obsessions.length, 3)}, minmax(0, 1fr))` }}
                    >
                      {obsessions.map((tile) => (
                        <div key={tile.key} className={`rounded-[28px] p-5 tc shadow-sm flex flex-col h-[140px] overflow-hidden ${tile.card}`}>
                          <div className="flex-shrink-0 text-[10px] font-mono uppercase tracking-widest opacity-60 mb-3">
                            {tile.label} ({tile.items.length})
                          </div>
                          <div className="flex-1 flex flex-wrap content-start gap-1.5 overflow-y-auto pr-1" style={{ scrollbarWidth: "none" }}>
                            {tile.items.map((item) => (
                              <span key={item} className={`px-2.5 py-1 rounded-full text-[12px] font-medium ${tile.chip}`}>{item}</span>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={startEditObsessions}
                    className="w-full p-5 rounded-[28px] border-2 border-dashed border-gray-200 text-[#8E8E88] font-mono text-[12px] hover:border-[#7B72E9] hover:text-[#7B72E9] transition-colors"
                  >
                    + Add interests, goals & topics
                  </button>
                )}
              </div>
            </div>

            {/* ─ ROW 2: MEMORY CONNECT + WORK EXPERIENCE ────────────────── */}

            {/* ZYND Memory Connect */}
            <div className="col-span-12 lg:col-span-6 bg-slate-900 text-white rounded-[32px] p-8 shadow-sm flex flex-col">
              <div className="flex justify-between items-center mb-6">
                <span className="text-xs font-mono uppercase tracking-widest text-purple-400 flex items-center gap-2">
                  <span className={`w-2 h-2 rounded-full ${memoryStatus === "connected" || memoryFacts.length > 0 ? "bg-purple-400 animate-pulse" : "bg-slate-600"}`} />
                  Memory &amp; MCP Sync
                </span>
                <span className="text-[10px] font-mono bg-slate-800 px-2.5 py-1 rounded-md text-slate-400">Agentic Context</span>
              </div>

              {memoryFacts.length > 0 ? (
                <>
                  <h3 className="text-xl font-bold text-white mb-3 leading-snug">Active AI Shared Memory</h3>
                  <div className="space-y-3 font-mono text-xs flex-1">
                    {memoryFacts.slice(0, 3).map((fact, i) => {
                      const text = factText(fact);
                      if (!text) return null;
                      return (
                        <div key={i} className="bg-slate-800/80 p-3.5 rounded-xl border border-slate-700/50">
                          <span className="text-purple-300 block mb-1">⚡ Context {i + 1}:</span>
                          <span className="text-slate-300">{text}</span>
                        </div>
                      );
                    })}
                  </div>
                  <button
                    type="button"
                    onClick={syncMemory}
                    disabled={memoryStatus === "loading"}
                    className="mt-5 inline-flex items-center gap-2 px-4 py-2 rounded-full bg-purple-500/20 border border-purple-500/30 text-purple-300 text-[12px] font-mono font-semibold hover:bg-purple-500/30 transition-colors disabled:opacity-60 self-start"
                  >
                    {memoryStatus === "loading" ? <Loader2 size={12} className="animate-spin" /> : <RefreshCw size={12} />}
                    {memoryStatus === "loading" ? "Syncing…" : "Re-sync memory"}
                  </button>
                </>
              ) : (
                <>
                  <div className="flex-1">
                    <h3 className="text-xl font-bold text-white mb-2">Connect ZYND Memory</h3>
                    <p className="text-slate-400 text-sm leading-relaxed mb-4">
                      Link your ZYND memory layer to show your AI context — the facts, preferences, and skills that AI agents use when working with you.
                    </p>
                    <div className="bg-slate-800/60 rounded-xl p-4 font-mono text-xs border border-slate-700/40 space-y-1.5 mb-5">
                      <div className="text-slate-500">// When connected, AI agents see:</div>
                      <div><span className="text-purple-300">your_skills</span><span className="text-slate-600"> → </span><span className="text-emerald-400">&ldquo;React, TypeScript, Rust…&rdquo;</span></div>
                      <div><span className="text-purple-300">working_on</span><span className="text-slate-600"> → </span><span className="text-emerald-400">&ldquo;{draft.working_on[0] ?? "your projects"}&rdquo;</span></div>
                      <div><span className="text-purple-300">availability</span><span className="text-slate-600"> → </span><span className="text-emerald-400">&ldquo;{draft.availability || "open"}&rdquo;</span></div>
                    </div>
                    {memoryStatus === "disconnected" && (
                      <div className="mb-4 p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-300 text-[12px] font-mono">
                        No ZYND memory found for your account. Set up ZYND to get started.
                      </div>
                    )}
                    {memoryStatus === "connected" && (
                      <div className="mb-4 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-[12px] font-mono flex items-center gap-2">
                        <Check size={12} /> Memory synced successfully!
                      </div>
                    )}
                  </div>
                  <div className="flex gap-2 flex-wrap">
                    <button
                      type="button"
                      onClick={syncMemory}
                      disabled={memoryStatus === "loading"}
                      className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#7B72E9] text-white text-[12px] font-mono font-semibold hover:bg-[#6c64d8] transition-colors disabled:opacity-60"
                    >
                      {memoryStatus === "loading" ? <Loader2 size={12} className="animate-spin" /> : <Zap size={12} />}
                      {memoryStatus === "loading" ? "Connecting…" : "Sync from ZYND"}
                    </button>
                    <a
                      href="https://zynd.ai"
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full border border-slate-700 text-slate-400 text-[12px] font-mono hover:border-slate-500 hover:text-slate-300 transition-colors"
                    >
                      Set up ZYND ↗
                    </a>
                  </div>
                </>
              )}
            </div>

            {/* Work Experience — read-only */}
            <div className="col-span-12 lg:col-span-6 bg-white rounded-[32px] p-6 sm:p-8 shadow-sm border border-gray-100 tc flex flex-col">
              <div className="flex justify-between items-center mb-5 text-xs font-mono uppercase tracking-widest text-[#8E8E88]">
                <span>Work Experience</span>
                {draft.experience_years != null && (
                  <span className="text-[#7B72E9] font-bold bg-[#7B72E9]/10 px-2 py-0.5 rounded-md">{draft.experience_years}Y Exp</span>
                )}
              </div>
              {(draft.work_experience ?? []).length > 0 ? (
                <div className="flex-1 space-y-0 divide-y divide-gray-100 overflow-y-auto max-h-[280px] pr-1">
                  {(draft.work_experience ?? []).slice(0, 5).map((job, i) => (
                    <div key={i} className="flex gap-3.5 py-4 first:pt-0">
                      <div className="shrink-0 w-9 h-9 rounded-xl bg-slate-100 border border-slate-200/60 flex items-center justify-center overflow-hidden">
                        <span className="text-[11px] font-bold text-slate-500">{(job.company || job.title || "?").charAt(0).toUpperCase()}</span>
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="font-semibold text-[#0B0B0B] text-[13.5px]">{job.title}</div>
                        <div className="text-[12px] text-slate-700 font-medium mt-0.5">{job.company}</div>
                        <div className="text-[11px] font-mono text-[#8E8E88] mt-0.5">{[job.start_date, job.end_date].filter(Boolean).join(" – ")}</div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex-1 flex flex-col justify-center items-center text-center py-6 gap-3">
                  <LinkedinGlyph size={28} />
                  <div>
                    <p className="font-semibold text-[#0B0B0B] text-sm">No work experience synced yet</p>
                    <p className="text-xs text-[#8E8E88] mt-1">Connect your LinkedIn profile to sync work history.</p>
                  </div>
                  {identity.links?.linkedin ? (
                    <span className="text-[11px] font-mono text-emerald-600">LinkedIn connected — re-create card to sync.</span>
                  ) : (
                    <button
                      type="button"
                      onClick={() => { setHeroLinks([...Object.entries(draft.identity.links ?? {}).map(([p, u]) => [p, u as string] as [string, string]), ["linkedin", ""]]); startEdit("hero"); }}
                      className="text-[11px] font-mono text-[#0A66C2] hover:underline"
                    >
                      + Add LinkedIn URL →
                    </button>
                  )}
                </div>
              )}
            </div>

            {/* ─ ROW 3: SOCIAL STATS (read-only) ────────────────────────── */}

            {showLinkedin && (
              <div
                className="col-span-12 md:col-span-6 lg:col-span-4 self-start bg-[#0A66C2] text-white rounded-[32px] p-5 shadow-sm flex flex-col overflow-hidden"
                style={{ height: SOCIAL_CARD_H }}
              >
                <div className="flex-shrink-0 flex justify-between items-start mb-3 text-xs font-mono">
                  <span className="flex items-center gap-1.5 font-bold"><LinkedinGlyph size={14} />LINKEDIN</span>
                  <span className="text-[10px] bg-white/10 px-2 py-0.5 rounded text-white/60">Read-only</span>
                </div>
                <div className="flex-1 flex flex-col justify-between">
                  <div>
                    <h4 className="text-lg font-bold">{identity.name}</h4>
                    {!isBlank(identity.headline) && <p className="text-xs text-white/80 mt-0.5">{identity.headline}</p>}
                    <p className="text-[11px] text-white/50 font-mono mt-3">Synced from LinkedIn. Re-create card to refresh posts.</p>
                  </div>
                  {draft.linkedin_stats?.connections != null && (
                    <div className="grid grid-cols-2 gap-3 text-center border-t border-white/20 pt-3 font-mono">
                      <div>
                        <div className="text-xl font-bold"><CountUp value={Number(draft.linkedin_stats.connections)} /></div>
                        <div className="text-[10px] text-white/70 uppercase">Connections</div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {showX && (
              <div
                className="col-span-12 md:col-span-6 lg:col-span-4 self-start bg-[#0f1419] text-white rounded-[32px] p-5 shadow-sm flex flex-col overflow-hidden"
                style={{ height: SOCIAL_CARD_H }}
              >
                <div className="flex-shrink-0 flex justify-between items-start mb-3 text-xs font-mono">
                  <span className="flex items-center gap-1.5 font-bold"><XGlyph size={13} />X / TWITTER</span>
                  <span className="text-[10px] bg-white/10 px-2 py-0.5 rounded text-white/60">Read-only</span>
                </div>
                <div className="flex-1 flex flex-col justify-between">
                  <div>
                    <h4 className="text-lg font-bold">{identity.name}</h4>
                    {xUrl && <a href={xUrl} target="_blank" rel="noreferrer" className="text-[11px] text-white/60 hover:text-white font-mono mt-1 block">{draft.x_stats?.handle ?? `@${usernameFromUrl(xUrl)}`} ↗</a>}
                    <p className="text-[11px] text-white/40 font-mono mt-2">Stats sync automatically. Add X URL in Identity to connect.</p>
                  </div>
                  {draft.x_stats && (
                    <div className="grid grid-cols-3 gap-2 text-center border-t border-white/10 pt-3 font-mono">
                      <div>
                        <div className="text-lg font-bold">{draft.x_stats.followers != null ? <CountUp value={Number(draft.x_stats.followers)} /> : "—"}</div>
                        <div className="text-[10px] text-white/50 uppercase">Followers</div>
                      </div>
                      <div>
                        <div className="text-lg font-bold">{draft.x_stats.posts != null ? <CountUp value={Number(draft.x_stats.posts)} /> : "—"}</div>
                        <div className="text-[10px] text-white/50 uppercase">Posts</div>
                      </div>
                      <div>
                        <div className="text-lg font-bold text-amber-400">{draft.x_stats.impressions != null ? <CountUp value={Number(draft.x_stats.impressions)} /> : "—"}</div>
                        <div className="text-[10px] text-white/50 uppercase">Impr.</div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {showGithub && (
              <div className="col-span-12 md:col-span-6 lg:col-span-4 self-start bg-white rounded-[32px] p-6 shadow-sm border border-gray-100 tc flex flex-col justify-between">
                <div>
                  <div className="flex justify-between items-center mb-4 text-xs font-mono uppercase tracking-widest text-[#8E8E88]">
                    <span className="flex items-center gap-1.5 text-[#0B0B0B]"><GithubGlyph size={14} />GitHub Stats</span>
                    {githubUrl ? (
                      <a href={githubUrl} target="_blank" rel="noreferrer" className="text-[#0B0B0B] font-bold hover:text-[#7B72E9]">@{githubHandle} ↗</a>
                    ) : (
                      <span className="text-[#0B0B0B] font-bold">@{githubHandle}</span>
                    )}
                  </div>
                  {(draft.github_stats?.total_repos != null || draft.github_stats?.total_commits != null) && (
                    <div className="grid grid-cols-2 gap-3 mb-4">
                      {draft.github_stats?.total_repos != null && (
                        <div className="bg-gray-50 p-3 rounded-2xl border border-gray-100 text-center">
                          <div className="text-xl font-extrabold text-[#0B0B0B]"><CountUp value={draft.github_stats.total_repos} /></div>
                          <div className="text-[10px] font-mono text-[#8E8E88] uppercase">Repos</div>
                        </div>
                      )}
                      {draft.github_stats?.total_commits != null && (
                        <div className="bg-gray-50 p-3 rounded-2xl border border-gray-100 text-center">
                          <div className="text-xl font-extrabold text-[#0B0B0B]"><CountUp value={Number(draft.github_stats.total_commits)} /></div>
                          <div className="text-[10px] font-mono text-[#8E8E88] uppercase">Commits</div>
                        </div>
                      )}
                    </div>
                  )}
                  {contributions && Array.isArray(contributions.levels) && contributions.levels.length > 0 && (
                    <ContributionHeatmap
                      levels={contributions.levels}
                      year={contributions.year}
                      total={contributions.total}
                      avgPerDay={contributions.avg_per_day}
                    />
                  )}
                </div>
              </div>
            )}

            {/* ─ ROW 4: SKILLS (editable) ─────────────────────────────────── */}

            {(skills.length > 0 || isEditing("skills")) && (
              <div className="col-span-12 bg-white rounded-[32px] p-6 sm:p-8 shadow-sm border border-gray-100 relative group">
                {isEditing("skills") ? (
                  <>
                    <div className="text-[10px] font-mono uppercase tracking-widest text-[#8E8E88] mb-4">Editing Skills</div>
                    <div className="space-y-2 mb-4">
                      {skillList.map((skill, i) => (
                        <div key={i} className="flex items-center gap-2 bg-gray-50 px-4 py-2.5 rounded-xl border border-gray-100">
                          <span style={{ color: skillAccent(skill.name) }} className="font-bold text-xs w-6 flex-shrink-0">{skill.name.slice(0, 2).toUpperCase()}</span>
                          <input
                            value={skill.name}
                            onChange={(e) => { const n = [...skillList]; n[i] = { ...n[i], name: e.target.value }; setSkillList(n); }}
                            className="flex-1 bg-transparent outline-none text-[13px] text-[#0B0B0B] font-medium"
                          />
                          <select
                            value={skill.level}
                            onChange={(e) => { const n = [...skillList]; n[i] = { ...n[i], level: e.target.value }; setSkillList(n); }}
                            className="bg-white border border-gray-200 rounded-lg text-[11px] font-mono px-2 py-1 outline-none"
                          >
                            {["expert", "advanced", "intermediate", "beginner"].map((l) => (
                              <option key={l} value={l}>{l}</option>
                            ))}
                          </select>
                          <button type="button" onClick={() => setSkillList(skillList.filter((_, j) => j !== i))} className="text-gray-300 hover:text-red-400 ml-1">
                            <X size={13} />
                          </button>
                        </div>
                      ))}
                    </div>
                    {/* Add new skill */}
                    <div className="flex gap-2 items-center p-3 rounded-xl border-2 border-dashed border-gray-200">
                      <input
                        value={newSkillName}
                        onChange={(e) => setNewSkillName(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" && newSkillName.trim()) {
                            setSkillList([...skillList, { name: newSkillName.trim(), level: newSkillLevel, evidence_count: 1 }]);
                            setNewSkillName("");
                          }
                        }}
                        placeholder="Skill name…"
                        className="flex-1 bg-transparent outline-none text-[13px] text-[#0B0B0B]"
                      />
                      <select
                        value={newSkillLevel}
                        onChange={(e) => setNewSkillLevel(e.target.value)}
                        className="bg-white border border-gray-200 rounded-lg text-[11px] font-mono px-2 py-1 outline-none"
                      >
                        {["expert", "advanced", "intermediate", "beginner"].map((l) => (
                          <option key={l} value={l}>{l}</option>
                        ))}
                      </select>
                      <button
                        type="button"
                        onClick={() => { if (newSkillName.trim()) { setSkillList([...skillList, { name: newSkillName.trim(), level: newSkillLevel, evidence_count: 1 }]); setNewSkillName(""); } }}
                        className="px-3 py-1.5 rounded-lg bg-[#7B72E9] text-white text-[11px] font-mono hover:bg-[#6c64d8] transition-colors"
                      >
                        + Add
                      </button>
                    </div>
                    <SaveBarDark onSave={saveSkills} onCancel={cancelEdit} saving={saving} />
                  </>
                ) : (
                  <>
                    <EditBtn onClick={startEditSkills} />
                    <div className="flex justify-between items-center mb-5 text-xs font-mono uppercase tracking-widest text-[#8E8E88]">
                      <span className="text-[#0B0B0B] font-bold">Skill Matrix</span>
                      <span className="text-[#7B72E9] font-bold bg-[#7B72E9]/8 px-2 py-0.5 rounded border border-[#7B72E9]/15">{skills.length} Tracked</span>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 font-mono text-sm">
                      {skills.slice(0, 9).map((skill) => {
                        const meta = levelMeta(skill.level);
                        const accent = skillAccent(skill.name);
                        const isExpert = skill.level.toLowerCase() === "expert";
                        const isAdvanced = skill.level.toLowerCase() === "advanced";
                        const isMid = skill.level.toLowerCase() === "intermediate" || skill.level.toLowerCase() === "mid";
                        const blocks = isExpert ? "■■■■" : isAdvanced ? "■■■□" : isMid ? "■■□□" : "■□□□";
                        return (
                          <div key={skill.name} className="flex justify-between items-center bg-gray-50 px-4 py-2.5 rounded-xl border border-gray-100">
                            <span className="flex items-center gap-2">
                              <span style={{ color: accent }} className="font-bold text-xs">{skill.name.slice(0, 2).toUpperCase()}</span>
                              <span className="text-[#0B0B0B] font-medium font-sans text-[13px]">{skill.name}</span>
                            </span>
                            <span className="text-[#8E8E88] text-xs">{meta.label} <span style={{ color: meta.bar }} className="ml-1 tracking-wider">{blocks}</span></span>
                          </div>
                        );
                      })}
                    </div>
                  </>
                )}
              </div>
            )}

            {skills.length === 0 && !isEditing("skills") && (
              <button
                type="button"
                onClick={startEditSkills}
                className="col-span-12 p-5 rounded-[32px] border-2 border-dashed border-gray-200 text-[#8E8E88] font-mono text-[12px] hover:border-[#7B72E9] hover:text-[#7B72E9] transition-colors"
              >
                + Add skills to your profile
              </button>
            )}

            {/* ─ ROW 5: CALENDLY + HANDLE ─────────────────────────────────── */}

            {/* Calendly edit */}
            <div className="col-span-12 md:col-span-6 relative group">
              {isEditing("calendly") ? (
                <div className="bg-blue-50 rounded-[32px] p-6 border border-blue-100">
                  <div className="text-[10px] font-mono uppercase tracking-widest text-blue-500 mb-3">Scheduling Link</div>
                  <p className="text-[12px] text-slate-500 mb-3">Paste your Calendly, Cal.com, or any booking URL.</p>
                  <input
                    value={calendlyInput}
                    onChange={(e) => setCalendlyInput(e.target.value)}
                    placeholder="https://calendly.com/your-link"
                    className="edit-input-dark"
                  />
                  <SaveBarDark onSave={saveCalendly} onCancel={cancelEdit} saving={saving} />
                </div>
              ) : draft.calendly_url ? (
                <div className="bg-blue-50 rounded-[32px] p-6 border border-blue-100 flex items-center justify-between">
                  <div>
                    <div className="text-[10px] font-mono uppercase text-blue-500 font-bold mb-1">Scheduling</div>
                    <p className="text-[13px] font-mono text-slate-700 truncate max-w-[220px]">{draft.calendly_url}</p>
                  </div>
                  <EditBtn onClick={startEditCalendly} />
                </div>
              ) : (
                <button
                  type="button"
                  onClick={startEditCalendly}
                  className="w-full p-5 rounded-[32px] border-2 border-dashed border-blue-200 text-blue-400 font-mono text-[12px] hover:border-blue-400 hover:text-blue-600 transition-colors"
                >
                  + Add scheduling link (Calendly, Cal.com…)
                </button>
              )}
            </div>

            {/* Handle / URL edit */}
            <div className="col-span-12 md:col-span-6 relative group">
              {isEditing("handle") ? (
                <div className="bg-[#7B72E9]/5 rounded-[32px] p-6 border border-[#7B72E9]/15">
                  <div className="text-[10px] font-mono uppercase tracking-widest text-[#7B72E9] mb-3">Profile URL</div>
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-[13px] font-mono text-[#8E8E88]">zynd.ai/p/</span>
                    <div className="relative flex-1">
                      <input
                        value={handleInput}
                        onChange={(e) => onHandleChange(e.target.value)}
                        className="edit-input-dark font-mono"
                        placeholder="your-handle"
                      />
                      <div className="absolute right-3 top-1/2 -translate-y-1/2">
                        {handleChecking && <Loader2 size={12} className="animate-spin text-gray-400" />}
                        {!handleChecking && handleAvailable === true && <Check size={12} className="text-emerald-500" />}
                        {!handleChecking && handleAvailable === false && <X size={12} className="text-red-400" />}
                      </div>
                    </div>
                  </div>
                  {handleAvailable === false && handleInput !== handle && (
                    <p className="text-[11px] font-mono text-red-500 mb-2">Handle taken — try another.</p>
                  )}
                  {handleInput === handle && (
                    <p className="text-[11px] font-mono text-gray-400 mb-2">Same as current handle.</p>
                  )}
                  <SaveBarDark
                    onSave={saveHandle}
                    onCancel={() => { setHandleInput(handle); setHandleAvailable(null); cancelEdit(); }}
                    saving={saving}
                  />
                </div>
              ) : (
                <div className="bg-[#7B72E9]/5 rounded-[32px] p-6 border border-[#7B72E9]/15 flex items-center justify-between">
                  <div>
                    <div className="text-[10px] font-mono uppercase text-[#7B72E9] font-bold mb-1">Profile URL</div>
                    <p className="text-[13px] font-mono text-[#0B0B0B] font-semibold">zynd.ai/p/<span className="text-[#7B72E9]">{handle}</span></p>
                  </div>
                  <EditBtn onClick={() => { setHandleInput(handle); setHandleAvailable(null); startEdit("handle"); }} />
                </div>
              )}
            </div>

          </div>{/* end grid */}

          {/* ── FOOTER ─────────────────────────────────────────────────────── */}
          <footer className="mt-10 pt-6 border-t border-gray-200 flex flex-wrap items-center justify-between gap-4 text-[11px] font-mono text-[#8E8E88]">
            <div className="flex items-center gap-2">
              <span className="font-bold text-[#0B0B0B]">ZYND.AI</span>
              <span>•</span>
              <span>Editing @{handle}</span>
            </div>
            <Link
              href={`/p/${handle}`}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-[#0B0B0B] text-white text-[12px] font-mono font-semibold hover:bg-[#333] transition-colors"
            >
              View live profile →
            </Link>
          </footer>

        </main>
      </div>
    </>
  );
}
