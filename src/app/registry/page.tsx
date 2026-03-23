"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import Link from "next/link";
import {
  Search,
  Bot,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Filter,
  X,
  TrendingUp,
  Clock,
  Star,
  Linkedin,
  Github,
  Shield,
  FileSearch,
  BarChart3,
  Workflow,
  Brain,
  Code,
  Scale,
  Eye,
  Zap,
  Database,
  Network,
  Scan,
  Award,
  type LucideIcon,
} from "lucide-react";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { getAgents } from "@/apis/registry";
import { Agent, AgentStatus, GetAgentsParams } from "@/apis/registry/types";
import { Badge } from "@/components/ui/Badge";
import { Skeleton } from "@/components/ui/Skeleton";
import { AccentCorners } from "@/components/ui/AccentCorners";
import { GridTripod } from "@/components/ui/GridTripod";

const ITEMS_PER_PAGE = 24;

type SortOption = "newest" | "trending" | "top";

const SORT_OPTIONS: { label: string; value: SortOption; icon: typeof Clock }[] = [
  { label: "Newest", value: "newest", icon: Clock },
  { label: "Trending", value: "trending", icon: TrendingUp },
  { label: "Top Rated", value: "top", icon: Star },
];

const CATEGORIES = [
  { label: "All", value: "" },
  { label: "AI", value: "ai" },
  { label: "Fair Hiring", value: "fair_hiring" },
  { label: "Analysis", value: "analysis" },
  { label: "Orchestration", value: "orchestration" },
  { label: "Evidence", value: "evidence" },
  { label: "Matching", value: "matching" },
  { label: "Screening", value: "screening" },
  { label: "Ranking", value: "ranking" },
  { label: "Verification", value: "verification" },
  { label: "Credential", value: "credential" },
  { label: "Parsing", value: "parsing" },
  { label: "Extraction", value: "extraction" },
  { label: "Bias Detection", value: "bias_detection" },
  { label: "Explainability", value: "explainability" },
  { label: "NLP", value: "nlp" },
  { label: "Scoring", value: "scoring" },
  { label: "Automation", value: "automation" },
  { label: "Data", value: "data" },
  { label: "Integration", value: "integration" },
] as const;

const ICON_COLORS = [
  "#8B5CF6", "#3B82F6", "#F59E0B", "#EC4899", "#8B5CF6",
  "#06B6D4", "#F97316", "#10B981", "#6366F1", "#EF4444",
];

function getAgentIcon(name: string): { Icon: LucideIcon; color: string } {
  const lower = name.toLowerCase();
  if (lower.includes("linkedin")) return { Icon: Linkedin, color: "#0A66C2" };
  if (lower.includes("github")) return { Icon: Github, color: "#8B5CF6" };
  if (lower.includes("passport") || lower.includes("credential")) return { Icon: Shield, color: "#F59E0B" };
  if (lower.includes("ats") || lower.includes("screen")) return { Icon: Scan, color: "#EC4899" };
  if (lower.includes("skill")) return { Icon: Award, color: "#06B6D4" };
  if (lower.includes("bias")) return { Icon: Scale, color: "#EF4444" };
  if (lower.includes("orchestrat")) return { Icon: Workflow, color: "#F97316" };
  if (lower.includes("match")) return { Icon: Network, color: "#10B981" };
  if (lower.includes("codeforce") || lower.includes("leetcode") || lower.includes("code")) return { Icon: Code, color: "#3B82F6" };
  if (lower.includes("rank")) return { Icon: BarChart3, color: "#8B5CF6" };
  if (lower.includes("explain")) return { Icon: Eye, color: "#F59E0B" };
  if (lower.includes("research") || lower.includes("search")) return { Icon: FileSearch, color: "#06B6D4" };
  if (lower.includes("data")) return { Icon: Database, color: "#10B981" };
  if (lower.includes("ai") || lower.includes("agent")) return { Icon: Brain, color: "#8B5CF6" };
  const hash = name.split("").reduce((acc, ch) => acc + ch.charCodeAt(0), 0);
  const icons: LucideIcon[] = [Brain, Zap, Bot, FileSearch, Database, Network, Workflow, BarChart3];
  return { Icon: icons[hash % icons.length], color: ICON_COLORS[hash % ICON_COLORS.length] };
}

function statusToBadgeVariant(
  status: AgentStatus
): "active" | "inactive" | "deprecated" {
  switch (status) {
    case "ACTIVE": return "active";
    case "INACTIVE": return "inactive";
    case "DEPRECATED": return "deprecated";
  }
}

/* Inline overrides for solution-card-wrap/solution-card to prevent landing page layout */
const wrapStyle: React.CSSProperties = {
  position: "relative",
  top: "auto",
  padding: 0,
};
const cardStyle: React.CSSProperties = {
  display: "block",
  gridTemplateColumns: "none",
  minHeight: "auto",
  gap: 0,
  padding: 0,
  position: "relative",
  zIndex: 5,
  backgroundColor: "transparent",
  border: "none",
  borderRadius: 0,
};

const STATUS_OPTIONS: { label: string; value: AgentStatus | "ALL" }[] = [
  { label: "All Status", value: "ALL" },
  { label: "Active", value: "ACTIVE" },
  { label: "Inactive", value: "INACTIVE" },
  { label: "Deprecated", value: "DEPRECATED" },
];

function StatusDropdown({ value, onChange }: { value: AgentStatus | "ALL"; onChange: (v: AgentStatus | "ALL") => void }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const selected = STATUS_OPTIONS.find((o) => o.value === value);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  return (
    <div ref={ref} className="relative flex-1 sm:flex-none">
      <button
        type="button"
        onClick={() => setOpen((p) => !p)}
        className={`flex h-12 w-full sm:w-[160px] items-center gap-2 border px-3 text-sm text-white transition-colors ${
          open ? "border-[var(--color-accent)]/40" : "border-white/20"
        }`}
      >
        <Filter className="h-4 w-4 shrink-0 text-white/50" />
        <span className="flex-1 text-left">{selected?.label}</span>
        <ChevronDown className={`h-4 w-4 shrink-0 text-white/50 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>

      {open && (
        <div className="absolute left-0 top-[calc(100%+4px)] z-50 w-full sm:w-[160px] border border-white/20 bg-black py-1" style={{ boxShadow: "0 8px 30px rgba(0,0,0,0.6)" }}>
          {STATUS_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => { onChange(opt.value); setOpen(false); }}
              className={`flex w-full items-center px-3 py-2.5 text-left text-sm transition-colors ${
                value === opt.value
                  ? "text-[var(--color-accent)]"
                  : "text-white/70 hover:bg-white/[0.06] hover:text-white"
              }`}
            >
              {value === opt.value && <span className="mr-2 text-[var(--color-accent)]">&#10003;</span>}
              {opt.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function AgentCard({
  agent,
  href,
}: {
  agent: Agent;
  href: string;
}): React.ReactElement {
  const allCapabilities = agent.capabilities
    ? (Object.values(agent.capabilities).flat().filter(Boolean) as string[])
    : [];
  const displayCapabilities = allCapabilities.slice(0, 3);
  const remainingCount = allCapabilities.length - 3;
  const { Icon: AgentIcon, color: iconColor } = getAgentIcon(agent.name);

  const handleClick = () => {
    try {
      sessionStorage.setItem(`agent_${agent.id}`, JSON.stringify(agent));
    } catch {
      // sessionStorage unavailable — detail page will show loading state
    }
  };

  return (
    <Link href={href} onClick={handleClick} className={`group relative block h-full outline-none${agent.status !== "ACTIVE" ? " opacity-50" : ""}`}>
      {/* Card container with accent border overlay */}
      <div className="solution-card-wrap" style={{ ...wrapStyle, height: "100%" }}>
        <div className="solution-card" style={{ ...cardStyle, height: "100%" }}>
          <div className="relative flex h-full flex-col p-5" style={{ backgroundColor: "rgba(255,255,255,0.025)" }}>
            <div className="flex items-start gap-4">
              <div
                className="flex size-12 shrink-0 items-center justify-center rounded-lg border transition-all duration-300 group-hover:scale-105"
                style={{
                  backgroundColor: `color-mix(in srgb, ${iconColor} 12%, transparent)`,
                  borderColor: `color-mix(in srgb, ${iconColor} 20%, transparent)`,
                }}
              >
                <AgentIcon className="size-6 transition-transform duration-300 group-hover:scale-110" style={{ color: iconColor }} />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-start justify-between gap-2">
                  <p className="line-clamp-2 text-lg font-bold leading-tight text-white transition-colors group-hover:text-[var(--color-accent)]">
                    {agent.name}
                  </p>
                  <Badge variant={statusToBadgeVariant(agent.status)} className="mt-0.5 shrink-0">
                    {agent.status}
                  </Badge>
                </div>
                <p className="mt-1.5 line-clamp-2 text-sm text-white/60">
                  {agent.description || "No description available"}
                </p>
              </div>
            </div>

            <div className="mt-auto flex flex-col gap-3 pt-6">
              <div className="flex flex-wrap gap-1.5">
                {displayCapabilities.map((capability, idx) => (
                  <span
                    key={`${capability}-${idx}`}
                    className="inline-flex items-center rounded border border-[#8B5CF6]/25 bg-[#8B5CF6]/10 px-2 py-0.5 font-mono text-[11px] uppercase tracking-wider text-[#8B5CF6]"
                  >
                    {capability}
                  </span>
                ))}
                {remainingCount > 0 && (
                  <span className="inline-flex items-center rounded border border-white/15 bg-white/[0.08] px-2 py-0.5 font-mono text-[11px] uppercase tracking-wider text-white/60">
                    +{remainingCount} more
                  </span>
                )}
                {allCapabilities.length === 0 && (
                  <span className="inline-flex items-center rounded border border-white/15 bg-white/[0.08] px-2 py-0.5 font-mono text-[11px] italic text-white/40">
                    No capabilities
                  </span>
                )}
              </div>

              <div className="flex items-center border-t border-white/[0.08] pt-3 text-xs font-medium text-white/60 transition-colors group-hover:text-[#8B5CF6]">
                View Agent Details
                <ChevronRight className="ml-1 h-3.5 w-3.5 transition-transform group-hover:translate-x-1" />
              </div>
            </div>
          </div>
        </div>
        <div className="accent-border-overlay" style={{ opacity: 0.5, transition: "opacity 0.3s" }} />
        <div className="accent-background" />
        <div className="events-none absolute">
          <AccentCorners />
        </div>
      </div>
    </Link>
  );
}

function AgentCardSkeleton(): React.ReactElement {
  return (
    <div className="solution-card-wrap" style={wrapStyle}>
      <div className="solution-card" style={cardStyle}>
        <div className="p-5">
          <div className="flex items-start gap-4">
            <Skeleton className="size-12 shrink-0 rounded-lg bg-white/[0.08]" />
            <div className="min-w-0 flex-1">
              <Skeleton className="h-5 w-32 bg-white/[0.08]" />
              <Skeleton className="mt-2 h-4 w-full bg-white/[0.08]" />
              <Skeleton className="mt-1 h-4 w-3/4 bg-white/[0.08]" />
            </div>
          </div>
          <div className="mt-6 flex flex-wrap gap-1.5">
            <Skeleton className="h-5 w-20 rounded bg-white/[0.08]" />
            <Skeleton className="h-5 w-24 rounded bg-white/[0.08]" />
            <Skeleton className="h-5 w-16 rounded bg-white/[0.08]" />
          </div>
        </div>
      </div>
      <div className="accent-border-overlay" style={{ opacity: 0.4 }} />
      <div className="accent-background" />
    </div>
  );
}

function Pagination({
  currentPage,
  totalPages,
  onPageChange,
  totalItems,
  itemsPerPage,
}: {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  totalItems: number;
  itemsPerPage: number;
}): React.ReactElement | null {
  const startItem = (currentPage - 1) * itemsPerPage + 1;
  const endItem = Math.min(currentPage * itemsPerPage, totalItems);

  const getPageNumbers = (): (number | string)[] => {
    const pages: (number | string)[] = [];
    const maxVisiblePages = 5;

    if (totalPages <= maxVisiblePages) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      if (currentPage <= 3) {
        for (let i = 1; i <= 4; i++) pages.push(i);
        pages.push("...");
        pages.push(totalPages);
      } else if (currentPage >= totalPages - 2) {
        pages.push(1);
        pages.push("...");
        for (let i = totalPages - 3; i <= totalPages; i++) pages.push(i);
      } else {
        pages.push(1);
        pages.push("...");
        pages.push(currentPage - 1);
        pages.push(currentPage);
        pages.push(currentPage + 1);
        pages.push("...");
        pages.push(totalPages);
      }
    }
    return pages;
  };

  if (totalPages <= 1) return null;

  return (
    <div className="mt-10 flex flex-col items-center justify-between gap-4 sm:flex-row">
      <p className="text-sm text-white/50">
        Showing <span className="font-medium text-white/70">{startItem}</span> to{" "}
        <span className="font-medium text-white/70">{endItem}</span> of{" "}
        <span className="font-medium text-white/70">{totalItems}</span> agents
      </p>

      <div className="flex flex-wrap items-center gap-1">
        <button
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
          className="flex h-11 w-11 sm:h-9 sm:w-9 items-center justify-center border border-white/10 text-white transition-colors hover:border-[var(--color-accent)]/30 hover:text-[var(--color-accent)] disabled:cursor-not-allowed disabled:opacity-30"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>

        {getPageNumbers().map((page, idx) =>
          typeof page === "number" ? (
            <button
              key={idx}
              onClick={() => onPageChange(page)}
              className={`flex h-11 w-11 sm:h-9 sm:w-9 items-center justify-center text-sm font-medium transition-colors ${
                currentPage === page
                  ? "border border-[var(--color-accent)]/40 bg-[var(--color-accent)]/10 text-[var(--color-accent)]"
                  : "border border-white/10 text-white hover:border-[var(--color-accent)]/30 hover:text-[var(--color-accent)]"
              }`}
            >
              {page}
            </button>
          ) : (
            <span key={idx} className="px-2 text-white/30">{page}</span>
          )
        )}

        <button
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          className="flex h-11 w-11 sm:h-9 sm:w-9 items-center justify-center border border-white/10 text-white transition-colors hover:border-[var(--color-accent)]/30 hover:text-[var(--color-accent)] disabled:cursor-not-allowed disabled:opacity-30"
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}

export default function RegistryPage(): React.ReactElement {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<AgentStatus | "ALL">("ACTIVE");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [sortBy, setSortBy] = useState<SortOption>("newest");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalItems, setTotalItems] = useState(0);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(searchQuery), 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  useEffect(() => {
    setCurrentPage(1);
  }, [debouncedSearch, statusFilter, categoryFilter, sortBy]);

  const fetchAgents = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const params: GetAgentsParams = {
        limit: ITEMS_PER_PAGE,
        offset: (currentPage - 1) * ITEMS_PER_PAGE,
      };
      if (debouncedSearch.trim()) params.name = debouncedSearch.trim();
      if (categoryFilter) params.capabilities = [categoryFilter];
      if (statusFilter !== "ALL") params.status = statusFilter;

      const response = await getAgents(params);
      setAgents(response.data);
      setTotalItems(response.total);
    } catch (err) {
      setError("Failed to load agents. Please try again.");
      console.error("Error fetching agents:", err);
    } finally {
      setLoading(false);
    }
  }, [currentPage, debouncedSearch, statusFilter, categoryFilter]);

  useEffect(() => {
    fetchAgents();
  }, [fetchAgents]);

  const sortedAgents = [...agents].sort((a, b) => {
    // Active agents always come first
    if (a.status === "ACTIVE" && b.status !== "ACTIVE") return -1;
    if (b.status === "ACTIVE" && a.status !== "ACTIVE") return 1;

    switch (sortBy) {
      case "newest":
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      case "trending": {
        const aCaps = a.capabilities ? Object.values(a.capabilities).flat().length : 0;
        const bCaps = b.capabilities ? Object.values(b.capabilities).flat().length : 0;
        return bCaps - aCaps;
      }
      case "top":
        return a.name.localeCompare(b.name);
      default:
        return 0;
    }
  });

  const totalPages = Math.ceil(totalItems / ITEMS_PER_PAGE);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const clearFilters = () => {
    setSearchQuery("");
    setDebouncedSearch("");
    setStatusFilter("ALL");
    setCategoryFilter("");
    setCurrentPage(1);
  };

  const hasActiveFilters = searchQuery.trim() || statusFilter !== "ALL" || categoryFilter !== "";

  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-black">
        <div className="padding-global">
          <div className="container">
            <div className="relative" style={{ paddingTop: "1.5rem", paddingBottom: "4rem" }}>

              {/* ── Header with accent ── */}
              <div className="solution-card-wrap" style={wrapStyle}>
                <div className="solution-card" style={cardStyle}>
                  <div style={{ padding: "1.5rem 2.5rem", textAlign: "center" }}>
                    <p style={{ fontSize: "clamp(2rem, 5vw, 3.5rem)", fontWeight: 700, color: "white", margin: 0, lineHeight: 1.1 }}>
                      Agent <span style={{ color: "var(--color-accent)" }}>Registry</span>
                    </p>
                    <p className="mx-auto text-base text-white/50" style={{ maxWidth: "36rem", marginTop: "0.75rem" }}>
                      Discover and connect with AI agents registered on the ZyndAI network. Find the perfect agent for your needs.
                    </p>
                  </div>
                </div>
                <div className="accent-border-overlay" />
                <div className="accent-background" />
                <div className="events-none absolute">
                  <AccentCorners />
                </div>
                <GridTripod corner="left-top-corner" />
                <GridTripod corner="right-top-corner" />
                <GridTripod corner="left-bottom-corner" />
                <GridTripod corner="right-bottom-corner" />
                <div className="main-hero-bottom-line" />
                <div className="main-hero-top-line" />
              </div>

              {/* ── Search & Filters ── */}
              <div className="solution-card-wrap" style={wrapStyle}>
                <div className="solution-card" style={cardStyle}>
                  <div style={{ padding: "1.5rem 2.5rem" }}>
                    {/* Search row */}
                    <div className="flex flex-col gap-3 sm:flex-row">
                      <div className="relative flex-1">
                        <Search className="absolute left-4 top-1/2 size-5 -translate-y-1/2 text-[var(--color-accent)]/50" />
                        <input
                          type="text"
                          placeholder="Search agents by name..."
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          className="h-12 w-full border border-white/20 bg-transparent pl-12 pr-4 text-sm text-white outline-none transition-colors placeholder:text-white/50 focus:border-[var(--color-accent)]/60"
                        />
                      </div>

                      <div className="flex gap-2">
                        <StatusDropdown value={statusFilter} onChange={setStatusFilter} />

                        {SORT_OPTIONS.map((opt) => (
                          <button
                            key={opt.value}
                            onClick={() => setSortBy(opt.value)}
                            className={`hidden sm:flex h-12 items-center gap-2 px-4 text-sm font-medium transition-colors ${
                              sortBy === opt.value
                                ? "border border-[var(--color-accent)]/40 bg-[var(--color-accent)]/10 text-[var(--color-accent)]"
                                : "border border-white/20 bg-transparent text-white/60 hover:border-white/30 hover:text-white"
                            }`}
                          >
                            <opt.icon className="h-4 w-4" />
                            {opt.label}
                          </button>
                        ))}

                        {hasActiveFilters && (
                          <button
                            onClick={clearFilters}
                            className="flex h-12 items-center gap-2 border border-white/20 bg-transparent px-4 text-sm text-white transition-colors hover:border-white/30"
                          >
                            <X className="h-4 w-4" />
                            Clear
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Categories */}
                    <div className="mt-4 flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
                      {CATEGORIES.map((cat) => (
                        <button
                          key={cat.value}
                          onClick={() => setCategoryFilter(cat.value)}
                          className={`shrink-0 px-4 py-2 text-sm font-medium transition-colors ${
                            categoryFilter === cat.value
                              ? "bg-[var(--color-accent)] text-white"
                              : "border border-white/10 text-white/70 hover:border-white/20 hover:text-white"
                          }`}
                        >
                          {cat.label}
                        </button>
                      ))}
                    </div>

                    {/* Results count */}
                    <div className="mt-4 flex flex-wrap items-center gap-2">
                      <p className="text-sm text-white/50">
                        {loading ? "Searching..." : (
                          <><span className="font-medium text-[var(--color-accent)]">{totalItems}</span> agent{totalItems !== 1 ? "s" : ""} found</>
                        )}
                      </p>
                      {hasActiveFilters && (
                        <div className="ml-2 flex flex-wrap gap-2">
                          {debouncedSearch && (
                            <Badge className="border-[#8B5CF6]/20 bg-[#8B5CF6]/10 text-[#8B5CF6]">
                              Name: &quot;{debouncedSearch}&quot;
                            </Badge>
                          )}
                          {statusFilter !== "ALL" && (
                            <Badge className="border-[#8B5CF6]/20 bg-[#8B5CF6]/10 text-[#8B5CF6]">
                              Status: {statusFilter}
                            </Badge>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
                <div className="accent-border-overlay" />
                <div className="accent-background" />
                <div className="events-none absolute">
                  <AccentCorners />
                </div>
                <div className="middle-hero-second-line" />
                <div className="middle-hero-right-second-line" />
              </div>

              {/* ── Agent Grid ── */}
              {loading && (
                <div className="mt-8 grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
                  {Array.from({ length: 6 }).map((_, i) => (
                    <AgentCardSkeleton key={i} />
                  ))}
                </div>
              )}

              {!loading && error && (
                <div className="mt-8 solution-card-wrap" style={wrapStyle}>
                  <div className="solution-card" style={{ ...cardStyle, padding: "3rem", textAlign: "center" }}>
                    <p className="font-medium text-red-400">{error}</p>
                    <button
                      onClick={fetchAgents}
                      className="mt-4 border border-[var(--color-accent)]/40 bg-black px-6 py-2.5 text-sm font-medium text-[var(--color-accent)] transition-all hover:border-[var(--color-accent)] hover:shadow-[0_0_16px_rgba(191,64,255,0.15)]"
                    >
                      Try Again
                    </button>
                  </div>
                  <div className="accent-border-overlay" />
                  <div className="accent-background" />
                </div>
              )}

              {!loading && !error && agents.length > 0 && (
                <>
                  <div className="mt-8 grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
                    {sortedAgents.map((agent) => (
                      <AgentCard
                        key={agent.id}
                        agent={agent}
                        href={`/registry/${agent.id}`}
                      />
                    ))}
                  </div>

                  <Pagination
                    currentPage={currentPage}
                    totalPages={totalPages}
                    onPageChange={handlePageChange}
                    totalItems={totalItems}
                    itemsPerPage={ITEMS_PER_PAGE}
                  />
                </>
              )}

              {!loading && !error && agents.length === 0 && (
                <div className="mt-8 solution-card-wrap" style={wrapStyle}>
                  <div className="solution-card" style={{ ...cardStyle, padding: "4rem", textAlign: "center" }}>
                    <Bot className="mx-auto mb-4 size-16 text-white/20" />
                    <p className="mb-2 text-xl font-semibold text-white/70">No agents found</p>
                    <p className="mb-6 text-white/50">
                      {hasActiveFilters ? "Try adjusting your search or filters" : "No agents have been registered yet"}
                    </p>
                    {hasActiveFilters && (
                      <button
                        onClick={clearFilters}
                        className="border border-[var(--color-accent)]/40 bg-black px-6 py-2.5 text-sm font-medium text-[var(--color-accent)] transition-all hover:border-[var(--color-accent)]"
                      >
                        Clear Filters
                      </button>
                    )}
                  </div>
                  <div className="accent-border-overlay" />
                  <div className="accent-background" />
                  <div className="events-none absolute">
                    <AccentCorners />
                  </div>
                </div>
              )}

              {/* Page-level grid decoration */}
              <div className="middle-hero-right-second-line is-hide-mb" />
              <div className="middle-hero-second-line is-hide-mb" />
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
