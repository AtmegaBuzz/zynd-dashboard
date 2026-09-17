"use client";

import { useState } from "react";

/** skillicons.dev ids (https://github.com/tandpfun/skill-icons). */
const SKILLICONS: Record<string, string> = {
  python: "py", py: "py", html: "html", html5: "html", css: "css", css3: "css",
  javascript: "js", js: "js", typescript: "ts", ts: "ts", react: "react",
  nextjs: "nextjs", next: "nextjs", "next.js": "nextjs", vue: "vue", angular: "angular",
  svelte: "svelte", node: "nodejs", nodejs: "nodejs", "node.js": "nodejs",
  go: "go", golang: "go", rust: "rust", java: "java", kotlin: "kotlin",
  swift: "swift", dart: "dart", flutter: "flutter", c: "c", "c++": "cpp", cpp: "cpp",
  "c#": "cs", csharp: "cs", php: "php", ruby: "ruby", scala: "scala",
  docker: "docker", kubernetes: "kubernetes", k8s: "kubernetes",
  postgresql: "postgres", postgres: "postgres", mysql: "mysql", sqlite: "sqlite",
  mongodb: "mongodb", redis: "redis", elasticsearch: "elasticsearch",
  graphql: "graphql", prisma: "prisma",
  aws: "aws", gcp: "gcp", azure: "azure", linux: "linux", git: "git", github: "github",
  tensorflow: "tensorflow", pytorch: "pytorch",
  terraform: "terraform", nginx: "nginx", bash: "bash",
  figma: "figma", jira: "jira", notion: "notion",
  tailwind: "tailwind", sass: "sass", webpack: "webpack", vite: "vite",
  supabase: "supabase", firebase: "firebase", cloudflare: "cloudflare",
  solidity: "solidity", ethereum: "solidity",
};

/** simple-icons slug overrides when skillicons has no match. */
const SIMPLE: Record<string, string> = {
  sql: "postgresql",
  "rest apis": "postman",
  "rest api": "postman",
  apis: "postman",
  api: "postman",
  "ai technologies": "openai",
  ai: "openai",
  "product management": "producthunt",
  "product manager": "producthunt",
  agile: "jira",
  scrum: "jira",
  "agile/scrum": "jira",
  "machine learning": "pytorch",
  ml: "pytorch",
  llm: "openai",
  blockchain: "ethereum",
  web3: "ethereum",
  fintech: "visa",
  saas: "salesforce",
};

function norm(name: string) {
  return name.trim().toLowerCase().replace(/[_./]+/g, " ").replace(/\s+/g, " ");
}

function slugify(name: string) {
  return norm(name).replace(/[^a-z0-9]+/g, "");
}

export function skillIconSrcs(name: string): string[] {
  const key = norm(name);
  const compact = slugify(name);
  const out: string[] = [];
  const si = SKILLICONS[key] || SKILLICONS[compact];
  if (si) out.push(`https://skillicons.dev/icons?i=${si}`);
  const simple = SIMPLE[key] || SIMPLE[compact] || (si ? undefined : compact);
  if (simple) out.push(`https://cdn.simpleicons.org/${simple}`);
  out.push(`https://cdn.jsdelivr.net/gh/devicons/devicon/icons/${compact}/${compact}-original.svg`);
  return [...new Set(out)];
}

export function SkillBrandIcon({ name, size = 28 }: { name: string; size?: number }) {
  const srcs = skillIconSrcs(name);
  const [i, setI] = useState(0);
  const src = srcs[i];
  if (!src) {
    return (
      <span style={{ width: size, height: size, borderRadius: 8, background: "#312e81", color: "#c7d2fe", fontSize: size * 0.38, fontWeight: 800, display: "flex", alignItems: "center", justifyContent: "center" }}>
        {name.slice(0, 2).toUpperCase()}
      </span>
    );
  }
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt=""
      width={size}
      height={size}
      onError={() => setI((n) => n + 1)}
      style={{ width: size, height: size, objectFit: "contain", flexShrink: 0, borderRadius: 6 }}
    />
  );
}
