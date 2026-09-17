"use client";

import { useCallback, useState } from "react";
import { Check, Copy, MessageCircle } from "lucide-react";

export function HeroAgentBar({
  handle,
  permalink,
  firstName,
}: {
  handle: string;
  permalink: string;
  firstName: string;
}) {
  const [copied, setCopied] = useState(false);

  const copy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(`https://${permalink}`);
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
    } catch {
      /* ignore */
    }
  }, [permalink]);

  return (
    <div style={{ display: "flex", gap: 8, marginTop: 14, flexWrap: "wrap" }}>
      <button
        type="button"
        onClick={copy}
        className="pf-mono"
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: 6,
          border: "1px solid rgba(255,255,255,0.22)",
          background: "rgba(255,255,255,0.12)",
          color: "#fff",
          borderRadius: 999,
          padding: "7px 11px",
          fontSize: "0.62rem",
          fontWeight: 700,
          cursor: "pointer",
          letterSpacing: "0.04em",
        }}
        aria-label={copied ? "Copied profile link" : "Copy profile link"}
      >
        {copied ? <Check size={11} /> : <Copy size={11} />}
        {copied ? "COPIED" : `@${handle}`}
      </button>
      <button
        type="button"
        onClick={() => window.dispatchEvent(new Event("zynd:open-profile-chat"))}
        className="pf-mono"
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: 6,
          border: "none",
          background: "#fff",
          color: "#4f46e5",
          borderRadius: 999,
          padding: "7px 12px",
          fontSize: "0.62rem",
          fontWeight: 800,
          cursor: "pointer",
          letterSpacing: "0.04em",
        }}
      >
        <MessageCircle size={12} />
        ASK {firstName.toUpperCase()}&apos;S AGENT
      </button>
    </div>
  );
}
