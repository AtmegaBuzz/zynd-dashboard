# How to Outrank AGNTCY for "internet for ai agents"

_Prepared June 22, 2026 • Target keyword: **internet for ai agents** • Competitor: **agntcy.org**_

## Bottom line

AGNTCY does **not** outrank you because of better on-page SEO. Their page is thin (131 words, 0 images, a Flesch score of -33). Neither their page nor yours actually contained the phrase "internet for ai agents" — they rank on the **semantically identical** brand term "Internet of Agents (IoA)" plus **heavy domain authority**: AGNTCY is a Cisco/Outshift-led, Linux Foundation project backed by Dell, Google, Oracle, and Red Hat.

So beating them is mostly an **authority + content** problem, not an on-page one. I've already closed the on-page gap in your code (below). Your page is now better optimized for this exact term than theirs. The remaining work is backlinks and topical depth.

## Why AGNTCY ranks (head-to-head from the audits)

| Signal | AGNTCY (agntcy.org) | ZyndAI (before) | ZyndAI (after my edits) |
|---|---|---|---|
| Keyword in title | No | No | **Yes** |
| Keyword in H1 | No ("Building the Internet of Agents") | No | No — brand H1 kept; signal carried by title + FAQ schema |
| Keyword in meta description | No | No | **Yes** |
| Meta description length | OK | 264 chars (too long) | **146 chars** |
| Word count | 131 | 1,126 | 1,126+ |
| Images / with alt | 0 / 0 | 13 / 9 | 13 / 10 |
| FAQ schema | No | No | **Yes** |
| Domain authority / backlinks | **Very high** (Cisco, Linux Foundation, Dell, Google, Oracle, Red Hat) | Low | Low — this is the gap |

The takeaway: their only durable advantage is authority. That's the thing to attack.

## What I already changed in your code

All edits compile cleanly (`tsc --noEmit` passes). Files touched:

- **`src/app/(site)/layout.tsx`**
  - Title → `The Internet for AI Agents | ZyndAI Open Agent Network` (54 chars, keyword first, brand kept)
  - Meta description → rewritten to 146 chars (was 264, over the 160 limit) and now contains the keyword
  - Added `internet for AI agents` and `internet of agents` to the keywords list
  - Added **FAQPage structured data** (JSON-LD) — eligible for rich results in Google, including a "What is the internet for AI agents?" Q&A. AGNTCY has none.
- **`src/components/Hero.tsx`**
  - Visible H1 and subhead **left unchanged** (no UI change to the homepage)
  - Added descriptive alt text to the main hero image (`alt="ZyndAI network visualization — the internet for AI agents"`) — invisible to users, but indexed by search and read by screen readers

The visible homepage copy (hero H1, subhead, vision statement) was intentionally **left unchanged**. Keyword targeting is done entirely through invisible metadata and structured data, so there is no visual change to the page.

Note on the 4 "missing alt" images the audit flagged: three are decorative hero background SVGs. Leaving those with empty `alt=""` is the correct accessibility practice — don't let the audit tool push you into keyword-stuffing decorative images. I added alt only to the one that's a real visual.

**Next step on your side:** deploy, then submit the homepage for re-indexing in Google Search Console so the new title/H1/schema get picked up.

## What still needs doing — prioritized

### P0 — Authority / backlinks (this is the actual lever)

You won't out-rank a Cisco-backed domain on-page alone. You need links and mentions from places Google trusts:

- **Get listed in AI-agent directories and "awesome" lists.** There are GitHub awesome-lists for AI agents, agent protocols, and x402 — submit PRs adding ZyndAI. These are easy, relevant, indexed links.
- **Launch on aggregators.** Product Hunt, Hacker News (Show HN), and the relevant subreddits (r/AI_Agents, r/LocalLLaMA, r/LangChain). A good launch earns links and brand searches, both of which feed rankings.
- **Developer-platform content.** Publish technical pieces on dev.to, Hashnode, and Medium that link back to specific docs/registry pages, not just the homepage.
- **Integration ecosystem links.** You support LangChain, CrewAI, LangGraph, n8n, MCP. Get into their community showcases, integration directories, and docs where third-party tools are listed.
- **Digital PR.** A short data/opinion piece ("we indexed 450+ agents — here's what the agent economy looks like") is linkable by AI newsletters and blogs.
- **Compete on the exact phrase.** AGNTCY owns "Internet of **Agents**." You can own "Internet **for AI** agents" — use that exact wording consistently in titles, anchor text, and outreach so it becomes your associated term.

### P1 — Content / topical authority

- **Build a pillar page** at `/internet-for-ai-agents` (or a blog post) that is the definitive, long-form answer to "what is the internet for AI agents." AGNTCY's equivalent is 131 words — you can easily publish the best resource on the topic. Target the exact keyword in the URL, title, H1, and first 100 words.
- **Build a cluster** of supporting posts that all internally link to the pillar: agent discovery, agent identity (DIDs), A2A/AgentMessage protocol, x402 micropayments, "Internet of Agents vs. agent APIs." You already have 5 blog posts — expand and interlink them.
- **Add internal links** from your existing blog posts and the homepage to the new pillar using "internet for AI agents" as anchor text.
- **Keep readability in mind.** Your Flesch score (27.4) is low. Shorter sentences and simpler phrasing in body copy will help both users and the score the audit tool flags.

### P2 — Remaining technical / on-page polish

- After deploying, re-run the audit; confirm keyword density is now > 0% and the title/H1/meta checks pass.
- Make sure the new pillar page is added to `src/app/sitemap.ts`.
- Consider an `og:image` and Twitter card tuned to the "internet for AI agents" message for better social CTR (more shares → more links).
- Your robots.txt, llms.txt, sitemap, and existing schema are already well done — no action needed there.

## 30 / 60 / 90 day plan

- **Days 1–30:** Deploy on-page changes; request re-indexing. Ship the `/internet-for-ai-agents` pillar page. Submit to 10–15 directories/awesome-lists. Do a Product Hunt + Show HN launch.
- **Days 31–60:** Publish 3–4 cluster posts with internal links to the pillar. Guest-post on 2–3 dev platforms with backlinks. Pursue integration-ecosystem listings (LangChain/CrewAI/n8n/MCP).
- **Days 61–90:** Digital-PR push for links. Track keyword movement weekly in Search Console; double down on whichever link sources moved the needle.

## How to measure

- **Google Search Console** — track impressions/position for "internet for ai agents" and variants weekly. This is the source of truth, not the heyTony tool.
- **Backlink count** — watch referring domains grow (Ahrefs/Semrush free tier or GSC links report).
- **Re-run the heyTony audit** after deploy to confirm on-page checks flip to green.

Realistic expectation: on-page fixes can show movement in 2–6 weeks. Closing the authority gap to outrank a Cisco-backed domain is a 3–6 month effort driven by links and content, not a one-time change.

## Sources

- [AGNTCY.org — Building the Internet of Agents (IoA)](https://agntcy.org/)
- [Outshift (Cisco) | Internet of Agents](https://outshift.cisco.com/the-internet-of-agents)
- [AGNTCY on GitHub](https://github.com/agntcy)
