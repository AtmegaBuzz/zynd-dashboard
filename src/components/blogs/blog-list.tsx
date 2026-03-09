"use client"

import Link from "next/link";
import { AccentCorners } from "../ui/AccentCorners";

const blogs = [
    {
        slug: "what-is-zynd",
        title: "What is Zynd? The Trust & Payment Layer for AI Agents",
        description:
            "Zynd Network is the infrastructure layer that lets AI agents discover, trust, and pay each other — turning isolated agents into an economic network.",
        date: "Feb 15, 2025",
        readTime: "5 min read",
        tags: ["Infrastructure", "AI Agents", "Protocol"],
    },
];

export default function BlogList() {
    return (
        <section className="blog-section">
            <div className="padding-global">
                <div className="blog-article-container">
                    <div className="blog-header">
                        <h1>Blog</h1>
                        <div className="text-large">
                            Insights, updates, and deep dives from the Zynd Protocol team.
                        </div>
                    </div>

                    {blogs.map((blog) => (
                        <Link href={`/blogs/${blog.slug}`} key={blog.slug}>
                            <div className="blog-card">
                                <AccentCorners />
                                <div className="blog-card-top">
                                    <div className="blog-tags">
                                        {blog.tags.map((tag) => (
                                            <span key={tag} className="blog-tag">{tag}</span>
                                        ))}
                                    </div>
                                    <div className="blog-read-link">
                                        Read
                                        <svg width="11" height="11" viewBox="0 0 11 11" fill="none">
                                            <path d="M1 5.5H10M10 5.5L6 1.5M10 5.5L6 9.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                                        </svg>
                                    </div>
                                </div>
                                <h3>{blog.title}</h3>
                                <div className="text-large">{blog.description}</div>
                                <div className="blog-meta">
                                    <div className="blog-meta-item">
                                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
                                        <span>{blog.date}</span>
                                    </div>
                                    <div className="blog-meta-item">
                                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                                        <span>{blog.readTime}</span>
                                    </div>
                                </div>
                            </div>
                        </Link>
                    ))}
                </div>
            </div>
        </section>
    );
}
