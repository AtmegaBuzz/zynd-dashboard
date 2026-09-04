export interface Identity {
  name: string;
  headline: string;
  location: string;
  avatar_url: string;
  avatar_bg_url?: string;
  links: Record<string, string>;
}

export interface Skill {
  name: string;
  level: string;
  evidence_count: number;
}

export interface Project {
  name: string;
  description: string;
  url: string;
  source: string;
  /** Not yet emitted by the cards API — see DUMMY.projects in p/[handle]/page.tsx. */
  stars?: number | null;
  /** Not yet emitted by the cards API — e.g. ["Rust", "SIMD", "85k RPS"]. */
  tech?: string[] | null;
}

export interface WritingSample {
  platform: string;
  excerpt: string;
  url: string;
  posted_at: string;
  /** Not yet emitted by the cards API — e.g. ["842 reposts", "3.1k bookmarks"]. */
  metrics?: string[] | null;
}

export interface Source {
  platform: string;
  url: string | null;
  scraped_at: string;
  method: string;
}

export interface Review {
  status: string;
  reviewed_by: string;
  reviewed_at: string;
}

/**
 * Platform telemetry blocks. None of these are returned by the cards API today —
 * the profile page falls back to DUMMY (see p/[handle]/page.tsx) until they are.
 */
export interface LinkedInStats {
  connections: number | string;
  posts: number | string;
  verified?: boolean;
}

export interface XStats {
  handle: string;
  followers: number | string;
  posts: number | string;
  impressions: number | string;
}

/** `levels` holds one 0–4 intensity per day, oldest first (GitHub-style heatmap). */
export interface ContributionStats {
  year: number;
  total: number;
  avg_per_day: number;
  levels: number[];
}

export interface Endorsement {
  quote: string;
  reviewer_count: number;
}

export interface AgentProfileCard {
  id: string;
  schema_version: string;
  status: string;
  handle: string;
  created_at: string;
  updated_at: string;
  identity: Identity;
  citation_snippet: string;
  summary: string;
  skills: Skill[];
  projects: Project[];
  writing_samples: WritingSample[];
  searchable_facts: string[];
  sources: Source[];
  review: Review;
  experience_years: number | null;
  industries: string[];
  availability: string;
  working_on: string[];
  can_help_with: string[];
  connect_with: string[];
  love_talking_about: string[];
  github_stats: {
    total_repos: number;
    active_repos: number;
    top_languages: string[];
    /** Not yet emitted by the cards API. */
    loc_added?: number | string | null;
    /** Not yet emitted by the cards API. */
    total_commits?: number | string | null;
  } | null;

  // ── Not yet emitted by the cards API; optional so the page can prefer them ──
  /** e.g. "Ex-DeepMind • OpenAI Fellow" — the sub-headline under the role. */
  affiliations?: string | null;
  /** 0–100 synthesis confidence shown on the About card. */
  synthesis_score?: number | null;
  linkedin_stats?: LinkedInStats | null;
  x_stats?: XStats | null;
  contribution_stats?: ContributionStats | null;
  endorsement?: Endorsement | null;
}

export interface AgentSearchResult {
  agent_id: string;
  handle: string;
  name: string;
  headline: string;
  location: string;
  skills: string[];
  industries: string[];
  availability: string;
  experience_years: number | null;
  match_score: number;
  match_reasons: string[];
  url: string;
}

export interface AgentSearchResponse {
  query: Record<string, string | number | null>;
  searchable_attributes: { name: string; type: string; description: string }[];
  results: AgentSearchResult[];
}

export interface OnboardStatus {
  status: "running" | "ready" | "error";
  card: AgentProfileCard | null;
  error: string | null;
}

const API_BASE =
  process.env.NEXT_PUBLIC_API_URL || "https://api.zynd.ai";

export async function fetchCard(id: string): Promise<AgentProfileCard | null> {
  try {
    const res = await fetch(`${API_BASE}/cards/${id}`, {
      next: { revalidate: 60 },
    });
    if (!res.ok) return null;
    return (await res.json()) as AgentProfileCard;
  } catch {
    return null;
  }
}

export async function fetchCardByHandle(handle: string): Promise<AgentProfileCard | null> {
  try {
    const res = await fetch(`${API_BASE}/cards/by-handle/${handle}`, {
      next: { revalidate: 60 },
    });
    if (!res.ok) return null;
    return (await res.json()) as AgentProfileCard;
  } catch {
    return null;
  }
}

export async function listCards(): Promise<AgentProfileCard[]> {
  try {
    const res = await fetch(`${API_BASE}/cards`, { next: { revalidate: 60 } });
    if (!res.ok) return [];
    return (await res.json()) as AgentProfileCard[];
  } catch {
    return [];
  }
}

export function cardCanonicalUrl(card: AgentProfileCard): string {
  const base = "https://www.zynd.ai";
  return card.handle ? `${base}/p/${card.handle}` : `${base}/profile/${card.id}`;
}

export async function searchAgents(
  params: Record<string, string>,
): Promise<AgentSearchResponse> {
  const qs = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) {
    if (v) qs.set(k, v);
  }
  try {
    const res = await fetch(`${API_BASE}/v1/agents/search?${qs}`, {
      next: { revalidate: 60 },
    });
    if (!res.ok) return { query: {}, searchable_attributes: [], results: [] };
    return (await res.json()) as AgentSearchResponse;
  } catch {
    return { query: {}, searchable_attributes: [], results: [] };
  }
}

export { API_BASE as CARDS_API };
