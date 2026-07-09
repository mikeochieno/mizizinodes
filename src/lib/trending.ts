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
  "https://hnrss.org/newest?q=ai+OR+llm+OR+gpt+OR+neural+OR+transformer+OR+diffusion+OR+agent+OR+rag+OR+fine+tuning",
  "https://techcrunch.com/category/artificial-intelligence/feed/",
  "https://www.theverge.com/rss/ai-artificial-intelligence/index.xml",
  "https://rss.nytimes.com/services/xml/rss/nyt/Technology.xml",
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
    t.includes("neural") ||
    t.includes("agent") ||
    t.includes("diffusion") ||
    t.includes("gpt") ||
    t.includes("gemini") ||
    t.includes("claude") ||
    t.includes("llama") ||
    t.includes("transformer") ||
    t.includes("deep learning")
  )
    return "AI";
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
  return "AI";
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
        "Recent advances in artificial intelligence have led to models that can perform complex reasoning tasks at human levels, marking a significant milestone in the field.",
      source: "TechCrunch",
      sourceUrl: "#",
      category: "AI",
      image: "https://picsum.photos/seed/aibreakthrough/800/450",
    },
    {
      slug: "open-source-llm-benchmarks",
      title: "Open Source LLMs Close the Gap: Benchmark Showdown 2024",
      date: today,
      excerpt:
        "Open source language models are matching proprietary alternatives on key benchmarks. We analyze the latest results from Llama, Mistral, and Qwen across reasoning, coding, and multilingual tasks.",
      source: "The Verge",
      sourceUrl: "#",
      category: "AI",
      image: "https://picsum.photos/seed/opensourcellm/800/450",
    },
    {
      slug: "ai-agents-production",
      title: "Building Reliable AI Agents: Lessons from Production Deployments",
      date: today,
      excerpt:
        "Companies deploying AI agents in production share patterns for handling hallucinations, tool use failures, and multi-step reasoning. A practical guide to agent architectures that work.",
      source: "TechCrunch",
      sourceUrl: "#",
      category: "AI",
      image: "https://picsum.photos/seed/aiagents/800/450",
    },
    {
      slug: "rag-patterns-2024",
      title: "RAG in Practice: Advanced Retrieval Patterns Beyond Naive Chunking",
      date: today,
      excerpt:
        "Retrieval-Augmented Generation has evolved beyond basic chunk-and-embed. We explore reranking, hybrid search, agentic RAG, and the latest research on improving retrieval quality.",
      source: "AI News",
      sourceUrl: "#",
      category: "AI",
      image: "https://picsum.photos/seed/ragpatterns/800/450",
    },
    {
      slug: "nvidia-blackwell-ai",
      title: "NVIDIA Blackwell: What the Next-Gen Architecture Means for AI Workloads",
      date: today,
      excerpt:
        "NVIDIA's Blackwell architecture promises a leap in AI training and inference performance. We break down the specs, the benchmarks, and what it means for the AI industry.",
      source: "TechCrunch",
      sourceUrl: "#",
      category: "Tech",
      image: "https://picsum.photos/seed/nvidiablackwell/800/450",
    },
    {
      slug: "multimodal-models-comparison",
      title: "Multimodal Models Compared: GPT-4V, Gemini, Claude, and Open Source Alternatives",
      date: today,
      excerpt:
        "A head-to-head comparison of leading multimodal models across vision, language, and reasoning tasks. We test real-world scenarios including document analysis, image understanding, and video comprehension.",
      source: "The Verge",
      sourceUrl: "#",
      category: "AI",
      image: "https://picsum.photos/seed/multimodal/800/450",
    },
  ];
}
