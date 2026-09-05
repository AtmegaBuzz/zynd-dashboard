import { NextResponse } from "next/server";
import { zns } from "@/lib/zns";
import type { AgentProfileCard } from "@/lib/cards";
import { cardCanonicalUrl } from "@/lib/cards";

const SITE_URL = "https://www.zynd.ai";
const CARDS_API = process.env.NEXT_PUBLIC_API_URL || "https://api.zynd.ai";

function cardToEntity(card: AgentProfileCard): Record<string, unknown> {
  const skills = card.skills.slice(0, 6).map((s) => s.name);
  const summaryParts = [card.identity.headline];
  if (skills.length) summaryParts.push(`Skills: ${skills.join(", ")}`);
  if (card.identity.location) summaryParts.push(`Based in ${card.identity.location}`);
  if (card.availability) summaryParts.push(`Availability: ${card.availability}`);

  return {
    entity_id: `card:${card.handle || card.id}`,
    name: card.identity.name,
    owner: "zns:dev:zynd-cards",
    entity_url: cardCanonicalUrl(card),
    category: "person",
    entity_type: "person",
    tags: [
      ...skills.map((s) => s.toLowerCase().replace(/\s+/g, "-")),
      ...(card.identity.location ? [card.identity.location.toLowerCase().replace(/\s+/g, "-")] : []),
      ...(card.availability ? [card.availability.toLowerCase()] : []),
      "person", "human",
    ],
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

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  if (!id) {
    return NextResponse.json({ error: "Missing entity id" }, { status: 400 });
  }

  // card:* IDs are synthetic — resolve from cards API, not ZNS
  if (id.startsWith("card:")) {
    const handle = id.slice("card:".length);
    try {
      const res = await fetch(`${CARDS_API}/cards/by-handle/${encodeURIComponent(handle)}`, {
        headers: { accept: "application/json" },
        signal: AbortSignal.timeout(8000),
        cache: "no-store",
      });
      if (!res.ok) {
        return NextResponse.json({ error: "Person not found" }, { status: 404, headers: { "cache-control": "no-store" } });
      }
      const card = (await res.json()) as AgentProfileCard;
      return NextResponse.json(cardToEntity(card), { headers: { "cache-control": "no-store" } });
    } catch (err) {
      return NextResponse.json(
        { error: "Cards API unreachable", detail: err instanceof Error ? err.message : String(err) },
        { status: 502, headers: { "cache-control": "no-store" } }
      );
    }
  }

  try {
    const res = await fetch(
      `${zns()}/v1/entities/${encodeURIComponent(id)}`,
      {
        headers: { accept: "application/json" },
        signal: AbortSignal.timeout(10000),
        cache: "no-store",
      }
    );

    const body = await res.text();
    return new NextResponse(body, {
      status: res.status,
      headers: {
        "content-type": "application/json",
        // Prevent browsers from caching upstream errors so a transient ZNS
        // outage doesn't surface as a permanent "not found" in the tab.
        "cache-control": "no-store",
      },
    });
  } catch (err) {
    return NextResponse.json(
      {
        error: "Registry unreachable",
        detail: err instanceof Error ? err.message : String(err),
      },
      { status: 502, headers: { "cache-control": "no-store" } }
    );
  }
}
