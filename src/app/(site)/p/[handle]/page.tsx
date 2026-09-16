import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { BadgeCheck, Calendar, Globe, Search, Sparkles } from "lucide-react";

import {
  fetchCardByHandle,
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

/* The cards API returns an 80x80 avatar (imgproxy `rs:fill:80:80`, baked into a
   signed path, so it cannot be re-requested any larger) which visibly upscales
   in the hero circle. GitHub renders the same face at any size, so a linked
   GitHub *profile* — not a repo URL — gives us a crisp source for free. */
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

// Green palette to match GitHub's real contribution heatmap


const VSCROLL_VISIBLE = 3;
const VSCROLL_SECS_PER_ROW = 3.5;
const POST_ROW_H = 104;
const POST_GAP = 12;
const SOCIAL_CARD_H = 360;
const SOCIAL_POST_ROW_H = 84;
const SOCIAL_POST_VISIBLE = 1;

const POST_STYLES = [
  { card: "bg-[#0B0B0B] text-white border-slate-800 hover:border-slate-700", badge: "bg-white/10 text-white", text: "text-slate-200", meta: "text-slate-400", link: "pf-post-link-0" },
  { card: "bg-[#0A66C2]/10 border-[#0A66C2]/30 hover:border-[#0A66C2]/50", badge: "bg-[#0A66C2] text-white", text: "text-[#1a2b42]", meta: "text-[#0A66C2]/80", link: "pf-post-link-1" },
  { card: "bg-[#F7F7F4] border-[#E8E8E1] hover:border-[#D5D5CE]", badge: "bg-[#0B0B0B] text-white", text: "text-[#2A2A2A]", meta: "text-[#8E8E88]", link: "pf-post-link-2" },
];

const OBSESSION_CARDS: {
  key: "connect_with" | "love_talking_about" | "working_on";
  label: string;
  card: string;
  chip: string;
  unit: string;
}[] = [
  { key: "love_talking_about", label: "Love Talking About", unit: "TOPICS", card: "bg-[#a7f3d0] text-[#064e3b]", chip: "bg-white/60 text-[#064e3b] border border-white/50" },
  { key: "working_on", label: "Working On", unit: "TRACKS", card: "bg-[#fde68a] text-[#78350f]", chip: "bg-white/60 text-[#78350f] border border-white/50" },
  { key: "connect_with", label: "Connect With", unit: "PEOPLE", card: "bg-[#7B72E9] text-white", chip: "bg-white/15 text-white border border-white/25" },
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
  github: "GitHub",
  x: "X",
  twitter: "X",
  linkedin: "LinkedIn",
  website: "Website",
  portfolio: "Portfolio",
  linktree: "Linktree",
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
  "linear-gradient(135deg, #3B82F6, #1D4ED8)", // blue
  "linear-gradient(135deg, #10B981, #047857)", // emerald
  "linear-gradient(135deg, #8B5CF6, #6D28D9)", // purple
  "linear-gradient(135deg, #EC4899, #BE185D)", // pink
  "linear-gradient(135deg, #F59E0B, #B45309)", // amber
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
    .map((s) => ({ ...s, metrics: s.metrics ?? [] }))
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

  // Fallbacks so there is always at least one scrollable item per card.
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
    .split(/\s+/)
    .map((p) => p[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();

  const nameParts = (identity.name || "").trim().split(/\s+/);
  const nameLines = nameParts.length > 1 ? [nameParts.slice(0, -1).join(" "), nameParts[nameParts.length - 1]] : nameParts;

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
  const xUrl = safeUrl(identity.links?.x);
  const calendlyUrl = safeUrl(card.calendly_url);

  const memoryFacts = (card.zynd_memory ?? []) as Array<Record<string, unknown>>;

  // Predicate → human language. The memory layer stores facts as
  // {predicate, object, source, confidence, approved_at} — the predicate is
  // the meaning, the object is the value.
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
        // Activity groups: newest first. Expertise: highest confidence first.
        const sorted = p === "has_expertise_in"
          ? [...items].sort((a, b) => b.confidence - a.confidence)
          : [...items].sort((a, b) => b.approved_at.localeCompare(a.approved_at));
        return { key: p, label: meta.label, icon: meta.icon, items: sorted };
      });
  })();
  const memoryVisible = memoryGroups.reduce((n, g) => n + Math.min(g.items.length, 4), 0);
  const memoryTotal = memoryGroups.reduce((n, g) => n + g.items.length, 0);
  const firstName = identity.name?.split(" ")[0] || "They";

  // Only show Edit button to the profile's owner — never to other viewers.
  let isOwner = false;
  try {
    const supabase = await createClient();
    const { data: { session } } = await supabase.auth.getSession();
    if (session?.access_token) {
      const myCard = await getMyCard(session.access_token);
      isOwner = !!(myCard && myCard.handle === handle);
    }
  } catch {
    // Auth check is best-effort; failing silently is safe since we just hide the button
  }

  const showLinkedin = !!(linkedinHandle || v.linkedin.connections != null);
  const showX = !!(v.x.handle || v.x.followers != null);
  const showGithub = !!(identity.links?.github || card.github_stats || card.contribution_stats);

  return (
    <>
      <link rel="canonical" href={canonical} />
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      {/* eslint-disable-next-line @next/next/no-page-custom-font */}
      <link
        href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;600;700&family=Geist:wght@300;400;500;600;700&family=Geist+Mono:wght@400;500;600;700&display=swap"
        rel="stylesheet"
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(buildJsonLd(card)).replace(/</g, "\\u003c") }}
      />

      <style>{`
        .pf-bento { letter-spacing: normal; line-height: 1.5; }
        .pf-bento h2 {
          font-family: 'Space Grotesk', sans-serif !important;
          text-transform: none !important;
          letter-spacing: normal !important;
        }
        .pf-bento.font-sans, .pf-bento .font-sans { font-family: 'Geist', sans-serif !important; }
        .pf-bento .font-mono { font-family: 'Geist Mono', monospace !important; }
        .pf-bento .font-display { font-family: 'Space Grotesk', sans-serif !important; }

        /* globals.css unlayered a { color } beats Tailwind — fix with same-tier selector */
        .pf-bento a { color: inherit; text-decoration: none; }
        .pf-bento a:hover { text-decoration: underline; }
        .pf-bento .pf-c-dark { color: #0B0B0B; }
        .pf-bento .pf-c-muted { color: #8E8E88; }
        .pf-bento .pf-c-slate { color: #94a3b8; }
        .pf-bento .pf-hv-dark:hover { color: #0B0B0B; }
        .pf-bento .pf-hv-purple:hover { color: #7B72E9; }
        .pf-bento .pf-hv-white:hover { color: #fff; }
        .pf-bento .pf-post-link-0 { color: #94a3b8; }
        .pf-bento .pf-post-link-0:hover { color: #fff; }
        .pf-bento .pf-post-link-1 { color: #0A66C2; }
        .pf-bento .pf-post-link-1:hover { color: #000; }
        .pf-bento .pf-post-link-2 { color: #8E8E88; }
        .pf-bento .pf-post-link-2:hover { color: #0B0B0B; }

        .pf-bento.zd-canvas, .pf-bento .zd-canvas {
          background-color: #f4f4f5;
          background-attachment: fixed;
        }

        /* tech-corners: bracket decoration (top-left + top-right) */
        .pf-bento .tc { position: relative; }
        .pf-bento .tc::before {
          content: ''; position: absolute;
          top: 12px; left: 12px; width: 8px; height: 8px;
          border-top: 1px solid #d4d4d8; border-left: 1px solid #d4d4d8;
        }
        .pf-bento .tc::after {
          content: ''; position: absolute;
          top: 12px; right: 12px; width: 8px; height: 8px;
          border-top: 1px solid #d4d4d8; border-right: 1px solid #d4d4d8;
        }
        /* tc-b: bottom corners */
        .pf-bento .tc-b::before {
          content: ''; position: absolute;
          bottom: 12px; left: 12px; width: 8px; height: 8px;
          border-bottom: 1px solid #d4d4d8; border-left: 1px solid #d4d4d8;
        }
        .pf-bento .tc-b::after {
          content: ''; position: absolute;
          bottom: 12px; right: 12px; width: 8px; height: 8px;
          border-bottom: 1px solid #d4d4d8; border-right: 1px solid #d4d4d8;
        }


        /* AutoScroll vertical marquee */
        .pf-vscroll { overflow: hidden; position: relative; }
        .pf-vrow { display: flex; flex-direction: column; justify-content: center; flex-shrink: 0; }
        .pf-vrow-proj { height: 92px; }
        .pf-vrow-post { height: 104px; }
        .pf-clamp-1 { overflow: hidden; display: -webkit-box; -webkit-box-orient: vertical; -webkit-line-clamp: 1; }
        .pf-clamp-2 { overflow: hidden; display: -webkit-box; -webkit-box-orient: vertical; -webkit-line-clamp: 2; }
        @media (prefers-reduced-motion: reduce) { .pf-vscroll { overflow-y: auto; } }

        /* legacy bento-corner for SkillMatrix component */
        .pf-bento .bento-corner { position: relative; }
        .pf-bento .bento-corner::after {
          content: ''; position: absolute; top: 14px; right: 14px;
          width: 14px; height: 14px; border-top: 2px solid currentColor; border-right: 2px solid currentColor;
          opacity: 0.35; pointer-events: none;
        }
        .pf-bento .bento-corner-light::after { border-color: #ffffff; opacity: 0.45; }
        .pf-bento .bento-corner-dark::after { border-color: #0B0B0B; opacity: 0.35; }

        /* pf-edit-btn for EditCardButton */
        .pf-bento .pf-edit-btn {
          display: inline-flex; align-items: center; gap: 6px;
          padding: 6px 14px; border-radius: 999px;
          background: #f4f4f5; border: 1px solid #E5E5DE;
          font-family: 'Geist Mono', monospace; font-size: 11px; font-weight: 600;
          color: #0B0B0B; cursor: pointer; transition: background 0.15s, color 0.15s;
        }
        .pf-bento .pf-edit-btn:hover { background: #0B0B0B; color: #fff; text-decoration: none; }
      `}</style>

      <div className="pf-bento zd-canvas font-sans antialiased w-full min-h-screen flex flex-col selection:bg-[#7B72E9] selection:text-white px-4 sm:px-10 md:px-16 lg:px-24 xl:px-32">
        <main className="w-full max-w-[1440px] mx-auto py-8 sm:py-12 flex-1">

          {/* ── TOP HEADER ─────────────────────────────────────────────── */}
          <header className="flex flex-col sm:flex-row justify-between items-center mb-8 gap-3 font-mono">
            <div className="flex items-center gap-2 text-[12px] text-[#8E8E88]">
              <span className="w-2 h-2 rounded-full bg-[#7B72E9] inline-block flex-shrink-0" />
              <Link href="/directory" className="pf-c-muted pf-hv-dark">Zynd</Link>
              <span>/</span>
              <Link href="/directory" className="pf-c-muted pf-hv-dark">Directory</Link>
              <span>/</span>
              <span className="font-semibold text-[#0B0B0B]">@{card.handle || card.id}</span>
            </div>
            <div className="flex items-center gap-2 flex-wrap justify-end">
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-[11px] font-semibold text-emerald-700">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 flex-shrink-0" />
                SYNTHESIS_ACTIVE
              </span>
              <ShareQrGroup url={canonical} />
              {isOwner && <EditCardButton handle={card.handle || handle} />}
              {!isOwner && <UnclaimedCardActions handle={card.handle || handle} />}
            </div>
          </header>

          {/* ── MAIN BENTO GRID ────────────────────────────────────────── */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-4 lg:gap-6 auto-rows-min">

            {/* ─ ROW 1: HERO ─────────────────────────────────────────── */}

            {/* Purple Hero Card — col-4 */}
            <div className="col-span-12 lg:col-span-4 bg-[#7B72E9] text-white rounded-[32px] p-8 flex flex-col justify-between shadow-sm relative overflow-hidden">
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
                {(card.working_on.length > 0 || card.love_talking_about.length > 0) && (
                  <div className="mt-4 space-y-1.5 font-mono text-[11px] uppercase tracking-wide">
                    {card.working_on.length > 0 && (
                      <div className="flex items-center gap-2">
                        <span className="text-white/50 w-24 flex-shrink-0">Building</span>
                        <span className="bg-black/15 px-2 py-0.5 rounded border border-white/10 text-white text-[10px] truncate">{card.working_on[0]}</span>
                      </div>
                    )}
                    {card.love_talking_about.length > 0 && (
                      <div className="flex items-center gap-2">
                        <span className="text-white/50 w-24 flex-shrink-0">Talks About</span>
                        <span className="bg-black/15 px-2 py-0.5 rounded border border-white/10 text-white text-[10px] truncate">{card.love_talking_about[0]}</span>
                      </div>
                    )}
                  </div>
                )}
                {v.links.length > 0 && (
                  <div className="mt-4 flex flex-wrap gap-2">
                    {v.links.map(([platform, url]) => (
                      <a
                        key={platform}
                        href={url}
                        target="_blank"
                        rel="noreferrer"
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
                ) : null}
              </div>
              <div className="absolute -right-20 -bottom-20 w-80 h-80 bg-white/10 rounded-full blur-3xl pointer-events-none" />
            </div>

            {/* Right column — col-8 */}
            <div className="col-span-12 lg:col-span-8 flex flex-col gap-4 lg:gap-6 overflow-hidden">
              {/* Dossier Summary */}
              <div className="bg-white rounded-[32px] p-6 sm:p-8 shadow-sm border border-gray-100 tc flex-1 flex flex-col justify-between">
                <div>
                  <div className="flex justify-between items-center mb-4 text-xs font-mono uppercase tracking-widest text-[#8E8E88]">
                    <span>Dossier Summary</span>
                    {verified && <span className="text-[#0B0B0B] font-bold">Zynd Verified</span>}
                  </div>
                  {!isBlank(card.summary) ? (
                    <p className="text-[#2A2A2A] text-[15px] leading-relaxed">{card.summary}</p>
                  ) : !isBlank(card.citation_snippet) ? (
                    <p className="text-[#2A2A2A] text-[15px] leading-relaxed">{card.citation_snippet}</p>
                  ) : (
                    <p className="text-[#8E8E88] text-[14px]">Profile summary not yet synthesized.</p>
                  )}
                </div>
                {(card.industries.length > 0 || !isBlank(card.availability)) && (
                  <div className="mt-auto pt-4 border-t border-gray-100 flex flex-wrap gap-1.5 font-mono text-[11px]">
                    {card.industries.map((tag) => (
                      <span key={tag} className="px-2.5 py-1 rounded-md bg-gray-100 text-[#0B0B0B] font-medium">{tag}</span>
                    ))}
                    {!isBlank(card.availability) && (
                      <span className="px-2.5 py-1 rounded-md bg-[#7B72E9]/10 text-[#7B72E9] font-semibold">Open to {card.availability}</span>
                    )}
                  </div>
                )}
              </div>

              {/* Obsession tiles */}
              {obsessions.length > 0 && (
                <div
                  className="grid gap-4 auto-rows-fr"
                  style={{ gridTemplateColumns: `repeat(${Math.min(obsessions.length, 3)}, minmax(0, 1fr))` }}
                >
                  {obsessions.map((tile) => (
                    <div
                      key={tile.key}
                      className={`rounded-[28px] p-5 tc shadow-sm flex flex-col h-[140px] overflow-hidden ${tile.card}`}
                    >
                      <div className="flex-shrink-0 text-[10px] font-mono uppercase tracking-widest opacity-60 mb-3">
                        {tile.label} ({tile.items.length} {tile.unit})
                      </div>
                      <div
                        className="flex-1 flex flex-wrap content-start gap-1.5 overflow-y-auto pr-1"
                        style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
                      >
                        {tile.items.map((item) => (
                          <span
                            key={item}
                            className={`px-2.5 py-1 rounded-full text-[12px] font-medium ${tile.chip}`}
                          >
                            {item}
                          </span>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* ─ ROW 2: MEMORY + WORK EXPERIENCE ────────────────────── */}

            {/* Memory / MCP Sync OR Professional Snapshot */}
            {memoryGroups.length > 0 ? (
              <div className="col-span-12 lg:col-span-6 bg-slate-900 text-white rounded-[32px] p-8 shadow-sm flex flex-col">
                <div className="flex justify-between items-center mb-6">
                  <span className="text-xs font-mono uppercase tracking-widest text-purple-400 flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-purple-400 animate-pulse" />
                    Zynd Memory · Live
                  </span>
                  <span className="text-[10px] font-mono bg-slate-800 px-2.5 py-1 rounded-md text-slate-400">Synced from agents</span>
                </div>
                <h3 className="text-xl font-bold text-white mb-2 leading-snug">What {firstName}&apos;s working on</h3>
                <p className="text-slate-300 text-sm leading-relaxed mb-6">
                  Live context from {firstName}&apos;s Zynd memory — extracted from their coding agents and chats, not a résumé.
                </p>
                <div className="space-y-5 flex-1">
                  {memoryGroups.map((g) => (
                    <div key={g.key}>
                      <div className="text-[11px] font-mono uppercase tracking-widest text-slate-400 mb-2">
                        {g.icon} {g.label}
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        {g.items.slice(0, 4).map((item, i) => (
                          <span key={i} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-800/80 border border-slate-700/60 text-[13px] text-slate-200">
                            {item.text}
                            {item.inferred && (
                              <span className="text-[9px] font-mono uppercase tracking-wide text-purple-300/80 bg-slate-900/60 px-1.5 py-0.5 rounded" title="Noticed by AI from their activity">
                                AI
                              </span>
                            )}
                          </span>
                        ))}
                        {g.items.length > 4 && (
                          <span className="px-3 py-1.5 rounded-full text-[13px] text-slate-400">+{g.items.length - 4}</span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
                {memoryTotal > memoryVisible && (
                  <p className="text-[11px] text-slate-500 font-mono mt-5">
                    +{memoryTotal - memoryVisible} more · synced from the Zynd memory layer
                  </p>
                )}
                {isOwner && (
                  <a href="/dashboard/findable" className="text-[12px] text-purple-400 hover:text-purple-300 mt-2 font-medium">
                    Keep it fresh — approve new key points →
                  </a>
                )}
              </div>
            ) : (
              /* AI Discoverability Fact — shown when no MCP memory is connected */
              <div className="col-span-12 lg:col-span-6 bg-[#0f1729] text-white rounded-[32px] p-8 shadow-sm flex flex-col gap-6">
                {/* Header */}
                <div className="flex justify-between items-center">
                  <span className="font-mono text-xs font-bold uppercase tracking-widest text-white">AI Discoverability Fact</span>
                  <span className="font-mono text-[10px] bg-white/10 border border-white/15 px-2.5 py-1 rounded-md text-white/70">Zynd Index</span>
                </div>

                {/* Code block */}
                <div className="bg-[#060d1f] rounded-2xl p-5 font-mono text-[12.5px] leading-[1.9] border border-white/5 flex-1">
                  <div className="text-[#4b5563]">{"// Structured discovery profile"}</div>
                  <div>
                    <span className="text-[#67e8f9]">entity</span>
                    <span className="text-white/40">{": "}</span>
                    <span className="text-[#86efac]">&ldquo;{!isBlank(identity.name) ? identity.name : "Professional"}&rdquo;</span>
                  </div>
                  {(card.industries.length > 0 || !isBlank(identity.headline)) && (
                    <div>
                      <span className="text-[#67e8f9]">specialization</span>
                      <span className="text-white/40">{": "}</span>
                      <span className="text-[#86efac]">
                        &ldquo;{card.industries.length > 0 ? card.industries.slice(0, 2).join(" & ") : identity.headline}&rdquo;
                      </span>
                    </div>
                  )}
                  {skills.length > 0 && (
                    <div>
                      <span className="text-[#67e8f9]">primary_tech</span>
                      <span className="text-white/40">{": ["}</span>
                      {skills.slice(0, 3).map((s, i) => (
                        <span key={s.name}>
                          <span className="text-[#fcd34d]">&ldquo;{s.name}&rdquo;</span>
                          {i < Math.min(skills.length, 3) - 1 && <span className="text-white/40">, </span>}
                        </span>
                      ))}
                      <span className="text-white/40">{"]"}</span>
                    </div>
                  )}
                  {!isBlank(card.availability) && (
                    <div>
                      <span className="text-[#67e8f9]">availability</span>
                      <span className="text-white/40">{": "}</span>
                      <span className="text-[#86efac]">&ldquo;{card.availability}&rdquo;</span>
                    </div>
                  )}
                </div>

                {/* Footer */}
                <p className="text-[12px] text-white/50 leading-relaxed">
                  Structured for AI agents (ChatGPT, Claude, Perplexity) to discover and recommend{" "}
                  {!isBlank(identity.name) ? identity.name.split(" ")[0] : "this person"} for specialized queries.
                </p>
              </div>
            )}

            {/* Work Experience */}
            <div className="col-span-12 lg:col-span-6 bg-white rounded-[32px] p-6 sm:p-8 shadow-sm border border-gray-100 tc flex flex-col">
              <div className="flex justify-between items-center mb-5 text-xs font-mono uppercase tracking-widest text-[#8E8E88]">
                <span>Work Experience</span>
                {card.experience_years != null && (
                  <span className="text-[#7B72E9] font-bold bg-[#7B72E9]/10 px-2 py-0.5 rounded-md">
                    {card.experience_years}Y Exp
                  </span>
                )}
              </div>

              {(card.work_experience ?? []).length > 0 ? (
                <div className="flex-1 space-y-0 divide-y divide-gray-100 overflow-y-auto max-h-[400px] pr-1">
                  {(card.work_experience ?? [])
                    .slice()
                    .sort((a, b) => {
                      // Current roles (end_date === "Present") always first
                      const aPresent = (a.end_date ?? "").toLowerCase() === "present";
                      const bPresent = (b.end_date ?? "").toLowerCase() === "present";
                      if (aPresent !== bPresent) return aPresent ? -1 : 1;
                      // Then newest start_date first
                      const aStart = a.start_date ?? "";
                      const bStart = b.start_date ?? "";
                      return bStart.localeCompare(aStart);
                    })
                    .slice(0, 8).map((job, i) => (
                    <div key={i} className="flex gap-3.5 py-4 first:pt-0">
                      {/* Company initial avatar */}
                      <div className="shrink-0 w-9 h-9 rounded-xl bg-slate-100 border border-slate-200/60 flex items-center justify-center overflow-hidden">
                        {job.company_logo ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={job.company_logo} alt="" className="w-full h-full object-cover" />
                        ) : (
                          <span className="text-[11px] font-bold text-slate-500 select-none">
                            {(job.company || job.title || "?").charAt(0).toUpperCase()}
                          </span>
                        )}
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <div className="font-semibold text-[#0B0B0B] text-[13.5px] leading-snug">
                            {job.title}
                          </div>
                          {(job.end_date ?? "").toLowerCase() === "present" && (
                            <span className="shrink-0 inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-bold font-mono bg-emerald-50 text-emerald-600 border border-emerald-200/60 uppercase tracking-wide">
                              <span className="w-1 h-1 rounded-full bg-emerald-500 inline-block" />
                              Now
                            </span>
                          )}
                        </div>
                        <div className="text-[12px] text-slate-700 font-medium mt-0.5">
                          {job.company}
                          {job.employment_type && (
                            <span className="text-slate-400 font-normal"> · {job.employment_type}</span>
                          )}
                        </div>
                        <div className="text-[11px] font-mono text-[#8E8E88] mt-0.5">
                          {[job.start_date, job.end_date].filter(Boolean).join(" – ")}
                          {job.duration && <span> · {job.duration}</span>}
                        </div>
                        {!isBlank(job.location ?? "") && (
                          <div className="text-[11px] text-slate-400 mt-0.5">{job.location}</div>
                        )}
                        {!isBlank(job.description ?? "") && (
                          <p className="text-[11.5px] text-slate-500 leading-relaxed mt-1.5 line-clamp-2">
                            {job.description}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                /* Fallback when no structured experience data yet */
                <div className="flex-1 flex flex-col justify-between">
                  <div className="relative border-l-2 border-[#7B72E9] pl-5 ml-1 space-y-1">
                    <div className="absolute -left-[6px] top-1 w-2.5 h-2.5 rounded-full bg-[#7B72E9] ring-4 ring-[#7B72E9]/20" />
                    <h4 className="font-bold text-[#0B0B0B] text-base leading-snug">
                      {!isBlank(identity.headline) ? identity.headline : "Professional"}
                    </h4>
                    {!isBlank(card.affiliations) && (
                      <p className="text-sm font-semibold text-slate-600 mt-1">{card.affiliations}</p>
                    )}
                    {!isBlank(identity.location) && (
                      <p className="text-xs text-[#8E8E88] font-mono mt-0.5 uppercase tracking-wider">{identity.location}</p>
                    )}
                  </div>
                  {card.industries.length > 0 && (
                    <div className="mt-4 flex flex-wrap gap-1.5">
                      {card.industries.map((tag) => (
                        <span key={tag} className="px-2.5 py-1 rounded-lg bg-slate-50 border border-slate-200/60 text-[#0B0B0B] text-xs font-semibold">
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}
                  <p className="mt-4 text-xs text-slate-400 font-mono">LinkedIn not yet synced — experience will appear here after connecting.</p>
                </div>
              )}
            </div>

            {/* ─ ROW 3: SOCIAL STATS ─────────────────────────────────── */}

            {/* LinkedIn */}
            {showLinkedin && (
              <div
                className="col-span-12 md:col-span-6 lg:col-span-4 self-start bg-[#0A66C2] text-white rounded-[32px] p-5 shadow-sm flex flex-col overflow-hidden"
                style={{ height: SOCIAL_CARD_H }}
              >
                <div className="flex-shrink-0 flex justify-between items-start mb-3 text-xs font-mono">
                  <span className="flex items-center gap-1.5 font-bold" style={{ color: "white" }}>
                    <LinkedinGlyph size={14} />
                    LINKEDIN
                  </span>
                  {linkedinUrl ? (
                    <a href={linkedinUrl} target="_blank" rel="noreferrer" className="text-white/70 hover:text-white">
                      {linkedinHandle ? `in/${linkedinHandle}` : "Profile"} ↗
                    </a>
                  ) : linkedinHandle ? (
                    <span className="text-white/70">in/{linkedinHandle}</span>
                  ) : null}
                </div>
                <div className="flex-shrink-0 mb-3">
                  <h4 className="text-lg font-bold">{identity.name}</h4>
                  {!isBlank(identity.headline) && (
                    <p className="text-xs text-white/80 mt-0.5 line-clamp-1">{identity.headline}</p>
                  )}
                </div>
                <div className="flex-1 min-h-0 -mx-1 px-1">
                  {v.linkedinScrollItems.length > 0 ? (
                    <AutoScroll rowHeight={SOCIAL_POST_ROW_H} visible={SOCIAL_POST_VISIBLE} secondsPerRow={VSCROLL_SECS_PER_ROW}>
                      {v.linkedinScrollItems.map((text, i) => (
                        <div key={i} className="pf-vrow flex flex-col justify-center" style={{ height: SOCIAL_POST_ROW_H }}>
                          <p className="text-white/90 text-[13px] leading-snug line-clamp-4 italic">
                            &ldquo;{text}&rdquo;
                          </p>
                          {i === 0 && (
                            <span className="mt-2 text-[9px] font-mono uppercase tracking-wider text-white/50">Latest post</span>
                          )}
                        </div>
                      ))}
                    </AutoScroll>
                  ) : (
                    <p className="text-white/70 text-[13px] italic leading-snug">
                      No LinkedIn posts synced yet.
                    </p>
                  )}
                </div>
                {v.linkedin.connections != null && (
                  <div className="flex-shrink-0 grid grid-cols-2 gap-3 text-center border-t border-white/20 pt-3 mt-3 font-mono">
                    <div>
                      <div className="text-xl font-bold"><CountUp value={v.linkedin.connections} /></div>
                      <div className="text-[10px] text-white/70 uppercase">Connections</div>
                    </div>
                    {v.linkedin.posts != null && Number(v.linkedin.posts) > 0 && (
                      <div>
                        <div className="text-xl font-bold"><CountUp value={v.linkedin.posts} /></div>
                        <div className="text-[10px] text-white/70 uppercase">Posts Shared</div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* X / Twitter */}
            {showX && (
              <div
                className="col-span-12 md:col-span-6 lg:col-span-4 self-start bg-[#0f1419] text-white rounded-[32px] p-5 shadow-sm flex flex-col overflow-hidden"
                style={{ height: SOCIAL_CARD_H }}
              >
                <div className="flex-shrink-0 flex justify-between items-start mb-3 text-xs font-mono">
                  <span className="flex items-center gap-1.5 font-bold" style={{ color: "white" }}>
                    <XGlyph size={13} />
                    X / TWITTER
                  </span>
                  {xUrl ? (
                    <a href={xUrl} target="_blank" rel="noreferrer" className="text-white/70 hover:text-white">
                      {v.x.handle ?? "Profile"} ↗
                    </a>
                  ) : v.x.handle ? (
                    <span className="text-white/70">{v.x.handle}</span>
                  ) : null}
                </div>
                <div className="flex-shrink-0 mb-3">
                  <h4 className="text-lg font-bold">{identity.name}</h4>
                  {!isBlank(identity.headline) && (
                    <p className="text-xs text-white/80 mt-0.5 line-clamp-1">{identity.headline}</p>
                  )}
                </div>
                <div className="flex-1 min-h-0 -mx-1 px-1">
                  {v.xScrollItems.length > 0 ? (
                    <AutoScroll rowHeight={SOCIAL_POST_ROW_H} visible={SOCIAL_POST_VISIBLE} secondsPerRow={VSCROLL_SECS_PER_ROW}>
                      {v.xScrollItems.map((text, i) => (
                        <div key={i} className="pf-vrow flex flex-col justify-center" style={{ height: SOCIAL_POST_ROW_H }}>
                          <p className="text-white/90 text-[13px] leading-snug line-clamp-4 italic">
                            &ldquo;{text}&rdquo;
                          </p>
                          {i === 0 && (
                            <span className="mt-2 text-[9px] font-mono uppercase tracking-wider text-white/50">Latest post</span>
                          )}
                        </div>
                      ))}
                    </AutoScroll>
                  ) : (
                    <p className="text-white/70 text-[13px] italic leading-snug">
                      No X posts synced yet.
                    </p>
                  )}
                </div>
                {(v.x.followers != null || v.x.posts != null || v.x.impressions != null) && (
                  <div className="flex-shrink-0 grid grid-cols-3 gap-2 text-center border-t border-white/10 pt-3 mt-3 font-mono">
                    <div>
                      <div className="text-lg font-bold">{v.x.followers != null ? <CountUp value={v.x.followers} /> : "—"}</div>
                      <div className="text-[10px] text-white/50 uppercase">Followers</div>
                    </div>
                    <div>
                      <div className="text-lg font-bold">{v.x.posts != null ? <CountUp value={v.x.posts} /> : "—"}</div>
                      <div className="text-[10px] text-white/50 uppercase">Posts</div>
                    </div>
                    <div>
                      <div className="text-lg font-bold text-amber-400">{v.x.impressions != null ? <CountUp value={v.x.impressions} delay={150} /> : "—"}</div>
                      <div className="text-[10px] text-white/50 uppercase">Impressions</div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* GitHub Stats + Heatmap */}
            {showGithub && (
              <div className="col-span-12 md:col-span-6 lg:col-span-4 self-start bg-white rounded-[32px] p-6 shadow-sm border border-gray-100 tc flex flex-col justify-between">
                <div>
                  <div className="flex justify-between items-center mb-4 text-xs font-mono uppercase tracking-widest text-[#8E8E88]">
                    <span className="flex items-center gap-1.5" style={{ color: "#0B0B0B" }}>
                      <GithubGlyph size={14} />
                      GitHub Stats
                    </span>
                    {githubUrl ? (
                      <a href={githubUrl} target="_blank" rel="noreferrer" className="text-[#0B0B0B] font-bold hover:text-[#7B72E9]">
                        @{githubHandle} ↗
                      </a>
                    ) : (
                      <span className="text-[#0B0B0B] font-bold">@{githubHandle}</span>
                    )}
                  </div>
                  {(v.github.repos != null || v.github.commits != null) && (
                    <div className="grid grid-cols-2 gap-3 mb-4">
                      {v.github.repos != null && (
                        <div className="bg-gray-50 p-3 rounded-2xl border border-gray-100 text-center">
                          <div className="text-xl font-extrabold text-[#0B0B0B]"><CountUp value={v.github.repos} /></div>
                          <div className="text-[10px] font-mono text-[#8E8E88] uppercase">Repos</div>
                        </div>
                      )}
                      {v.github.commits != null && (
                        <div className="bg-gray-50 p-3 rounded-2xl border border-gray-100 text-center">
                          <div className="text-xl font-extrabold text-[#0B0B0B]"><CountUp value={v.github.commits} /></div>
                          <div className="text-[10px] font-mono text-[#8E8E88] uppercase">Commits</div>
                        </div>
                      )}
                    </div>
                  )}
                  {v.github.topLanguages.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mb-4">
                      {v.github.topLanguages.slice(0, 4).map((lang) => (
                        <span key={lang} className="px-2 py-0.5 rounded-md bg-gray-100 text-[#0B0B0B] font-mono text-[10px]">{lang}</span>
                      ))}
                    </div>
                  )}
                  {v.contributions && Array.isArray(v.contributions.levels) && v.contributions.levels.length > 0 && (
                    <ContributionHeatmap
                      levels={v.contributions.levels}
                      year={v.contributions.year}
                      total={v.contributions.total}
                      avgPerDay={v.contributions.avg_per_day}
                    />
                  )}
                </div>
                {v.github.activeRepos != null && (
                  <span className="font-mono text-[10px] text-emerald-600 flex items-center gap-1.5 mt-3">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                    {v.github.activeRepos} active repos
                  </span>
                )}
              </div>
            )}

            {/* ─ ROW 4: WRITING ───────────────────────────── */}

            {v.writing.length > 0 && (
              <div className="col-span-12 bg-[#F5F3FF] rounded-[32px] p-6 shadow-sm border border-[#7B72E9]/10">
                <div className="flex items-center justify-between mb-4">
                  <span className="font-mono text-[11px] uppercase font-bold tracking-wider text-[#6d5acd]">Posts &amp; Writing</span>
                  <span className="font-mono text-[10px] text-[#7B72E9] font-semibold bg-[#7B72E9]/10 px-2 py-0.5 rounded">{v.writing.length} POSTS ARCHIVED</span>
                </div>
                <AutoScroll
                  rowHeight={POST_ROW_H + POST_GAP}
                  gap={0}
                  visible={VSCROLL_VISIBLE}
                  secondsPerRow={VSCROLL_SECS_PER_ROW}
                >
                  {v.writing.slice(0, 10).map((post, idx) => {
                    const style = POST_STYLES[idx % POST_STYLES.length];
                    const isX = ["x", "twitter"].includes(post.platform.toLowerCase());
                    const url = safeUrl(post.url);
                    return (
                      <div
                        key={`${post.platform}-${idx}`}
                        className={`pf-vrow pf-vrow-post p-3.5 rounded-2xl border transition-all ${style.card}`}
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
                          {url && (
                            <a href={url} target="_blank" rel="noreferrer" className={`font-mono text-xs ${style.link}`}>↗</a>
                          )}
                        </div>
                        <p className={`text-[11.5px] italic leading-snug font-medium pf-clamp-2 ${style.text}`}>
                          &ldquo;{post.excerpt}&rdquo;
                        </p>
                      </div>
                    );
                  })}
                </AutoScroll>
              </div>
            )}

            {/* ─ ROW 5: LIVE IN PRODUCTION & SKILL MATRIX (BENTO ROW) ── */}

            {(v.projects.length > 0 || skills.length > 0) && (
              <div className="col-span-12 bg-white rounded-[32px] p-6 sm:p-8 shadow-sm border border-gray-100 flex flex-col md:flex-row gap-6">

                {v.projects.length > 0 && (
                  <div className="flex-1 rounded-[24px] border border-gray-100 bg-gray-50/60 p-5">
                    <div className="flex justify-between items-center mb-5 text-xs font-mono uppercase tracking-widest text-[#8E8E88]">
                      <span className="text-[#0B0B0B] font-bold">Live in Production</span>
                      <span className="text-[#7B72E9] font-bold bg-[#7B72E9]/8 px-2 py-0.5 rounded border border-[#7B72E9]/15">
                        {v.projects.length} {v.projects.length === 1 ? 'Highlight' : 'Highlights'}
                      </span>
                    </div>
                    <div className="space-y-2.5">
                      {v.projects.slice(0, 4).map((proj) => {
                        const url = safeUrl(proj.url);
                        return (
                          <div
                            key={proj.name}
                            className="group flex items-center justify-between p-3.5 bg-white border border-gray-100 hover:border-[#7B72E9]/25 rounded-2xl transition-all hover:shadow-sm"
                          >
                            <div className="flex items-center gap-3.5 min-w-0 flex-1">
                              <div className="w-9 h-9 rounded-xl border border-gray-100 bg-gray-100 flex items-center justify-center text-[#8E8E88] shrink-0 select-none group-hover:bg-[#7B72E9]/8 group-hover:border-[#7B72E9]/20 group-hover:text-[#7B72E9] transition-colors duration-200">
                                <GithubGlyph size={16} />
                              </div>
                              <div className="min-w-0 flex-1">
                                <div className="flex items-center gap-2 mb-0.5">
                                  {url ? (
                                    <a
                                      href={url}
                                      target="_blank"
                                      rel="noreferrer"
                                      className="font-bold text-[13.5px] text-[#0B0B0B] group-hover:text-[#7B72E9] transition-colors inline-flex items-center gap-1 leading-snug truncate"
                                    >
                                      {proj.name}
                                    </a>
                                  ) : (
                                    <span className="font-bold text-[13.5px] text-[#0B0B0B] leading-snug truncate">{proj.name}</span>
                                  )}
                                  {proj.stars != null && proj.stars > 0 && (
                                    <span className="px-2 py-0.5 rounded-md bg-amber-50 border border-amber-200/60 text-amber-600 font-mono text-[10px] font-bold inline-flex items-center gap-1 shrink-0">
                                      ★ {compact(proj.stars)}
                                    </span>
                                  )}
                                </div>
                                {!isBlank(proj.description) && (
                                  <p className="text-[11.5px] text-[#8E8E88] leading-relaxed line-clamp-1 pr-4">{proj.description}</p>
                                )}
                                {proj.tech.length > 0 && (
                                  <div className="flex flex-wrap items-center gap-1.5 mt-1">
                                    {proj.tech.slice(0, 3).map((t) => (
                                      <span
                                        key={t}
                                        className="px-2 py-0.5 rounded-md bg-[#7B72E9]/8 border border-[#7B72E9]/15 text-[#7B72E9] font-mono text-[9px] font-semibold uppercase tracking-wider"
                                      >
                                        {t}
                                      </span>
                                    ))}
                                  </div>
                                )}
                              </div>
                            </div>
                            {url && (
                              <span className="text-gray-300 group-hover:text-[#7B72E9] group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all text-base font-bold pr-1 select-none">
                                ↗
                              </span>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {v.projects.length > 0 && skills.length > 0 && (
                  <div className="w-px bg-gray-100 hidden md:block" />
                )}

                {skills.length > 0 && (
                  <div className="flex-1 rounded-[24px] border border-gray-100 bg-gray-50/60 p-5">
                    <div className="flex justify-between items-center mb-5 text-xs font-mono uppercase tracking-widest text-[#8E8E88]">
                      <span className="text-[#0B0B0B] font-bold">Skill Matrix</span>
                      <span className="text-[#7B72E9] font-bold bg-[#7B72E9]/8 px-2 py-0.5 rounded border border-[#7B72E9]/15">
                        {skills.length} Tracked
                      </span>
                    </div>
                    <div className="space-y-2 font-mono text-sm">
                      {skills.slice(0, 6).map((skill) => {
                        const meta = levelMeta(skill.level);
                        const accent = skillAccent(skill.name);

                        let short = skill.name.slice(0, 2).toUpperCase();
                        if (skill.name.toLowerCase().includes("golang") || skill.name.toLowerCase().includes("go")) short = "Go";
                        else if (skill.name.toLowerCase().includes("typescript")) short = "TS";
                        else if (skill.name.toLowerCase().includes("javascript")) short = "JS";
                        else if (skill.name.toLowerCase().includes("python")) short = "Py";
                        else if (skill.name.toLowerCase().includes("rust")) short = "Rs";

                        const isExpert = skill.level.toLowerCase() === "expert";
                        const isAdvanced = skill.level.toLowerCase() === "advanced";
                        const isMid = skill.level.toLowerCase() === "intermediate" || skill.level.toLowerCase() === "mid";
                        const blocks = isExpert ? "■■■■" : isAdvanced ? "■■■□" : isMid ? "■■□□" : "■□□□";

                        return (
                          <div key={skill.name} className="flex justify-between items-center bg-white px-4 py-2.5 rounded-xl border border-gray-100 hover:border-gray-200 transition-colors">
                            <span className="flex items-center gap-2">
                              <span style={{ color: accent }} className="font-bold text-xs">{short}</span>
                              <span className="text-[#0B0B0B] font-medium font-sans text-[13px]">{skill.name}</span>
                            </span>
                            <span className="text-[#8E8E88] text-xs">
                              {meta.label} <span style={{ color: meta.bar }} className="ml-1 tracking-wider">{blocks}</span>
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

              </div>
            )}

            {/* ─ ROW 6: CALENDLY (if present) ─────────────────────────── */}

            {calendlyUrl && (
              <div className="col-span-12 bg-gradient-to-br from-blue-50/40 via-white to-indigo-50/15 rounded-[32px] p-6 sm:p-8 shadow-sm border border-blue-100/50 tc tc-b flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 hover:shadow-md transition-all duration-300">
                <div className="flex items-start gap-4 flex-1">
                  {/* Glowing scheduling icon */}
                  <div className="w-12 h-12 rounded-2xl bg-blue-500/10 border border-blue-200/40 flex items-center justify-center text-blue-600 shrink-0 shadow-inner select-none">
                    <Calendar size={22} className="stroke-[2.2]" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <span className="text-[10px] font-mono uppercase font-bold tracking-widest text-blue-600 block mb-1.5">Scheduling</span>
                    <h3 className="text-xl! font-bold! text-slate-900! leading-snug! mb-1">Book a 1:1 Session</h3>
                    <p className="text-[13px] text-slate-500 font-sans leading-relaxed">
                      Ideas, projects, or collaborations{!isBlank(identity.name) ? ` with ${identity.name.split(" ")[0]}` : ""}. Find a slot to sync live.
                    </p>
                  </div>
                </div>
                <a
                  href={calendlyUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 px-6 py-3 rounded-full font-bold text-sm text-white shrink-0 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 hover:shadow-lg hover:shadow-blue-500/10 hover:scale-[1.02] active:scale-[0.98] transition-all duration-200 shadow-md shadow-blue-500/5 select-none"
                >
                  Schedule Meet ↗
                </a>
              </div>
            )}

            {/* ─ ROW 5A: FULL-WIDTH CTA ───────────────────────────────── */}
            <div className="col-span-12 bg-slate-50 rounded-[32px] p-8 sm:p-10 shadow-sm border border-slate-200/70 flex flex-col md:flex-row justify-between items-center gap-8 hover:shadow-md hover:border-slate-300 transition-all duration-300">
              
              <div className="flex items-start gap-4 flex-1">
                {/* Clean SaaS Search icon */}
                <div className="w-12 h-12 rounded-2xl bg-slate-200/50 border border-slate-300/30 flex items-center justify-center text-slate-600 shrink-0 shadow-inner">
                  <Search size={22} className="stroke-[2.2]" />
                </div>
                <div className="flex-1 min-w-0">
                  <span className="text-[10px] font-mono uppercase font-bold tracking-widest text-slate-500 block mb-1.5">
                    Explore Zynd Intelligence
                  </span>
                  <h3 className="text-xl sm:text-2xl font-extrabold text-slate-900 leading-tight tracking-tight mb-2 max-w-[520px]">
                    Find people with matching expertise across the Zynd directory.
                  </h3>
                  <p className="text-[13px] text-slate-500 font-sans leading-relaxed">
                    Powered by Zynd&apos;s semantic search across verified profiles.
                  </p>
                </div>
              </div>
              
              <div className="flex flex-col gap-3.5 shrink-0 w-full md:w-auto text-center md:text-left">
                {skills.length > 0 && (
                  <Link
                    href={`/search?skills=${skills.slice(0, 3).map((s) => encodeURIComponent(s.name)).join(",")}`}
                    className="inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-full font-mono text-[11px] font-bold bg-slate-900 hover:bg-slate-800 active:scale-[0.98] transition-all duration-150 text-white uppercase tracking-wider shadow-sm shrink-0 select-none"
                  >
                    <Search size={13} strokeWidth={2.5} />
                    Find Similar Profiles
                  </Link>
                )}
                <Link 
                  href="/directory" 
                  className="group/link font-mono text-[11px] text-slate-500 hover:text-slate-900 transition-colors py-1 flex items-center justify-center gap-1 inline-block"
                >
                  Browse all profiles 
                  <span className="group-hover/link:translate-x-0.5 transition-transform duration-150">→</span>
                </Link>
              </div>
            </div>

          </div>{/* end grid */}

          {/* ── EDITORIAL FOOTER ──────────────────────────────────────── */}
          <footer className="mt-10 pt-6 border-t border-gray-200 flex flex-wrap items-center justify-between gap-4 text-[11px] font-mono text-[#8E8E88]">
            <div className="flex items-center gap-2">
              <span className="font-bold text-[#0B0B0B]">ZYND.AI</span>
              <span>•</span>
              <span>Algorithmic Dossier &amp; Synthesis Protocol</span>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-gray-50 border border-gray-200">
                <span className="text-[#0B0B0B] font-medium">{permalink}</span>
                <CopyPermalinkIcon url={canonical} />
              </div>
              <Link href="/directory" className="pf-hv-dark transition-colors">DIRECTORY</Link>
              <Link href="/for-ai" className="pf-hv-dark transition-colors">AGENT_API</Link>
              <Link href="/create" className="pf-hv-dark transition-colors">CREATE</Link>
            </div>
          </footer>

        </main>
      </div>
      <ProfileChatWidget handle={handle} personName={identity.name} />
    </>
  );
}
