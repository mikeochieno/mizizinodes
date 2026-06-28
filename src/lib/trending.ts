import Parser from "rss-parser";
import { getAllPosts } from "./posts";

type FeedItem = {
  title?: string;
  link?: string;
  pubDate?: string;
  contentSnippet?: string;
  content?: string;
  "media:content"?: { $: { url: string } };
  mediaContent?: { $: { url: string } };
  enclosure?: { url: string };
};

const parser: Parser<{ title: string }, FeedItem> = new Parser({
  customFields: {
    item: [
      ["media:content", "mediaContent", { keepArray: false }],
      ["enclosure", "enclosure"],
    ],
  },
});

const RSS_FEEDS = [
  "https://hnrss.org/frontpage",
  "https://techcrunch.com/feed/",
  "https://www.theverge.com/rss/index.xml",
  "https://feeds.feedburner.com/TheNextWeb",
];

const CACHE_DURATION = 30 * 60 * 1000;

type CacheEntry = { data: TrendingPost[]; timestamp: number };
let cache: CacheEntry | null = null;

export type TrendingPost = {
  slug: string;
  title: string;
  date: string;
  excerpt: string;
  source: string;
  sourceUrl: string;
  category: string;
  image: string;
};

function extractImage(item: FeedItem): string | null {
  if (item.enclosure?.url) return item.enclosure.url;
  if (item.mediaContent?.$?.url) return item.mediaContent.$.url;
  if (item.content) {
    const m = item.content.match(/<img[^>]+src=["']([^"']+)["']/);
    if (m) return m[1];
  }
  return null;
}

export async function getTrendingPosts(): Promise<TrendingPost[]> {
  if (cache && Date.now() - cache.timestamp < CACHE_DURATION) {
    return cache.data;
  }

  const local = await getLocalPosts();
  if (local.length >= 4) {
    cache = { data: local, timestamp: Date.now() };
    return local;
  }

  try {
    const all: TrendingPost[] = [...local];

    for (const feedUrl of RSS_FEEDS) {
      try {
        const feed = await parser.parseURL(feedUrl);
        for (const item of feed.items.slice(0, 4)) {
          if (item.title && item.link) {
            const slug = slugify(item.title) + "-" + Math.random().toString(36).slice(2, 6);
            const img = extractImage(item);
            all.push({
              slug,
              title: item.title,
              date: item.pubDate
                ? new Date(item.pubDate).toISOString().split("T")[0]
                : new Date().toISOString().split("T")[0],
              excerpt: (item.contentSnippet || item.title).slice(0, 280),
              source: feed.title || "News",
              sourceUrl: item.link,
              category: categorize(item.title),
              image: img || `https://picsum.photos/seed/${slug}/800/450`,
            });
          }
        }
      } catch {}
    }

    const seen = new Set<string>();
    const unique = all.filter((p) => {
      if (seen.has(p.title)) return false;
      seen.add(p.title);
      return true;
    });

    cache = { data: unique, timestamp: Date.now() };
    return unique;
  } catch {
    return local.length > 0 ? local : getFallback();
  }
}

export async function getPostBySlug(
  slug: string
): Promise<TrendingPost | null> {
  const posts = await getTrendingPosts();
  const found = posts.find((p) => p.slug === slug);
  if (found) return found;
  const local = await getLocalPosts();
  return local.find((p) => p.slug === slug) || null;
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
    .slice(0, 60);
}

function categorize(title: string): string {
  const t = title.toLowerCase();
  if (
    t.includes("ai") ||
    t.includes("chatgpt") ||
    t.includes("machine learning") ||
    t.includes("openai") ||
    t.includes("llm") ||
    t.includes("neural")
  )
    return "AI";
  if (
    t.includes("world cup") ||
    t.includes("soccer") ||
    t.includes("football") ||
    t.includes("nfl") ||
    t.includes("nba") ||
    t.includes("espn") ||
    t.includes("champions") ||
    t.includes("olympic")
  )
    return "Sports";
  if (
    t.includes("apple") ||
    t.includes("google") ||
    t.includes("microsoft") ||
    t.includes("meta") ||
    t.includes("tesla") ||
    t.includes("amazon") ||
    t.includes("nvidia")
  )
    return "Tech";
  if (
    t.includes("react") ||
    t.includes("javascript") ||
    t.includes("python") ||
    t.includes("code") ||
    t.includes("css") ||
    t.includes("typescript") ||
    t.includes("developer") ||
    t.includes("software")
  )
    return "Dev";
  if (
    t.includes("design") ||
    t.includes("ui") ||
    t.includes("ux") ||
    t.includes("interface")
  )
    return "Design";
  if (
    t.includes("stock") ||
    t.includes("market") ||
    t.includes("finance") ||
    t.includes("bank") ||
    t.includes("economy") ||
    t.includes("ipo")
  )
    return "Business";
  if (
    t.includes("film") ||
    t.includes("movie") ||
    t.includes("music") ||
    t.includes("game") ||
    t.includes("celebrity") ||
    t.includes("hollywood")
  )
    return "Entertainment";
  return "News";
}

export async function getLocalPosts(): Promise<TrendingPost[]> {
  try {
    const posts = await getAllPosts();
    return posts
      .map((p) => ({
        slug: p.slug,
        title: p.title,
        date: p.date,
        excerpt: p.excerpt || "",
        source: p.author || "MiziziNodes",
        sourceUrl: `/blog/${p.slug}`,
        category: p.tags.length > 0 ? (categorize(p.tags[0]) === "News" ? categorize(p.title) : categorize(p.tags[0])) : "News",
        image: (p as any).image || `https://picsum.photos/seed/${p.slug}/800/450`,
      }))
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  } catch {
    return [];
  }
}

function getFallback(): TrendingPost[] {
  const today = new Date().toISOString().split("T")[0];
  return [
    {
      slug: "ai-breakthrough-reasoning",
      title: "AI Breakthrough: New Models Achieve Human-Level Reasoning",
      date: today,
      excerpt:
        "Recent advances in artificial intelligence have led to models that can perform complex reasoning tasks at human levels, marking a significant milestone in the field. Researchers demonstrated unprecedented performance on benchmarks testing logic, mathematics, and common sense.",
      source: "TechCrunch",
      sourceUrl: "#",
      category: "AI",
      image: "https://picsum.photos/seed/aibreakthrough/800/450",
    },
    {
      slug: "apple-vision-pro-update",
      title: "Apple Vision Pro Gets Major Software Update with New Features",
      date: today,
      excerpt:
        "Apple announced a significant software update for Vision Pro, bringing spatial Personas, improved productivity features, and new entertainment experiences. The update includes better hand tracking and virtual display expansion.",
      source: "The Verge",
      sourceUrl: "#",
      category: "Tech",
      image: "https://picsum.photos/seed/applevision/800/450",
    },
    {
      slug: "react-19-new-features",
      title: "React 19: What Developers Need to Know About the Latest Release",
      date: today,
      excerpt:
        "React 19 introduces groundbreaking features including server components, improved suspense handling, and a new compiler that promises significant performance gains for production applications.",
      source: "TechCrunch",
      sourceUrl: "#",
      category: "Dev",
      image: "https://picsum.photos/seed/react19/800/450",
    },
    {
      slug: "typescript-5-6-arrives",
      title: "TypeScript 5.6 Arrives with Smarter Type Inference and Better DX",
      date: today,
      excerpt:
        "Microsoft releases TypeScript 5.6 with improved type narrowing, better discriminated unions, and performance optimizations for large codebases. The update also includes a new --isolatedDeclarations flag.",
      source: "The Next Web",
      sourceUrl: "#",
      category: "Dev",
      image: "https://picsum.photos/seed/typescript56/800/450",
    },
    {
      slug: "google-gemini-expands",
      title: "Google Gemini Expands to More Countries with New Features",
      date: today,
      excerpt:
        "Google's Gemini AI assistant is rolling out to additional markets, bringing multilingual support and enhanced integration with Workspace apps. Users can now access Gemini directly from Gmail and Docs.",
      source: "TechCrunch",
      sourceUrl: "#",
      category: "AI",
      image: "https://picsum.photos/seed/gemini/800/450",
    },
    {
      slug: "future-of-css-layouts",
      title: "The Future of CSS Layouts: Anchor Positioning and More",
      date: today,
      excerpt:
        "New CSS features like anchor positioning, scroll-driven animations, and container queries are changing how developers approach web layouts. Browser support is expanding rapidly across all major engines.",
      source: "The Verge",
      sourceUrl: "#",
      category: "Design",
      image: "https://picsum.photos/seed/csslayouts/800/450",
    },
  ];
}
