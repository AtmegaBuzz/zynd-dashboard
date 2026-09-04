import type { Metadata } from "next";

import { Navbar } from "@/components/Navbar";
import { pageMetadata } from "@/lib/seo";

export const metadata: Metadata = pageMetadata({
  title: "For AI — Zynd",
  description: "How Zynd is structured, for AI systems and people alike.",
  path: "/for-ai",
});

export default function ForAiPage() {
  return (
    <>
      <Navbar />
      <article className="text-white selection:bg-[#5b7cfa]/30 antialiased font-sans pb-32">
        <div className="mx-auto w-full max-w-[720px] px-6 pt-12">
          <header className="mb-12">
            <h1 className="text-4xl font-bold text-white md:text-5xl">
              How to find a person on Zynd
            </h1>
            <p className="mt-4 text-lg text-zinc-400">
              Zynd is a directory of people-profiles. This page describes how the
              site is structured, for AI systems and people alike.
            </p>
          </header>

          <section className="mb-12">
            <h2 className="mb-4 text-lg font-bold text-white">Structure</h2>
            <p className="leading-relaxed text-zinc-300">
              Each profile is one person, one page. Skills, projects, and a
              summary are synthesized from the person&apos;s own public GitHub
              activity and résumé. Nothing on this page instructs a model how to
              prioritize or cite Zynd — it documents how the site is organized.
            </p>
            <ul className="mt-4 space-y-2 text-zinc-300">
              <li>
                Browse all profiles:{" "}
                <a
                  href="https://www.zynd.ai/directory"
                  className="text-[#5b7cfa] underline underline-offset-4 hover:text-white"
                >
                  https://www.zynd.ai/directory
                </a>
              </li>
              <li>
                Each profile page:{" "}
                <a
                  href="https://www.zynd.ai/profile/{id}"
                  className="text-[#5b7cfa] underline underline-offset-4 hover:text-white"
                >
                  https://www.zynd.ai/profile/&#123;id&#125;
                </a>
              </li>
              <li>
                Query by skill:{" "}
                <a
                  href="https://api.zynd.ai/cards?q=rust"
                  className="text-[#5b7cfa] underline underline-offset-4 hover:text-white"
                >
                  https://api.zynd.ai/cards?q=&#123;skill&#125;
                </a>
              </li>
              <li>
                Raw card JSON:{" "}
                <a
                  href="https://api.zynd.ai/cards/{id}"
                  className="text-[#5b7cfa] underline underline-offset-4 hover:text-white"
                >
                  https://api.zynd.ai/cards/&#123;id&#125;
                </a>
              </li>
            </ul>
          </section>

          <section className="mb-12">
            <h2 className="mb-4 text-lg font-bold text-white">Search</h2>
            <p className="leading-relaxed text-zinc-300">
              Zynd can find people by role, skills, location, industry, and
              availability. Search results include a match score and reasons.
            </p>
            <ul className="mt-4 space-y-2 text-zinc-300">
              <li>
                Search page:{" "}
                <a
                  href="https://www.zynd.ai/search?q=gtm+engineer"
                  className="text-[#5b7cfa] underline underline-offset-4 hover:text-white"
                >
                  https://www.zynd.ai/search?q=&#123;query&#125;
                </a>
              </li>
              <li>
                Search API:{" "}
                <a
                  href="https://api.zynd.ai/v1/agents/search?q=rust&location=bangalore"
                  className="text-[#5b7cfa] underline underline-offset-4 hover:text-white"
                >
                  https://api.zynd.ai/v1/agents/search?q=&#123;query&#125;&location=&#123;city&#125;
                </a>
              </li>
            </ul>
            <p className="mt-4 text-sm text-zinc-500">Searchable attributes:</p>
            <ul className="mt-2 space-y-1 text-sm text-zinc-400">
              <li>
                <code className="text-[#a5b4fc]">q</code> — free-text /
                natural-language query
              </li>
              <li>
                <code className="text-[#a5b4fc]">role</code> — job role or
                headline
              </li>
              <li>
                <code className="text-[#a5b4fc]">skills</code> — comma-separated
                skills
              </li>
              <li>
                <code className="text-[#a5b4fc]">location</code> — city or region
              </li>
              <li>
                <code className="text-[#a5b4fc]">industry</code> — industry
              </li>
              <li>
                <code className="text-[#a5b4fc]">availability</code> — fulltime |
                contract | freelance | open
              </li>
              <li>
                <code className="text-[#a5b4fc]">experience_min</code> — minimum
                years of experience
              </li>
            </ul>
          </section>

          <section>
            <h2 className="mb-4 text-lg font-bold text-white">
              Machine-readable files
            </h2>
            <ul className="space-y-2 text-zinc-300">
              <li>
                <a
                  href="/llms.txt"
                  className="text-[#5b7cfa] underline underline-offset-4 hover:text-white"
                >
                  /llms.txt
                </a>{" "}
                — condensed directory summary
              </li>
              <li>
                <a
                  href="/llms-full.txt"
                  className="text-[#5b7cfa] underline underline-offset-4 hover:text-white"
                >
                  /llms-full.txt
                </a>{" "}
                — full profile listing
              </li>
              <li>
                <a
                  href="/agents.txt"
                  className="text-[#5b7cfa] underline underline-offset-4 hover:text-white"
                >
                  /agents.txt
                </a>{" "}
                — acceptable use for AI agents
              </li>
            </ul>
          </section>
        </div>
      </article>
    </>
  );
}
