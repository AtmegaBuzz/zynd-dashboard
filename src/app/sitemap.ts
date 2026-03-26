import { MetadataRoute } from "next";

const BASE_URL = "https://www.zynd.ai";

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    {
      url: BASE_URL,
      lastModified: new Date("2026-03-26"),
      changeFrequency: "weekly",
      priority: 1.0,
    },
    {
      url: `${BASE_URL}/registry`,
      lastModified: new Date("2026-03-26"),
      changeFrequency: "daily",
      priority: 0.9,
    },
    {
      url: `${BASE_URL}/blogs`,
      lastModified: new Date("2026-03-26"),
      changeFrequency: "weekly",
      priority: 0.8,
    },
    {
      url: `${BASE_URL}/blogs/what-is-zynd`,
      lastModified: new Date("2026-03-26"),
      changeFrequency: "monthly",
      priority: 0.7,
    },
    {
      url: `${BASE_URL}/privacy-policy`,
      lastModified: new Date("2026-03-26"),
      changeFrequency: "yearly",
      priority: 0.3,
    },
    {
      url: `${BASE_URL}/terms-of-service`,
      lastModified: new Date("2026-03-26"),
      changeFrequency: "yearly",
      priority: 0.3,
    },
  ];
}
