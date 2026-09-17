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

function initialsImg(name: string, size: number): string {
  const letters = (name || "?").slice(0, 2).toUpperCase();
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}"><rect width="${size}" height="${size}" rx="${Math.round(size * 0.22)}" fill="#312e81"/><text x="50%" y="54%" text-anchor="middle" dominant-baseline="middle" fill="#c7d2fe" font-family="system-ui,sans-serif" font-size="${Math.round(size * 0.38)}" font-weight="800">${letters}</text></svg>`;
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
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
  const srcs = [...skillIconSrcs(name), initialsImg(name, size)];
  const [i, setI] = useState(0);
  const src = srcs[Math.min(i, srcs.length - 1)];
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt=""
      width={size}
      height={size}
      referrerPolicy="no-referrer"
      onError={() => setI((n) => (n + 1 < srcs.length ? n + 1 : n))}
      style={{ width: size, height: size, objectFit: "contain", flexShrink: 0, borderRadius: 6, display: "block" }}
    />
  );
}
