import type { MetadataRoute } from "next";
import { getTrendingPosts, getLocalPosts } from "@/lib/trending";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = process.env.SITE_URL || "https://mizizinodes.vercel.app";
  const posts = [...await getLocalPosts(), ...await getTrendingPosts()];

  const staticPages: MetadataRoute.Sitemap = [
    { url: baseUrl, lastModified: new Date(), changeFrequency: "daily", priority: 1 },
    { url: `${baseUrl}/blog`, lastModified: new Date(), changeFrequency: "daily", priority: 0.9 },
    { url: `${baseUrl}/tags`, lastModified: new Date(), changeFrequency: "weekly", priority: 0.5 },
    { url: `${baseUrl}/about`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.3 },
  ];

  const postPages: MetadataRoute.Sitemap = posts.map((p) => ({
    url: `${baseUrl}/blog/${p.slug}`,
    lastModified: new Date(p.date),
    changeFrequency: "daily" as const,
    priority: 0.8,
  }));

  const catPages: MetadataRoute.Sitemap = [...new Set(posts.map((p) => p.category))].map((cat) => ({
    url: `${baseUrl}/tags/${cat.toLowerCase()}`,
    lastModified: new Date(),
    changeFrequency: "weekly" as const,
    priority: 0.4,
  }));

  return [...staticPages, ...postPages, ...catPages];
}
