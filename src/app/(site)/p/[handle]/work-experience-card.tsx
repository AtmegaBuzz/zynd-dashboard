"use client";

import { useState } from "react";

export type WorkJob = {
  title: string;
  company: string;
  company_logo?: string;
  employment_type?: string;
  start_date?: string;
  end_date?: string;
  duration?: string;
  location?: string;
  description?: string;
};

function isCurrent(end?: string) {
  return /^(present|current|now)$/i.test((end || "").trim());
}

function jobLogoSrc(logo?: string): string | null {
  if (!logo) return null;
  try {
    const u = new URL(logo);
    if (u.protocol !== "http:" && u.protocol !== "https:") return null;
    if (u.hostname.includes("clearbit.com")) {
      const host = u.pathname.replace(/^\//, "").split("/")[0];
      return host ? `https://www.google.com/s2/favicons?domain=${encodeURIComponent(host)}&sz=128` : null;
    }
    if (u.hostname.includes("licdn.com") || u.hostname.includes("linkedin.com")) return null;
    return logo;
  } catch {
    return null;
  }
}

function JobLogo({ src, name }: { src?: string | null; name: string }) {
  const [dead, setDead] = useState(false);
  const initial = (name || "?").charAt(0).toUpperCase();
  const resolved = src && !dead ? src : null;
  if (!resolved) {
    return (
      <div style={{ width: 40, height: 40, borderRadius: 8, background: "#0f172a", color: "#fff", fontWeight: 800, fontSize: 14, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
        {initial}
      </div>
    );
  }
  return (
    <img
      src={resolved}
      alt=""
      onError={() => setDead(true)}
      style={{ width: 40, height: 40, borderRadius: 8, objectFit: "contain", border: "1px solid #e2e8f0", background: "#fff", flexShrink: 0, padding: 4 }}
    />
  );
}

function JobRow({ job, first }: { job: WorkJob; first: boolean }) {
  const current = isCurrent(job.end_date);
  const when = [job.start_date, job.end_date || (current ? "Present" : "")].filter(Boolean).join(" – ");
  const whenDur = [when, job.duration].filter(Boolean).join(" · ");
  return (
    <div style={{ display: "flex", gap: 10, padding: "10px 0", borderTop: first ? "none" : "1px solid #f1f5f9" }}>
      <JobLogo src={jobLogoSrc(job.company_logo)} name={job.company || job.title} />
      <div style={{ minWidth: 0, flex: 1 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
          <div style={{ fontSize: "0.88rem", fontWeight: 700, color: "#191919", lineHeight: 1.25 }}>{job.title || job.company}</div>
          {current && (
            <span className="pf-mono" style={{ fontSize: "0.55rem", fontWeight: 700, letterSpacing: "0.06em", color: "#047857", background: "#d1fae5", borderRadius: 99, padding: "2px 7px" }}>CURRENT</span>
          )}
        </div>
        <div style={{ fontSize: "0.78rem", color: "#334155", fontWeight: 600, marginTop: 1 }}>
          {job.company}{job.employment_type ? ` · ${job.employment_type}` : ""}
        </div>
        {whenDur && (
          <div style={{ fontSize: "0.72rem", color: "#64748b", marginTop: 2 }}>{whenDur}</div>
        )}
      </div>
    </div>
  );
}

export function WorkExperienceCard({
  jobs,
  experienceYears,
  linkedinHandle,
  linkedinUrl,
  cardClass,
  labelClass,
  pillClass,
}: {
  jobs: WorkJob[];
  experienceYears: number | null | undefined;
  linkedinHandle: string | null;
  linkedinUrl: string | null;
  cardClass: string;
  labelClass: string;
  pillClass: string;
}) {
  const [showPast, setShowPast] = useState(false);
  const current = jobs.filter((j) => isCurrent(j.end_date));
  const past = jobs.filter((j) => !isCurrent(j.end_date));
  const primary = current.length > 0 ? current : jobs.slice(0, 2);
  const extra = current.length > 0 ? past : jobs.slice(2);
  const shown = showPast ? [...primary, ...extra] : primary;
  const expLabel = experienceYears != null
    ? `${experienceYears}Y EXP`
    : current.length > 0
      ? "CURRENT"
      : jobs.length > 0 ? `${jobs.length} ROLES` : "EXP";

  return (
    <div className={`${cardClass} tc`} style={{ gridColumn: "span 7", justifyContent: "flex-start", alignSelf: "start", height: "auto" }}>
      <div>
        <div className={`${labelClass} pf-mono`}>
          <span>┌ WORK EXPERIENCE</span>
          <span className={`${pillClass} text-indigo-600 bg-indigo-50 border-indigo-200`}>{expLabel} ┐</span>
        </div>
        {shown.length > 0 ? (
          shown.map((job, i) => (
            <JobRow key={`${job.company}-${job.title}-${i}`} job={job} first={i === 0} />
          ))
        ) : (
          <div className="pf-mono" style={{ fontSize: "0.75rem", color: "#94a3b8" }}>
            {linkedinHandle
              ? "LinkedIn connected — work history will appear after the next profile sync."
              : "Connect LinkedIn to import roles, dates, and companies."}
          </div>
        )}
      </div>
      <div>
        {extra.length > 0 && (
          <button
            type="button"
            onClick={() => setShowPast((v) => !v)}
            className="pf-mono"
            style={{ marginTop: 4, fontSize: "0.68rem", fontWeight: 700, color: "#4f46e5", background: "none", border: "none", padding: "6px 0", cursor: "pointer", textAlign: "left" }}
          >
            {showPast ? "Hide previous experience" : `See previous experience (${extra.length})`}
          </button>
        )}
        {linkedinHandle && (
          <div className="pf-mono" style={{ fontSize: "0.68rem", color: "#94a3b8", marginTop: 4 }}>
            {linkedinUrl ? <a href={linkedinUrl} target="_blank" rel="noreferrer">in/{linkedinHandle} ↗</a> : `in/${linkedinHandle}`}
          </div>
        )}
      </div>
    </div>
  );
}
