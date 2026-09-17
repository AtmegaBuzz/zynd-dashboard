"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import {
  BadgeCheck, Globe, Pencil, X, Check, Loader2, RefreshCw, Zap,
} from "lucide-react";
import { type AgentProfileCard, updateCard, CARDS_API } from "@/lib/cards";
import { createClient } from "@/lib/supabase/client";
import { ContributionHeatmap } from "../contribution-heatmap";
import { CountUp } from "../count-up";

/* ─── helpers ───────────────────────────────────────────────────────────── */

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
  } catch { return null; }
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
  } catch { return null; }
}

function usernameFromUrl(url: string | null | undefined): string | null {
  if (!url) return null;
  return url.replace(/\/+$/, "").split("/").pop() || null;
}

const LEVEL_BLOCKS: Record<string, string> = {
  expert: "■■■■", advanced: "■■■□", intermediate: "■■□□", beginner: "■□□□",
};
const LEVEL_COLORS: Record<string, string> = {
  expert: "#F59E0B", advanced: "#7B72E9", intermediate: "#0EA5E9", beginner: "#10B981",
};
const LEVEL_LABELS: Record<string, string> = {
  expert: "Expert", advanced: "Advanced", intermediate: "Mid", beginner: "Beginner",
};
const SKILL_ACCENTS: Record<string, string> = {
  rust: "#F97316", "c++": "#0070BA", python: "#0284C7", go: "#14B8A6",
  pytorch: "#E11D48", kubernetes: "#6366F1", typescript: "#0284C7", javascript: "#F59E0B",
};
const skillAccent = (n: string) => SKILL_ACCENTS[n.trim().toLowerCase()] ?? "#7B72E9";
function skillShort(name: string): string {
  const n = name.toLowerCase();
  if (n.includes("typescript")) return "TS";
  if (n.includes("javascript")) return "JS";
  if (n.includes("python")) return "Py";
  if (n.includes("rust")) return "Rs";
  if (n.includes("golang") || n === "go") return "Go";
  return name.slice(0, 2).toUpperCase();
}

const OBSESSION_CARDS: {
  key: "connect_with" | "love_talking_about" | "working_on";
  label: string;
  card: string;
  chip: string;
  inputBorder: string;
}[] = [
  { key: "love_talking_about", label: "Love Talking About", card: "bg-[#a7f3d0] text-[#064e3b]", chip: "bg-white/60 text-[#064e3b] border border-white/50", inputBorder: "border-[#064e3b]/30 text-[#064e3b]" },
  { key: "working_on",         label: "Working On",         card: "bg-[#fde68a] text-[#78350f]", chip: "bg-white/60 text-[#78350f] border border-white/50", inputBorder: "border-[#78350f]/30 text-[#78350f]" },
  { key: "connect_with",       label: "Connect With",       card: "bg-[#7B72E9] text-white",     chip: "bg-white/15 text-white border border-white/25",    inputBorder: "border-white/30 text-white" },
];

const LINK_LABELS: Record<string, string> = {
  github: "GitHub", x: "X", twitter: "X", linkedin: "LinkedIn",
  website: "Website", portfolio: "Portfolio",
};
function linkLabel(p: string) {
  return LINK_LABELS[p.toLowerCase()] ?? p.charAt(0).toUpperCase() + p.slice(1);
}

/* ─── glyphs ──────────────────────────────────────────────────────────────── */

function GithubGlyph({ size = 16 }: { size?: number }) {
  return <svg className="fill-current" style={{ width: size, height: size }} viewBox="0 0 24 24" aria-hidden><path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z" /></svg>;
}
function XGlyph({ size = 14 }: { size?: number }) {
  return <svg className="fill-current" style={{ width: size, height: size }} viewBox="0 0 24 24" aria-hidden><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" /></svg>;
}
function LinkedinGlyph({ size = 16 }: { size?: number }) {
  return <svg className="fill-current" style={{ width: size, height: size }} viewBox="0 0 24 24" aria-hidden><path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z" /></svg>;
}

/* ─── shared edit UI ─────────────────────────────────────────────────────── */

function TagInput({ tags, onChange, placeholder, chipClass }: {
  tags: string[]; onChange: (t: string[]) => void;
  placeholder?: string; chipClass?: string;
}) {
  const [input, setInput] = useState("");
  function commit() {
    const v = input.trim();
    if (v && !tags.includes(v)) onChange([...tags, v]);
    setInput("");
  }
  return (
    <div className="flex flex-wrap gap-1.5 min-h-[28px]">
      {tags.map((t) => (
        <span key={t} className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[12px] font-medium ${chipClass ?? "bg-white/20 border border-white/30"}`}>
          {t}
          <button type="button" onClick={() => onChange(tags.filter((x) => x !== t))} className="opacity-60 hover:opacity-100">
            <X size={9} />
          </button>
        </span>
      ))}
      <input
        value={input}
        onChange={(e) => setInput(e.target.value)}
        onKeyDown={(e) => { if (e.key === "Enter" || e.key === ",") { e.preventDefault(); commit(); } }}
        onBlur={commit}
        placeholder={placeholder ?? "Add, press Enter…"}
        className="bg-transparent border-b border-current/25 outline-none text-[12px] px-1 py-0.5 min-w-[100px] placeholder:opacity-40"
      />
    </div>
  );
}

function EditBtn({ onClick, light = false }: { onClick: () => void; light?: boolean }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`absolute top-4 right-4 z-10 opacity-0 group-hover:opacity-100 transition-all inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-mono font-semibold shadow-sm
        ${light
          ? "bg-black/20 border border-white/20 text-white hover:bg-black/35"
          : "bg-white border border-gray-200 text-[#0B0B0B] hover:bg-[#7B72E9] hover:text-white hover:border-[#7B72E9]"
        }`}
    >
      <Pencil size={10} />
      Edit
    </button>
  );
}

function SaveBar({ onSave, onCancel, saving, light }: {
  onSave: () => void; onCancel: () => void; saving: boolean; light?: boolean;
}) {
  if (light) {
    return (
      <div className="flex gap-2 mt-4 pt-3 border-t border-white/15">
        <button type="button" onClick={onSave} disabled={saving}
          className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-white/20 hover:bg-white/35 border border-white/30 text-[12px] font-mono font-semibold transition-colors disabled:opacity-50">
          {saving ? <Loader2 size={12} className="animate-spin" /> : <Check size={12} />}
          Save
        </button>
        <button type="button" onClick={onCancel}
          className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full hover:bg-white/10 border border-white/20 text-[12px] font-mono transition-colors">
          <X size={12} /> Cancel
        </button>
      </div>
    );
  }
  return (
    <div className="flex gap-2 mt-4 pt-3 border-t border-gray-100">
      <button type="button" onClick={onSave} disabled={saving}
        className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-[#7B72E9] hover:bg-[#6c64d8] text-white text-[12px] font-mono font-semibold transition-colors disabled:opacity-50">
        {saving ? <Loader2 size={12} className="animate-spin" /> : <Check size={12} />}
        Save changes
      </button>
      <button type="button" onClick={onCancel}
        className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full border border-gray-200 hover:bg-gray-50 text-[#0B0B0B] text-[12px] font-mono transition-colors">
        <X size={12} /> Cancel
      </button>
    </div>
  );
}

/* ─── toast ──────────────────────────────────────────────────────────────── */

function Toast({ msg, type }: { msg: string; type: "ok" | "err" }) {
  return (
    <div className={`fixed bottom-6 left-1/2 -translate-x-1/2 z-50 inline-flex items-center gap-2 px-4 py-2.5 rounded-full shadow-lg font-mono text-[12px] font-semibold transition-all
      ${type === "ok" ? "bg-emerald-600 text-white" : "bg-red-600 text-white"}`}>
      {type === "ok" ? <Check size={13} /> : <X size={13} />}
      {msg}
    </div>
  );
}

/* ─── main component ─────────────────────────────────────────────────────── */

interface Props { initialCard: AgentProfileCard; handle: string; token: string; }

export function EditProfileClient({ initialCard, handle, token }: Props) {
  // Always treat card as published when in edit mode
  const [draft, setDraft] = useState<AgentProfileCard>({
    ...initialCard,
    status: "published",
  });
  const [editingSection, setEditingSection] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<{ msg: string; type: "ok" | "err" } | null>(null);
  const [memoryStatus, setMemoryStatus] = useState<"idle" | "loading" | "connected" | "disconnected">("idle");
  const [memoryFacts, setMemoryFacts] = useState<Array<Record<string, unknown>>>(
    (initialCard.zynd_memory ?? []) as Array<Record<string, unknown>>
  );

  function showToast(msg: string, type: "ok" | "err") {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  }

  const isEditing = (s: string) => editingSection === s;
  const startEdit = (s: string) => setEditingSection(s);
  const cancelEdit = () => setEditingSection(null);

  async function save(updated: AgentProfileCard) {
    setSaving(true);
    const toSave = { ...updated, status: "published" as const };
    const result = await updateCard(handle, toSave, token);
    if (result) {
      setDraft({ ...result, status: "published" });
      setEditingSection(null);
      showToast("Saved!", "ok");
    } else {
      showToast("Save failed — try again", "err");
    }
    setSaving(false);
  }

  /* ── Memory sync ──────────────────────────────────────────────────────── */

  async function syncMemory() {
    setMemoryStatus("loading");
    try {
      const res = await fetch(
        `${CARDS_API}/cards/by-handle/${encodeURIComponent(handle)}/refresh-memory`,
        { method: "POST", headers: { Authorization: `Bearer ${token}` } },
      );
      const data = await res.json();
      if (data.zynd_memory && data.zynd_memory.length > 0) {
        setMemoryFacts(data.zynd_memory);
        setDraft((prev) => ({ ...prev, zynd_memory: data.zynd_memory }));
        setMemoryStatus("connected");
        showToast(`${data.zynd_memory.length} memory facts synced!`, "ok");
      } else {
        setMemoryStatus("disconnected");
      }
    } catch {
      setMemoryStatus("disconnected");
    }
  }

  /* ── Handle rename ────────────────────────────────────────────────────── */

  const [handleInput, setHandleInput] = useState(handle);
  const [handleAvail, setHandleAvail] = useState<boolean | null>(null);
  const [handleChecking, setHandleChecking] = useState(false);
  const handleTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  function onHandleChange(val: string) {
    const slug = val.toLowerCase().replace(/[^a-z0-9-]/g, "").slice(0, 30);
    setHandleInput(slug);
    setHandleAvail(null);
    if (handleTimerRef.current) clearTimeout(handleTimerRef.current);
    if (slug.length < 2) return;
    setHandleChecking(true);
    handleTimerRef.current = setTimeout(async () => {
      try {
        const r = await fetch(`${CARDS_API}/cards/handle-available/${encodeURIComponent(slug)}`);
        const d = await r.json();
        setHandleAvail(slug === handle ? null : d.available);
      } catch {
        setHandleAvail(null);
      }
      setHandleChecking(false);
    }, 400);
  }

  async function saveHandle() {
    if (handleInput === handle) { cancelEdit(); return; }
    if (!handleAvail) return;
    setSaving(true);
    try {
      const res = await fetch(
        `${CARDS_API}/cards/by-handle/${encodeURIComponent(handle)}`,
        {
          method: "PATCH",
          headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
          body: JSON.stringify({ ...draft, status: "published", new_handle: handleInput }),
        },
      );
      if (res.ok) {
        showToast("Handle updated! Redirecting…", "ok");
        setTimeout(() => { window.location.href = `/p/${handleInput}/edit`; }, 1200);
      } else {
        showToast("Could not update handle", "err");
      }
    } catch {
      showToast("Network error", "err");
    }
    setSaving(false);
  }

  /* ── Avatar upload ────────────────────────────────────────────────────── */

  const avatarFileRef = useRef<HTMLInputElement>(null);
  const [avatarUploading, setAvatarUploading] = useState(false);

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

  /* ── Section local state ─────────────────────────────────────────────── */

  // Hero
  const [hName, setHName] = useState(draft.identity.name);
  const [hHeadline, setHHeadline] = useState(draft.identity.headline);
  const [hLocation, setHLocation] = useState(draft.identity.location);
  const [hAvatar, setHAvatar] = useState(draft.identity.avatar_url);
  const [hLinks, setHLinks] = useState<[string, string][]>(Object.entries(draft.identity.links ?? {}).map(([p, u]) => [p, u as string]));

  function startHero() {
    setHName(draft.identity.name); setHHeadline(draft.identity.headline);
    setHLocation(draft.identity.location); setHAvatar(draft.identity.avatar_url);
    setHLinks(Object.entries(draft.identity.links ?? {}).map(([p, u]) => [p, u as string]));
    startEdit("hero");
  }
  async function saveHero() {
    const links = Object.fromEntries(hLinks.filter(([p, u]) => p.trim() && u.trim()));
    await save({ ...draft, identity: { ...draft.identity, name: hName, headline: hHeadline, location: hLocation, avatar_url: hAvatar, links } });
  }

  // Summary
  const [sText, setSText] = useState(draft.summary);
  const [sAvail, setSAvail] = useState(draft.availability);
  const [sIndustries, setSIndustries] = useState(draft.industries);

  function startSummary() { setSText(draft.summary); setSAvail(draft.availability); setSIndustries(draft.industries); startEdit("summary"); }
  async function saveSummary() { await save({ ...draft, summary: sText, availability: sAvail, industries: sIndustries }); }

  // Obsessions
  const [oWorking, setOWorking] = useState(draft.working_on);
  const [oConnect, setOConnect] = useState(draft.connect_with);
  const [oTalking, setOTalking] = useState(draft.love_talking_about);

  function startObs() { setOWorking(draft.working_on); setOConnect(draft.connect_with); setOTalking(draft.love_talking_about); startEdit("obsessions"); }
  async function saveObs() { await save({ ...draft, working_on: oWorking, connect_with: oConnect, love_talking_about: oTalking }); }

  // Skills
  const [skillList, setSkillList] = useState(draft.skills);
  const [newSkillName, setNewSkillName] = useState("");
  const [newSkillLevel, setNewSkillLevel] = useState("intermediate");

  function startSkills() { setSkillList(draft.skills); setNewSkillName(""); startEdit("skills"); }
  async function saveSkills() { await save({ ...draft, skills: skillList }); }

  function addSkill() {
    const name = newSkillName.trim();
    if (!name) return;
    setSkillList((prev) => [...prev, { name, level: newSkillLevel, evidence_count: 1 }]);
    setNewSkillName("");
  }

  // Calendly
  const [calInput, setCalInput] = useState(draft.calendly_url ?? "");
  function startCal() { setCalInput(draft.calendly_url ?? ""); startEdit("calendly"); }
  async function saveCal() { await save({ ...draft, calendly_url: calInput.trim() || null }); }

  /* ── derived view data ───────────────────────────────────────────────── */

  const { identity } = draft;
  const avatarUrl = safeUrl(identity.avatar_url) ?? githubAvatar(identity.links?.github);
  const verified = draft.review?.status === "human_approved";
  const skills = draft.skills.slice().sort((a, b) => b.evidence_count - a.evidence_count);
  const nameParts = (identity.name || "").trim().split(/\s+/);
  const nameLines = nameParts.length > 1 ? [nameParts.slice(0, -1).join(" "), nameParts[nameParts.length - 1]] : nameParts;
  const initials = (identity.name || "?").split(/\s+/).map((p) => p[0]).filter(Boolean).slice(0, 2).join("").toUpperCase();
  const links = Object.entries(identity.links ?? {}).map(([p, u]) => [p, safeUrl(u)] as const).filter((e): e is readonly [string, string] => e[1] !== null);
  const syncedAt = (() => {
    const d = new Date(draft.updated_at);
    return Number.isNaN(d.getTime()) ? null : d.toLocaleDateString("en-US", { month: "short", year: "numeric" }).toUpperCase();
  })();

  const obsessionData: Record<(typeof OBSESSION_CARDS)[number]["key"], string[]> = {
    connect_with: draft.connect_with, love_talking_about: draft.love_talking_about, working_on: draft.working_on,
  };

  const linkedinUrl = safeUrl(identity.links?.linkedin);
  const linkedinHandle = usernameFromUrl(identity.links?.linkedin);
  const githubUrl = safeUrl(identity.links?.github);
  const githubHandle = usernameFromUrl(identity.links?.github) || handle;
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

  const SOCIAL_H = 320;

  // Scroll to editing section
  const heroRef = useRef<HTMLDivElement>(null);
  const summaryRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (editingSection === "hero") heroRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    if (editingSection === "summary") summaryRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, [editingSection]);

  /* ─── render ─────────────────────────────────────────────────────────── */

  return (
    <>
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      {/* eslint-disable-next-line @next/next/no-page-custom-font */}
      <link href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;600;700&family=Geist:wght@300;400;500;600;700&family=Geist+Mono:wght@400;500;600;700&display=swap" rel="stylesheet" />
      <style>{`
        .pf-bento { letter-spacing: normal; line-height: 1.5; }
        .pf-bento h2 { font-family: 'Space Grotesk', sans-serif !important; text-transform: none !important; letter-spacing: normal !important; }
        .pf-bento.font-sans, .pf-bento .font-sans { font-family: 'Geist', sans-serif !important; }
        .pf-bento .font-mono { font-family: 'Geist Mono', monospace !important; }
        .pf-bento .font-display { font-family: 'Space Grotesk', sans-serif !important; }
        .pf-bento a { color: inherit; text-decoration: none; }
        .pf-bento a:hover { text-decoration: underline; }
        .pf-bento.zd-canvas { background-color: #f4f4f5; background-attachment: fixed; }
        .pf-bento .tc { position: relative; }
        .pf-bento .tc::before { content:''; position:absolute; top:12px; left:12px; width:8px; height:8px; border-top:1px solid #d4d4d8; border-left:1px solid #d4d4d8; }
        .pf-bento .tc::after  { content:''; position:absolute; top:12px; right:12px; width:8px; height:8px; border-top:1px solid #d4d4d8; border-right:1px solid #d4d4d8; }
        .ei { background:#f9f9f9; border:1px solid #e5e5e5; border-radius:8px; padding:6px 10px; outline:none; font-size:13px; width:100%; color:#0B0B0B; font-family:'Geist',sans-serif; }
        .ei:focus { border-color:#7B72E9; }
        .ei-w { background:rgba(255,255,255,.12); border:1px solid rgba(255,255,255,.3); border-radius:8px; padding:6px 10px; outline:none; font-size:13px; width:100%; color:white; }
        .ei-w:focus { border-color:rgba(255,255,255,.7); }
        .el { font-size:10px; font-family:'Geist Mono',monospace; text-transform:uppercase; letter-spacing:.08em; opacity:.55; margin-bottom:3px; display:block; }
      `}</style>

      {toast && <Toast msg={toast.msg} type={toast.type} />}

      <div className="pf-bento zd-canvas font-sans antialiased w-full min-h-screen flex flex-col text-[#0B0B0B] selection:bg-[#7B72E9] selection:text-white px-4 sm:px-10 md:px-16 lg:px-24 xl:px-32">
        <main className="w-full max-w-[1440px] mx-auto py-8 sm:py-12 flex-1">

          {/* header */}
          <header className="flex flex-col sm:flex-row justify-between items-center mb-8 gap-3 font-mono">
            <div className="flex items-center gap-2 text-[12px] text-[#8E8E88]">
              <span className="w-2 h-2 rounded-full bg-amber-400 inline-block flex-shrink-0" />
              <Link href="/directory" className="hover:text-[#0B0B0B]">Zynd</Link>
              <span>/</span>
              <Link href={`/p/${handle}`} className="hover:text-[#0B0B0B]">@{handle}</Link>
              <span>/</span>
              <span className="font-semibold text-[#0B0B0B]">edit</span>
            </div>
            <div className="flex items-center gap-2 flex-wrap justify-end">
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-amber-50 border border-amber-200 text-[11px] font-semibold text-amber-600 font-mono">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-400 flex-shrink-0" />
                EDIT_MODE
              </span>
              <Link href={`/p/${handle}`}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full border border-gray-200 bg-white font-mono text-[12px] font-semibold text-[#0B0B0B] hover:bg-gray-50 transition-colors">
                View live →
              </Link>
            </div>
          </header>

          {/* hint bar */}
          <div className="mb-6 px-4 py-2.5 rounded-2xl bg-[#7B72E9]/8 border border-[#7B72E9]/15 font-mono text-[11px] text-[#7B72E9] font-semibold flex items-center gap-2">
            <Pencil size={11} />
            Hover any card then click <strong>Edit</strong> to change it. Changes publish live immediately.
          </div>

          <div className="grid grid-cols-1 md:grid-cols-12 gap-4 lg:gap-6 auto-rows-min">

            {/* ── HERO ──────────────────────────────────────────────────── */}
            <div ref={heroRef} className="col-span-12 lg:col-span-4 relative group">
              {isEditing("hero") ? (
                <div className="bg-[#7B72E9] text-white rounded-[32px] p-7 flex flex-col shadow-sm">
                  <div className="text-[10px] font-mono uppercase tracking-widest text-white/55 mb-5">Editing Identity</div>

                  {/* avatar */}
                  <div className="flex items-center gap-3 mb-5">
                    <div className="w-14 h-14 rounded-full border-2 border-white/30 overflow-hidden flex items-center justify-center bg-[#8b5cf6] flex-shrink-0">
                      {hAvatar ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={hAvatar} alt="" className="w-full h-full object-cover" />
                      ) : <span className="font-display text-lg font-bold">{initials}</span>}
                    </div>
                    <div className="flex-1 min-w-0 space-y-1.5">
                      <button type="button" onClick={() => avatarFileRef.current?.click()} disabled={avatarUploading}
                        className="text-[11px] font-mono px-3 py-1 rounded-full bg-white/20 border border-white/30 hover:bg-white/30 transition-colors disabled:opacity-50">
                        {avatarUploading ? "Uploading…" : "Upload photo"}
                      </button>
                      <input ref={avatarFileRef} type="file" accept="image/*" className="hidden"
                        onChange={async (e) => {
                          const file = e.target.files?.[0];
                          if (!file) return;
                          setAvatarUploading(true);
                          const url = await uploadAvatar(file);
                          if (url) setHAvatar(url);
                          setAvatarUploading(false);
                        }} />
                      <input value={hAvatar} onChange={(e) => setHAvatar(e.target.value)} placeholder="Or paste image URL…" className="ei-w text-[11px]" />
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div><span className="el">Full Name</span><input value={hName} onChange={(e) => setHName(e.target.value)} className="ei-w font-semibold text-base" placeholder="Your name" /></div>
                    <div><span className="el">Headline</span><input value={hHeadline} onChange={(e) => setHHeadline(e.target.value)} className="ei-w" placeholder="Role / what you do" /></div>
                    <div><span className="el">Location</span><input value={hLocation} onChange={(e) => setHLocation(e.target.value)} className="ei-w" placeholder="City, Country" /></div>
                    <div>
                      <span className="el">Social Links</span>
                      <div className="space-y-1.5">
                        {hLinks.map(([p, u], i) => (
                          <div key={i} className="flex gap-1.5">
                            <input value={p} onChange={(e) => { const n = [...hLinks]; n[i] = [e.target.value, u]; setHLinks(n); }}
                              placeholder="platform" className="ei-w w-[88px] flex-shrink-0 text-[11px]" />
                            <input value={u} onChange={(e) => { const n = [...hLinks]; n[i] = [p, e.target.value]; setHLinks(n); }}
                              placeholder="https://…" className="ei-w flex-1 text-[11px]" />
                            <button type="button" onClick={() => setHLinks(hLinks.filter((_, j) => j !== i))} className="text-white/50 hover:text-white px-1"><X size={12} /></button>
                          </div>
                        ))}
                        <button type="button" onClick={() => setHLinks([...hLinks, ["", ""]])}
                          className="text-[11px] font-mono text-white/55 hover:text-white transition-colors mt-1">
                          + Add link
                        </button>
                      </div>
                    </div>
                  </div>
                  <SaveBar onSave={saveHero} onCancel={cancelEdit} saving={saving} light />
                </div>
              ) : (
                <div className="bg-[#7B72E9] text-white rounded-[32px] p-8 flex flex-col justify-between shadow-sm relative overflow-hidden min-h-[360px]">
                  <EditBtn onClick={startHero} light />
                  {verified && (
                    <div className="absolute top-5 right-5 z-20 inline-flex items-center gap-1.5 pl-2 pr-2.5 py-1 rounded-full bg-black/25 backdrop-blur-sm border border-white/20">
                      <BadgeCheck size={14} className="text-[#FBC46A]" />
                      <span className="font-mono text-[10px] font-bold uppercase tracking-wider text-white">Verified</span>
                    </div>
                  )}
                  <div>
                    <div className="w-20 h-20 rounded-full border-2 border-white/30 mb-5 overflow-hidden flex items-center justify-center bg-[#8b5cf6]">
                      {avatarUrl
                        // eslint-disable-next-line @next/next/no-img-element
                        ? <img src={avatarUrl} alt={identity.name} className="w-full h-full object-cover" />
                        : <span className="font-display text-2xl font-bold text-white">{initials}</span>}
                    </div>
                    <p className="text-white/70 text-sm mb-1 font-mono">I&apos;m,</p>
                    <h2 className="font-display text-[44px]! font-bold! leading-[1.05]! tracking-tight! text-white! text-left">
                      {nameLines.map((line, i) => <span key={i}>{line}{i === 0 && nameLines.length > 1 && <br />}</span>)}
                    </h2>
                    {!isBlank(identity.headline) && <p className="text-white/90 font-medium mt-2 text-[13px] leading-snug">{identity.headline}</p>}
                    {links.length > 0 && (
                      <div className="mt-4 flex flex-wrap gap-2">
                        {links.map(([platform, url]) => (
                          <a key={platform} href={url} target="_blank" rel="noreferrer"
                            className="inline-flex w-8 h-8 rounded-full items-center justify-center bg-white/15 border border-white/20 text-white hover:bg-white/25 transition-colors flex-shrink-0"
                            title={linkLabel(platform)}>
                            {platform.toLowerCase() === "github" ? <GithubGlyph size={15} />
                              : platform.toLowerCase() === "x" || platform.toLowerCase() === "twitter" ? <XGlyph size={13} />
                              : platform.toLowerCase() === "linkedin" ? <LinkedinGlyph size={15} />
                              : <Globe style={{ width: 15, height: 15 }} strokeWidth={2} />}
                          </a>
                        ))}
                      </div>
                    )}
                  </div>
                  <div className="mt-8 pt-4 border-t border-white/10 text-xs text-white/60 font-mono">
                    {syncedAt && !isBlank(identity.location) ? `Updated ${syncedAt} · ${identity.location}`
                      : syncedAt ? `Updated ${syncedAt}`
                      : !isBlank(identity.location) ? identity.location
                      : <span className="opacity-40">Click Edit to add name, headline &amp; links</span>}
                  </div>
                  <div className="absolute -right-20 -bottom-20 w-80 h-80 bg-white/10 rounded-full blur-3xl pointer-events-none" />
                </div>
              )}
            </div>

            {/* Right column */}
            <div className="col-span-12 lg:col-span-8 flex flex-col gap-4 lg:gap-6 overflow-hidden">

              {/* Summary */}
              <div ref={summaryRef} className="relative group">
                {isEditing("summary") ? (
                  <div className="bg-white rounded-[32px] p-6 sm:p-8 shadow-sm border border-gray-100 tc">
                    <div className="text-[10px] font-mono uppercase tracking-widest text-[#8E8E88] mb-4">Editing Summary</div>
                    <div className="space-y-3">
                      <div><span className="el">Summary</span>
                        <textarea value={sText} onChange={(e) => setSText(e.target.value)} rows={5} placeholder="Write your professional summary…" className="ei resize-none" />
                      </div>
                      <div><span className="el">Availability</span>
                        <input value={sAvail} onChange={(e) => setSAvail(e.target.value)} placeholder="e.g. Full-time, Consulting, Freelance" className="ei" />
                      </div>
                      <div><span className="el">Industries (press Enter to add)</span>
                        <div className="p-3 border border-gray-200 rounded-xl bg-gray-50 min-h-[44px]">
                          <TagInput tags={sIndustries} onChange={setSIndustries} placeholder="Industry…"
                            chipClass="bg-gray-200 text-[#0B0B0B] border border-gray-300" />
                        </div>
                      </div>
                    </div>
                    <SaveBar onSave={saveSummary} onCancel={cancelEdit} saving={saving} />
                  </div>
                ) : (
                  <div className="bg-white rounded-[32px] p-6 sm:p-8 shadow-sm border border-gray-100 tc flex-1 flex flex-col justify-between">
                    <EditBtn onClick={startSummary} />
                    <div>
                      <div className="flex justify-between items-center mb-4 text-xs font-mono uppercase tracking-widest text-[#8E8E88]">
                        <span>Dossier Summary</span>
                        {verified && <span className="text-[#0B0B0B] font-bold">Zynd Verified</span>}
                      </div>
                      {!isBlank(draft.summary) ? (
                        <p className="text-[#2A2A2A] text-[15px] leading-relaxed">{draft.summary}</p>
                      ) : (
                        <p className="text-[#8E8E88] text-[14px] italic">No summary yet — click Edit to write one.</p>
                      )}
                    </div>
                    {(draft.industries.length > 0 || !isBlank(draft.availability)) && (
                      <div className="mt-auto pt-4 border-t border-gray-100 flex flex-wrap gap-1.5 font-mono text-[11px]">
                        {draft.industries.map((t) => <span key={t} className="px-2.5 py-1 rounded-md bg-gray-100 text-[#0B0B0B] font-medium">{t}</span>)}
                        {!isBlank(draft.availability) && <span className="px-2.5 py-1 rounded-md bg-[#7B72E9]/10 text-[#7B72E9] font-semibold">Open to {draft.availability}</span>}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Obsessions */}
              <div className="relative group">
                {isEditing("obsessions") ? (
                  <div className="bg-white rounded-[32px] p-6 shadow-sm border border-gray-100">
                    <div className="text-[10px] font-mono uppercase tracking-widest text-[#8E8E88] mb-4">Editing Interests &amp; Goals</div>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      {OBSESSION_CARDS.map((oc) => {
                        const val = oc.key === "love_talking_about" ? oTalking : oc.key === "working_on" ? oWorking : oConnect;
                        const set = oc.key === "love_talking_about" ? setOTalking : oc.key === "working_on" ? setOWorking : setOConnect;
                        return (
                          <div key={oc.key} className={`rounded-[20px] p-4 ${oc.card}`}>
                            <div className="text-[10px] font-mono uppercase tracking-widest opacity-55 mb-2">{oc.label}</div>
                            <TagInput tags={val} onChange={set} placeholder="Add…" chipClass={oc.chip} />
                          </div>
                        );
                      })}
                    </div>
                    <SaveBar onSave={saveObs} onCancel={cancelEdit} saving={saving} />
                  </div>
                ) : (
                  <>
                    {OBSESSION_CARDS.some((oc) => obsessionData[oc.key].length > 0) ? (
                      <div className="grid gap-4 auto-rows-fr" style={{ gridTemplateColumns: `repeat(${Math.min(OBSESSION_CARDS.filter((oc) => obsessionData[oc.key].length > 0).length, 3)}, minmax(0, 1fr))` }}>
                        <EditBtn onClick={startObs} light />
                        {OBSESSION_CARDS.filter((oc) => obsessionData[oc.key].length > 0).map((tile) => (
                          <div key={tile.key} className={`rounded-[28px] p-5 tc shadow-sm flex flex-col h-[140px] overflow-hidden ${tile.card}`}>
                            <div className="flex-shrink-0 text-[10px] font-mono uppercase tracking-widest opacity-55 mb-3">{tile.label} ({obsessionData[tile.key].length})</div>
                            <div className="flex-1 flex flex-wrap content-start gap-1.5 overflow-y-auto pr-1" style={{ scrollbarWidth: "none" }}>
                              {obsessionData[tile.key].map((item) => <span key={item} className={`px-2.5 py-1 rounded-full text-[12px] font-medium ${tile.chip}`}>{item}</span>)}
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <button type="button" onClick={startObs}
                        className="w-full p-5 rounded-[28px] border-2 border-dashed border-gray-200 text-[#8E8E88] font-mono text-[12px] hover:border-[#7B72E9] hover:text-[#7B72E9] transition-colors text-center">
                        + Add what you&apos;re working on, talking about &amp; who you want to connect with
                      </button>
                    )}
                  </>
                )}
              </div>
            </div>

            {/* ── ZYND MEMORY ──────────────────────────────────────────── */}
            <div className="col-span-12 lg:col-span-6 bg-slate-900 text-white rounded-[32px] p-8 shadow-sm flex flex-col">
              <div className="flex justify-between items-center mb-6">
                <span className="text-xs font-mono uppercase tracking-widest text-purple-400 flex items-center gap-2">
                  <span className={`w-2 h-2 rounded-full ${memoryFacts.length > 0 || memoryStatus === "connected" ? "bg-purple-400 animate-pulse" : "bg-slate-600"}`} />
                  Memory &amp; MCP Sync
                </span>
                <span className="text-[10px] font-mono bg-slate-800 px-2.5 py-1 rounded-md text-slate-400">Agentic Context</span>
              </div>

              {memoryFacts.length > 0 ? (
                <>
                  <h3 className="text-lg font-bold text-white mb-3">Active AI Shared Memory</h3>
                  <p className="text-slate-400 text-sm mb-4 leading-relaxed">Your context is synced. AI agents will read these facts when working with you.</p>
                  <div className="space-y-3 font-mono text-xs flex-1">
                    {memoryFacts.slice(0, 4).map((fact, i) => {
                      const text = factText(fact);
                      if (!text) return null;
                      return (
                        <div key={i} className="bg-slate-800/80 p-3.5 rounded-xl border border-slate-700/50">
                          <span className="text-purple-300 block mb-1">⚡ Context {i + 1}:</span>
                          <span className="text-slate-300 leading-relaxed">{text}</span>
                        </div>
                      );
                    })}
                    {memoryFacts.length > 4 && <p className="text-slate-500 text-[11px]">+ {memoryFacts.length - 4} more facts synced</p>}
                  </div>
                  <button type="button" onClick={syncMemory} disabled={memoryStatus === "loading"}
                    className="mt-5 self-start inline-flex items-center gap-2 px-4 py-2 rounded-full bg-purple-500/20 border border-purple-500/30 text-purple-300 text-[12px] font-mono hover:bg-purple-500/30 transition-colors disabled:opacity-60">
                    {memoryStatus === "loading" ? <Loader2 size={12} className="animate-spin" /> : <RefreshCw size={12} />}
                    {memoryStatus === "loading" ? "Syncing…" : "Re-sync memory"}
                  </button>
                </>
              ) : (
                <>
                  <h3 className="text-xl font-bold text-white mb-2">Connect ZYND Memory</h3>
                  <p className="text-slate-400 text-sm leading-relaxed mb-4">
                    Link your ZYND memory layer to show your AI context facts on your public profile card.
                  </p>
                  <div className="bg-slate-800/60 rounded-xl p-4 font-mono text-xs border border-slate-700/40 space-y-1.5 mb-5 flex-1">
                    <div className="text-slate-500">{"// After connecting, AI agents see:"}</div>
                    <div><span className="text-purple-300">your_name</span><span className="text-slate-600"> → </span><span className="text-emerald-400">&ldquo;{identity.name || "You"}&rdquo;</span></div>
                    {draft.working_on[0] && <div><span className="text-purple-300">working_on</span><span className="text-slate-600"> → </span><span className="text-emerald-400">&ldquo;{draft.working_on[0]}&rdquo;</span></div>}
                    {!isBlank(draft.availability) && <div><span className="text-purple-300">availability</span><span className="text-slate-600"> → </span><span className="text-emerald-400">&ldquo;{draft.availability}&rdquo;</span></div>}
                    {skills[0] && <div><span className="text-purple-300">top_skill</span><span className="text-slate-600"> → </span><span className="text-emerald-400">&ldquo;{skills[0].name}&rdquo;</span></div>}
                  </div>
                  {memoryStatus === "disconnected" && (
                    <div className="mb-4 p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-300 text-[12px] font-mono">
                      No ZYND memory found for your account. Create your ZYND profile first.
                    </div>
                  )}
                  <div className="flex gap-2 flex-wrap">
                    <button type="button" onClick={syncMemory} disabled={memoryStatus === "loading"}
                      className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#7B72E9] text-white text-[12px] font-mono font-semibold hover:bg-[#6c64d8] transition-colors disabled:opacity-60">
                      {memoryStatus === "loading" ? <Loader2 size={12} className="animate-spin" /> : <Zap size={12} />}
                      {memoryStatus === "loading" ? "Connecting…" : "Sync from ZYND"}
                    </button>
                    <a href="https://zynd.ai" target="_blank" rel="noreferrer"
                      className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full border border-slate-700 text-slate-400 text-[12px] font-mono hover:border-slate-500 hover:text-white transition-colors">
                      Set up ZYND ↗
                    </a>
                  </div>
                </>
              )}
            </div>

            {/* Work experience (read-only) */}
            <div className="col-span-12 lg:col-span-6 bg-white rounded-[32px] p-6 sm:p-8 shadow-sm border border-gray-100 tc flex flex-col">
              <div className="flex justify-between items-center mb-5 text-xs font-mono uppercase tracking-widest text-[#8E8E88]">
                <span>Work Experience</span>
                <div className="flex items-center gap-2">
                  {draft.experience_years != null && <span className="text-[#7B72E9] font-bold bg-[#7B72E9]/10 px-2 py-0.5 rounded-md">{draft.experience_years}Y</span>}
                  <span className="text-[9px] bg-gray-100 px-2 py-0.5 rounded text-[#8E8E88]">Auto-synced</span>
                </div>
              </div>
              {(draft.work_experience ?? []).length > 0 ? (
                <div className="flex-1 space-y-0 divide-y divide-gray-100 overflow-y-auto max-h-[300px] pr-1">
                  {(draft.work_experience ?? []).slice(0, 8).map((job, i) => (
                    <div key={i} className="flex gap-3.5 py-4 first:pt-0">
                      {job.company_logo ? (
                        <img src={job.company_logo} alt="" className="shrink-0 w-10 h-10 rounded-lg object-cover border border-slate-200 bg-white" />
                      ) : (
                        <div className="shrink-0 w-10 h-10 rounded-lg bg-slate-900 text-white flex items-center justify-center text-[13px] font-bold">
                          {(job.company || job.title || "?").charAt(0).toUpperCase()}
                        </div>
                      )}
                      <div className="min-w-0 flex-1">
                        <div className="font-semibold text-[#0B0B0B] text-[13px]">{job.title}</div>
                        <div className="text-[12px] text-slate-600 mt-0.5">{job.company}{job.employment_type ? ` · ${job.employment_type}` : ""}</div>
                        <div className="text-[11px] text-[#676767] mt-0.5">{[job.start_date, job.end_date].filter(Boolean).join(" – ")}{job.duration ? ` · ${job.duration}` : ""}</div>
                        {job.location && <div className="text-[11px] text-[#676767]">{job.location}</div>}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex-1 flex flex-col justify-center items-center text-center gap-3 py-6">
                  <LinkedinGlyph size={24} />
                  <div>
                    <p className="font-semibold text-[#0B0B0B] text-sm">No work experience yet</p>
                    <p className="text-xs text-[#8E8E88] mt-1">Add your LinkedIn URL in Identity above to import work history.</p>
                  </div>
                  {!identity.links?.linkedin && (
                    <button type="button" onClick={() => { setHLinks([...Object.entries(draft.identity.links ?? {}).map(([p, u]) => [p, u as string] as [string, string]), ["linkedin", ""]]); startEdit("hero"); }}
                      className="text-[11px] font-mono text-[#0A66C2] hover:underline">
                      + Add LinkedIn URL →
                    </button>
                  )}
                </div>
              )}
            </div>

            {/* ── SOCIAL STATS (read-only) ───────────────────────────────── */}
            {showLinkedin && (
              <div className="col-span-12 md:col-span-6 lg:col-span-4 bg-[#0A66C2] text-white rounded-[32px] p-5 shadow-sm flex flex-col overflow-hidden" style={{ height: SOCIAL_H }}>
                <div className="flex justify-between items-center mb-3 text-xs font-mono">
                  <span className="flex items-center gap-1.5 font-bold"><LinkedinGlyph size={14} />LINKEDIN</span>
                  {linkedinUrl ? <a href={linkedinUrl} target="_blank" rel="noreferrer" className="text-white/60 hover:text-white text-[11px]">{linkedinHandle ? `in/${linkedinHandle}` : "View"} ↗</a> : null}
                </div>
                <div className="flex-1">
                  <h4 className="text-lg font-bold">{identity.name}</h4>
                  {!isBlank(identity.headline) && <p className="text-xs text-white/75 mt-0.5 line-clamp-2">{identity.headline}</p>}
                  <p className="text-[10px] font-mono text-white/40 mt-3">Stats auto-sync · Re-create card to refresh posts</p>
                </div>
                {draft.linkedin_stats?.connections != null && (
                  <div className="border-t border-white/20 pt-3 text-center font-mono">
                    <div className="text-2xl font-bold"><CountUp value={Number(draft.linkedin_stats.connections)} /></div>
                    <div className="text-[10px] text-white/60 uppercase">Connections</div>
                  </div>
                )}
              </div>
            )}

            {showX && (
              <div className="col-span-12 md:col-span-6 lg:col-span-4 bg-[#0f1419] text-white rounded-[32px] p-5 shadow-sm flex flex-col overflow-hidden" style={{ height: SOCIAL_H }}>
                <div className="flex justify-between items-center mb-3 text-xs font-mono">
                  <span className="flex items-center gap-1.5 font-bold"><XGlyph size={13} />X / TWITTER</span>
                  {xUrl && <a href={xUrl} target="_blank" rel="noreferrer" className="text-white/60 hover:text-white text-[11px]">{draft.x_stats?.handle ?? `@${usernameFromUrl(xUrl)}`} ↗</a>}
                </div>
                <div className="flex-1">
                  <h4 className="text-lg font-bold">{identity.name}</h4>
                  <p className="text-[10px] font-mono text-white/35 mt-2">Stats auto-sync · Add X URL in Identity to connect</p>
                </div>
                {draft.x_stats && (
                  <div className="grid grid-cols-3 gap-2 text-center border-t border-white/10 pt-3 font-mono">
                    {[
                      { val: draft.x_stats.followers, label: "Followers" },
                      { val: draft.x_stats.posts, label: "Posts" },
                      { val: draft.x_stats.impressions, label: "Impr.", accent: true },
                    ].map(({ val, label, accent }) => (
                      <div key={label}>
                        <div className={`text-base font-bold ${accent ? "text-amber-400" : ""}`}>{val != null ? <CountUp value={Number(val)} /> : "—"}</div>
                        <div className="text-[9px] text-white/45 uppercase">{label}</div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {showGithub && (
              <div className="col-span-12 md:col-span-6 lg:col-span-4 bg-white rounded-[32px] p-6 shadow-sm border border-gray-100 tc flex flex-col justify-between">
                <div>
                  <div className="flex justify-between items-center mb-4 text-xs font-mono uppercase tracking-widest text-[#8E8E88]">
                    <span className="flex items-center gap-1.5 text-[#0B0B0B]"><GithubGlyph size={14} />GitHub</span>
                    {githubUrl ? <a href={githubUrl} target="_blank" rel="noreferrer" className="text-[#0B0B0B] font-bold hover:text-[#7B72E9]">@{githubHandle} ↗</a> : <span className="font-bold text-[#0B0B0B]">@{githubHandle}</span>}
                  </div>
                  {(draft.github_stats?.total_repos != null || draft.github_stats?.total_commits != null) && (
                    <div className="grid grid-cols-2 gap-3 mb-4">
                      {draft.github_stats.total_repos != null && (
                        <div className="bg-gray-50 p-3 rounded-2xl border border-gray-100 text-center">
                          <div className="text-xl font-extrabold text-[#0B0B0B]"><CountUp value={draft.github_stats.total_repos} /></div>
                          <div className="text-[10px] font-mono text-[#8E8E88] uppercase">Repos</div>
                        </div>
                      )}
                      {draft.github_stats.total_commits != null && (
                        <div className="bg-gray-50 p-3 rounded-2xl border border-gray-100 text-center">
                          <div className="text-xl font-extrabold text-[#0B0B0B]"><CountUp value={Number(draft.github_stats.total_commits)} /></div>
                          <div className="text-[10px] font-mono text-[#8E8E88] uppercase">Commits</div>
                        </div>
                      )}
                    </div>
                  )}
                  {contributions && Array.isArray(contributions.levels) && contributions.levels.length > 0 && (
                    <ContributionHeatmap levels={contributions.levels} year={contributions.year} total={contributions.total} avgPerDay={contributions.avg_per_day} />
                  )}
                </div>
              </div>
            )}

            {/* ── SKILLS ────────────────────────────────────────────────── */}
            <div className="col-span-12 bg-white rounded-[32px] p-6 sm:p-8 shadow-sm border border-gray-100 relative group">
              {isEditing("skills") ? (
                <>
                  <div className="text-[10px] font-mono uppercase tracking-widest text-[#8E8E88] mb-4">Editing Skills</div>
                  <div className="space-y-2 mb-4 max-h-[300px] overflow-y-auto pr-1">
                    {skillList.map((skill, i) => (
                      <div key={i} className="flex items-center gap-2 bg-gray-50 px-4 py-2.5 rounded-xl border border-gray-100">
                        <span style={{ color: skillAccent(skill.name) }} className="font-bold text-xs w-6 shrink-0">{skillShort(skill.name)}</span>
                        <input value={skill.name} onChange={(e) => { const n = [...skillList]; n[i] = { ...n[i], name: e.target.value }; setSkillList(n); }}
                          className="flex-1 bg-transparent outline-none text-[13px] text-[#0B0B0B] font-medium" />
                        <select value={skill.level} onChange={(e) => { const n = [...skillList]; n[i] = { ...n[i], level: e.target.value }; setSkillList(n); }}
                          className="bg-white border border-gray-200 rounded-lg text-[11px] font-mono px-2 py-1 outline-none">
                          {["expert", "advanced", "intermediate", "beginner"].map((l) => <option key={l} value={l}>{LEVEL_LABELS[l]}</option>)}
                        </select>
                        <button type="button" onClick={() => setSkillList(skillList.filter((_, j) => j !== i))} className="text-gray-300 hover:text-red-400"><X size={13} /></button>
                      </div>
                    ))}
                  </div>
                  <div className="flex gap-2 items-center p-3 rounded-xl border-2 border-dashed border-gray-200 mb-4">
                    <input value={newSkillName} onChange={(e) => setNewSkillName(e.target.value)}
                      onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addSkill(); } }}
                      placeholder="New skill name…" className="flex-1 bg-transparent outline-none text-[13px] text-[#0B0B0B]" />
                    <select value={newSkillLevel} onChange={(e) => setNewSkillLevel(e.target.value)}
                      className="bg-white border border-gray-200 rounded-lg text-[11px] font-mono px-2 py-1 outline-none">
                      {["expert", "advanced", "intermediate", "beginner"].map((l) => <option key={l} value={l}>{LEVEL_LABELS[l]}</option>)}
                    </select>
                    <button type="button" onClick={addSkill} className="px-3 py-1.5 rounded-lg bg-[#7B72E9] text-white text-[11px] font-mono hover:bg-[#6c64d8] transition-colors">
                      + Add
                    </button>
                  </div>
                  <SaveBar onSave={saveSkills} onCancel={cancelEdit} saving={saving} />
                </>
              ) : (
                <>
                  <EditBtn onClick={startSkills} />
                  <div className="flex justify-between items-center mb-5 text-xs font-mono uppercase tracking-widest text-[#8E8E88]">
                    <span className="text-[#0B0B0B] font-bold">Skill Matrix</span>
                    <span className="text-[#7B72E9] font-bold bg-[#7B72E9]/8 px-2 py-0.5 rounded border border-[#7B72E9]/15">{skills.length} Tracked</span>
                  </div>
                  {skills.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 font-mono">
                      {skills.slice(0, 9).map((skill) => {
                        const blocks = LEVEL_BLOCKS[skill.level.toLowerCase()] ?? "■■□□";
                        const color = LEVEL_COLORS[skill.level.toLowerCase()] ?? "#7B72E9";
                        const label = LEVEL_LABELS[skill.level.toLowerCase()] ?? "Mid";
                        return (
                          <div key={skill.name} className="flex justify-between items-center bg-gray-50 px-4 py-2.5 rounded-xl border border-gray-100">
                            <span className="flex items-center gap-2">
                              <span style={{ color: skillAccent(skill.name) }} className="font-bold text-xs">{skillShort(skill.name)}</span>
                              <span className="text-[#0B0B0B] font-medium font-sans text-[13px]">{skill.name}</span>
                            </span>
                            <span className="text-[#8E8E88] text-xs">{label} <span style={{ color }} className="ml-1 tracking-wider">{blocks}</span></span>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <p className="text-[#8E8E88] text-sm font-mono text-center py-4">No skills yet — click Edit to add them.</p>
                  )}
                </>
              )}
            </div>

            {/* ── PROJECTS (read-only display) ───────────────────────────── */}
            {draft.projects.length > 0 && (
              <div className="col-span-12 bg-white rounded-[32px] p-6 sm:p-8 shadow-sm border border-gray-100 tc">
                <div className="flex justify-between items-center mb-5 text-xs font-mono uppercase tracking-widest">
                  <span className="text-[#0B0B0B] font-bold">Live in Production</span>
                  <span className="text-[#7B72E9] font-bold bg-[#7B72E9]/8 px-2 py-0.5 rounded border border-[#7B72E9]/15">{draft.projects.length} Highlights</span>
                </div>
                <div className="space-y-2.5">
                  {draft.projects.slice(0, 6).map((proj) => {
                    const url = safeUrl(proj.url);
                    return (
                      <div key={proj.name} className="flex items-center justify-between p-3.5 bg-gray-50 border border-gray-100 rounded-2xl">
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="w-9 h-9 rounded-xl bg-gray-100 border border-gray-200 flex items-center justify-center text-[#8E8E88] shrink-0">
                            <GithubGlyph size={15} />
                          </div>
                          <div className="min-w-0">
                            <div className="font-bold text-[13px] text-[#0B0B0B] truncate">{proj.name}</div>
                            {!isBlank(proj.description) && <p className="text-[11px] text-[#8E8E88] line-clamp-1 mt-0.5">{proj.description}</p>}
                            {(proj.tech ?? []).length > 0 && (
                              <div className="flex gap-1 mt-1">
                                {(proj.tech ?? []).slice(0, 3).map((t) => <span key={t} className="px-1.5 py-0.5 rounded bg-[#7B72E9]/8 text-[#7B72E9] font-mono text-[9px] font-semibold uppercase">{t}</span>)}
                              </div>
                            )}
                          </div>
                        </div>
                        {url && <a href={url} target="_blank" rel="noreferrer" className="text-gray-300 hover:text-[#7B72E9] font-bold ml-3">↗</a>}
                      </div>
                    );
                  })}
                </div>
                <p className="text-[11px] font-mono text-[#8E8E88] mt-4">Projects are extracted automatically from GitHub &amp; LinkedIn. Re-create card to refresh.</p>
              </div>
            )}

            {/* ── CALENDLY + HANDLE ─────────────────────────────────────── */}
            <div className="col-span-12 md:col-span-6 relative group">
              {isEditing("calendly") ? (
                <div className="bg-blue-50 rounded-[32px] p-6 border border-blue-100">
                  <div className="text-[10px] font-mono uppercase tracking-widest text-blue-500 mb-2">Scheduling Link</div>
                  <p className="text-[12px] text-slate-500 mb-3 leading-relaxed">Paste your Calendly, Cal.com, or any booking URL. Visitors will see a &ldquo;Book a 1:1&rdquo; section.</p>
                  <input value={calInput} onChange={(e) => setCalInput(e.target.value)} placeholder="https://calendly.com/your-link" className="ei" />
                  <SaveBar onSave={saveCal} onCancel={cancelEdit} saving={saving} />
                </div>
              ) : draft.calendly_url ? (
                <div className="bg-blue-50 rounded-[32px] p-5 border border-blue-100 flex items-center justify-between">
                  <div>
                    <div className="text-[10px] font-mono uppercase text-blue-500 font-bold mb-1">Scheduling Link</div>
                    <p className="text-[12px] font-mono text-slate-600 truncate max-w-[260px]">{draft.calendly_url}</p>
                  </div>
                  <EditBtn onClick={startCal} />
                </div>
              ) : (
                <button type="button" onClick={startCal}
                  style={{ color: "#3B82F6" }}
                  className="w-full h-full min-h-[80px] p-5 rounded-[32px] border-2 border-dashed border-blue-200 font-mono text-[12px] hover:border-blue-500 hover:bg-blue-50 transition-colors text-center">
                  + Add scheduling link (Calendly, Cal.com…)
                </button>
              )}
            </div>

            <div className="col-span-12 md:col-span-6 relative group">
              {isEditing("handle") ? (
                <div className="bg-[#7B72E9]/5 rounded-[32px] p-6 border border-[#7B72E9]/15">
                  <div className="text-[10px] font-mono uppercase tracking-widest text-[#7B72E9] mb-2">Custom Profile URL</div>
                  <p className="text-[12px] text-slate-500 mb-3">Your public URL: <span className="font-mono text-[#0B0B0B]">zynd.ai/p/<strong>{handleInput || "…"}</strong></span></p>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[12px] font-mono text-[#8E8E88]">zynd.ai/p/</span>
                    <input value={handleInput} onChange={(e) => onHandleChange(e.target.value)}
                      className="ei pl-[80px] font-mono" placeholder="your-handle" />
                    <div className="absolute right-3 top-1/2 -translate-y-1/2">
                      {handleChecking && <Loader2 size={12} className="animate-spin text-gray-400" />}
                      {!handleChecking && handleAvail === true && <Check size={12} className="text-emerald-500" />}
                      {!handleChecking && handleAvail === false && <X size={12} className="text-red-400" />}
                    </div>
                  </div>
                  {handleAvail === false && <p className="text-[11px] font-mono text-red-500 mt-1.5">Handle taken — choose another.</p>}
                  {handleInput === handle && <p className="text-[11px] font-mono text-gray-400 mt-1.5">This is your current handle.</p>}
                  <SaveBar
                    onSave={saveHandle}
                    onCancel={() => { setHandleInput(handle); setHandleAvail(null); cancelEdit(); }}
                    saving={saving}
                  />
                </div>
              ) : (
                <div className="bg-[#7B72E9]/5 rounded-[32px] p-5 border border-[#7B72E9]/15 flex items-center justify-between min-h-[80px]">
                  <div>
                    <div className="text-[10px] font-mono uppercase text-[#7B72E9] font-bold mb-1">Profile URL</div>
                    <p className="text-[13px] font-mono text-[#0B0B0B] font-semibold">zynd.ai/p/<span className="text-[#7B72E9]">{handle}</span></p>
                  </div>
                  <EditBtn onClick={() => { setHandleInput(handle); setHandleAvail(null); startEdit("handle"); }} />
                </div>
              )}
            </div>

          </div>{/* /grid */}

          {/* footer */}
          <footer className="mt-10 pt-6 border-t border-gray-200 flex flex-wrap items-center justify-between gap-4 text-[11px] font-mono text-[#8E8E88]">
            <div className="flex items-center gap-2">
              <span className="font-bold text-[#0B0B0B]">ZYND.AI</span>
              <span>•</span>
              <span>Editing @{handle}</span>
            </div>
            <Link href={`/p/${handle}`}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-[#0B0B0B] text-white text-[12px] font-mono font-semibold hover:bg-[#333] transition-colors">
              View live profile →
            </Link>
          </footer>

        </main>
      </div>
    </>
  );
}
