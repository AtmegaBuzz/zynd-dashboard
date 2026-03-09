import type { Metadata } from "next";
import { Navbar } from "@/components/Navbar";
import BlogList from "@/components/blogs/blog-list";

export const metadata: Metadata = {
    title: "Blog - ZyndAI",
    description:
        "Read the latest from ZyndAI — the trust and payment layer for AI agents.",
    openGraph: {
        title: "Blog - ZyndAI",
        description: "Read the latest from ZyndAI.",
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
