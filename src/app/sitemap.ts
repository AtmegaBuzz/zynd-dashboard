import { MetadataRoute } from "next";

const BASE_URL = "https://www.zynd.ai";

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    {
      url: BASE_URL,
      lastModified: new Date("2026-03-23"),
    },
    {
      url: `${BASE_URL}/registry`,
      lastModified: new Date("2026-03-23"),
    },
    {
      url: `${BASE_URL}/blogs`,
      lastModified: new Date("2026-03-23"),
    },
    {
      url: `${BASE_URL}/blogs/what-is-zynd`,
      lastModified: new Date("2025-02-15"),
    },
  ];
}
