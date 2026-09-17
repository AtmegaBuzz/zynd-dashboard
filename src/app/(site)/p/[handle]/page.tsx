import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { BadgeCheck, Calendar, Clock, Globe, Search, Sparkles, Video } from "lucide-react";

import {
  fetchCardByHandle,
  fetchGithubExtras,
  cardCanonicalUrl,
  getMyCard,
  type AgentProfileCard,
  type ContributionStats,
  type Project,
} from "@/lib/cards";
import { createClient } from "@/lib/supabase/server";
import { pageMetadata } from "@/lib/seo";
import { SkillMatrix } from "./skill-matrix";
import { ShareQrGroup, CopyPermalinkIcon } from "./share-controls";
import { EditCardButton } from "./edit-card-button";
import { UnclaimedCardActions } from "./unclaimed-card-actions";
import { CountUp } from "./count-up";
import { AutoScroll } from "./auto-scroll";
import { ContributionHeatmap } from "./contribution-heatmap";
import { ProfileChatWidget } from "@/components/ProfileChatWidget";
import { WorkExperienceCard } from "./work-experience-card";
import { SkillBrandIcon } from "./skill-icon";

interface PageProps {
  params: Promise<{ handle: string }>;
}

/* ─── utils ─────────────────────────────────────────────────────────────── */

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

function displayExcerpt(raw: string | null | undefined): string {
  if (!raw) return "";
  const stripped = raw.replace(/<[^>]*>/g, " ");
  const decoded = stripped
    .replace(/&amp;/gi, "&")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;|&apos;/gi, "'")
    .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(Number(n)))
    .replace(/&#x([0-9a-f]+);/gi, (_, n) => String.fromCharCode(parseInt(n, 16)));
  return decoded
    .replace(/https?:\/\/t\.co\/\S+/gi, "")
    .replace(/[ \t]+/g, " ")
    .replace(/ ?\n ?/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

const VSCROLL_VISIBLE = 3;
const VSCROLL_SECS_PER_ROW = 3.5;
const POST_ROW_H = 128;
const POST_GAP = 12;

const POST_STYLES = [
  { card: "bg-[#111827] text-white border-slate-700", badge: "bg-white/10 text-white", text: "text-slate-200", meta: "text-slate-400", link: "pf-post-link-0" },
  { card: "bg-[#e0e7ff] border-indigo-200", badge: "bg-[#3b82f6] text-white", text: "text-[#1e293b]", meta: "text-indigo-600", link: "pf-post-link-1" },
  { card: "bg-[#111827] text-white border-slate-700", badge: "bg-white/10 text-white", text: "text-slate-200", meta: "text-slate-400", link: "pf-post-link-2" },
];

const OBSESSION_CARDS: {
  key: "connect_with" | "love_talking_about" | "working_on";
  label: string;
  card: string;
  chip: string;
  unit: string;
}[] = [
  { key: "love_talking_about", label: "Love Talking About", unit: "TOPICS", card: "bg-[#bbf7d0] border border-[#86efac] text-[#064e3b]", chip: "bg-white text-[#064e3b]" },
  { key: "working_on", label: "Working On", unit: "TRACKS", card: "bg-[#fef08a] border border-[#fde047] text-[#78350f]", chip: "bg-white text-[#78350f]" },
  { key: "connect_with", label: "Connect With", unit: "PEOPLE", card: "bg-[#c7d2fe] border border-[#818cf8] text-[#1e1b4b]", chip: "bg-white text-[#312e81]" },
];

/* ─── brand glyphs ──────────────────────────────────────────────────────── */

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
  website: "Website", portfolio: "Portfolio", linktree: "Linktree",
};

function LinkGlyph({ platform, size = 15 }: { platform: string; size?: number }) {
  const key = platform.toLowerCase();
  if (key === "github") return <GithubGlyph size={size} />;
  if (key === "x" || key === "twitter") return <XGlyph size={size - 1} />;
  if (key === "linkedin") return <LinkedinGlyph size={size} />;
  return <Globe style={{ width: size, height: size }} strokeWidth={2} aria-hidden />;
}

function linkLabel(platform: string) {
  return LINK_LABELS[platform.toLowerCase()] ?? platform.charAt(0).toUpperCase() + platform.slice(1);
}

const GRADIENTS = [
  "linear-gradient(135deg, #3B82F6, #1D4ED8)",
  "linear-gradient(135deg, #10B981, #047857)",
  "linear-gradient(135deg, #8B5CF6, #6D28D9)",
  "linear-gradient(135deg, #EC4899, #BE185D)",
  "linear-gradient(135deg, #F59E0B, #B45309)",
];
function getGradient(name: string): string {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return GRADIENTS[Math.abs(hash) % GRADIENTS.length];
}

function getHashNumber(str: string, min: number, max: number): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) hash = str.charCodeAt(i) + ((hash << 5) - hash);
  return min + (Math.abs(hash) % (max - min + 1));
}

const LEVEL_META: Record<string, { label: string; color: string; bar: string; glow: string; bars: number }> = {
  expert: { label: "Expert", color: "#D97706", bar: "#F59E0B", glow: "rgba(245,158,11,.4)", bars: 3 },
  advanced: { label: "Advanced", color: "#5448D4", bar: "#7B72E9", glow: "rgba(123,114,233,.35)", bars: 2 },
  intermediate: { label: "Mid", color: "#0284C7", bar: "#0EA5E9", glow: "rgba(14,165,233,.35)", bars: 1 },
  beginner: { label: "Beginner", color: "#059669", bar: "#10B981", glow: "rgba(16,185,129,.35)", bars: 1 },
};
const levelMeta = (l: string) => LEVEL_META[l.toLowerCase()] ?? LEVEL_META.intermediate;

const SKILL_ACCENTS: Record<string, string> = {
  rust: "#F97316", "c++": "#0070BA", cuda: "#5C9400", python: "#0284C7", kubernetes: "#6366F1",
  pytorch: "#E11D48", terraform: "#9333EA", go: "#14B8A6", "distributed systems": "#0891B2",
  "performance testing": "#059669",
};
const skillAccent = (name: string) => SKILL_ACCENTS[name.trim().toLowerCase()] ?? "#7B72E9";

/* ─── view model ──────────────────────────────────────────────────────────── */

function buildView(card: AgentProfileCard) {
  const { identity } = card;

  const links = Object.entries(identity.links ?? {})
    .map(([platform, url]) => [platform, safeUrl(url)] as const)
    .filter((e): e is readonly [string, string] => e[1] !== null);

  const projects: (Project & { stars: number | null; tech: string[] })[] = card.projects.map((p) => ({
    ...p,
    stars: p.stars ?? null,
    tech: p.tech ?? [],
  }));

  const skillKeywords = new Set(card.skills.map((s) => s.name.toLowerCase()));
  const writing = card.writing_samples
    .map((s) => ({ ...s, excerpt: displayExcerpt(s.excerpt), metrics: s.metrics ?? [] }))
    .filter((s) => s.excerpt.length > 0)
    .sort((a, b) => {
      const score = (text: string) => {
        const t = text.toLowerCase();
        let n = 0;
        for (const kw of skillKeywords) if (t.includes(kw)) n++;
        return n;
      };
      return score(b.excerpt) - score(a.excerpt);
    });

  const endorsementQuote = card.endorsement?.quote ?? (isBlank(card.citation_snippet) ? null : card.citation_snippet);

  const xQuote =
    writing.find((s) => ["x", "twitter"].includes(s.platform.toLowerCase()))?.excerpt ??
    writing[0]?.excerpt ??
    endorsementQuote ??
    (isBlank(card.summary) ? null : card.summary);

  const linkedinPosts = writing
    .filter((s) => s.platform.toLowerCase() === "linkedin")
    .map((s) => s.excerpt);
  const xPosts = writing
    .filter((s) => ["x", "twitter"].includes(s.platform.toLowerCase()))
    .map((s) => s.excerpt);

  const linkedinScrollItems = linkedinPosts.length > 0 ? linkedinPosts : endorsementQuote ? [endorsementQuote] : [];
  const xScrollItems = xPosts.length > 0 ? xPosts : xQuote ? [xQuote] : [];

  return {
    links,
    projects,
    writing,
    endorsementQuote,
    xQuote,
    linkedinScrollItems,
    xScrollItems,
    linkedin: {
      connections: card.linkedin_stats?.connections ?? null,
      posts: card.linkedin_stats?.posts ?? null,
    },
    github: {
      repos: card.github_stats?.total_repos ?? null,
      activeRepos: card.github_stats?.active_repos ?? null,
      topLanguages: card.github_stats?.top_languages ?? [],
      commits: card.github_stats?.total_commits ?? null,
      followers: card.github_stats?.followers ?? null,
    },
    x: {
      handle:
        card.x_stats?.handle ??
        (identity.links?.x ? `@${usernameFromUrl(identity.links.x)}` : null),
      followers: card.x_stats?.followers ?? null,
      posts: card.x_stats?.posts ?? null,
      impressions: card.x_stats?.impressions ?? null,
    },
    contributions: card.contribution_stats ?? null,
  };
}

/* ─── SEO ───────────────────────────────────────────────────────────────── */

function buildJsonLd(card: AgentProfileCard) {
  const { identity } = card;
  const sameAs = Object.values(identity.links)
    .filter((v): v is string => Boolean(v))
    .filter((v) => /^https?:\/\//.test(v));
  const image = /^https?:\/\//.test(identity.avatar_url || "") ? identity.avatar_url : undefined;
  return {
    "@context": "https://schema.org",
    "@type": "ProfilePage",
    dateCreated: card.created_at,
    dateModified: card.updated_at,
    mainEntity: {
      "@type": "Person",
      name: identity.name,
      description: card.citation_snippet || card.summary,
      image,
      sameAs,
      knowsAbout: card.skills.map((s) => s.name),
      ...(identity.headline ? { hasOccupation: { "@type": "Occupation", name: identity.headline } } : {}),
      ...(identity.location ? { address: { "@type": "PostalAddress", addressLocality: identity.location } } : {}),
    },
    breadcrumb: {
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "Zynd", item: "https://www.zynd.ai" },
        { "@type": "ListItem", position: 2, name: "Directory", item: "https://www.zynd.ai/directory" },
        { "@type": "ListItem", position: 3, name: identity.name, item: cardCanonicalUrl(card) },
      ],
    },
  };
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { handle } = await params;
  const card = await fetchCardByHandle(handle);
  if (!card) {
    return pageMetadata({
      title: "Profile not found",
      description: "This profile does not exist on Zynd.",
      path: `/p/${handle}`,
    });
  }
  const name = card.identity.name || "Profile";
  const headline = card.identity.headline;
  const canonical = cardCanonicalUrl(card);
  return {
    ...pageMetadata({
      title: headline ? `${name} — ${headline} — Zynd` : `${name} — Zynd`,
      description: card.citation_snippet || card.summary,
      path: `/p/${handle}`,
    }),
    alternates: { canonical },
    openGraph: {
      type: "profile",
      url: canonical,
      title: headline ? `${name} — ${headline}` : name,
      description: card.citation_snippet || card.summary,
      ...(card.identity.links.github ? { username: handle } : {}),
    },
  };
}

/* ─── page ──────────────────────────────────────────────────────────────── */

export default async function PersonPage({ params }: PageProps) {
  const { handle } = await params;
  const card = await fetchCardByHandle(handle);
  if (!card) notFound();

  const { identity } = card;
  const v = buildView(card);
  const canonical = cardCanonicalUrl(card);
  const permalink = `zynd.ai/p/${card.handle || card.id}`;

  const initials = (identity.name || "?")
    .split(/\s+/).map((p) => p[0]).filter(Boolean).slice(0, 2).join("").toUpperCase();

  const nameParts = (identity.name || "").trim().split(/\s+/);
  const nameLines = nameParts.length > 1
    ? [nameParts.slice(0, -1).join(" "), nameParts[nameParts.length - 1]]
    : nameParts;

  const avatarUrl = safeUrl(identity.avatar_url) ?? githubAvatar(identity.links?.github);
  const verified = card.review?.status === "human_approved";
  const skills = card.skills.slice().sort((a, b) => b.evidence_count - a.evidence_count);

  const syncedAt = (() => {
    const d = new Date(card.updated_at);
    return Number.isNaN(d.getTime()) ? null : d.toLocaleDateString("en-US", { month: "short", year: "numeric" }).toUpperCase();
  })();

  const obsessionSources: Record<(typeof OBSESSION_CARDS)[number]["key"], string[]> = {
    connect_with: card.connect_with,
    love_talking_about: card.love_talking_about,
    working_on: card.working_on,
  };
  const obsessions = OBSESSION_CARDS.filter((row) => obsessionSources[row.key].length > 0).map((row) => ({
    ...row,
    items: obsessionSources[row.key],
  }));

  const linkedinHandle = usernameFromUrl(identity.links?.linkedin);
  const linkedinUrl = safeUrl(identity.links?.linkedin);
  const githubHandle = usernameFromUrl(identity.links?.github) || card.handle || "profile";
  const githubUrl = safeUrl(identity.links?.github);
  const ghLogin = usernameFromUrl(identity.links?.github);
  const ghExtras = ghLogin ? await fetchGithubExtras(ghLogin) : null;
  const xUrl = safeUrl(identity.links?.x);
  const calendlyUrl = safeUrl(card.calendly_url);

  const memoryFacts = (card.zynd_memory ?? []) as Array<Record<string, unknown>>;

  const MEMORY_GROUPS: Record<string, { label: string; icon: string }> = {
    is_building: { label: "Currently building", icon: "⚙️" },
    is_learning: { label: "Learning", icon: "📚" },
    is_seeking: { label: "Seeking", icon: "🤝" },
    open_to: { label: "Open to", icon: "🤝" },
    has_expertise_in: { label: "Expert in", icon: "🧠" },
    is_affiliated_with: { label: "Works at", icon: "🏢" },
    is_located_in: { label: "Based in", icon: "📍" },
  };
  const GROUP_ORDER = ["is_building", "is_learning", "is_seeking", "open_to", "has_expertise_in", "is_affiliated_with", "is_located_in"];
  const ENUM_LABELS: Record<string, string> = {
    co_founder: "a co-founder", technical_feedback: "technical feedback",
    early_users: "early users", mentoring: "mentoring", being_mentored: "being mentored",
    peer_review: "peer reviews", collaboration: "collaboration", investment: "investment",
    community: "community", coffee_chat: "coffee chats", mentoring_others: "mentoring others",
    early_user_testing: "early user testing",
  };

  const memoryGroups = (() => {
    const facts = memoryFacts
      .map((f) => ({
        predicate: String(f.predicate ?? ""),
        object: String(f.object ?? "").trim(),
        source: String(f.source ?? ""),
        confidence: typeof f.confidence === "number" ? f.confidence : 0,
        approved_at: typeof f.approved_at === "string" ? f.approved_at : "",
      }))
      .filter((f) => f.predicate && f.object);
    const seen = new Set<string>();
    const byPredicate = new Map<string, { text: string; inferred: boolean; confidence: number; approved_at: string }[]>();
    for (const f of facts) {
      const meta = MEMORY_GROUPS[f.predicate];
      if (!meta) continue;
      const dedupeKey = `${f.predicate}|${f.object.toLowerCase()}`;
      if (seen.has(dedupeKey)) continue;
      seen.add(dedupeKey);
      const list = byPredicate.get(f.predicate) ?? [];
      const rawText = ENUM_LABELS[f.object] ?? f.object;
      const text = f.predicate === "is_building" ? rawText.replace(/^building\s+/i, "") : rawText;
      list.push({ text, inferred: f.source === "inferred", confidence: f.confidence, approved_at: f.approved_at });
      byPredicate.set(f.predicate, list);
    }
    return GROUP_ORDER
      .filter((p) => byPredicate.has(p))
      .map((p) => {
        const meta = MEMORY_GROUPS[p];
        const items = byPredicate.get(p)!;
        const sorted = p === "has_expertise_in"
          ? [...items].sort((a, b) => b.confidence - a.confidence)
          : [...items].sort((a, b) => b.approved_at.localeCompare(a.approved_at));
        return { key: p, label: meta.label, icon: meta.icon, items: sorted };
      });
  })();
  const memoryTotal = memoryGroups.reduce((n, g) => n + g.items.length, 0);
  const firstName = identity.name?.split(" ")[0] || "They";

  let isOwner = false;
  try {
    const supabase = await createClient();
    const { data: { session } } = await supabase.auth.getSession();
    if (session?.access_token) {
      const myCard = await getMyCard(session.access_token);
      isOwner = !!(myCard && myCard.handle === handle);
    }
  } catch {
    // Auth check is best-effort
  }

  const showLinkedin = !!(linkedinHandle || v.linkedin.connections != null);
  const showX = !!(v.x.handle || v.x.followers != null);
  const showGithub = !!(identity.links?.github || card.github_stats || card.contribution_stats || ghExtras?.contributions);
  const contributions = (v.contributions && Array.isArray(v.contributions.levels) && v.contributions.levels.length > 0)
    ? v.contributions
    : ghExtras?.contributions ?? null;
  const hasContributions = !!(contributions && contributions.levels.length > 0);
  const ghFollowers = v.github.followers ?? ghExtras?.followers ?? null;
  const ghFollowing = ghExtras?.following ?? null;
  const ghBio = ghExtras?.bio;
  const ghContribTotal = contributions?.total ?? (typeof v.github.commits === "number" ? v.github.commits : null);
  const linkedinAvatar = safeUrl(card.linkedin_stats?.avatar) ?? avatarUrl;
  const xAvatar = safeUrl(card.x_stats?.avatar) ?? avatarUrl;
  const xImpressions = v.x.impressions != null && String(v.x.impressions).trim() !== "—" ? v.x.impressions : null;
  const showMemory = memoryTotal > 0;
  const socialSlots = [showLinkedin, showX, showMemory, !!calendlyUrl].filter(Boolean).length;
  const weekLabels = ["S", "M", "T", "W", "T", "F", "S"];
  const todayIdx = new Date().getDay();

  /* ── shared card style ─────────────────────────────────── */
  const card_ = "bg-white border border-[#e2e8f0] rounded-[20px] p-5 flex flex-col justify-between";
  const label_ = "flex justify-between items-center text-[0.65rem] font-mono font-bold uppercase tracking-widest text-slate-400 mb-3";
  const pill_ = "bg-[#f1f5f9] border border-[#e2e8f0] text-slate-500 text-[0.65rem] font-bold font-mono px-2.5 py-1 rounded-full";

  return (
    <>
      <link rel="canonical" href={canonical} />
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      {/* eslint-disable-next-line @next/next/no-page-custom-font */}
      <link
        href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@500;600;700;800&family=Space+Mono:wght@400;700&display=swap"
        rel="stylesheet"
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(buildJsonLd(card)).replace(/</g, "\\u003c") }}
      />

      <style>{`
        .pf-page { font-family: 'Plus Jakarta Sans', -apple-system, sans-serif; -webkit-font-smoothing: antialiased; letter-spacing: 0; line-height: 1.45; word-spacing: normal; }
        .pf-mono { font-family: 'Space Mono', monospace; }
        .pf-page a { color: inherit; text-decoration: none; }
        .pf-page a:hover { text-decoration: underline; }
        /* AutoScroll */
        .pf-vscroll { overflow: hidden; position: relative; }
        .pf-vrow { display: flex; flex-direction: column; justify-content: flex-start; flex-shrink: 0; overflow: hidden; }
        .pf-vrow-post { height: 128px; }
        .pf-clamp-2 { overflow: hidden; display: -webkit-box; -webkit-box-orient: vertical; -webkit-line-clamp: 2; }
        .pf-post-excerpt { margin: 0; font-size: 13.5px; line-height: 1.55; font-weight: 500; font-style: normal; letter-spacing: 0.01em; word-spacing: 0.06em; word-break: break-word; overflow-wrap: break-word; white-space: pre-wrap; overflow: hidden; display: -webkit-box; -webkit-box-orient: vertical; -webkit-line-clamp: 3; }
        .pf-quote-reel { height: 100%; display: flex; flex-direction: column; min-height: 0; }
        .pf-quote-text { margin: 0; flex: 1; min-height: 0; overflow: hidden; white-space: pre-wrap; font-size: 13.5px; line-height: 1.55; font-weight: 500; font-style: normal; letter-spacing: 0.01em; word-break: break-word; overflow-wrap: break-word; max-height: calc(1.55em * 6); }
        .pf-quote-count { margin-top: 8px; font-size: 0.58rem; letter-spacing: 0.08em; opacity: 0.55; }
        @media (prefers-reduced-motion: reduce) { .pf-vscroll { overflow-y: auto; } }
        /* bracket corners */
        .tc { position: relative; }
        .tc::before { content:''; position:absolute; top:12px; left:12px; width:8px; height:8px; border-top:1px solid #d4d4d8; border-left:1px solid #d4d4d8; }
        .tc::after  { content:''; position:absolute; top:12px; right:12px; width:8px; height:8px; border-top:1px solid #d4d4d8; border-right:1px solid #d4d4d8; }
        /* SkillMatrix / EditCardButton compat */
        .pf-edit-btn { display:inline-flex; align-items:center; gap:6px; padding:6px 14px; border-radius:999px; background:#f4f4f5; border:1px solid #E5E5DE; font-family:'Space Mono',monospace; font-size:11px; font-weight:600; color:#0B0B0B; cursor:pointer; transition:background .15s,color .15s; }
        .pf-edit-btn:hover { background:#0B0B0B; color:#fff; text-decoration:none; }
        .bento-corner { position:relative; }
        .bento-corner::after { content:''; position:absolute; top:14px; right:14px; width:14px; height:14px; border-top:2px solid currentColor; border-right:2px solid currentColor; opacity:.35; pointer-events:none; }
        .pf-book-card { position: relative; overflow: hidden; }
        .pf-book-card::before { content:''; position:absolute; width:220px; height:220px; right:-60px; top:-70px; background:radial-gradient(circle, rgba(255,255,255,0.22), transparent 68%); pointer-events:none; }
        .pf-book-cta { transition: background .15s, transform .15s, box-shadow .15s; }
        .pf-book-cta:hover { background:#f8fafc !important; text-decoration:none !important; transform:translateY(-1px); box-shadow:0 8px 20px rgba(15,23,42,0.18); }
      `}</style>

      <div className="pf-page" style={{ backgroundColor: "#f5f6f8", minHeight: "100vh" }}>
        <div style={{ maxWidth: 1300, margin: "0 auto", padding: "24px 24px 56px" }}>

          {/* ── HEADER ── */}
          <header className="flex justify-between items-center pb-5">
            <div className="pf-mono text-[0.75rem] text-slate-500">
              <Link href="/directory" className="hover:text-slate-800">Zynd</Link>
              {" / "}
              <Link href="/directory" className="hover:text-slate-800">Directory</Link>
              {" / "}
              <strong className="text-slate-800">@{card.handle || card.id}</strong>
            </div>
            <div className="flex gap-2.5 items-center flex-wrap justify-end">
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-50 border border-emerald-200 text-[0.7rem] pf-mono font-bold text-emerald-700">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                SYNTHESIS_ACTIVE
              </span>
              <ShareQrGroup url={canonical} />
              {isOwner && <EditCardButton handle={card.handle ?? card.id} />}
            </div>
          </header>

          {/* ── MAIN GRID ── */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(12, 1fr)", gap: 16, alignItems: "stretch" }}>

            {/* ── HERO CARD (4 col) ── */}
            <div
              style={{ gridColumn: "span 4", background: "linear-gradient(145deg, #7c73ff, #6b63ff)", borderRadius: 20, padding: "24px", color: "#fff", display: "flex", flexDirection: "column", justifyContent: "space-between", minHeight: 420 }}
            >
              <div>
                {/* Avatar */}
                {avatarUrl ? (
                  <img
                    src={avatarUrl}
                    alt={identity.name}
                    style={{ width: 64, height: 64, borderRadius: "50%", border: "2px solid rgba(255,255,255,0.4)", objectFit: "cover", marginBottom: 20 }}
                  />
                ) : (
                  <div style={{ width: 64, height: 64, borderRadius: "50%", border: "2px solid rgba(255,255,255,0.3)", background: "rgba(255,255,255,0.15)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22, fontWeight: 800, marginBottom: 20 }}>
                    {initials}
                  </div>
                )}
                <div style={{ fontSize: "0.8rem", fontWeight: 700, opacity: 0.9 }}>I&apos;m,</div>
                <div style={{ fontSize: "1.9rem", fontWeight: 800, lineHeight: 1.05, margin: "4px 0 6px" }}>
                  {nameLines.map((line, i) => <div key={i}>{line}</div>)}
                </div>
                {!isBlank(identity.headline) && (
                  <div style={{ fontSize: "0.8rem", color: "#e0e7ff", fontWeight: 600, marginBottom: 20 }}>
                    {identity.headline}
                  </div>
                )}

                {/* Tags */}
                <div className="pf-mono" style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  {card.working_on[0] && (
                    <div style={{ display: "flex", alignItems: "center", gap: 10, fontSize: "0.65rem" }}>
                      <span style={{ color: "#c7d2fe", width: 80, flexShrink: 0 }}>BUILDING</span>
                      <span style={{ background: "rgba(255,255,255,0.2)", padding: "3px 10px", borderRadius: 6, color: "#fff", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: 160 }}>
                        {card.working_on[0].toUpperCase()}
                      </span>
                    </div>
                  )}
                  {card.love_talking_about[0] && (
                    <div style={{ display: "flex", alignItems: "center", gap: 10, fontSize: "0.65rem" }}>
                      <span style={{ color: "#c7d2fe", width: 80, flexShrink: 0 }}>TALKS ABOUT</span>
                      <span style={{ background: "rgba(255,255,255,0.2)", padding: "3px 10px", borderRadius: 6, color: "#fff", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: 160 }}>
                        {card.love_talking_about[0].toUpperCase()}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              <div>
                {/* Social icons */}
                <div style={{ display: "flex", gap: 10, margin: "20px 0 16px" }}>
                  {identity.links?.x && (
                    <a href={safeUrl(identity.links.x) ?? "#"} target="_blank" rel="noreferrer" style={{ width: 30, height: 30, borderRadius: "50%", background: "rgba(255,255,255,0.2)", display: "flex", alignItems: "center", justifyContent: "center" }} aria-label="X">
                      <XGlyph size={13} />
                    </a>
                  )}
                  {identity.links?.github && (
                    <a href={safeUrl(identity.links.github) ?? "#"} target="_blank" rel="noreferrer" style={{ width: 30, height: 30, borderRadius: "50%", background: "rgba(255,255,255,0.2)", display: "flex", alignItems: "center", justifyContent: "center" }} aria-label="GitHub">
                      <GithubGlyph size={14} />
                    </a>
                  )}
                  {identity.links?.linkedin && (
                    <a href={safeUrl(identity.links.linkedin) ?? "#"} target="_blank" rel="noreferrer" style={{ width: 30, height: 30, borderRadius: "50%", background: "rgba(255,255,255,0.2)", display: "flex", alignItems: "center", justifyContent: "center" }} aria-label="LinkedIn">
                      <LinkedinGlyph size={14} />
                    </a>
                  )}
                </div>
                <div className="pf-mono" style={{ fontSize: "0.7rem", color: "#c7d2fe" }}>
                  {syncedAt && <>Updated {syncedAt}</>}
                  {card.industries?.[0] && <> · {card.industries[0]}</>}
                </div>
              </div>
            </div>

            {/* ── RIGHT STACK: Dossier + Signals (8 col) ── */}
            <div style={{ gridColumn: "span 8", display: "flex", flexDirection: "column", gap: 16 }}>

              {/* Dossier */}
              {!isBlank(card.summary) && (
                <div className={`${card_} tc`}>
                  <div>
                    <div className={label_}>
                      <span>┌ DOSSIER SUMMARY</span>
                      <span>┐</span>
                    </div>
                    <p style={{ fontSize: "0.85rem", color: "#0f172a", fontWeight: 600, lineHeight: 1.65, marginBottom: 16 }}>
                      {card.summary}
                    </p>
                  </div>
                  {card.industries && card.industries.length > 0 && (
                    <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                      {card.industries.slice(0, 5).map((tag) => (
                        <span key={tag} className={pill_}>{tag}</span>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Signal cards row */}
              {obsessions.length > 0 && (
                <div style={{ display: "grid", gridTemplateColumns: `repeat(${obsessions.length}, 1fr)`, gap: 16 }}>
                  {obsessions.map((obs) => (
                    <div key={obs.key} className={`${obs.card} rounded-[20px] p-[18px] flex flex-col justify-between`}>
                      <div className={`${label_} pf-mono`} style={{ color: "inherit", opacity: 0.8 }}>
                        <span>┌ {obs.label.toUpperCase()}</span>
                        <span className={`${obs.chip} text-[0.6rem] px-2 py-0.5 rounded-full font-mono font-bold`}>
                          {obsessionSources[obs.key].length} {obs.unit}
                        </span>
                      </div>
                      <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-start", gap: 6 }}>
                        {obsessionSources[obs.key].slice(0, 4).map((item) => (
                          <span key={item} className={`${obs.chip} text-[0.65rem] font-bold font-mono px-2.5 py-1 rounded-full`}>
                            {item}
                          </span>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* ── AI FACT + WORK EXP: equal height, fact card fills ── */}
            <div style={{ gridColumn: "span 12", display: "grid", gridTemplateColumns: "repeat(12, 1fr)", gap: 16, alignItems: "stretch" }}>
            {(() => {
              const q = (s: string) => `"${s.replace(/"/g, '\\"')}"`;
              const arr = (items: string[]) => `[${items.map(q).join(", ")}]`;
              const currentRoles = (card.work_experience ?? [])
                .filter((j) => /^(present|current|now)$/i.test((j.end_date || "").trim()) && (j.title || j.company))
                .map((j) => j.title || j.company)
                .slice(0, 3);
              const tech = skills.slice(0, 5).map((s) => s.name);
              const industries = (card.industries ?? []).filter((x) => !isBlank(x)).slice(0, 4);
              const help = (card.can_help_with ?? []).filter((x) => !isBlank(x)).slice(0, 3);
              return (
            <div style={{ gridColumn: "span 5", background: "#0f172a", borderRadius: 20, padding: "20px 24px", color: "#fff", display: "flex", flexDirection: "column", height: "100%", minHeight: 0 }}>
              <div className="pf-mono flex justify-between items-center" style={{ fontSize: "0.65rem", color: "#94a3b8", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em" }}>
                <span>AI DISCOVERABILITY FACT</span>
                <span style={{ background: "rgba(255,255,255,0.1)", color: "#e2e8f0", padding: "3px 10px", borderRadius: 99 }}>Zynd Index</span>
              </div>
              <div className="pf-mono" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 12, padding: "14px 16px", fontSize: "0.72rem", lineHeight: 1.75, margin: "14px 0 0", flex: 1 }}>
                <div style={{ color: "#64748b", marginBottom: 8 }}>{"// structured discovery profile"}</div>
                <div><span style={{ color: "#38bdf8" }}>entity</span><span style={{ color: "#94a3b8" }}>:</span> <span style={{ color: "#fde047" }}>{q(identity.name)}</span></div>
                {!isBlank(identity.headline) && (
                  <div><span style={{ color: "#38bdf8" }}>role</span><span style={{ color: "#94a3b8" }}>:</span> <span style={{ color: "#fde047" }}>{q(identity.headline)}</span></div>
                )}
                {!isBlank(identity.location) && (
                  <div><span style={{ color: "#38bdf8" }}>location</span><span style={{ color: "#94a3b8" }}>:</span> <span style={{ color: "#fde047" }}>{q(identity.location)}</span></div>
                )}
                {card.experience_years != null && (
                  <div><span style={{ color: "#38bdf8" }}>experience</span><span style={{ color: "#94a3b8" }}>:</span> <span style={{ color: "#86efac" }}>{card.experience_years}</span><span style={{ color: "#94a3b8" }}> years</span></div>
                )}
                {!isBlank(card.availability) && (
                  <div><span style={{ color: "#38bdf8" }}>availability</span><span style={{ color: "#94a3b8" }}>:</span> <span style={{ color: "#fde047" }}>{q(card.availability)}</span></div>
                )}
                {currentRoles.length > 0 && (
                  <div><span style={{ color: "#38bdf8" }}>current_roles</span><span style={{ color: "#94a3b8" }}>:</span> <span style={{ color: "#fde047" }}>{arr(currentRoles)}</span></div>
                )}
                {tech.length > 0 && (
                  <div><span style={{ color: "#38bdf8" }}>primary_tech</span><span style={{ color: "#94a3b8" }}>:</span> <span style={{ color: "#fde047" }}>{arr(tech)}</span></div>
                )}
                {industries.length > 0 && (
                  <div><span style={{ color: "#38bdf8" }}>industries</span><span style={{ color: "#94a3b8" }}>:</span> <span style={{ color: "#fde047" }}>{arr(industries)}</span></div>
                )}
                {help.length > 0 && (
                  <div><span style={{ color: "#38bdf8" }}>can_help_with</span><span style={{ color: "#94a3b8" }}>:</span> <span style={{ color: "#fde047" }}>{arr(help)}</span></div>
                )}
              </div>
              <div className="pf-mono" style={{ fontSize: "0.65rem", color: "#64748b", marginTop: 12, lineHeight: 1.5 }}>
                Indexed for AI agents (ChatGPT, Claude, Perplexity) to discover and recommend {firstName}.
              </div>
            </div>
              );
            })()}

            <WorkExperienceCard
              jobs={(card.work_experience ?? []).filter((j) => !!(j.title || j.company))}
              experienceYears={card.experience_years}
              linkedinHandle={linkedinHandle}
              linkedinUrl={linkedinUrl}
              cardClass={card_}
              labelClass={label_}
              pillClass={pill_}
            />
            </div>

            {/* ── SOCIAL ROW: equal columns, always fills the 12-col track ── */}
            {socialSlots > 0 && (
            <div style={{ gridColumn: "span 12", display: "grid", gridTemplateColumns: `repeat(${socialSlots}, minmax(0, 1fr))`, gap: 16, alignItems: "start" }}>

            {/* ── SOCIAL: LINKEDIN ── */}
            {showLinkedin && (
              <div
                style={{ background: "#0A66C2", borderRadius: 20, padding: 16, color: "#fff", display: "flex", flexDirection: "column", overflow: "hidden", minWidth: 0 }}
              >
                <div className="pf-mono flex justify-between items-start" style={{ fontSize: "0.65rem", fontWeight: 700 }}>
                  <span className="flex items-center gap-1"><LinkedinGlyph size={12} /> LINKEDIN</span>
                  {linkedinUrl ? (
                    <a href={linkedinUrl} target="_blank" rel="noreferrer" style={{ opacity: 0.7 }}>
                      {linkedinHandle ? `in/${linkedinHandle} ↗` : "Profile ↗"}
                    </a>
                  ) : linkedinHandle ? (
                    <span style={{ opacity: 0.7 }}>in/{linkedinHandle}</span>
                  ) : null}
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 10, marginTop: 12 }}>
                  {linkedinAvatar ? (
                    <img src={linkedinAvatar} alt="" style={{ width: 44, height: 44, borderRadius: "50%", objectFit: "cover", border: "2px solid rgba(255,255,255,0.35)", flexShrink: 0 }} />
                  ) : (
                    <div style={{ width: 44, height: 44, borderRadius: "50%", background: "rgba(255,255,255,0.15)", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800, flexShrink: 0 }}>{initials}</div>
                  )}
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontSize: "1.05rem", fontWeight: 800, lineHeight: 1.2 }}>{identity.name}</div>
                    {!isBlank(identity.headline) && (
                      <div className="pf-clamp-2" style={{ fontSize: "0.7rem", opacity: 0.8, marginTop: 3, fontWeight: 600 }}>{identity.headline}</div>
                    )}
                  </div>
                </div>
                <div className="pf-mono" style={{ display: "grid", gridTemplateColumns: v.linkedin.connections != null && v.linkedin.posts != null ? "1fr 1fr" : "1fr", gap: 8, marginTop: 12, paddingTop: 12, borderTop: "1px solid rgba(255,255,255,0.18)" }}>
                  {v.linkedin.connections != null && (
                    <div>
                      <strong style={{ fontSize: "1.15rem", display: "block", color: "#fff" }}><CountUp value={v.linkedin.connections} /></strong>
                      <span style={{ fontSize: "0.58rem", opacity: 0.75 }}>CONNECTIONS</span>
                    </div>
                  )}
                  {v.linkedin.posts != null && Number(v.linkedin.posts) > 0 && (
                    <div>
                      <strong style={{ fontSize: "1.15rem", display: "block", color: "#fff" }}><CountUp value={v.linkedin.posts} /></strong>
                      <span style={{ fontSize: "0.58rem", opacity: 0.75 }}>POSTS</span>
                    </div>
                  )}
                </div>
                {linkedinUrl && (
                  <a href={linkedinUrl} target="_blank" rel="noreferrer" className="pf-mono" style={{ marginTop: 10, display: "flex", alignItems: "center", justifyContent: "center", padding: "8px 14px", borderRadius: 10, background: "rgba(255,255,255,0.14)", fontSize: "0.68rem", fontWeight: 700, textDecoration: "none" }}>
                    View LinkedIn profile →
                  </a>
                )}
              </div>
            )}

            {/* ── SOCIAL: X / TWITTER ── */}
            {showX && (
              <div
                style={{ background: "#090a0f", borderRadius: 20, padding: 16, color: "#fff", display: "flex", flexDirection: "column", overflow: "hidden", minWidth: 0 }}
              >
                <div className="pf-mono flex justify-between items-start" style={{ fontSize: "0.65rem", fontWeight: 700 }}>
                  <span className="flex items-center gap-1"><XGlyph size={11} /> X / TWITTER</span>
                  {xUrl ? (
                    <a href={xUrl} target="_blank" rel="noreferrer" style={{ opacity: 0.7 }}>
                      {v.x.handle ?? "Profile"} ↗
                    </a>
                  ) : v.x.handle ? (
                    <span style={{ opacity: 0.7 }}>{v.x.handle}</span>
                  ) : null}
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 10, marginTop: 12 }}>
                  {xAvatar ? (
                    <img src={xAvatar} alt="" style={{ width: 44, height: 44, borderRadius: "50%", objectFit: "cover", border: "2px solid rgba(255,255,255,0.2)", flexShrink: 0 }} />
                  ) : (
                    <div style={{ width: 44, height: 44, borderRadius: "50%", background: "rgba(255,255,255,0.1)", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800, flexShrink: 0 }}>{initials}</div>
                  )}
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontSize: "1.05rem", fontWeight: 800, lineHeight: 1.2 }}>{identity.name}</div>
                    {v.x.handle && (
                      <div className="pf-mono" style={{ fontSize: "0.7rem", opacity: 0.65, marginTop: 3 }}>{v.x.handle}</div>
                    )}
                  </div>
                </div>
                <div className="pf-mono" style={{ display: "grid", gridTemplateColumns: xImpressions != null ? "1fr 1fr 1fr" : "1fr 1fr", gap: 8, marginTop: 12, paddingTop: 12, borderTop: "1px solid rgba(255,255,255,0.1)" }}>
                  <div>
                    <strong style={{ fontSize: "1.15rem", display: "block", color: "#fff" }}>{v.x.followers != null ? <CountUp value={v.x.followers} /> : "—"}</strong>
                    <span style={{ fontSize: "0.58rem", opacity: 0.6 }}>FOLLOWERS</span>
                  </div>
                  <div>
                    <strong style={{ fontSize: "1.15rem", display: "block", color: "#fff" }}>{v.x.posts != null ? <CountUp value={v.x.posts} /> : "—"}</strong>
                    <span style={{ fontSize: "0.58rem", opacity: 0.6 }}>POSTS</span>
                  </div>
                  {xImpressions != null && (
                    <div>
                      <strong style={{ fontSize: "1.15rem", display: "block", color: "#fff" }}><CountUp value={xImpressions} /></strong>
                      <span style={{ fontSize: "0.58rem", opacity: 0.6 }}>IMPRESSIONS</span>
                    </div>
                  )}
                </div>
                {xUrl && (
                  <a href={xUrl} target="_blank" rel="noreferrer" className="pf-mono" style={{ marginTop: 10, display: "flex", alignItems: "center", justifyContent: "center", padding: "8px 14px", borderRadius: 10, background: "rgba(255,255,255,0.08)", fontSize: "0.68rem", fontWeight: 700, textDecoration: "none" }}>
                    View X profile →
                  </a>
                )}
              </div>
            )}

            {/* ── SOCIAL: ZYND MEMORY ── */}
            {showMemory && (
              <div
                style={{ background: "#0f172a", borderRadius: 20, padding: 16, color: "#fff", display: "flex", flexDirection: "column", overflow: "hidden", minWidth: 0 }}
              >
                <div className="pf-mono flex justify-between items-start mb-3" style={{ fontSize: "0.65rem", fontWeight: 700 }}>
                  <span>● ZYND MEMORY</span>
                  <span style={{ color: "#64748b" }}>LIVE</span>
                </div>
                <div style={{ fontSize: "1.1rem", fontWeight: 800, marginBottom: 2 }}>What {firstName}&apos;s working on</div>
                <div style={{ fontSize: "0.75rem", fontWeight: 400, color: "#94a3b8", marginBottom: 12 }}>Synced from coding agents</div>
                <div className="pf-mono flex-1" style={{ display: "flex", flexDirection: "column", gap: 10, fontSize: "0.7rem", overflow: "hidden" }}>
                  {memoryGroups.slice(0, 3).map((g) => (
                    <div key={g.key}>
                      <span style={{ color: "#fbbf24" }}>▼</span>{" "}
                      <span style={{ textTransform: "uppercase", letterSpacing: "0.05em" }}>{g.label}</span><br />
                      <div style={{ display: "flex", flexWrap: "wrap", gap: 4, marginTop: 4 }}>
                        {g.items.slice(0, 3).map((item) => (
                          <span key={item.text} style={{ background: "rgba(255,255,255,0.1)", borderRadius: 6, padding: "2px 6px", fontSize: "0.6rem" }}>
                            {item.text}
                          </span>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
                <div className="pf-mono flex justify-between mt-auto pt-3" style={{ borderTop: "1px solid rgba(255,255,255,0.08)", fontSize: "0.6rem", color: "#64748b" }}>
                  <span>{memoryTotal} KEY POINTS</span>
                  <span>ZYND</span>
                </div>
              </div>
            )}

            {/* ── BOOK A CALL (only when calendlyUrl exists) ── */}
            {calendlyUrl && (
              <div
                className="pf-book-card"
                style={{ background: "linear-gradient(160deg, #2563eb 0%, #1d4ed8 48%, #1e3a8a 100%)", borderRadius: 20, padding: 16, color: "#fff", display: "flex", flexDirection: "column", minWidth: 0 }}
              >
                <div className="pf-mono flex justify-between items-center" style={{ fontSize: "0.65rem", fontWeight: 700, letterSpacing: "0.08em", position: "relative" }}>
                  <span className="flex items-center gap-1.5"><Calendar size={12} /> BOOK A CALL</span>
                  <span style={{ background: "rgba(255,255,255,0.16)", border: "1px solid rgba(255,255,255,0.22)", borderRadius: 99, padding: "3px 8px", fontSize: "0.58rem" }}>OPEN</span>
                </div>

                <div style={{ display: "flex", alignItems: "center", gap: 10, marginTop: 12, position: "relative" }}>
                  <div style={{ width: 40, height: 40, borderRadius: 12, background: "rgba(255,255,255,0.16)", border: "1px solid rgba(255,255,255,0.22)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                    <Calendar size={18} />
                  </div>
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontSize: "1.05rem", fontWeight: 800, lineHeight: 1.2 }}>Meet {firstName}</div>
                    <div style={{ fontSize: "0.7rem", opacity: 0.8, marginTop: 2 }}>20-min intro · collab, projects, ideas</div>
                  </div>
                </div>

                <div style={{ display: "flex", gap: 6, marginTop: 10, position: "relative" }}>
                  <span className="pf-mono" style={{ display: "inline-flex", alignItems: "center", gap: 4, background: "rgba(255,255,255,0.12)", borderRadius: 8, padding: "5px 8px", fontSize: "0.6rem", fontWeight: 700 }}>
                    <Clock size={10} /> 20 MIN
                  </span>
                  <span className="pf-mono" style={{ display: "inline-flex", alignItems: "center", gap: 4, background: "rgba(255,255,255,0.12)", borderRadius: 8, padding: "5px 8px", fontSize: "0.6rem", fontWeight: 700 }}>
                    <Video size={10} /> VIDEO
                  </span>
                  <span className="pf-mono" style={{ background: "rgba(255,255,255,0.12)", borderRadius: 8, padding: "5px 8px", fontSize: "0.6rem", fontWeight: 700 }}>1:1</span>
                </div>

                <div className="pf-mono" style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 4, marginTop: 10, position: "relative" }}>
                  {weekLabels.map((d, i) => (
                    <div
                      key={`${d}-${i}`}
                      style={{
                        textAlign: "center",
                        fontSize: "0.58rem",
                        fontWeight: 700,
                        padding: "7px 0",
                        borderRadius: 8,
                        background: i === todayIdx ? "#fff" : "rgba(255,255,255,0.1)",
                        color: i === todayIdx ? "#1d4ed8" : "rgba(255,255,255,0.85)",
                      }}
                    >
                      {d}
                    </div>
                  ))}
                </div>

                <a
                  href={calendlyUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="pf-book-cta pf-mono"
                  style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, marginTop: 10, padding: "9px 14px", borderRadius: 10, background: "#fff", fontSize: "0.7rem", fontWeight: 800, color: "#1e3a8a", cursor: "pointer", textDecoration: "none", letterSpacing: "0.04em" }}
                >
                  Book intro call
                  <span aria-hidden>→</span>
                </a>
              </div>
            )}

            </div>
            )}

            {/* ── GITHUB: stats + heatmap fill the row; stats stretch if no graph ── */}
            {showGithub && (
              <div
                style={{
                  gridColumn: "span 12",
                  display: "grid",
                  gridTemplateColumns: hasContributions ? "minmax(240px, 4fr) minmax(0, 8fr)" : "1fr",
                  gap: 16,
                }}
              >
                <div className={`${card_} tc`} style={{ minHeight: hasContributions ? undefined : 220 }}>
                  <div>
                    <div className={`${label_} pf-mono`}>
                      <span className="flex items-center gap-1.5"><GithubGlyph size={13} />GITHUB</span>
                      {githubUrl ? (
                        <a href={githubUrl} target="_blank" rel="noreferrer" className="hover:underline">@{githubHandle} ↗</a>
                      ) : (
                        <span>@{githubHandle}</span>
                      )}
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 14 }}>
                      <img
                        src={githubAvatar(githubUrl, 80) ?? `https://github.com/${encodeURIComponent(ghLogin || githubHandle)}.png?size=80`}
                        alt=""
                        style={{ width: 44, height: 44, borderRadius: 12, objectFit: "cover", border: "1px solid #e2e8f0", flexShrink: 0, background: "#f8fafc" }}
                      />
                      <div style={{ minWidth: 0 }}>
                        <div style={{ fontSize: "0.95rem", fontWeight: 800, color: "#0f172a" }}>{identity.name}</div>
                        {ghBio && (
                          <div className="pf-clamp-2" style={{ fontSize: "0.7rem", color: "#64748b", marginTop: 2, lineHeight: 1.4, whiteSpace: "normal" }}>{ghBio}</div>
                        )}
                      </div>
                    </div>
                    <div style={{ display: "grid", gridTemplateColumns: hasContributions ? "1fr 1fr" : "repeat(4, minmax(0, 1fr))", gap: 8, marginBottom: 12 }}>
                      {v.github.repos != null && (
                        <div style={{ background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: 12, padding: "10px 10px", textAlign: "center" }}>
                          <div style={{ fontSize: "1.15rem", fontWeight: 800, color: "#0f172a", lineHeight: 1 }}><CountUp value={v.github.repos} /></div>
                          <div className="pf-mono" style={{ fontSize: "0.55rem", color: "#94a3b8", fontWeight: 700, marginTop: 4 }}>REPOS</div>
                        </div>
                      )}
                      {v.github.activeRepos != null && (
                        <div style={{ background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: 12, padding: "10px 10px", textAlign: "center" }}>
                          <div style={{ fontSize: "1.15rem", fontWeight: 800, color: "#0f172a", lineHeight: 1 }}><CountUp value={v.github.activeRepos} /></div>
                          <div className="pf-mono" style={{ fontSize: "0.55rem", color: "#94a3b8", fontWeight: 700, marginTop: 4 }}>ACTIVE</div>
                        </div>
                      )}
                      {ghContribTotal != null && (
                        <div style={{ background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: 12, padding: "10px 10px", textAlign: "center" }}>
                          <div style={{ fontSize: "1.15rem", fontWeight: 800, color: "#0f172a", lineHeight: 1 }}><CountUp value={ghContribTotal} /></div>
                          <div className="pf-mono" style={{ fontSize: "0.55rem", color: "#94a3b8", fontWeight: 700, marginTop: 4 }}>CONTRIBUTIONS</div>
                        </div>
                      )}
                      {ghFollowers != null && (
                        <div style={{ background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: 12, padding: "10px 10px", textAlign: "center" }}>
                          <div style={{ fontSize: "1.15rem", fontWeight: 800, color: "#0f172a", lineHeight: 1 }}><CountUp value={ghFollowers} /></div>
                          <div className="pf-mono" style={{ fontSize: "0.55rem", color: "#94a3b8", fontWeight: 700, marginTop: 4 }}>FOLLOWERS</div>
                        </div>
                      )}
                      {!hasContributions && ghFollowing != null && (
                        <div style={{ background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: 12, padding: "10px 10px", textAlign: "center" }}>
                          <div style={{ fontSize: "1.15rem", fontWeight: 800, color: "#0f172a", lineHeight: 1 }}><CountUp value={ghFollowing} /></div>
                          <div className="pf-mono" style={{ fontSize: "0.55rem", color: "#94a3b8", fontWeight: 700, marginTop: 4 }}>FOLLOWING</div>
                        </div>
                      )}
                    </div>
                    {v.github.topLanguages.length > 0 && (
                      <div>
                        <div className="pf-mono" style={{ fontSize: "0.55rem", color: "#94a3b8", fontWeight: 700, marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.05em" }}>Languages</div>
                        <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
                          {v.github.topLanguages.slice(0, 6).map((lang) => (
                            <span key={lang} style={{ background: "#f1f5f9", border: "1px solid #e2e8f0", color: "#475569", fontSize: "0.62rem", fontWeight: 700, padding: "3px 8px", borderRadius: 99 }} className="pf-mono">
                              {lang}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {hasContributions && contributions && (
                  <div className={card_}>
                    <div className={`${label_} pf-mono`}>
                      <span>CONTRIBUTION ACTIVITY</span>
                      {contributions.year ? <span>{contributions.year}</span> : null}
                    </div>
                    <ContributionHeatmap
                      levels={contributions.levels}
                      year={contributions.year}
                      total={contributions.total}
                      avgPerDay={contributions.avg_per_day}
                    />
                  </div>
                )}
              </div>
            )}

            {/* ── POSTS & WRITING ── */}
            {v.writing.length > 0 && (
              <div style={{ gridColumn: "span 12", background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: 20, padding: "20px 24px" }}>
                <div className="pf-mono flex justify-between items-center mb-4" style={{ fontSize: "0.65rem" }}>
                  <span style={{ color: "#6b63ff", fontWeight: 700 }}>┌ POSTS &amp; WRITING</span>
                  <span style={{ background: "#e0e7ff", color: "#4f46e5", padding: "3px 10px", borderRadius: 99, fontWeight: 700 }}>
                    {v.writing.length} ARCHIVED ┐
                  </span>
                </div>
                <AutoScroll rowHeight={POST_ROW_H + POST_GAP} gap={0} visible={VSCROLL_VISIBLE} secondsPerRow={VSCROLL_SECS_PER_ROW}>
                  {v.writing.slice(0, 10).map((post, idx) => {
                    const style = POST_STYLES[idx % POST_STYLES.length];
                    const isX = ["x", "twitter"].includes(post.platform.toLowerCase());
                    const url = safeUrl(post.url);
                    return (
                      <div
                        key={`${post.platform}-${idx}`}
                        className={`pf-vrow pf-vrow-post p-3.5 rounded-2xl border ${style.card}`}
                        style={{ marginBottom: POST_GAP }}
                      >
                        <div className="flex items-center justify-between mb-1.5">
                          <div className="flex items-center gap-2">
                            <span className={`px-2 py-0.5 rounded font-mono text-[9px] font-semibold flex items-center gap-1 ${style.badge}`}>
                              {isX ? <XGlyph size={10} /> : <LinkedinGlyph size={10} />}
                              {isX ? "X" : "LinkedIn"}
                            </span>
                            <span className={`font-mono text-[10px] font-medium ${style.meta}`}>{post.posted_at}</span>
                          </div>
                          {url && <a href={url} target="_blank" rel="noreferrer" className={`font-mono text-xs ${style.link}`}>↗</a>}
                        </div>
                        <p className={`pf-post-excerpt ${style.text}`}>
                          &ldquo;{post.excerpt}&rdquo;
                        </p>
                      </div>
                    );
                  })}
                </AutoScroll>
              </div>
            )}

            {/* ── PROJECTS + SKILLS ── */}
            {(v.projects.length > 0 || skills.length > 0) && (
              <div style={{ gridColumn: "span 12", display: "grid", gridTemplateColumns: v.projects.length > 0 && skills.length > 0 ? "1fr 1fr" : "1fr", gap: 16, alignItems: "stretch" }}>

                  {v.projects.length > 0 && (
                    <div style={{ background: "#0f172a", borderRadius: 20, padding: 20, color: "#fff", display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
                      <div>
                        <div className="pf-mono flex justify-between items-center mb-4" style={{ fontSize: "0.65rem", color: "#94a3b8", fontWeight: 700 }}>
                          <span>┌ LIVE IN PRODUCTION</span>
                          <span style={{ background: "rgba(99,102,241,0.25)", color: "#c7d2fe", padding: "3px 10px", borderRadius: 99 }}>{v.projects.length} HIGHLIGHTS ┐</span>
                        </div>
                        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                          {v.projects.slice(0, 4).map((proj) => {
                            const url = safeUrl(proj.url);
                            const desc = (proj.description || "").trim();
                            return (
                              <div key={proj.name} style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 14, padding: "12px 14px" }}>
                                <div style={{ display: "flex", alignItems: "flex-start", gap: 12 }}>
                                  <div style={{ width: 40, height: 40, background: "rgba(255,255,255,0.08)", borderRadius: 12, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                                    {proj.tech[0] ? <SkillBrandIcon name={proj.tech[0]} size={26} /> : <GithubGlyph size={18} />}
                                  </div>
                                  <div style={{ minWidth: 0, flex: 1 }}>
                                    {url ? (
                                      <a href={url} target="_blank" rel="noreferrer" style={{ color: "#fff", fontWeight: 800, fontSize: "0.9rem" }} className="hover:underline">
                                        {proj.name}
                                      </a>
                                    ) : (
                                      <div style={{ color: "#fff", fontWeight: 800, fontSize: "0.9rem" }}>{proj.name}</div>
                                    )}
                                    {desc && (
                                      <p className="pf-clamp-2" style={{ margin: "4px 0 0", fontSize: "0.72rem", color: "#94a3b8", lineHeight: 1.45, fontWeight: 500 }}>{desc}</p>
                                    )}
                                    <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 6, marginTop: 8 }}>
                                      {proj.tech.slice(0, 4).map((t) => (
                                        <span key={t} style={{ display: "inline-flex", alignItems: "center", gap: 5, background: "rgba(255,255,255,0.08)", color: "#e2e8f0", fontSize: "0.62rem", padding: "3px 8px", borderRadius: 99, fontWeight: 700 }}>
                                          <SkillBrandIcon name={t} size={14} />
                                          {t}
                                        </span>
                                      ))}
                                      {proj.stars != null && proj.stars > 0 && (
                                        <span className="pf-mono" style={{ color: "#fdba74", fontSize: "0.62rem", fontWeight: 800 }}>★ {compact(proj.stars)}</span>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                      {githubUrl && (
                        <a href={githubUrl} target="_blank" rel="noreferrer" className="pf-mono" style={{ display: "inline-block", marginTop: 14, fontSize: "0.68rem", fontWeight: 700, color: "#a5b4fc" }}>
                          View GitHub ↗
                        </a>
                      )}
                    </div>
                  )}

                  {skills.length > 0 && (
                    <div style={{ background: "#eef2ff", border: "1px solid #c7d2fe", borderRadius: 20, padding: 20, display: "flex", flexDirection: "column" }}>
                      <div className="pf-mono flex justify-between items-center mb-4" style={{ fontSize: "0.65rem", fontWeight: 700, color: "#3730a3" }}>
                        <span>┌ SKILL MATRIX</span>
                        <span style={{ background: "#fff", color: "#4f46e5", padding: "3px 10px", borderRadius: 99 }}>{skills.length} TRACKED ┐</span>
                      </div>
                      <SkillMatrix skills={skills} embedded />
                    </div>
                  )}
              </div>
            )}

            {/* ── EXPLORE FOOTER ── */}
            <div style={{ gridColumn: "span 12", position: "relative", overflow: "hidden", background: "linear-gradient(120deg, #1e1b4b 0%, #312e81 45%, #4f46e5 100%)", borderRadius: 20, padding: "28px 32px", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 24, flexWrap: "wrap" }}>
              <div style={{ position: "absolute", right: -40, top: -50, width: 180, height: 180, borderRadius: "50%", background: "rgba(255,255,255,0.08)", pointerEvents: "none" }} />
              <div style={{ position: "relative", display: "flex", gap: 16, alignItems: "center", minWidth: 0 }}>
                <div style={{ width: 48, height: 48, background: "rgba(255,255,255,0.12)", border: "1px solid rgba(255,255,255,0.2)", borderRadius: 14, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, color: "#fff" }}>
                  <Search size={20} />
                </div>
                <div style={{ minWidth: 0 }}>
                  <div className="pf-mono mb-1" style={{ fontSize: "0.62rem", color: "#c7d2fe", fontWeight: 700, letterSpacing: "0.08em" }}>ZYND DIRECTORY</div>
                  <h3 style={{ fontSize: "1.25rem", color: "#fff", fontWeight: 800, margin: 0, lineHeight: 1.25 }}>
                    Find people who share {firstName}&apos;s stack
                  </h3>
                  {skills.length > 0 && (
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 10 }}>
                      {skills.slice(0, 4).map((s) => (
                        <Link
                          key={s.name}
                          href={`/search?skills=${encodeURIComponent(s.name)}`}
                          className="pf-mono"
                          style={{ fontSize: "0.62rem", fontWeight: 700, color: "#e0e7ff", background: "rgba(255,255,255,0.12)", border: "1px solid rgba(255,255,255,0.18)", borderRadius: 99, padding: "3px 10px", textDecoration: "none" }}
                        >
                          {s.name}
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              </div>
              <Link
                href={skills.length > 0 ? `/search?skills=${skills.slice(0, 3).map((s) => encodeURIComponent(s.name)).join(",")}` : "/directory"}
                style={{ position: "relative", padding: "12px 22px", borderRadius: 99, border: "none", background: "#fff", fontWeight: 800, fontSize: "0.78rem", color: "#312e81", cursor: "pointer", textDecoration: "none", whiteSpace: "nowrap", display: "inline-flex", alignItems: "center", gap: 8, flexShrink: 0 }}
              >
                <Search size={14} /> Find similar profiles
              </Link>
            </div>

          </div>{/* end grid */}

          {/* ── FOOTER ── */}
          <footer className="mt-10 pt-6 border-t border-gray-200 flex flex-wrap items-center justify-between gap-4 pf-mono" style={{ fontSize: "0.65rem", color: "#94a3b8" }}>
            <div className="flex items-center gap-2">
              <span style={{ fontWeight: 700, color: "#0f172a" }}>ZYND.AI</span>
              <span>•</span>
              <span>Algorithmic Dossier &amp; Synthesis Protocol</span>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-gray-50 border border-gray-200">
                <span style={{ color: "#0f172a", fontWeight: 600 }}>{permalink}</span>
                <CopyPermalinkIcon url={`https://${permalink}`} />
              </div>
              <Link href="/directory" className="hover:text-slate-800">DIRECTORY</Link>
              <Link href={`/p/${card.handle ?? card.id}/agent`} className="hover:text-slate-800">AGENT_API</Link>
              <Link href="/create" className="hover:text-slate-800">CREATE</Link>
            </div>
          </footer>

        </div>
      </div>

      <ProfileChatWidget handle={card.handle ?? card.id} personName={identity.name} />
    </>
  );
}
