import type { Metadata } from "next";
import { Navbar } from "@/components/Navbar";
import BlogList from "@/components/blogs/blog-list";

export const metadata: Metadata = {
    title: "Blog — AI Agent Infrastructure Insights | ZyndAI",
    description:
        "Read the latest from ZyndAI — insights on AI agent infrastructure, x402 micropayments on Base, agent identity, and the open agent network.",
    alternates: {
        canonical: "https://www.zynd.ai/blogs",
    },
    openGraph: {
        title: "Blog — AI Agent Infrastructure Insights | ZyndAI",
        description:
            "Insights on AI agent infrastructure, x402 micropayments, agent identity with W3C DIDs, and the open agent network.",
        url: "https://www.zynd.ai/blogs",
        type: "website",
    },
};

export default function BlogsPage() {
    return (
        <>
            <Navbar />
            <BlogList />
        </>
    );
}
