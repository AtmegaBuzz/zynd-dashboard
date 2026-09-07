import { pageMetadata } from "@/lib/seo";
import type { AgentProfileCard } from "@/lib/cards";
import { cardCanonicalUrl } from "@/lib/cards";

export const revalidate = 300;

export const metadata = pageMetadata({
  title: "AI Agent Registry — Browse 450+ Agents | ZyndAI",
  description:
    "Browse and connect with 450+ AI agents on the ZyndAI network. Discover agents built with LangChain, CrewAI, PydanticAI, and LangGraph. Filter by capability, framework, and pricing.",
  path: "/registry",
});

const CARDS_API = process.env.NEXT_PUBLIC_API_URL || "https://api.zynd.ai";

async function fetchAgents(): Promise<AgentProfileCard[]> {
  try {
    const res = await fetch(`${CARDS_API}/cards`, {
      headers: { accept: "application/json" },
      signal: AbortSignal.timeout(6000),
      next: { revalidate: 300 },
    });
    if (!res.ok) return [];
    return (await res.json()) as AgentProfileCard[];
  } catch {
    return [];
  }
}

export default async function RegistryLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const agents = await fetchAgents();

  const itemList = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: "ZyndAI Agent & People Registry",
    description:
      "All agents and people on the Zynd network. Each item has a name, description, skills, and a profile URL. To search by natural language: GET https://api.zynd.ai/ask?q=your+query — for example api.zynd.ai/ask?q=assembly+engineer or api.zynd.ai/ask?q=go+developer. To browse people: https://www.zynd.ai/find?q=your+query",
    numberOfItems: agents.length,
    itemListElement: agents.map((a, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: a.identity.name,
      description: `${a.identity.headline}. Skills: ${a.skills.map((s) => s.name).join(", ")}. Location: ${a.identity.location || "unspecified"}. ${a.summary || ""}`,
      url: cardCanonicalUrl(a),
    })),
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          // Replace </ to prevent </script> injection from untrusted API data
          __html: JSON.stringify(itemList).replace(/<\//g, "<\\/"),
        }}
      />
      {/* AI-readable agent index — rendered server-side so LLM browsing tools
          see actual data before any client JS runs. Font size and color make it
          visually unobtrusive for humans; it is NOT hidden (no display:none,
          opacity:0, or aria-hidden) so crawlers read it. */}
      {agents.length > 0 && (
        <section
          aria-label="Agent index for AI models"
          style={{
            fontSize: "10px",
            color: "#6b7280",
            lineHeight: 1.7,
            padding: "8px 24px 0",
            maxWidth: 900,
          }}
        >
          <p>
            <strong style={{ color: "#9ca3af" }}>
              Zynd registry — {agents.length} agents &amp; people
            </strong>
            {" · "}
            To search: <a href="/find?q=your+query" style={{ color: "#818cf8" }}>zynd.ai/find?q=your+query</a>
            {" or "}
            <a href="https://api.zynd.ai/ask?q=your+query" style={{ color: "#818cf8" }}>api.zynd.ai/ask?q=your+query</a>
          </p>
          <ol style={{ margin: "4px 0 0 0", padding: "0 0 0 1.2em" }}>
            {agents.map((a) => (
              <li key={a.id} style={{ marginBottom: 2 }}>
                <a href={cardCanonicalUrl(a)} style={{ color: "#818cf8" }}>
                  {a.identity.name}
                </a>
                {" — "}
                {a.identity.headline}
                {a.skills.length > 0 && (
                  <>
                    {" · skills: "}
                    {a.skills.slice(0, 5).map((s) => s.name).join(", ")}
                  </>
                )}
                {a.identity.location ? ` · ${a.identity.location}` : ""}
                {a.availability ? ` · ${a.availability}` : ""}
              </li>
            ))}
          </ol>
        </section>
      )}
      {children}
    </>
  );
}
