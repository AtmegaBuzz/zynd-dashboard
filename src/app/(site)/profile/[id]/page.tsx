import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { Navbar } from "@/components/Navbar";
import { fetchCard, type AgentProfileCard } from "@/lib/cards";
import { pageMetadata } from "@/lib/seo";

interface PageProps {
  params: Promise<{ id: string }>;
}

function buildJsonLd(card: AgentProfileCard) {
  const { identity } = card;
  const sameAs = [
    identity.links.github,
    identity.links.x,
    identity.links.linkedin,
    identity.links.website,
  ].filter((v): v is string => Boolean(v));
  return {
    "@context": "https://schema.org",
    "@type": "ProfilePage",
    dateCreated: card.created_at,
    dateModified: card.updated_at,
    mainEntity: {
      "@type": "Person",
      name: identity.name,
      description: identity.headline,
      image: identity.avatar_url || undefined,
      sameAs,
    },
  };
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params;
  const card = await fetchCard(id);
  if (!card) {
    return pageMetadata({
      title: "Profile not found",
      description: "This profile does not exist on Zynd.",
      path: `/profile/${id}`,
    });
  }
  const name = card.identity.name || "Profile";
  const headline = card.identity.headline;
  const title = headline ? `${name} — ${headline} — Zynd` : `${name} — Zynd`;
  return pageMetadata({
    title,
    description: card.citation_snippet,
    path: `/profile/${id}`,
  });
}

export default async function ProfilePage({ params }: PageProps) {
  const { id } = await params;
  const card = await fetchCard(id);
  if (!card) notFound();

  const { identity } = card;
  const initials = (identity.name || "?")
    .split(/\s+/)
    .map((p) => p[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();

  const updated = card.updated_at
    ? new Date(card.updated_at).toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      })
    : null;

  return (
    <>
      <Navbar />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(buildJsonLd(card)) }}
      />
      <article className="text-white selection:bg-[#5b7cfa]/30 antialiased font-sans pb-32">
        <div className="mx-auto w-full max-w-[720px] px-6 pt-10">
          <header className="flex items-center gap-5 pb-8 border-b border-white/[0.08]">
            <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-[#5b7cfa] to-[#8b5cf6] text-2xl font-bold text-white">
              {initials}
            </div>
            <div>
              <h1 className="text-3xl font-bold text-white md:text-4xl">
                {identity.name}
              </h1>
              <p className="text-lg text-zinc-400">{identity.headline}</p>
              {identity.location && (
                <p className="mt-1 text-sm text-zinc-500">{identity.location}</p>
              )}
            </div>
          </header>

          <p className="mt-8 border-l-2 border-[#5b7cfa] pl-4 text-xl leading-relaxed text-white">
            {card.citation_snippet}
          </p>

          <p className="mt-4 text-sm text-zinc-500">
            This profile is listed on Zynd, the AI agent discovery network.
            {updated ? ` Last updated: ${updated}.` : ""}
          </p>

          {card.summary && (
            <section className="mt-12">
              <h2 className="mb-4 text-lg font-bold text-white">About</h2>
              <p className="leading-relaxed text-zinc-300">{card.summary}</p>
            </section>
          )}

          {card.skills.length > 0 && (
            <section className="mt-12">
              <h2 className="mb-4 text-lg font-bold text-white">Skills</h2>
              <div className="flex flex-wrap gap-2">
                {card.skills.map((skill) => (
                  <span
                    key={skill.name}
                    className="inline-flex rounded-full border border-[#5b7cfa]/30 bg-[#5b7cfa]/10 px-3 py-1 text-sm text-[#a5b4fc]"
                  >
                    {skill.name}
                  </span>
                ))}
              </div>
            </section>
          )}

          {card.projects.length > 0 && (
            <section className="mt-12">
              <h2 className="mb-4 text-lg font-bold text-white">Projects</h2>
              <div className="grid gap-4 sm:grid-cols-2">
                {card.projects.map((project) => (
                  <div
                    key={project.name}
                    className="rounded-lg border border-white/[0.08] bg-white/[0.02] p-5"
                  >
                    <div className="font-semibold text-white">{project.name}</div>
                    {project.description && (
                      <p className="mt-2 text-sm leading-relaxed text-zinc-400">
                        {project.description}
                      </p>
                    )}
                    {project.url && (
                      <a
                        href={project.url}
                        target="_blank"
                        rel="noreferrer"
                        className="mt-3 inline-block text-sm text-[#5b7cfa] underline underline-offset-4 hover:text-white"
                      >
                        View project
                      </a>
                    )}
                  </div>
                ))}
              </div>
            </section>
          )}

          {Object.values(identity.links).filter(Boolean).length > 0 && (
            <section className="mt-12">
              <h2 className="mb-4 text-lg font-bold text-white">Links</h2>
              <div className="flex flex-wrap gap-3">
                {Object.entries(identity.links).map(([platform, url]) =>
                  url ? (
                    <a
                      key={platform}
                      href={url}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex rounded-md border border-white/10 bg-white/[0.03] px-3 py-1.5 text-sm text-zinc-300 transition-colors hover:border-white/30 hover:text-white"
                    >
                      {platform}
                    </a>
                  ) : null,
                )}
              </div>
            </section>
          )}

          <div className="mt-16 border-t border-white/[0.08] pt-8">
            <Link href="/directory" className="text-sm text-[#5b7cfa] hover:text-white">
              ← Back to the Zynd directory
            </Link>
          </div>
        </div>
      </article>
    </>
  );
}
