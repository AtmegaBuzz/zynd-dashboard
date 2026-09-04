"use client";

/* ═══════════════════════════════════════════════════════════════════════════
   ProfileDossier — standalone, self-contained preview of /p/[handle]
   ───────────────────────────────────────────────────────────────────────────
   Everything the real page needs is inlined here (styles, glyphs, skill icons,
   count-up animation, copy buttons) so this file can be dropped into ANY route
   with zero wiring:

       import ProfileDossier from "@/../ProfileDossier";
       export default function Page() { return <ProfileDossier />; }

   It renders entirely from DEMO_DATA below — no fetch, no API, no props
   required. Pass a partial override to test a variant:

       <ProfileDossier data={{ name: "Ada Lovelace", skills: [] }} />

   Only dependencies: react + lucide-react (both already in package.json).
   The real page lives at src/app/(site)/p/[handle]/page.tsx — this is a
   throwaway test harness, not a shared component.
   ═══════════════════════════════════════════════════════════════════════════ */

import {
  useCallback, useEffect, useLayoutEffect, useRef, useState,
  type CSSProperties,
} from "react";
import {
  Check, CheckSquare, Code2, Copy, Cpu, ExternalLink, FileText, Globe, Hammer,
  Layers, LifeBuoy, Link2, MessageCircle, Network, Search, Shield, Users,
} from "lucide-react";

/* ─── shape ─────────────────────────────────────────────────────────────── */

export type ObsessionKey = "working_on" | "can_help_with" | "connect_with" | "love_talking_about";

export interface DossierData {
  id: string;
  handle: string;
  name: string;
  headline: string;
  affiliations: string;
  avatarUrl: string | null;
  location: string;
  availability: string;
  verified: boolean;
  syncedAt: string;
  summary: string;
  industries: string[];
  experienceYears: number | null;
  score: number;
  links: { platform: string; url: string }[];
  linkedin: { connections: string; posts: number | string; verified: boolean };
  github: {
    repos: number | string; locAdded: string; commits: string;
    active: number | null; languages: string[];
  };
  x: { handle: string; followers: string; posts: number | string; impressions: string };
  skills: { name: string; level: string }[];
  writing: { platform: string; postedAt: string; url: string; excerpt: string; metrics: string[] }[];
  contributions: { year: number; total: number; avgPerDay: number; levels: number[] };
  obsessions: Record<ObsessionKey, string[]>;
  projects: { name: string; url: string; description: string; stars: number | null; tech: string[] }[];
  endorsement: { quote: string; reviewers: number };
  sources: { platform: string; scrapedAt: string }[];
}

/* ─── deterministic heatmap (same on server and client) ─────────────────── */

function mulberry32(seed: number): () => number {
  let a = seed;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function demoContributions(seed: number) {
  const rnd = mulberry32(seed);
  const weights = [0, 1, 3, 6, 11];
  const levels: number[] = Array.from({ length: 371 }, (_, i) => {
    const weekend = i % 7 === 0 || i % 7 === 6;
    const r = rnd();
    if (r < (weekend ? 0.55 : 0.16)) return 0;
    if (r < 0.48) return 1;
    if (r < 0.72) return 2;
    if (r < 0.9) return 3;
    return 4;
  });
  const total = levels.reduce<number>((n, l) => n + weights[l], 0);
  return { year: 2026, total, avgPerDay: Math.round((total / 365) * 10) / 10, levels };
}

/* ─── DEMO DATA — the single place to edit while testing ────────────────── */

export const DEMO_DATA: DossierData = {
  id: "a1f9c2",
  handle: "alex-chen",
  name: "Dr. Alex Chen",
  headline: "Principal Systems Architect · Distributed Inference",
  affiliations: "Ex-DeepMind • OpenAI Fellow",
  avatarUrl: "https://i.pravatar.cc/256?img=68",
  location: "San Francisco, CA",
  availability: "advisory work",
  verified: true,
  syncedAt: "2026-08-28",
  summary:
    "Systems architect focused on the physics of large-model inference — KV cache layout, collective latency, and the PCIe topology that quietly decides your throughput ceiling. Fifteen years shipping infrastructure that other engineers build on top of, most recently a 4,000-GPU training fabric serving three production model families.",
  industries: ["AI Infrastructure", "Distributed Systems", "Hardware"],
  experienceYears: 15,
  score: 99.8,

  links: [
    { platform: "github", url: "https://github.com/alexchen" },
    { platform: "linkedin", url: "https://linkedin.com/in/alexchen" },
    { platform: "x", url: "https://x.com/chen_ai" },
    { platform: "website", url: "https://alexchen.dev" },
  ],

  linkedin: { connections: "500+", posts: 38, verified: true },
  github: {
    repos: 68, locAdded: "184k", commits: "1,420",
    active: 17, languages: ["Rust", "C++", "Python"],
  },
  x: { handle: "@chen_ai", followers: "14.2k", posts: 612, impressions: "3.4M" },

  skills: [
    { name: "Rust", level: "expert" },
    { name: "C++", level: "expert" },
    { name: "CUDA", level: "expert" },
    { name: "Python", level: "advanced" },
    { name: "Kubernetes", level: "advanced" },
    { name: "PyTorch", level: "advanced" },
    { name: "Distributed Systems", level: "expert" },
    { name: "Terraform", level: "intermediate" },
    { name: "Go", level: "intermediate" },
    { name: "Performance Testing", level: "advanced" },
  ],

  writing: [
    {
      platform: "x",
      postedAt: "2026-06-18",
      url: "https://x.com/chen_ai/status/1",
      excerpt:
        "Why speculative decoding plus KV cache compression is fundamentally reshaping inference cost curves in 2026. Benchmarks on 70B models show a 3.4x throughput leap without accuracy degradation across 100k synthetic prompts…",
      metrics: ["842 reposts", "3.1k bookmarks"],
    },
    {
      platform: "linkedin",
      postedAt: "2026-06-04",
      url: "https://linkedin.com/posts/alexchen_1",
      excerpt:
        "Reflections on building distributed GPU clusters from scratch. The hardest bottleneck is rarely compute density — it is PCIe topology, NUMA node thrashing, and cross-switch collective latency. Here are 5 hard lessons…",
      metrics: ["1.2k reactions", "184 comments"],
    },
    {
      platform: "x",
      postedAt: "2026-05-28",
      url: "https://x.com/chen_ai/status/2",
      excerpt:
        "Released open-source benchmarks comparing FlashAttention-3 vs Triton kernels on H100 SXM5 architectures. Reproducible configs inside repo…",
      metrics: ["2.4k stars on benchmark repo"],
    },
  ],

  contributions: demoContributions(0x5eed1234),

  obsessions: {
    working_on: ["Distributed inference", "Generative AI"],
    can_help_with: ["Systems architecture", "Founder advising", "GPU infra"],
    connect_with: ["Founders", "AI researchers", "Systems engineers"],
    love_talking_about: ["Distributed systems", "LLM optimization", "Kernel benchmarking"],
  },

  projects: [
    {
      name: "hyperlane",
      url: "https://github.com/alexchen/hyperlane",
      description: "Zero-copy RPC transport for multi-node inference. Sustains 85k RPS across a 32-node fabric.",
      stars: 4200,
      tech: ["Rust", "SIMD", "85k RPS"],
    },
    {
      name: "kvcompress",
      url: "https://github.com/alexchen/kvcompress",
      description: "Drop-in KV cache quantisation plugin for vLLM. 2.8x context length at the same VRAM budget.",
      stars: 2900,
      tech: ["C++", "CUDA", "vLLM Plugin"],
    },
    {
      name: "graphsplit",
      url: "https://github.com/alexchen/graphsplit",
      description: "Partitioner for 50B-edge graphs on commodity hardware, used in three public research pipelines.",
      stars: 1800,
      tech: ["Ray", "Python", "50B Edges"],
    },
  ],

  endorsement: {
    quote:
      "Alex is one of the rare architects who understands GPU hardware micro-architecture as deeply as modern transformer attention mechanisms. A top 0.1% systems mind.",
    reviewers: 14,
  },

  sources: [
    { platform: "github", scrapedAt: "2026-08-28" },
    { platform: "linkedin", scrapedAt: "2026-08-27" },
    { platform: "x", scrapedAt: "2026-08-27" },
    { platform: "website", scrapedAt: "2026-08-26" },
    { platform: "resume", scrapedAt: "2026-08-20" },
  ],
};

/* ─── utils ─────────────────────────────────────────────────────────────── */

function isBlank(s: string | null | undefined): boolean {
  return !s || s.trim() === "";
}

function compact(n: number): string {
  return n >= 1000 ? `${(n / 1000).toFixed(1).replace(/\.0$/, "")}k` : String(n);
}

function shortDate(value: string): string | null {
  const d = new Date(value);
  return Number.isNaN(d.getTime())
    ? null
    : d.toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" });
}

const LEVEL_META: Record<string, { label: string; color: string; bg: string }> = {
  expert: { label: "Expert", color: "#b45309", bg: "#fef3c7" },
  advanced: { label: "Advanced", color: "#6d28d9", bg: "#ede9fe" },
  intermediate: { label: "Mid", color: "#1d4ed8", bg: "#dbeafe" },
  beginner: { label: "Beginner", color: "#065f46", bg: "#d1fae5" },
};
const levelMeta = (l: string) => LEVEL_META[l.toLowerCase()] ?? LEVEL_META.intermediate;

const HEAT = ["#f1f5f9", "#9be9a8", "#40c463", "#30a14e", "#216e39"];

const OBSESSIONS: {
  key: ObsessionKey; label: string; Icon: typeof Hammer;
  color: string; tint: string; edge: string;
}[] = [
  { key: "working_on",         label: "Working on",            Icon: Hammer,        color: "#4f46e5", tint: "#eef2ff", edge: "#c7d2fe" },
  { key: "can_help_with",      label: "Can help with",         Icon: LifeBuoy,      color: "#047857", tint: "#ecfdf5", edge: "#a7f3d0" },
  { key: "connect_with",       label: "Wants to connect with", Icon: Users,         color: "#b45309", tint: "#fffbeb", edge: "#fde68a" },
  { key: "love_talking_about", label: "Loves talking about",   Icon: MessageCircle, color: "#7c3aed", tint: "#f5f3ff", edge: "#ddd6fe" },
];

/* ─── inlined: count-up ─────────────────────────────────────────────────── */

const useIsoLayoutEffect = typeof window !== "undefined" ? useLayoutEffect : useEffect;

interface Parsed { prefix: string; value: number; suffix: string; decimals: number; grouped: boolean }

/** "500+" → 500 with a "+", "14.2k" → 14.2 with a "k", "1,420" → grouped 1420.
 *  Anything with no digits ("—") returns null and is rendered verbatim. */
function parseFigure(raw: string): Parsed | null {
  const m = raw.match(/^(\D*?)(\d[\d,]*(?:\.\d+)?)(.*)$/);
  if (!m) return null;
  const [, prefix, num, suffix] = m;
  const plain = num.replace(/,/g, "");
  const dot = plain.indexOf(".");
  return {
    prefix, value: Number.parseFloat(plain), suffix,
    decimals: dot === -1 ? 0 : plain.length - dot - 1,
    grouped: num.includes(","),
  };
}

function renderFigure(n: number, p: Parsed): string {
  const body = p.grouped
    ? n.toLocaleString("en-US", { minimumFractionDigits: p.decimals, maximumFractionDigits: p.decimals })
    : n.toFixed(p.decimals);
  return `${p.prefix}${body}${p.suffix}`;
}

/** Rolls a stat from zero the first time it scrolls into view. The final value
 *  is what renders on the server, so crawlers still see the real number. */
function CountUp({ value, duration = 1100, delay = 0 }: { value: number | string; duration?: number; delay?: number }) {
  const final = String(value);
  const [text, setText] = useState(final);
  const ref = useRef<HTMLSpanElement>(null);

  useIsoLayoutEffect(() => {
    const el = ref.current;
    const parsed = parseFigure(final);
    if (!el || !parsed) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    let raf = 0;
    let started = false;
    const start = () => {
      if (started) return;
      started = true;
      setText(renderFigure(0, parsed));
      const t0 = performance.now() + delay;
      const step = (now: number) => {
        const t = Math.min(1, Math.max(0, (now - t0) / duration));
        if (t >= 1) { setText(final); return; }
        // easeOutExpo — fast out of the gate, long settle
        setText(renderFigure(parsed.value * (1 - Math.pow(2, -10 * t)), parsed));
        raf = requestAnimationFrame(step);
      };
      raf = requestAnimationFrame(step);
    };

    const io = new IntersectionObserver(
      (entries) => { if (entries.some((e) => e.isIntersecting)) { io.disconnect(); start(); } },
      { threshold: 0.4 },
    );
    io.observe(el);
    return () => { io.disconnect(); cancelAnimationFrame(raf); };
  }, [final, duration, delay]);

  return <span ref={ref}>{text}</span>;
}

/* ─── inlined: copy / share ─────────────────────────────────────────────── */

async function writeClipboard(text: string): Promise<void> {
  try {
    await navigator.clipboard.writeText(text);
  } catch {
    const ta = document.createElement("textarea");
    ta.value = text;
    ta.style.position = "fixed";
    ta.style.opacity = "0";
    document.body.appendChild(ta);
    ta.select();
    document.execCommand("copy");
    document.body.removeChild(ta);
  }
}

function useCopy(url: string) {
  const [copied, setCopied] = useState(false);
  const onClick = useCallback(async () => {
    await writeClipboard(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [url]);
  return { copied, onClick };
}

function ShareButton({ url }: { url: string }) {
  const { copied, onClick } = useCopy(url);
  return (
    <div className="zd-share-wrap">
      <button type="button" onClick={onClick} className="zd-share-btn" aria-label="Copy profile link">
        <Link2 size={14} strokeWidth={2} style={{ color: "#94a3b8" }} />
        <span>Share</span>
      </button>
      <span className="zd-toast" data-on={copied ? "1" : "0"} aria-live="polite">Link copied!</span>
    </div>
  );
}

function CopyPermalink({ url }: { url: string }) {
  const { copied, onClick } = useCopy(url);
  return (
    <button
      type="button" onClick={onClick} className="zd-copy-icon"
      title={copied ? "Copied!" : "Copy profile link"}
      aria-label={copied ? "Copied" : "Copy profile link"}
    >
      {copied ? <Check size={15} strokeWidth={2.5} /> : <Copy size={15} strokeWidth={2} />}
    </button>
  );
}

/* ─── inlined: skill icons (simpleicons → category fallback) ────────────── */

const SKILL_SLUGS: Record<string, string> = {
  react: "react", typescript: "typescript", javascript: "javascript", python: "python",
  go: "go", golang: "go", rust: "rust", "node.js": "nodedotjs", nodejs: "nodedotjs",
  "next.js": "nextdotjs", nextjs: "nextdotjs", postgresql: "postgresql", postgres: "postgresql",
  mongodb: "mongodb", docker: "docker", kubernetes: "kubernetes", k8s: "kubernetes",
  aws: "amazonaws", gcp: "googlecloud", azure: "microsoftazure", graphql: "graphql",
  prisma: "prisma", tailwind: "tailwindcss", tailwindcss: "tailwindcss", solidity: "solidity",
  vue: "vuedotjs", angular: "angular", swift: "swift", kotlin: "kotlin", java: "openjdk",
  "c++": "cplusplus", "c#": "csharp", ruby: "ruby", redis: "redis", supabase: "supabase",
  firebase: "firebase", vercel: "vercel", github: "github", linux: "linux", figma: "figma",
  svelte: "svelte", openai: "openai", tensorflow: "tensorflow", pytorch: "pytorch",
  stripe: "stripe", mysql: "mysql", terraform: "terraform", git: "git", nvidia: "nvidia",
  cuda: "nvidia", elixir: "elixir", scala: "scala", haskell: "haskell", flutter: "flutter",
  dart: "dart", nginx: "nginx", fastapi: "fastapi", django: "django", numpy: "numpy",
  pandas: "pandas", langchain: "langchain",
};

function skillSlug(name: string): string | null {
  const raw = name.toLowerCase().trim();
  if (SKILL_SLUGS[raw]) return SKILL_SLUGS[raw];
  const stripped = raw.replace(/\s*\([^)]*\)/g, "").trim();
  if (stripped !== raw && SKILL_SLUGS[stripped]) return SKILL_SLUGS[stripped];
  const first = raw.split(/[\s(]/)[0];
  return first.length > 1 && SKILL_SLUGS[first] ? SKILL_SLUGS[first] : null;
}

type SkillCategory = "security" | "blockchain" | "hardware" | "testing" | "networking" | "generic";

function skillCategory(name: string): SkillCategory {
  const n = name.toLowerCase();
  if (/security|penetrat|owasp|vuln|exploit|hack|forensic|threat|audit|encrypt/.test(n)) return "security";
  if (/blockchain|smart.contract|defi|nft|web3|solidity|ethereum|zk|rollup|evm/.test(n)) return "blockchain";
  if (/assembl|hardware|fpga|verilog|embedded|firmware|circuit|soc|gpu|kernel/.test(n)) return "hardware";
  if (/test|qa|quality|jest|cypress|selenium|playwright|verification|tdd|bdd|benchmark/.test(n)) return "testing";
  if (/network|tcp|http|api\s|api$|rest|grpc|socket|protocol|dns|distributed/.test(n)) return "networking";
  return "generic";
}

const CATEGORY_STYLE: Record<SkillCategory, { color: string; bg: string }> = {
  security:   { color: "#dc2626", bg: "#fee2e2" },
  blockchain: { color: "#7c3aed", bg: "#ede9fe" },
  hardware:   { color: "#475569", bg: "#e2e8f0" },
  testing:    { color: "#059669", bg: "#d1fae5" },
  networking: { color: "#0284c7", bg: "#e0f2fe" },
  generic:    { color: "#5b7cfa", bg: "#eff3ff" },
};

function CategoryIcon({ category, size }: { category: SkillCategory; size: number }) {
  if (category === "security") return <Shield size={size} />;
  if (category === "blockchain") return <Layers size={size} />;
  if (category === "hardware") return <Cpu size={size} />;
  if (category === "testing") return <CheckSquare size={size} />;
  if (category === "networking") return <Network size={size} />;
  return <Code2 size={size} />;
}

function SkillIcon({ name, size = 16 }: { name: string; size?: number }) {
  const slug = skillSlug(name);
  if (slug) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={`https://cdn.simpleicons.org/${slug}`} alt="" width={size} height={size}
        style={{ width: size, height: size, objectFit: "contain", flexShrink: 0 }}
      />
    );
  }
  const cat = skillCategory(name);
  const style = CATEGORY_STYLE[cat];
  return (
    <span style={{ width: size + 2, height: size + 2, borderRadius: 4, background: style.bg, color: style.color, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
      <CategoryIcon category={cat} size={Math.max(9, size - 4)} />
    </span>
  );
}

/* ─── brand glyphs ──────────────────────────────────────────────────────── */

function GithubGlyph({ size = 14 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z" />
    </svg>
  );
}

function XGlyph({ size = 12 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
    </svg>
  );
}

function LinkedinGlyph({ size = 14 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z" />
    </svg>
  );
}

function PlatformGlyph({ platform, size = 14 }: { platform: string; size?: number }) {
  const p = platform.toLowerCase();
  if (p === "github") return <GithubGlyph size={size} />;
  if (p === "x" || p === "twitter") return <XGlyph size={size - 2} />;
  if (p === "linkedin") return <LinkedinGlyph size={size} />;
  if (p === "resume") return <FileText size={size} />;
  return <Globe size={size} />;
}

function platformLabel(platform: string): string {
  const p = platform.toLowerCase();
  if (p === "x" || p === "twitter") return "X / Twitter";
  if (p === "github") return "GitHub";
  if (p === "linkedin") return "LinkedIn";
  if (p === "resume") return "Résumé upload";
  if (p === "website") return "Website";
  return platform;
}

/* ─── component ─────────────────────────────────────────────────────────── */

export default function ProfileDossier({ data }: { data?: Partial<DossierData> }) {
  const d: DossierData = { ...DEMO_DATA, ...data };

  const canonical = `https://www.zynd.ai/p/${d.handle}`;
  const permalink = `zynd.ai/p/${d.handle}`;
  const synced = shortDate(d.syncedAt);
  const initials = (d.name || "?").split(/\s+/).map((p) => p[0]).filter(Boolean).slice(0, 2).join("").toUpperCase();
  const obsessions = OBSESSIONS.map((row) => ({ ...row, items: d.obsessions[row.key] ?? [] }))
    .filter((row) => row.items.length > 0);

  return (
    <>
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      {/* App Router hoists this into <head>; the rule targets the legacy pages/ router. */}
      {/* eslint-disable-next-line @next/next/no-page-custom-font */}
      <link
        rel="stylesheet"
        href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=Geist+Mono:wght@400;500;600&display=swap"
      />

      <style>{`
        /* Dark canvas + dark hero; every other surface is a light card. */
        .zd-root {
          --zd-sans: 'Plus Jakarta Sans', Inter, -apple-system, BlinkMacSystemFont, sans-serif;
          --zd-mono: 'Geist Mono', ui-monospace, SFMono-Regular, monospace;
          --zd-line: #e2e8f0;
          --zd-bg: #556179;
          position: relative;
          min-height: 100vh;
          overflow-x: hidden;
          background: var(--zd-bg);
          color: #e2e8f0;
          font-family: var(--zd-sans);
          font-size: 14px;
          line-height: 1.5;
          letter-spacing: normal;
          -webkit-font-smoothing: antialiased;
        }
        .zd-root *, .zd-root *::before, .zd-root *::after { box-sizing: border-box; }
        .zd-root p, .zd-root h1 { margin: 0; }
        /* globals.css gives every h1 the landing-page display treatment
           (Chakra Petch, uppercase, centered) with !important — opt out here. */
        .zd-root h1 {
          font-family: var(--zd-sans) !important;
          font-weight: 700 !important;
          text-transform: none !important;
          letter-spacing: -.02em !important;
          text-align: inherit;
        }
        .zd-root ::selection { background: rgba(99,102,241,0.28); }

        .zd-glows { position: absolute; inset: 0; z-index: 0; overflow: hidden; pointer-events: none; }
        .zd-glow { position: absolute; border-radius: 9999px; }
        .zd-glow-a { top: -160px; left: 25%; width: 600px; height: 500px; background: rgba(79,70,229,0.18); filter: blur(150px); }
        .zd-glow-b { top: 35%; right: -160px; width: 500px; height: 500px; background: rgba(14,165,233,0.11); filter: blur(140px); }
        .zd-glow-c { bottom: -80px; left: 33%; width: 650px; height: 450px; background: rgba(99,102,241,0.10); filter: blur(160px); }

        .zd-shell { position: relative; z-index: 1; max-width: 1280px; margin: 0 auto; padding: 24px 16px 0; }
        @media (min-width: 768px) { .zd-shell { padding-left: 24px; padding-right: 24px; } }

        .zd-rail { display: flex; flex-wrap: wrap; align-items: center; justify-content: space-between; gap: 12px; margin-bottom: 24px; }
        .zd-crumbs { display: flex; align-items: center; gap: 12px; }
        .zd-crumb-link { display: inline-flex; align-items: center; gap: 6px; font-size: 13px; font-weight: 500; color: #94a3b8; text-decoration: none; transition: color .15s; }
        .zd-crumb-link:hover { color: #e2e8f0; }
        .zd-crumb-sep { color: rgba(148,163,184,0.35); }
        .zd-crumb-mut { font-size: 13px; color: #64748b; }
        .zd-crumb-handle { font-family: var(--zd-mono); font-size: 13px; font-weight: 500; color: #a5b4fc; background: rgba(99,102,241,0.14); border: 1px solid rgba(129,140,248,0.28); border-radius: 6px; padding: 2px 8px; }
        .zd-canvas-tag { color: #94a3b8; }
        .zd-canvas-meta { color: #64748b; }

        .zd-share-wrap { display: flex; align-items: center; gap: 8px; }
        .zd-share-btn { display: inline-flex; align-items: center; gap: 6px; padding: 6px 12px; border-radius: 8px; background: rgba(255,255,255,0.035); border: 1px solid rgba(148,163,184,0.14); font-family: var(--zd-sans); font-size: 12px; font-weight: 500; color: #94a3b8; cursor: pointer; transition: background .15s, color .15s, border-color .15s; }
        .zd-share-btn:hover { background: rgba(255,255,255,0.07); border-color: rgba(148,163,184,0.25); color: #e2e8f0; }
        .zd-toast { font-family: var(--zd-mono); font-size: 11px; font-weight: 600; color: #34d399; opacity: 0; transition: opacity .3s; }
        .zd-toast[data-on="1"] { opacity: 1; }

        .zd-grid { display: grid; grid-template-columns: repeat(12, minmax(0,1fr)); gap: 20px; align-items: start; }
        .zd-col { display: flex; flex-direction: column; gap: 16px; }
        .zd-col-l { grid-column: span 3; }
        .zd-col-c { grid-column: span 6; gap: 20px; }
        .zd-col-r { grid-column: span 3; }
        @media (max-width: 1279px) {
          .zd-col-l { grid-column: span 4; }
          .zd-col-c { grid-column: span 8; }
          .zd-col-r { grid-column: span 12; }
        }
        @media (max-width: 1023px) {
          .zd-col-l, .zd-col-c, .zd-col-r { grid-column: span 12; }
        }

        .zd-card { background: #fff; color: #0f172a; border: 1px solid var(--zd-line); border-radius: 18px; box-shadow: 0 1px 2px rgba(0,0,0,.3); transition: box-shadow .2s; }
        .zd-card:hover { box-shadow: 0 8px 26px rgba(0,0,0,.45); }
        .zd-pad-5 { padding: 20px; }
        .zd-pad-6 { padding: 24px; }

        .zd-tag { font-family: var(--zd-mono); font-size: 10px; letter-spacing: .14em; text-transform: uppercase; font-weight: 600; color: #64748b; }
        .zd-meta { font-family: var(--zd-mono); font-size: 10px; color: #94a3b8; }
        .zd-head { display: flex; align-items: center; justify-content: space-between; gap: 8px; }
        .zd-pill { font-family: var(--zd-mono); font-size: 10px; font-weight: 600; letter-spacing: .04em; padding: 2px 8px; border-radius: 9999px; }

        .zd-tele-grid { display: grid; gap: 8px; margin-top: 8px; }
        .zd-tele-3 { grid-template-columns: repeat(3, minmax(0,1fr)); }
        .zd-tele-2 { grid-template-columns: repeat(2, minmax(0,1fr)); }
        .zd-stat-n { font-family: var(--zd-mono); font-size: 18px; font-weight: 700; color: #0f172a; letter-spacing: -.01em; font-variant-numeric: tabular-nums; }
        .zd-stat-n.lg { font-size: 20px; }
        .zd-stat-l { font-size: 11px; color: #64748b; font-weight: 500; margin-top: 1px; }

        .zd-hero { position: relative; border-radius: 20px; overflow: hidden; border: 1px solid rgba(129,140,248,.22); box-shadow: 0 20px 50px rgba(0,0,0,.55), inset 0 1px 0 rgba(255,255,255,.06); padding: 28px; color: #fff; background: radial-gradient(120% 130% at 50% 0%, #26324b 0%, #1d2739 45%, #182134 100%); }
        .zd-hero-badges { position: absolute; top: 14px; right: 16px; display: flex; align-items: center; gap: 8px; }
        .zd-hero h1 { font-size: 28px; font-weight: 700; line-height: 1.2; letter-spacing: -.02em; color: #fff; }
        .zd-avatar { width: 128px; height: 128px; border-radius: 22px; object-fit: cover; border: 3px solid rgba(148,163,184,.22); box-shadow: 0 6px 20px rgba(0,0,0,.5); display: block; }
        .zd-avatar-fb { display: flex; align-items: center; justify-content: center; font-family: var(--zd-mono); font-size: 38px; font-weight: 700; background: linear-gradient(135deg,#4f46e5,#7c3aed); color: #fff; }
        .zd-link-grid { margin-top: 20px; display: grid; grid-template-columns: repeat(auto-fit, minmax(140px, 1fr)); gap: 10px; }
        .zd-link-btn { display: flex; align-items: center; justify-content: center; gap: 8px; padding: 8px 14px; border-radius: 12px; background: rgba(255,255,255,.055); border: 1px solid rgba(148,163,184,.18); color: #e2e8f0; font-size: 13px; font-weight: 500; text-decoration: none; transition: background .15s, border-color .15s; }
        .zd-link-btn:hover { background: rgba(255,255,255,.1); border-color: rgba(148,163,184,.3); }

        .zd-post { padding: 16px; border-radius: 12px; background: #f8fafc; border: 1px solid rgba(226,232,240,.8); transition: border-color .15s; }
        .zd-post:hover { border-color: #cbd5e1; }
        .zd-post-quote { font-size: 13px; line-height: 1.7; color: #334155; font-style: italic; }
        .zd-post-meta { margin-top: 10px; display: flex; flex-wrap: wrap; align-items: center; gap: 8px; font-family: var(--zd-mono); font-size: 11px; color: #64748b; }
        .zd-ext { color: #94a3b8; text-decoration: none; font-weight: 600; display: inline-flex; transition: color .15s; }
        .zd-ext:hover { color: #0f172a; }

        /* heatmap — 53 cols * 8px + 52 gaps * 2px = 528px, so a full year fits */
        .zd-heat-scroll { overflow-x: auto; padding-bottom: 4px; }
        .zd-heat { display: grid; grid-auto-flow: column; grid-template-rows: repeat(7, 8px); gap: 2px; width: max-content; padding: 4px 0; }
        .zd-heat i { width: 8px; height: 8px; border-radius: 2px; display: block; }
        .zd-months { display: flex; justify-content: space-between; min-width: 528px; font-family: var(--zd-mono); font-size: 10px; color: #94a3b8; margin-bottom: 6px; padding: 0 2px; }
        .zd-legend { display: flex; align-items: center; gap: 6px; }
        .zd-legend i { width: 8px; height: 8px; border-radius: 2px; display: inline-block; }

        .zd-skill { display: inline-flex; align-items: center; gap: 8px; padding: 7px 12px; background: #f8fafc; border: 1px solid var(--zd-line); border-radius: 10px; font-size: 13px; font-weight: 500; color: #0f172a; transition: border-color .15s; }
        .zd-skill:hover { border-color: rgba(79,70,229,.35); }

        /* obsessions — each row carries its own colour, icon and tag list */
        .zd-obs {
          position: relative;
          padding: 11px 13px 12px;
          border-radius: 12px;
          border: 1px solid #eef1f6;
          background: linear-gradient(100deg, var(--zd-obs-tint) 0%, #ffffff 62%);
          box-shadow: inset 3px 0 0 var(--zd-obs-color);
          transition: box-shadow .18s ease, border-color .18s ease, transform .18s ease;
        }
        .zd-obs:hover {
          border-color: var(--zd-obs-edge);
          box-shadow: inset 4px 0 0 var(--zd-obs-color), 0 6px 18px rgba(15,23,42,.07);
          transform: translateY(-1px);
        }
        .zd-obs-h { display: flex; align-items: center; gap: 7px; margin-bottom: 9px; }
        .zd-obs-i { display: flex; align-items: center; justify-content: center; width: 21px; height: 21px; border-radius: 7px; background: #fff; border: 1px solid var(--zd-obs-edge); color: var(--zd-obs-color); flex-shrink: 0; }
        .zd-obs-k { font-family: var(--zd-mono); font-size: 9.5px; font-weight: 700; letter-spacing: .11em; text-transform: uppercase; color: var(--zd-obs-color); line-height: 1.2; }
        .zd-obs-tags { display: flex; flex-wrap: wrap; gap: 5px; }
        .zd-obs-tag { display: inline-flex; padding: 4px 9px; border-radius: 7px; background: #fff; border: 1px solid var(--zd-obs-edge); color: #1e293b; font-size: 11.5px; font-weight: 600; line-height: 1.35; transition: background .15s ease; }
        .zd-obs:hover .zd-obs-tag { background: var(--zd-obs-tint); }
        @media (prefers-reduced-motion: reduce) { .zd-obs, .zd-obs:hover { transform: none; } }

        .zd-proj { padding: 12px 0; border-top: 1px solid #f1f5f9; }
        .zd-proj:first-child { padding-top: 0; border-top: none; }
        .zd-proj:last-child { padding-bottom: 0; }
        .zd-proj-a { display: inline-flex; align-items: center; gap: 4px; font-size: 14px; font-weight: 600; color: #0f172a; text-decoration: none; transition: color .15s; }
        .zd-proj-a:hover { color: #4f46e5; }

        .zd-explore { position: relative; overflow: hidden; padding: 20px; border-radius: 18px; border: 1px solid #c7d2fe; background: linear-gradient(135deg, #f0f3ff 0%, #fff 55%, #f3faff 100%); box-shadow: 0 1px 2px rgba(0,0,0,.3); display: flex; flex-direction: column; gap: 12px; }
        .zd-explore::after { content: ''; position: absolute; right: -32px; bottom: -32px; width: 112px; height: 112px; border-radius: 9999px; background: rgba(199,210,254,.5); filter: blur(28px); }
        .zd-cta { position: relative; z-index: 1; display: flex; align-items: center; justify-content: center; gap: 8px; width: 100%; padding: 10px 16px; border-radius: 12px; background: #4f46e5; color: #fff; font-size: 13px; font-weight: 500; text-decoration: none; box-shadow: 0 2px 8px rgba(79,70,229,.2); transition: background .15s; }
        .zd-cta:hover { background: #4338ca; }
        .zd-cta-sub { position: relative; z-index: 1; display: inline-flex; align-items: center; justify-content: center; gap: 4px; font-size: 12px; font-weight: 600; color: #4f46e5; text-decoration: none; transition: color .15s; }
        .zd-cta-sub:hover { color: #3730a3; }

        .zd-perma { display: flex; align-items: center; justify-content: space-between; gap: 8px; padding: 10px; border-radius: 12px; background: #f8fafc; border: 1px solid var(--zd-line); margin-top: 4px; }
        .zd-copy-icon { display: inline-flex; align-items: center; justify-content: center; padding: 4px; border: none; background: transparent; border-radius: 6px; color: #64748b; cursor: pointer; transition: background .15s, color .15s; }
        .zd-copy-icon:hover { background: #e2e8f0; color: #0f172a; }

        .zd-footer { position: relative; z-index: 1; margin-top: 64px; border-top: 1px solid rgba(148,163,184,0.14); background: rgba(255,255,255,.02); }
        .zd-footer-in { max-width: 1280px; margin: 0 auto; padding: 32px 16px; display: flex; flex-direction: column; align-items: center; justify-content: space-between; gap: 16px; font-size: 12px; color: #94a3b8; }
        @media (min-width: 768px) { .zd-footer-in { flex-direction: row; padding-left: 24px; padding-right: 24px; } }
        .zd-footer-links { display: flex; flex-wrap: wrap; justify-content: center; gap: 24px; font-family: var(--zd-mono); font-size: 11px; }
        .zd-footer-links a { color: inherit; text-decoration: none; transition: color .15s; }
        .zd-footer-links a:hover { color: #e2e8f0; }

        .zd-dot { position: relative; display: inline-flex; width: 8px; height: 8px; }
        .zd-dot i { position: absolute; inset: 0; border-radius: 9999px; background: #34d399; animation: zd-pulse 1.8s cubic-bezier(0,0,.2,1) infinite; }
        .zd-dot b { position: relative; width: 8px; height: 8px; border-radius: 9999px; background: #34d399; display: inline-block; }
        @keyframes zd-pulse { 0% { transform: scale(1); opacity: .75; } 75%,100% { transform: scale(2); opacity: 0; } }
        @media (prefers-reduced-motion: reduce) { .zd-dot i { animation: none; } }
      `}</style>

      <div className="zd-root">
        <div className="zd-glows" aria-hidden>
          <span className="zd-glow zd-glow-a" />
          <span className="zd-glow zd-glow-b" />
          <span className="zd-glow zd-glow-c" />
        </div>

        <main className="zd-shell">
          {/* ── top rail ── */}
          <div className="zd-rail">
            <div className="zd-crumbs">
              <a href="/directory" className="zd-crumb-link">
                <span aria-hidden>←</span>
                <span>Directory</span>
              </a>
              <span className="zd-crumb-sep">/</span>
              <span className="zd-crumb-mut">Profiles</span>
              <span className="zd-crumb-sep">/</span>
              <span className="zd-crumb-handle">@{d.handle}</span>
            </div>
            <ShareButton url={canonical} />
          </div>

          <div className="zd-grid">
            {/* ══════════ COLUMN 1 — LEFT ══════════ */}
            <div className="zd-col zd-col-l">
              {!isBlank(d.summary) && (
                <div className="zd-card zd-pad-6">
                  <div className="zd-head" style={{ marginBottom: 14 }}>
                    <span className="zd-tag">About</span>
                    <span className="zd-pill" style={{ color: "#92400e", background: "#fffbeb", border: "1px solid rgba(252,211,77,.8)" }}>
                      SCORE {d.score} / 100
                    </span>
                  </div>
                  <p style={{ fontSize: 14, lineHeight: 1.7, color: "#475569" }}>{d.summary}</p>

                  {d.industries.length > 0 && (
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 14 }}>
                      {d.industries.map((ind) => (
                        <span key={ind} style={{ fontSize: 11, fontWeight: 600, padding: "3px 9px", borderRadius: 9999, background: "#eef2ff", color: "#4f46e5" }}>
                          {ind}
                        </span>
                      ))}
                    </div>
                  )}

                  {d.experienceYears != null && (
                    <div style={{ marginTop: 14, paddingTop: 12, borderTop: "1px solid var(--zd-line)" }} className="zd-meta">
                      {d.experienceYears} YEARS EXPERIENCE
                    </div>
                  )}
                </div>
              )}

              <div className="zd-head" style={{ padding: "4px 4px 0" }}>
                <span className="zd-tag zd-canvas-tag">Scale &amp; Community</span>
                <span className="zd-meta zd-canvas-meta">3 NETWORKS</span>
              </div>

              {/* LinkedIn */}
              <div style={{ padding: 16, borderRadius: 16, background: "#f0f7fb", border: "1px solid #bfdcec", boxShadow: "0 1px 2px rgba(0,0,0,.3)" }}>
                <div className="zd-head" style={{ marginBottom: 8 }}>
                  <span style={{ display: "inline-flex", alignItems: "center", gap: 6, fontFamily: "var(--zd-mono)", fontSize: 10, letterSpacing: ".08em", textTransform: "uppercase", fontWeight: 700, color: "#0077b5" }}>
                    <LinkedinGlyph size={13} />
                    LinkedIn Network
                  </span>
                  {d.linkedin.verified && (
                    <span className="zd-pill" style={{ color: "#0077b5", background: "rgba(255,255,255,.8)", border: "1px solid rgba(0,119,181,.2)", borderRadius: 6 }}>
                      VERIFIED
                    </span>
                  )}
                </div>
                <div className="zd-tele-grid zd-tele-2">
                  <div>
                    <div className="zd-stat-n lg"><CountUp value={d.linkedin.connections} /></div>
                    <div className="zd-stat-l">connections</div>
                  </div>
                  <div>
                    <div className="zd-stat-n lg"><CountUp value={d.linkedin.posts} delay={90} /></div>
                    <div className="zd-stat-l">published posts</div>
                  </div>
                </div>
              </div>

              {/* GitHub */}
              <div className="zd-card" style={{ padding: 16 }}>
                <div className="zd-head" style={{ marginBottom: 8 }}>
                  <span style={{ display: "inline-flex", alignItems: "center", gap: 6, fontFamily: "var(--zd-mono)", fontSize: 10, letterSpacing: ".08em", textTransform: "uppercase", fontWeight: 700, color: "#334155" }}>
                    <GithubGlyph size={13} />
                    GitHub Telemetry
                  </span>
                  <span className="zd-pill" style={{ display: "inline-flex", alignItems: "center", gap: 4, color: "#059669", background: "#ecfdf5", border: "1px solid #a7f3d0", borderRadius: 6 }}>
                    <span style={{ width: 6, height: 6, borderRadius: 9999, background: "#10b981" }} />
                    ACTIVE
                  </span>
                </div>
                <div className="zd-tele-grid zd-tele-3">
                  <div>
                    <div className="zd-stat-n"><CountUp value={d.github.repos} /></div>
                    <div className="zd-stat-l">repos</div>
                  </div>
                  <div>
                    <div className="zd-stat-n"><CountUp value={d.github.locAdded} delay={90} /></div>
                    <div className="zd-stat-l">loc added</div>
                  </div>
                  <div>
                    <div className="zd-stat-n"><CountUp value={d.github.commits} delay={180} /></div>
                    <div className="zd-stat-l">commits</div>
                  </div>
                </div>
                {(d.github.active != null || d.github.languages.length > 0) && (
                  <div style={{ marginTop: 12, paddingTop: 10, borderTop: "1px solid #f1f5f9", fontSize: 11, color: "#64748b", fontWeight: 500 }}>
                    {[d.github.active != null ? `${d.github.active} active` : null, ...d.github.languages]
                      .filter(Boolean)
                      .join("  ·  ")}
                  </div>
                )}
              </div>

              {/* X / Twitter */}
              <div className="zd-card" style={{ padding: 16 }}>
                <div className="zd-head" style={{ marginBottom: 8 }}>
                  <span style={{ display: "inline-flex", alignItems: "center", gap: 6, fontFamily: "var(--zd-mono)", fontSize: 10, letterSpacing: ".08em", textTransform: "uppercase", fontWeight: 700, color: "#334155" }}>
                    <XGlyph size={11} />
                    X / Twitter
                  </span>
                  <span className="zd-pill" style={{ color: "#475569", background: "#f1f5f9", borderRadius: 6 }}>
                    {d.x.handle}
                  </span>
                </div>
                <div className="zd-tele-grid zd-tele-3">
                  <div>
                    <div className="zd-stat-n"><CountUp value={d.x.followers} /></div>
                    <div className="zd-stat-l">followers</div>
                  </div>
                  <div>
                    <div className="zd-stat-n"><CountUp value={d.x.posts} delay={90} /></div>
                    <div className="zd-stat-l">posts</div>
                  </div>
                  <div>
                    <div className="zd-stat-n"><CountUp value={d.x.impressions} delay={180} /></div>
                    <div className="zd-stat-l">impressions</div>
                  </div>
                </div>
              </div>

              {/* Explore Zynd */}
              <div className="zd-explore">
                <span className="zd-tag" style={{ color: "#4338ca", fontWeight: 700, position: "relative", zIndex: 1 }}>
                  Explore Zynd
                </span>
                <p style={{ position: "relative", zIndex: 1, fontSize: 13, lineHeight: 1.6, color: "#475569" }}>
                  Find people with matching expertise across the Zynd directory.
                </p>
                {d.skills.length > 0 && (
                  <a
                    href={`/search?skills=${d.skills.slice(0, 3).map((s) => encodeURIComponent(s.name)).join(",")}`}
                    className="zd-cta"
                  >
                    <Search size={13} />
                    Find Similar Profiles
                  </a>
                )}
                <a href="/directory" className="zd-cta-sub">
                  Browse all profiles <span aria-hidden>→</span>
                </a>
              </div>
            </div>

            {/* ══════════ COLUMN 2 — CENTER ══════════ */}
            <div className="zd-col zd-col-c">
              {/* Hero */}
              <div className="zd-hero">
                <div className="zd-hero-badges">
                  <span style={{ padding: "4px 10px", borderRadius: 9999, background: "rgba(255,255,255,.07)", border: "1px solid rgba(148,163,184,.22)", fontFamily: "var(--zd-mono)", fontSize: 11, fontWeight: 500, letterSpacing: ".08em", color: "#cbd5e1" }}>
                    ID: {d.id.toUpperCase()}
                  </span>
                  {d.verified && (
                    <span className="zd-pill" style={{ color: "#fcd34d", background: "rgba(245,158,11,.1)", border: "1px solid rgba(245,158,11,.3)", borderRadius: 6, fontWeight: 700, letterSpacing: ".08em" }}>
                      VERIFIED
                    </span>
                  )}
                </div>

                <div style={{ display: "flex", flexDirection: "column", alignItems: "center", paddingTop: 8, marginBottom: 12 }}>
                  {d.avatarUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={d.avatarUrl} alt={d.name} width={128} height={128} className="zd-avatar" />
                  ) : (
                    <div className="zd-avatar zd-avatar-fb">{initials}</div>
                  )}
                  <div style={{ marginTop: 12, display: "inline-flex", alignItems: "center", gap: 8, padding: "6px 12px", borderRadius: 9999, background: "rgba(16,185,129,.15)", border: "1px solid rgba(16,185,129,.3)", fontSize: 12, fontWeight: 600, color: "#6ee7b7" }}>
                    <span className="zd-dot"><i /><b /></span>
                    Open to {d.availability}
                  </div>
                </div>

                <div style={{ textAlign: "center" }}>
                  <h1>{d.name}</h1>
                  {!isBlank(d.headline) && (
                    <p style={{ fontSize: 15, fontWeight: 600, color: "#a5b4fc", marginTop: 4, lineHeight: 1.4 }}>
                      {d.headline}
                    </p>
                  )}
                  <p style={{ fontSize: 13, fontWeight: 500, color: "#94a3b8", marginTop: 4 }}>{d.affiliations}</p>
                </div>

                <div style={{ marginTop: 20, paddingTop: 16, borderTop: "1px solid rgba(148,163,184,0.16)", display: "flex", flexWrap: "wrap", alignItems: "center", justifyContent: "center", gap: 16, fontSize: 13, color: "#cbd5e1" }}>
                  {!isBlank(d.location) && (
                    <span style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
                      <span aria-hidden style={{ fontSize: 15 }}>📍</span>
                      {d.location}
                    </span>
                  )}
                  {synced && (
                    <span style={{ display: "inline-flex", alignItems: "center", gap: 8, fontFamily: "var(--zd-mono)", fontSize: 12, color: "#94a3b8" }}>
                      <span aria-hidden style={{ fontSize: 15 }}>📅</span>
                      Telemetry sync: {synced}
                    </span>
                  )}
                </div>

                {d.links.length > 0 && (
                  <div className="zd-link-grid">
                    {d.links.map(({ platform, url }) => (
                      <a key={platform} href={url} target="_blank" rel="noreferrer" className="zd-link-btn">
                        <PlatformGlyph platform={platform} size={15} />
                        <span>{platform === "website" ? new URL(url).hostname.replace(/^www\./, "") : platformLabel(platform)}</span>
                      </a>
                    ))}
                  </div>
                )}
              </div>

              {/* Skill Matrix */}
              {d.skills.length > 0 && (
                <div className="zd-card zd-pad-6">
                  <div className="zd-head" style={{ marginBottom: 16 }}>
                    <span className="zd-tag">Skill Matrix</span>
                    <span className="zd-meta" style={{ color: "#64748b", fontWeight: 600 }}>
                      {d.skills.length} TRACKED
                    </span>
                  </div>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                    {d.skills.map((skill) => {
                      const meta = levelMeta(skill.level);
                      return (
                        <div key={skill.name} className="zd-skill">
                          <SkillIcon name={skill.name} size={16} />
                          <span>{skill.name}</span>
                          <span style={{ fontFamily: "var(--zd-mono)", fontSize: 10, fontWeight: 700, padding: "2px 6px", borderRadius: 4, background: meta.bg, color: meta.color }}>
                            {meta.label}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Posts & Writing */}
              {d.writing.length > 0 && (
                <div className="zd-card zd-pad-6">
                  <div className="zd-head" style={{ marginBottom: 16 }}>
                    <span className="zd-tag">Posts &amp; Writing</span>
                    <span className="zd-meta" style={{ color: "#64748b", fontWeight: 600, letterSpacing: ".06em" }}>
                      {d.writing.length} POSTS ARCHIVED
                    </span>
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                    {d.writing.slice(0, 10).map((post, i) => {
                      const isX = ["x", "twitter"].includes(post.platform.toLowerCase());
                      const posted = shortDate(post.postedAt);
                      return (
                        <div key={`${post.platform}-${i}`} className="zd-post">
                          <div className="zd-head" style={{ marginBottom: 8 }}>
                            <span style={{ display: "flex", alignItems: "center", gap: 8 }}>
                              <span
                                className="zd-pill"
                                style={
                                  isX
                                    ? { display: "inline-flex", alignItems: "center", gap: 4, color: "#1e293b", background: "#e2e8f0", borderRadius: 4 }
                                    : { display: "inline-flex", alignItems: "center", gap: 4, color: "#0077b5", background: "rgba(0,119,181,.12)", border: "1px solid rgba(0,119,181,.25)", borderRadius: 4 }
                                }
                              >
                                {isX ? <XGlyph size={9} /> : <LinkedinGlyph size={10} />}
                                {isX ? "X" : "LinkedIn"}
                              </span>
                              {posted && <span style={{ fontFamily: "var(--zd-mono)", fontSize: 11, color: "#64748b" }}>{posted}</span>}
                            </span>
                            {post.url && (
                              <a href={post.url} target="_blank" rel="noreferrer" className="zd-ext" aria-label="Open post">
                                <ExternalLink size={13} />
                              </a>
                            )}
                          </div>
                          <p className="zd-post-quote">
                            “{post.excerpt.length > 320 ? `${post.excerpt.slice(0, 317)}…` : post.excerpt}”
                          </p>
                          {post.metrics.length > 0 && (
                            <div className="zd-post-meta">
                              {post.metrics.map((m, j) => (
                                <span key={m} style={{ display: "inline-flex", gap: 8 }}>
                                  {j > 0 && <span aria-hidden>•</span>}
                                  {m}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Activity & Commit History */}
              <div className="zd-card zd-pad-6">
                <div className="zd-head" style={{ marginBottom: 12 }}>
                  <span className="zd-tag">Activity &amp; Commit History</span>
                  <span style={{ fontFamily: "var(--zd-mono)", fontSize: 11, fontWeight: 600, color: "#1e293b" }}>
                    {d.contributions.total.toLocaleString()} contributions in {d.contributions.year}
                  </span>
                </div>
                <div className="zd-heat-scroll">
                  <div className="zd-months" aria-hidden>
                    <span>Jan</span><span>Mar</span><span>May</span><span>Jul</span><span>Sep</span><span>Nov</span>
                  </div>
                  <div className="zd-heat" role="img" aria-label={`${d.contributions.total} contributions in ${d.contributions.year}`}>
                    {d.contributions.levels.map((lvl, i) => (
                      <i key={i} style={{ background: HEAT[lvl] ?? HEAT[0] }} />
                    ))}
                  </div>
                </div>
                <div className="zd-head" style={{ paddingTop: 12, marginTop: 8, borderTop: "1px solid rgba(226,232,240,.8)", fontSize: 11, color: "#64748b" }}>
                  <span>Average: {d.contributions.avgPerDay} commits / day</span>
                  <span className="zd-legend">
                    <span style={{ color: "#94a3b8" }}>Less</span>
                    {HEAT.map((c) => (
                      <i key={c} style={{ background: c }} />
                    ))}
                    <span style={{ color: "#94a3b8" }}>More</span>
                  </span>
                </div>
              </div>
            </div>

            {/* ══════════ COLUMN 3 — RIGHT ══════════ */}
            <div className="zd-col zd-col-r">
              {/* Current Obsessions */}
              {obsessions.length > 0 && (
                <div className="zd-card zd-pad-5" style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                  <div className="zd-head">
                    <span className="zd-tag">Current Obsessions</span>
                    <span className="zd-meta" style={{ color: "#4f46e5", fontWeight: 600, letterSpacing: ".1em" }}>
                      ACTIVE FOCUS
                    </span>
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                    {obsessions.map((row) => (
                      <div
                        key={row.key}
                        className="zd-obs"
                        style={{
                          "--zd-obs-color": row.color,
                          "--zd-obs-tint": row.tint,
                          "--zd-obs-edge": row.edge,
                        } as CSSProperties}
                      >
                        <div className="zd-obs-h">
                          <span className="zd-obs-i">
                            <row.Icon size={11} strokeWidth={2.4} />
                          </span>
                          <span className="zd-obs-k">{row.label}</span>
                        </div>
                        <div className="zd-obs-tags">
                          {row.items.map((item) => (
                            <span key={item} className="zd-obs-tag">{item}</span>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Live in Production */}
              {d.projects.length > 0 && (
                <div className="zd-card zd-pad-5">
                  <div className="zd-head" style={{ marginBottom: 14 }}>
                    <span className="zd-tag">Live in Production</span>
                    <span className="zd-meta" style={{ color: "#4f46e5", fontWeight: 600 }}>
                      {d.projects.length} HIGHLIGHTS
                    </span>
                  </div>
                  <div>
                    {d.projects.map((project) => (
                      <div key={project.name} className="zd-proj">
                        <div className="zd-head">
                          {project.url ? (
                            <a href={project.url} target="_blank" rel="noreferrer" className="zd-proj-a">
                              <span>{project.name}</span>
                              <span aria-hidden style={{ fontSize: 11, color: "#94a3b8" }}>↗</span>
                            </a>
                          ) : (
                            <span className="zd-proj-a">{project.name}</span>
                          )}
                          {project.stars != null && (
                            <span className="zd-pill" style={{ color: "#92400e", background: "#fffbeb", border: "1px solid #fcd34d", borderRadius: 6, whiteSpace: "nowrap" }}>
                              ★ {compact(project.stars)}
                            </span>
                          )}
                        </div>
                        {!isBlank(project.description) && (
                          <p style={{ fontSize: 12, lineHeight: 1.6, color: "#475569", marginTop: 6 }}>
                            {project.description}
                          </p>
                        )}
                        {project.tech.length > 0 && (
                          <div style={{ marginTop: 8, fontFamily: "var(--zd-mono)", fontSize: 10, fontWeight: 500, color: "#4f46e5" }}>
                            {project.tech.join(" • ")}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Endorsement */}
              {!isBlank(d.endorsement.quote) && (
                <div style={{ position: "relative", padding: 20, borderRadius: 18, border: "1px solid var(--zd-line)", background: "linear-gradient(180deg, #f7f9ff 0%, #fff 55%, #fafcfd 100%)", boxShadow: "0 1px 2px rgba(0,0,0,.3)" }}>
                  <span aria-hidden style={{ position: "absolute", top: 4, left: 12, fontSize: 60, lineHeight: 1, fontFamily: "Georgia, serif", color: "#c7d2fe", userSelect: "none" }}>
                    “
                  </span>
                  <p style={{ position: "relative", zIndex: 1, paddingTop: 12, fontSize: 13, lineHeight: 1.7, fontStyle: "italic", color: "#334155" }}>
                    {d.endorsement.quote}
                  </p>
                  <div className="zd-head" style={{ marginTop: 16, paddingTop: 12, borderTop: "1px solid rgba(226,232,240,.8)" }}>
                    <span className="zd-tag" style={{ color: "#4338ca", fontWeight: 700 }}>ZYND.AI</span>
                    <span className="zd-meta" style={{ color: "#64748b", fontWeight: 500 }}>
                      {d.endorsement.reviewers} PEER REVIEWS
                    </span>
                  </div>
                </div>
              )}

              {/* Profile sources */}
              {d.sources.length > 0 && (
                <div className="zd-card zd-pad-5">
                  <div className="zd-tag" style={{ marginBottom: 14, display: "block" }}>Profile Sources</div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                    {d.sources.map((src, i) => (
                      <div key={`${src.platform}-${i}`} style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <span style={{ color: "#475569", display: "inline-flex" }}>
                          <PlatformGlyph platform={src.platform} size={13} />
                        </span>
                        <span style={{ flex: 1, fontSize: 12, color: "#475569" }}>{platformLabel(src.platform)}</span>
                        {shortDate(src.scrapedAt) && (
                          <span className="zd-meta">
                            {new Date(src.scrapedAt).toLocaleDateString("en-US", { month: "short", year: "numeric" })}
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                  <p style={{ marginTop: 14, paddingTop: 12, borderTop: "1px solid var(--zd-line)", fontSize: 10, lineHeight: 1.5, color: "#94a3b8" }}>
                    Profile synthesized by Zynd AI from public sources.
                  </p>
                </div>
              )}

              {/* Zynd Verified permalink */}
              <div className="zd-card zd-pad-5" style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                <div className="zd-head">
                  <span style={{ display: "inline-flex", alignItems: "center", gap: 8, fontSize: 13, fontWeight: 600, color: "#0f172a" }}>
                    <span style={{ width: 10, height: 10, borderRadius: 9999, background: "linear-gradient(90deg,#4f46e5,#06b6d4)", boxShadow: "0 0 8px rgba(79,70,229,.3)" }} />
                    Zynd Verified
                  </span>
                  <span className="zd-meta" style={{ color: "#64748b" }}>AI-native directory</span>
                </div>
                <div className="zd-perma">
                  <span style={{ fontFamily: "var(--zd-mono)", fontSize: 11, fontWeight: 500, color: "#4338ca", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {permalink}
                  </span>
                  <CopyPermalink url={canonical} />
                </div>
              </div>
            </div>
          </div>
        </main>

        <footer className="zd-footer">
          <div className="zd-footer-in">
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ fontWeight: 700, color: "#e2e8f0", letterSpacing: "-.01em" }}>Zynd</span>
              <span style={{ color: "rgba(148,163,184,0.4)" }}>•</span>
              <span style={{ color: "#94a3b8" }}>Dossier Intelligence &amp; Algorithmic Synthesis</span>
            </div>
            <div className="zd-footer-links">
              <a href="/for-ai">AGENT_API</a>
              <a href="/directory">DIRECTORY</a>
              <a href="/create">CREATE_PROFILE</a>
            </div>
          </div>
        </footer>
      </div>
    </>
  );
}
