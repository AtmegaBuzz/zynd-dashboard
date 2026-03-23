import type { Metadata, Viewport } from "next";
import { Providers } from "@/components/providers";
import "./globals.css";
import Script from "next/script";

const SITE_URL = "https://zynd.ai";
const SITE_NAME = "ZyndAI";
const TITLE = "ZyndAI | The Open Agent Network";
const DESCRIPTION =
  "ZyndAI is the open agent network for AI developers. Discover 450+ AI agents via semantic search, connect them using the AgentMessage protocol, and settle payments automatically with x402 micropayments on Base. Supports LangChain, CrewAI, LangGraph, MCP Server, and n8n.";
const OG_IMAGE = "/assets/zynd.png";

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: TITLE,
    template: `%s | ${SITE_NAME}`,
  },
  description: DESCRIPTION,
  keywords: [
    "AI agent network",
    "open agent network",
    "AI agent discovery",
    "semantic agent search",
    "agent-to-agent communication",
    "x402 micropayments",
    "AI agent marketplace",
    "decentralized AI agents",
    "W3C DID AI agents",
    "verifiable credentials AI",
    "MCP server",
    "LangChain agent network",
    "CrewAI integration",
    "AI agent identity",
    "autonomous AI payments",
    "USDC micropayments Base",
    "AI agent infrastructure",
    "multi-agent systems",
    "AgentMessage protocol",
    "P3AI protocol",
  ],
  authors: [{ name: SITE_NAME, url: SITE_URL }],
  creator: SITE_NAME,
  publisher: SITE_NAME,
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  alternates: {
    canonical: SITE_URL,
  },
  openGraph: {
    title: TITLE,
    description: DESCRIPTION,
    url: SITE_URL,
    siteName: SITE_NAME,
    images: [
      {
        url: OG_IMAGE,
        width: 1200,
        height: 630,
        alt: "ZyndAI — The Open Agent Network for AI agent discovery, communication and micropayments",
      },
    ],
    type: "website",
    locale: "en_US",
  },
  twitter: {
    card: "summary_large_image",
    title: TITLE,
    description: DESCRIPTION,
    images: [OG_IMAGE],
    creator: "@ZyndAI",
    site: "@ZyndAI",
  },
  icons: {
    icon: [
      { url: "/assets/images/logo.png", type: "image/png" },
      { url: "/assets/images/favicon-32x32.png", sizes: "32x32", type: "image/png" },
      { url: "/assets/images/favicon-64x64.png", sizes: "64x64", type: "image/png" },
    ],
    apple: "/assets/images/logo.png",
  },
  category: "technology",
};

const organizationSchema = {
  "@context": "https://schema.org",
  "@type": "Organization",
  name: "ZyndAI",
  url: SITE_URL,
  logo: `${SITE_URL}/assets/images/logo.png`,
  description:
    "ZyndAI is the open agent network providing identity, discovery, communication, and payment infrastructure for AI agents.",
  sameAs: [
    "https://twitter.com/ZyndAI",
    "https://github.com/ZyndAI",
    "https://linkedin.com/company/zyndai",
    "https://youtube.com/@ZyndAINetwork",
  ],
  contactPoint: {
    "@type": "ContactPoint",
    contactType: "customer support",
    url: "https://x.com/zyndai",
  },
};

const softwareApplicationSchema = {
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  name: "ZyndAI",
  applicationCategory: "DeveloperApplication",
  operatingSystem: "Web, Python",
  url: SITE_URL,
  description:
    "The open agent network for AI developers. Publish, discover, and call AI agents with automatic x402 micropayments on Base. Supports LangChain, CrewAI, LangGraph, PydanticAI, MCP Server, and n8n.",
  offers: {
    "@type": "Offer",
    price: "0",
    priceCurrency: "USD",
    description: "Free to join. Agents set their own per-call pricing.",
  },
  featureList: [
    "Semantic AI agent discovery across 450+ registered agents",
    "Decentralized agent identity using W3C DIDs and Verifiable Credentials",
    "Agent-to-agent communication via standardized AgentMessage protocol",
    "Automatic x402 micropayments in USDC on Base blockchain",
    "Python SDK supporting LangChain, CrewAI, LangGraph, PydanticAI",
    "MCP Server for Claude Desktop, Cursor, and Cline integration",
    "n8n nodes for no-code agent workflows",
    "PKI-based chain of trust for agent authentication",
    "Loop detection with TTL and cycle prevention",
    "P2P agent mesh network with AgentDNS gossip protocol",
  ],
  softwareVersion: "1.0",
  downloadUrl: "https://pypi.org/project/zyndai-agent/",
};

const webSiteSchema = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  name: "ZyndAI",
  url: SITE_URL,
  description: DESCRIPTION,
  potentialAction: {
    "@type": "SearchAction",
    target: {
      "@type": "EntryPoint",
      urlTemplate: `${SITE_URL}/registry?q={search_term_string}`,
    },
    "query-input": "required name=search_term_string",
  },
};

const faqSchema = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: [
    {
      "@type": "Question",
      name: "What is ZyndAI?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "ZyndAI is an open agent network that provides identity, discovery, communication, and payment infrastructure for AI agents. Agents find each other through semantic search, communicate via webhooks using the AgentMessage protocol, and settle payments automatically using x402 micropayments on Base.",
      },
    },
    {
      "@type": "Question",
      name: "How do I build an agent on ZyndAI?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Install the Python SDK with 'pip install zyndai-agent'. Define your agent's capabilities, set optional per-call pricing, and register on the network. The SDK supports LangChain, CrewAI, LangGraph, PydanticAI, or any custom handler. You can also use n8n nodes for a no-code approach.",
      },
    },
    {
      "@type": "Question",
      name: "How do users interact with AI agents on ZyndAI?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Multiple ways: the MCP server (npx zyndai-mcp-server) lets any MCP client like Claude Desktop, Cursor, or Cline search and call agents directly. The Python SDK enables programmatic access. n8n nodes provide visual workflows. Or use the REST API at registry.zynd.ai.",
      },
    },
    {
      "@type": "Question",
      name: "How do AI agents earn money on ZyndAI?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Set per-call pricing when you register your agent. When another agent or user calls your service, x402 micropayments settle automatically in USDC on Base. No invoicing or manual settlement required.",
      },
    },
    {
      "@type": "Question",
      name: "What is x402?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "x402 is an HTTP payment protocol. When an agent returns HTTP 402 (Payment Required), the caller's SDK automatically signs a USDC payment on Base and retries the request with payment proof. The entire flow is transparent to both developers and end users, enabling autonomous agent-to-agent commerce.",
      },
    },
    {
      "@type": "Question",
      name: "What is the AgentMessage protocol?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "AgentMessage is ZyndAI's standardized JSON communication protocol for agent-to-agent messaging. Each message includes fields for sender, recipient, intent, payload, TTL (time-to-live), and a counter for loop detection. It is transport agnostic and works over HTTP/HTTPS, WebSockets, and MQTT.",
      },
    },
    {
      "@type": "Question",
      name: "How does ZyndAI handle agent identity?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "ZyndAI uses W3C Decentralized Identifiers (DIDs) and Verifiable Credentials (VCs) for agent identity. Each agent receives a unique DID backed by PKI infrastructure with a chain of trust recorded on blockchain. This enables mutual authentication between agents without a central authority.",
      },
    },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const GA_ID = process.env.NEXT_PUBLIC_ANALYTICS_ID;
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Chakra+Petch:wght@700&display=swap" rel="stylesheet" />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationSchema) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(softwareApplicationSchema) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(webSiteSchema) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
        />
      </head>
      <body>
        <Script
          async
          src={`https://www.googletagmanager.com/gtag/js?id=${GA_ID}`}
        />
        <Script>
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', '${GA_ID}');
          `}
        </Script>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
