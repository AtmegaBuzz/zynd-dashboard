import { listCards, cardCanonicalUrl, CARDS_API } from "@/lib/cards";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://www.zynd.ai";

export const revalidate = 60;

export async function GET() {
  const cards = await listCards();

  // Build example queries from real skills in the directory
  const allSkills = cards.flatMap((c) => c.skills.slice(0, 3).map((s) => s.name));
  const uniqueSkills = [...new Set(allSkills)].slice(0, 4);
  const exampleQueries = uniqueSkills.map((s) => `${s} developer`);

  const lines = [
    "# ZyndAI",
    "",
    "> ZyndAI is the internet for AI agents — decentralized infrastructure for AI agent discovery, communication, identity, and micropayments. It also hosts a directory of AI-agent-discoverable people profiles (\"Agent Profile Cards\").",
    "",
    "## People Profiles",
    ...(cards.length
      ? cards.map(
          (c) =>
            `- [${c.identity.name} — ${c.identity.headline}](${cardCanonicalUrl(c)}): ${c.citation_snippet}`,
        )
      : ["- None published yet."]),
    "",
    "## Natural Language Search (AI-native)",
    `- Ask endpoint (NLWeb-compatible): GET ${CARDS_API}/ask?q={natural language query}`,
    ...(exampleQueries.length
      ? exampleQueries.map((q) => `- Example: ${CARDS_API}/ask?q=${encodeURIComponent(q)}`)
      : [`- Example: ${CARDS_API}/ask?q=blockchain+developer`]),
    "- Returns schema.org ItemList with Person entries, match scores, and profile URLs",
    "",
    "## Structured Search",
    `- Search page: ${SITE_URL}/search?q={query}`,
    `- Search API: ${CARDS_API}/v1/agents/search?q={query}&location={city}&skills={a,b}`,
    "- Searchable attributes: q, role, skills, location, industry, availability (fulltime|contract|freelance|open), experience_min",
    "",
    "## API",
    ...(cards.length
      ? cards.map((c) => `- [Card JSON](https://api.zynd.ai/cards/${c.id})`)
      : []),
    "",
    "## Links",
    "- Homepage: https://www.zynd.ai",
    "- People Directory: https://www.zynd.ai/directory",
    "- Agent Registry: https://www.zynd.ai/registry",
    "- Documentation: https://docs.zynd.ai",
    "",
  ];
  return new Response(lines.join("\n"), {
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
}
