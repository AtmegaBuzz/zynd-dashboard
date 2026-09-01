import type { Metadata } from "next";
import Link from "next/link";

import { Navbar } from "@/components/Navbar";
import { searchAgents } from "@/lib/cards";
import { pageMetadata } from "@/lib/seo";

export const metadata: Metadata = pageMetadata({
  title: "Search People — Zynd",
  description:
    "Search Zynd's directory of AI-discoverable people by role, skills, location, industry, and availability.",
  path: "/search",
});

interface PageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

function val(
  sp: Record<string, string | string[] | undefined>,
  k: string,
): string {
  const v = sp[k];
  return typeof v === "string" ? v : "";
}

export default async function SearchPage({ searchParams }: PageProps) {
  const sp = await searchParams;
  const q = val(sp, "q");
  const role = val(sp, "role");
  const location = val(sp, "location");
  const skills = val(sp, "skills");
  const industry = val(sp, "industry");
  const availability = val(sp, "availability");
  const experience_min = val(sp, "experience_min");

  const hasQuery = Boolean(
    q || role || location || skills || industry || availability || experience_min,
  );
  const data = hasQuery
    ? await searchAgents({
        q,
        role,
        location,
        skills,
        industry,
        availability,
        experience_min,
      })
    : null;

  return (
    <>
      <Navbar />
      <article className="text-white selection:bg-[#5b7cfa]/30 antialiased font-sans pb-32">
        <div className="mx-auto w-full max-w-[1000px] px-6 pt-12">
          <header className="mb-10">
            <h1 className="text-4xl font-bold text-white md:text-5xl">
              Find people on Zynd
            </h1>
            <p className="mt-4 max-w-2xl text-lg text-zinc-400">
              Search Zynd&apos;s directory of AI-discoverable people by role,
              skills, location, industry, and availability.
            </p>
          </header>

          <form
            method="get"
            action="/search"
            className="mb-12 grid gap-3 rounded-lg border border-white/[0.08] bg-white/[0.02] p-5 sm:grid-cols-2 lg:grid-cols-3"
          >
            <input
              name="q"
              defaultValue={q}
              placeholder="Search — e.g. GTM engineer, rust developer…"
              className="border border-white/[0.08] bg-transparent px-3 py-2 text-sm text-white outline-none transition-colors placeholder:text-white/25 focus:border-[#5b7cfa]/40 sm:col-span-2 lg:col-span-3"
            />
            <input
              name="location"
              defaultValue={location}
              placeholder="Location (e.g. Bangalore)"
              className="border border-white/[0.08] bg-transparent px-3 py-2 text-sm text-white outline-none transition-colors placeholder:text-white/25 focus:border-[#5b7cfa]/40"
            />
            <input
              name="skills"
              defaultValue={skills}
              placeholder="Skills (comma-separated)"
              className="border border-white/[0.08] bg-transparent px-3 py-2 text-sm text-white outline-none transition-colors placeholder:text-white/25 focus:border-[#5b7cfa]/40"
            />
            <input
              name="availability"
              defaultValue={availability}
              placeholder="Availability (fulltime/contract/freelance/open)"
              className="border border-white/[0.08] bg-transparent px-3 py-2 text-sm text-white outline-none transition-colors placeholder:text-white/25 focus:border-[#5b7cfa]/40"
            />
            <input
              name="experience_min"
              type="number"
              defaultValue={experience_min}
              placeholder="Min years experience"
              className="border border-white/[0.08] bg-transparent px-3 py-2 text-sm text-white outline-none transition-colors placeholder:text-white/25 focus:border-[#5b7cfa]/40"
            />
            <button
              type="submit"
              className="inline-flex items-center justify-center rounded-md border border-[#5b7cfa] bg-[#5b7cfa] px-5 py-2 text-sm font-semibold text-white transition-colors hover:bg-[#4a67e0]"
            >
              Search
            </button>
          </form>

          {hasQuery && (
            <section aria-label="Search results">
              <h2 className="mb-4 text-lg font-bold text-white">
                Results{data ? ` (${data.results.length})` : ""}
              </h2>

              {data && data.results.length > 0 ? (
                <ol className="grid gap-4">
                  {data.results.map((r) => (
                    <li key={r.agent_id}>
                      <Link
                        href={r.handle ? `/p/${r.handle}` : `/profile/${r.agent_id}`}
                        className="group block rounded-lg border border-white/[0.08] bg-white/[0.02] p-5 transition-colors hover:border-[#5b7cfa]/40"
                      >
                        <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                          <span className="text-lg font-semibold text-white group-hover:text-[#a5b4fc]">
                            {r.name}
                          </span>
                          {r.location && (
                            <span className="text-sm text-zinc-400">
                              {r.location}
                            </span>
                          )}
                          {r.match_score > 0 && (
                            <span className="rounded-full border border-[#5b7cfa]/30 bg-[#5b7cfa]/10 px-2 py-0.5 font-mono text-xs text-[#a5b4fc]">
                              {Math.round(r.match_score * 100)}% match
                            </span>
                          )}
                        </div>

                        {r.headline && (
                          <div className="mt-1 text-zinc-400">{r.headline}</div>
                        )}

                        {r.skills.length > 0 && (
                          <div className="mt-3 flex flex-wrap gap-2">
                            {r.skills.slice(0, 6).map((s) => (
                              <span
                                key={s}
                                className="inline-flex rounded-full border border-[#5b7cfa]/30 bg-[#5b7cfa]/10 px-2.5 py-0.5 text-xs text-[#a5b4fc]"
                              >
                                {s}
                              </span>
                            ))}
                          </div>
                        )}

                        {(r.experience_years != null || r.availability) && (
                          <div className="mt-3 text-sm text-zinc-500">
                            {r.experience_years != null &&
                              `${r.experience_years} years experience`}
                            {r.experience_years != null && r.availability && " · "}
                            {r.availability && `Available for ${r.availability}`}
                          </div>
                        )}

                        {r.match_reasons.length > 0 && (
                          <div className="mt-3 text-sm text-zinc-500">
                            Why:{" "}
                            <span className="text-zinc-400">
                              {r.match_reasons.join(" · ")}
                            </span>
                          </div>
                        )}
                      </Link>
                    </li>
                  ))}
                </ol>
              ) : data && data.results.length === 0 ? (
                <p className="text-zinc-400">
                  No matches found. Try a broader query, or{" "}
                  <Link href="/create" className="text-[#5b7cfa] hover:text-white">
                    create your profile
                  </Link>
                  .
                </p>
              ) : null}
            </section>
          )}
        </div>
      </article>
    </>
  );
}
