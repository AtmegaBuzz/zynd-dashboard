# Zynd profile card — what happens, what we take, what they see

Plain notes. No marketing words. Use these to write your messages to people.

## The whole thing in one line

A person pastes their public links (GitHub, LinkedIn, X, website, or a resume file). We scrape what is already public, build a clean profile page for them at zynd.ai/p/theirname, they review it once, and it goes live. AI agents can then find them on Zynd. Sign-in is optional and only needed if they want to edit it later.

## The exact flow (links)

1. `zynd.ai/create` — the form. They paste links. No sign-in needed at this step.
2. They hit "Build my card". We scrape. While scraping, we ask 6 small questions (what are you working on, what can you help with, who do you want to connect with, what do you love talking about, where are you based, got a Calendly). These are optional, they can skip all of them.
3. Review screen — they see every line we extracted. They can edit anything, remove anything (projects, posts, photo, links). Nothing is live yet.
4. "Publish my card" — now it is live at zynd.ai/p/{handle}.
5. After publishing we show one screen: "your profile is live, here is the link" + a sign-in option (Google/GitHub) so they can claim it and edit later. Signing in is not required to publish.
6. Editing later: zynd.ai/create?edit={handle} (or the "Edit my card" button on their profile page).

## What we extract from each source

Only public data. No passwords, no DMs, no private profiles.

- **GitHub** — name, bio, avatar, repos (top 30 by recent update), languages used, stars, what they pushed recently, commit messages and PR titles as project context. Also the contribution graph (green squares) and total commits. Note: the graph needs our GitHub token wired in — being fixed, currently the rest of GitHub works.
- **X / Twitter** — name, handle, bio, followers, tweet count, verified badge, and their latest 7 posts (their own only, newest first, replies and retweets skipped).
- **LinkedIn** — name, headline, about, location, skills, top 3 jobs, connections count, and their latest 7 posts (their own only). Note: LinkedIn scraping runs on Apify which hit its free limit for this month — until the plan is upgraded, LinkedIn falls back to a basic read of the page (headline/about still come through, posts may be missing).
- **Website** — whatever text is public on the page they linked.
- **Resume upload (optional)** — PDF or DOCX. This is used to build the card but never shown as a file anywhere.

## What the final profile page looks like

One page at zynd.ai/p/{handle} with:

- Name, headline, location, avatar, links (GitHub, X, LinkedIn, website)
- A short summary (2-3 sentences, written from their data)
- Skills list (with a level and how much evidence we have for each)
- Projects (from GitHub repos / websites, with stars and tech used)
- Posts — their recent X tweets and LinkedIn posts, quoted
- Stats row: GitHub repos, active repos, top languages, total commits, X followers, LinkedIn connections, and the GitHub contribution graph
- Facts searchable by AI agents (e.g. "Name — working on X — Zynd")
- Optional: what they are working on, what they can help with, who they want to connect with, topics they love talking about, availability, Calendly link

## What the person actually has to do

1. Open zynd.ai/create
2. Paste 1-4 public links (GitHub/LinkedIn/X/website). That is the whole input.
3. Answer up to 6 optional questions (or skip).
4. Look at the review screen, remove or edit anything they don't like.
5. Click Publish.

That's it. About 2-3 minutes. Sign-in is optional and comes after publishing, only to keep edit rights.

## Things worth saying when you message people

- "Everything on your card already exists publicly — we just organize it."
- "You review and approve every line before it goes live."
- "No login needed to try it. Sign in only if you want to edit it later."
- "The point is AI agents can find you — ChatGPT, Claude, Perplexity — when someone asks 'who can help with X'."
- "If you don't like it, you can delete/remove anything before publishing, or not publish at all."

## Known gaps (be honest if asked)

- GitHub contribution graph: waiting on a GitHub token — will work shortly.
- LinkedIn posts: blocked by Apify free-plan limit this month — fixed as soon as the plan is upgraded; profile basics still work.
- X posts: fully working.