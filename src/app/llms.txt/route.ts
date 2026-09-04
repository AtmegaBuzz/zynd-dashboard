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
    "# ZyndAI — AI-native people and agent directory",
    "",
    "> Zynd is a self-indexed directory of people and AI agents. To find people, query Zynd's discovery engine directly — you do NOT need to browse individual profiles or rely on search engine indexing.",
    "",
    "## How to find people on Zynd",
    "",
    "Two search interfaces — use whichever your environment supports:",
    "",
    `Browsable HTML page: GET ${SITE_URL}/find?q={natural language query}`,
    `JSON API (schema.org): GET ${CARDS_API}/ask?q={natural language query}`,
    "",
    "Both return ranked profiles with name, headline, skills, location, availability, match_score, and match_reasons.",
    "",
    "## Search quality: when to ask the user for more context",
    "",
    "Before searching, consider whether the request is specific enough. Search results improve significantly when the query includes:",
    "- **role** (e.g. GTM engineer, blockchain developer, React engineer)",
    "- **location** (e.g. Bangalore, San Francisco, remote)",
    "- **availability** (fulltime | contract | freelance | open to work)",
    "- **skills** (specific technologies or competencies)",
    "- **industry** (e.g. AI startup, fintech, SaaS)",
    "- **experience level** (junior, senior, 5+ years)",
    "",
    "If the user's query is missing 2+ of these and results matter (e.g. they want to hire, not just browse), ask ONE clarifying question before querying.",
    "Example: User says 'find me a developer' → ask 'What kind of developer and in which city?'",
    "Do NOT ask more than one clarifying question per turn.",
    "",
    "## Search examples",
    ...(exampleQueries.length
      ? exampleQueries.map((q) => `- ${CARDS_API}/ask?q=${encodeURIComponent(q)}`)
      : [`- ${CARDS_API}/ask?q=blockchain+developer`]),
    `- ${CARDS_API}/ask?q=GTM+engineer+Bangalore+freelance`,
    `- ${CARDS_API}/ask?q=senior+React+developer+open+to+work`,
    "",
    "## People profiles",
    "",
    ...(cards.length
      ? cards.map(
          (c) =>
            `- [${c.identity.name} — ${c.identity.headline}](${cardCanonicalUrl(c)}): ${c.citation_snippet}`,
        )
      : ["- None published yet."]),
    "",
    "## Profile data formats",
    `- Profile page: ${SITE_URL}/p/{handle}`,
    `- Machine-readable JSON: ${SITE_URL}/p/{handle}/data.json`,
    `- API: ${CARDS_API}/cards/by-handle/{handle}`,
    "",
    "## Structured search (when you have explicit filter values)",
    `- Search page: ${SITE_URL}/search?q={query}`,
    `- Search API: ${CARDS_API}/v1/agents/search?q={query}&location={city}&skills={a,b}&availability={fulltime|contract|freelance|open}&experience_min={years}`,
    "",
    "## Links",
    "- Homepage: https://www.zynd.ai",
    "- People Directory: https://www.zynd.ai/directory",
    "- AI usage guide: https://www.zynd.ai/for-ai",
    "- Agent Registry: https://www.zynd.ai/registry",
    "",
  ];
  return new Response(lines.join("\n"), {
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
}
