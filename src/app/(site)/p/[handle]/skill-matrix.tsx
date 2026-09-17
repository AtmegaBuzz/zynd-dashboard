"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { SkillBrandIcon } from "./skill-icon";

/** Skills shown before the "see all" toggle. */
const SKILLS_PREVIEW = 6;

const LEVEL_META: Record<string, { label: string; color: string; bar: string; glow: string; bars: number }> = {
  expert: { label: "Expert", color: "#D97706", bar: "#F59E0B", glow: "rgba(245,158,11,.4)", bars: 3 },
  advanced: { label: "Advanced", color: "#5448D4", bar: "#7B72E9", glow: "rgba(123,114,233,.35)", bars: 2 },
  intermediate: { label: "Mid", color: "#0284C7", bar: "#0EA5E9", glow: "rgba(14,165,233,.35)", bars: 1 },
  beginner: { label: "Beginner", color: "#059669", bar: "#10B981", glow: "rgba(16,185,129,.35)", bars: 1 },
};
const levelMeta = (l: string) => LEVEL_META[l.toLowerCase()] ?? LEVEL_META.intermediate;

const SKILL_ACCENTS: Record<string, string> = {
  rust: "#F97316", "c++": "#0070BA", cuda: "#5C9400", python: "#3776AB", kubernetes: "#326CE5",
  pytorch: "#EE4C2C", terraform: "#7B42BC", go: "#00ADD8", "distributed systems": "#0891B2",
  "performance testing": "#059669", sql: "#336791", "product management": "#DA552F",
  "ai technologies": "#10A37F", "rest apis": "#FF6C37", "agile/scrum": "#0052CC",
  html: "#E34F26", javascript: "#F7DF1E",
};
const skillAccent = (name: string) => SKILL_ACCENTS[name.trim().toLowerCase()] ?? "#7B72E9";

function alpha(hex: string, a: number): string {
  const n = Number.parseInt(hex.slice(1), 16);
  return `rgba(${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255}, ${a})`;
}

export function SkillMatrix({ skills, embedded = false }: { skills: { name: string; level: string }[]; embedded?: boolean }) {
  const [open, setOpen] = useState(false);
  const visible = open ? skills : skills.slice(0, SKILLS_PREVIEW);

  const body = (
    <>
      {!embedded && (
        <div className="flex items-center justify-between mb-4">
          <span className="font-mono text-[11px] uppercase font-bold tracking-wider text-[#8E8E88]">Skill Matrix</span>
          <span className="font-mono text-[10px] text-[#7B72E9] font-bold">{skills.length} TRACKED</span>
        </div>
      )}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {visible.map((skill) => {
          const meta = levelMeta(skill.level);
          const accent = skillAccent(skill.name);
          return (
            <div
              key={skill.name}
              className="flex flex-col items-center text-center p-3.5 rounded-2xl bg-white border border-[#c7d2fe] shadow-[0_1px_0_rgba(79,70,229,0.08)]"
            >
              <span
                className="w-12 h-12 rounded-2xl border flex items-center justify-center mb-2"
                style={{ background: alpha(accent, 0.12), borderColor: alpha(accent, 0.25) }}
              >
                <SkillBrandIcon name={skill.name} size={28} />
              </span>
              <span className="text-[12px] font-semibold text-[#1E1E1E] truncate max-w-full mb-1" title={skill.name}>
                {skill.name}
              </span>
              <span className="inline-flex items-center gap-1.5">
                <span className="font-mono text-[10px] font-bold" style={{ color: meta.color }}>{meta.label}</span>
                <span className="flex gap-[2px]" role="img" aria-label={`${meta.label}: ${meta.bars} of 3`}>
                  {[0, 1, 2].map((i) => (
                    <span
                      key={i}
                      className="w-2.5 h-1.5 rounded-sm"
                      style={i < meta.bars ? { background: meta.bar, boxShadow: `0 0 4px ${meta.glow}` } : { background: "#E2E8F0" }}
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
          style={{ color: "#4f46e5" }}
          className="mt-3 w-full flex items-center justify-center gap-1.5 py-2 rounded-xl border border-[#c7d2fe] bg-[#eef2ff] font-mono text-[10px] font-bold uppercase tracking-wider hover:bg-[#4f46e5] hover:!text-white transition-colors"
        >
          {open ? "Show less" : `See all ${skills.length} skills`}
          <ChevronDown
            size={16}
            strokeWidth={2.5}
            strokeLinecap="butt"
            strokeLinejoin="miter"
            style={{ transform: open ? "rotate(180deg)" : "none", transition: "transform .18s" }}
          />
        </button>
      )}
    </>
  );

  if (embedded) return <div id="skills">{body}</div>;
  return (
    <div className="bg-white border border-[#E5E5DE] rounded-[28px] p-6 bento-corner bento-corner-dark shadow-sm" id="skills">
      {body}
    </div>
  );
}
