import { NextResponse } from "next/server";
import { zns } from "@/lib/zns";
import type { AgentProfileCard } from "@/lib/cards";
import { cardCanonicalUrl } from "@/lib/cards";

export const revalidate = 60;

const SITE_URL = "https://www.zynd.ai";
const CARDS_API = process.env.NEXT_PUBLIC_API_URL || "https://api.zynd.ai";

async function fetchCards(): Promise<AgentProfileCard[]> {
  try {
    const res = await fetch(`${CARDS_API}/cards`, {
      headers: { accept: "application/json" },
      signal: AbortSignal.timeout(8000),
      cache: "no-store",
    });
    if (!res.ok) return [];
    return (await res.json()) as AgentProfileCard[];
  } catch {
    return [];
  }
}

function intParam(raw: string | null, fallback: number, min: number, max: number): number {
  const n = raw === null ? NaN : Number(raw);
  if (!Number.isFinite(n)) return fallback;
  return Math.min(Math.max(Math.trunc(n), min), max);
}

function cardToEntity(card: AgentProfileCard): Record<string, unknown> {
  const skills = card.skills.slice(0, 6).map((s) => s.name);
  const availability = card.availability || "";
  const location = card.identity.location || "";

  const summaryParts = [card.identity.headline];
  if (skills.length) summaryParts.push(`Skills: ${skills.join(", ")}`);
  if (location) summaryParts.push(`Based in ${location}`);
  if (availability) summaryParts.push(`Availability: ${availability}`);

  const tags = [
    ...skills.map((s) => s.toLowerCase().replace(/\s+/g, "-")),
    ...(location ? [location.toLowerCase().replace(/\s+/g, "-")] : []),
    ...(availability ? [availability.toLowerCase()] : []),
    "person",
    "human",
  ];

  return {
    entity_id: `card:${card.handle || card.id}`,
    name: card.identity.name,
    owner: "zns:dev:zynd-cards",
    entity_url: cardCanonicalUrl(card),
    category: "person",
    entity_type: "person",
    tags,
    summary: summaryParts.join(". "),
    status: "active",
    home_registry: "zynd.ai",
    schema_version: "1.0",
    registered_at: card.created_at || new Date().toISOString(),
    updated_at: card.updated_at || new Date().toISOString(),
    ttl: 86400,
    last_heartbeat: new Date().toISOString(),
    public_key: "",
    service_endpoint: `${SITE_URL}/p/${card.handle || card.id}`,
    developer_handle: card.handle || card.id,
    fqan: `${card.handle || card.id}.person.zynd.ai`,
  };
}

export async function GET(req: Request): Promise<NextResponse> {
  const url = new URL(req.url);
  const limit = intParam(url.searchParams.get("limit"), 200, 1, 500);
  const offset = intParam(url.searchParams.get("offset"), 0, 0, 100_000);
  const type = url.searchParams.get("type") || "";
  const category = url.searchParams.get("category") || "";

  const includePeople = !type || type === "person" || type === "all";
  const includeAgents = !type || type !== "person";

  const upstream = new URL(`${zns()}/v1/entities`);
  upstream.searchParams.set("limit", String(limit));
  if (offset > 0) upstream.searchParams.set("offset", String(offset));
  if (includeAgents && type && type !== "all" && type !== "person") upstream.searchParams.set("type", type);
  if (includeAgents && category && category !== "person") upstream.searchParams.set("category", category);

  const [znsResult, cardsResult] = await Promise.allSettled([
    includeAgents
      ? fetch(upstream, {
          headers: { accept: "application/json" },
          signal: AbortSignal.timeout(8000),
          next: { revalidate: 60 },
        }).then(async (res) => {
          if (!res.ok) return [] as Record<string, unknown>[];
          const data = (await res.json()) as { entities?: unknown[] };
          const raw = Array.isArray(data.entities) ? data.entities : [];
          return raw.filter((e): e is Record<string, unknown> => {
            if (!e || typeof e !== "object") return false;
            const r = e as Record<string, unknown>;
            return typeof r.entity_id === "string" && typeof r.name === "string";
          });
        })
      : Promise.resolve([] as Record<string, unknown>[]),
    includePeople && (!category || category === "person")
      ? fetchCards().then((cards) => cards.map(cardToEntity))
      : Promise.resolve([] as Record<string, unknown>[]),
  ]);

  const agents = znsResult.status === "fulfilled" ? znsResult.value : [];
  const people = cardsResult.status === "fulfilled" ? cardsResult.value : [];

  // People first — they're the primary discovery target
  const entities = [...people, ...agents];

  return NextResponse.json(
    { entities, count: entities.length },
    { headers: { "cache-control": "public, s-maxage=60, stale-while-revalidate=300" } },
  );
}
