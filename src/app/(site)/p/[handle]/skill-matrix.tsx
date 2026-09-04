"use client";

import { useState } from "react";
import { ChevronDown, Code2 } from "lucide-react";

/** Skills shown before the "see all" toggle. */
const SKILLS_PREVIEW = 3;

/** `bars` fills the 3-segment gauge; `glow` is the lit-segment halo. */
const LEVEL_META: Record<string, { label: string; color: string; bar: string; glow: string; bars: number }> = {
  expert: { label: "Expert", color: "#D97706", bar: "#F59E0B", glow: "rgba(245,158,11,.4)", bars: 3 },
  advanced: { label: "Advanced", color: "#5448D4", bar: "#7B72E9", glow: "rgba(123,114,233,.35)", bars: 2 },
  intermediate: { label: "Mid", color: "#0284C7", bar: "#0EA5E9", glow: "rgba(14,165,233,.35)", bars: 1 },
  beginner: { label: "Beginner", color: "#059669", bar: "#10B981", glow: "rgba(16,185,129,.35)", bars: 1 },
};
const levelMeta = (l: string) => LEVEL_META[l.toLowerCase()] ?? LEVEL_META.intermediate;

const SKILL_SLUGS: Record<string, string> = {
  rust: "rust", "c++": "cplusplus", cuda: "nvidia", python: "python", kubernetes: "kubernetes",
  pytorch: "pytorch", terraform: "terraform", go: "go", golang: "go", typescript: "typescript",
  javascript: "javascript", react: "react", docker: "docker", postgresql: "postgresql",
  redis: "redis", tensorflow: "tensorflow", linux: "linux", git: "git",
};

const SKILL_ACCENTS: Record<string, string> = {
  rust: "#F97316", "c++": "#0070BA", cuda: "#5C9400", python: "#0284C7", kubernetes: "#6366F1",
  pytorch: "#E11D48", terraform: "#9333EA", go: "#14B8A6", "distributed systems": "#0891B2",
  "performance testing": "#059669",
};
const skillAccent = (name: string) => SKILL_ACCENTS[name.trim().toLowerCase()] ?? "#7B72E9";

/** #rrggbb → rgba(), for the 10%-tint fills the icon tiles use. */
function alpha(hex: string, a: number): string {
  const n = Number.parseInt(hex.slice(1), 16);
  return `rgba(${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255}, ${a})`;
}

function SkillGlyph({ name, color }: { name: string; color: string }) {
  const slug = SKILL_SLUGS[name.trim().toLowerCase()];
  if (slug) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={`https://cdn.simpleicons.org/${slug}`}
        alt=""
        width={14}
        height={14}
        style={{ width: 14, height: 14, objectFit: "contain", flexShrink: 0 }}
      />
    );
  }
  return <Code2 size={14} style={{ color }} />;
}

export function SkillMatrix({ skills }: { skills: { name: string; level: string }[] }) {
  const [open, setOpen] = useState(false);
  const visible = open ? skills : skills.slice(0, SKILLS_PREVIEW);

  return (
    <div className="bg-white border border-[#E5E5DE] rounded-[28px] p-6 bento-corner bento-corner-dark shadow-sm" id="skills">
      <div className="flex items-center justify-between mb-4">
        <span className="font-mono text-[11px] uppercase font-bold tracking-wider text-[#8E8E88]">Skill Matrix</span>
        <span className="font-mono text-[10px] text-[#7B72E9] font-bold">{skills.length} TRACKED</span>
      </div>
      <div className="flex flex-col gap-1.5">
        {visible.map((skill) => {
          const meta = levelMeta(skill.level);
          const accent = skillAccent(skill.name);
          return (
            <div
              key={skill.name}
              className="flex items-center justify-between gap-2 px-3 py-2 rounded-xl bg-[#F7F7F4] border border-[#E8E8E1] hover:border-[#D5D5CE] transition-colors"
            >
              <span className="flex items-center gap-2.5 min-w-0">
                <span
                  className="w-7 h-7 rounded-lg border flex items-center justify-center shrink-0"
                  style={{ background: alpha(accent, 0.1), borderColor: alpha(accent, 0.2) }}
                >
                  <SkillGlyph name={skill.name} color={accent} />
                </span>
                <span className="text-[13px] font-semibold tracking-tight text-[#1E1E1E] truncate">{skill.name}</span>
              </span>
              <span className="flex items-center gap-2 shrink-0">
                <span className="font-mono text-[10px] font-bold" style={{ color: meta.color }}>{meta.label}</span>
                <span className="flex items-center gap-1" role="img" aria-label={`${meta.label}: ${meta.bars} of 3`}>
                  {[0, 1, 2].map((i) => (
                    <span
                      key={i}
                      className="w-3.5 h-1 rounded-sm"
                      style={i < meta.bars ? { background: meta.bar, boxShadow: `0 0 4px ${meta.glow}` } : { background: "#E2E2DB" }}
                    />
                  ))}
                </span>
              </span>
            </div>
          );
        })}
      </div>
      {skills.length > SKILLS_PREVIEW && (
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          style={{ color: "#7B72E9" }}
          className="mt-3 w-full flex items-center justify-center gap-1.5 py-2.5 rounded-xl border-2 border-[#7B72E9] font-mono text-[10px] font-bold uppercase tracking-wider hover:bg-[#7B72E9] hover:!text-white transition-colors"
        >
          {open ? "Show less" : `See all ${skills.length} skills`}
          {/* squarer + heavier than lucide's default, to read like the Material
              Symbols `expand_more` glyph this card was designed against */}
          <ChevronDown
            size={16}
            strokeWidth={2.5}
            strokeLinecap="butt"
            strokeLinejoin="miter"
            style={{ transform: open ? "rotate(180deg)" : "none", transition: "transform .18s" }}
          />
        </button>
      )}
    </div>
  );
}
