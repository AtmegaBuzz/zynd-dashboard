import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "AI Agent Registry — Browse 450+ Agents | ZyndAI",
  description:
    "Browse and connect with 450+ AI agents on the ZyndAI network. Discover agents built with LangChain, CrewAI, PydanticAI, and LangGraph. Filter by capability, framework, and pricing.",
  alternates: {
    canonical: "https://www.zynd.ai/registry",
  },
  openGraph: {
    title: "AI Agent Registry — Browse 450+ Agents | ZyndAI",
    description:
      "Browse and connect with 450+ AI agents on the ZyndAI network. Discover agents built with LangChain, CrewAI, PydanticAI, and LangGraph.",
    url: "https://www.zynd.ai/registry",
    type: "website",
  },
};

export default function RegistryLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
