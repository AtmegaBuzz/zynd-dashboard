import type { Metadata } from "next";
import { Navbar } from "@/components/Navbar";
import BlogDetail from "@/components/blogs/blog-detail";

export const metadata: Metadata = {
    title: "What is Zynd? - ZyndAI Blog",
    description:
        "Zynd Network is the infrastructure layer that lets AI agents discover, trust, and pay each other — turning isolated agents into an economic network.",
    openGraph: {
        title: "What is Zynd?",
        description:
            "Zynd Network is the infrastructure layer that lets AI agents discover, trust, and pay each other.",
        type: "article",
    },
};

export default function WhatIsZyndPage() {
    return (
        <>
            <Navbar />
            <BlogDetail />
        </>
    );
}
