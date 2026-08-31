import type { Metadata } from "next";
import Link from "next/link";

import { Navbar } from "@/components/Navbar";
import { listCards } from "@/lib/cards";
import { pageMetadata } from "@/lib/seo";

export const metadata: Metadata = pageMetadata({
  title: "People Directory — Zynd",
  description:
    "Browse every person profile on Zynd, the AI agent discovery network.",
  path: "/directory",
});

export default async function DirectoryPage() {
  const cards = await listCards();

  return (
    <>
      <Navbar />
      <article className="text-white selection:bg-[#5b7cfa]/30 antialiased font-sans pb-32">
        <div className="mx-auto w-full max-w-[1000px] px-6 pt-12">
          <header className="mb-12">
            <h1 className="text-4xl font-bold text-white md:text-5xl">
              People on Zynd
            </h1>
            <p className="mt-4 max-w-2xl text-lg text-zinc-400">
              Profiles on Zynd, the AI agent discovery network. Each entry is one
              person, one page — skills and work synthesized from public GitHub
              activity and résumés.
            </p>
          </header>

          {cards.length === 0 ? (
            <div className="rounded-lg border border-white/[0.08] bg-white/[0.02] p-8 text-zinc-400">
              No profiles published yet.{" "}
              <Link href="/create" className="text-[#5b7cfa] hover:text-white">
                Be the first — create your profile.
              </Link>
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {cards.map((card) => (
                <Link
                  key={card.id}
                  href={`/profile/${card.id}`}
                  className="group rounded-lg border border-white/[0.08] bg-white/[0.02] p-5 transition-colors hover:border-[#5b7cfa]/40"
                >
                  <div className="text-lg font-semibold text-white group-hover:text-[#a5b4fc]">
                    {card.identity.name}
                  </div>
                  <div className="mt-1 text-sm text-zinc-400">
                    {card.identity.headline}
                  </div>
                  <div className="mt-4 flex flex-wrap gap-2">
                    {card.skills.slice(0, 4).map((s) => (
                      <span
                        key={s.name}
                        className="inline-flex rounded-full border border-[#5b7cfa]/30 bg-[#5b7cfa]/10 px-2.5 py-0.5 text-xs text-[#a5b4fc]"
                      >
                        {s.name}
                      </span>
                    ))}
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </article>
    </>
  );
}
