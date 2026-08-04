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
  "https://www.caranddriver.com/rss/all/",
  "https://www.motortrend.com/feed/",
  "https://www.autoblog.com/rss.xml",
  "https://www.topgear.com/rss",
  "https://www.edmunds.com/rss/news/",
  "https://www.jalopnik.com/rss",
  "https://www.thedrive.com/feed",
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
            const slug = slugify(item.title);
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
    t.includes("electric") ||
    t.includes(" ev") ||
    t.includes("battery") ||
    t.includes("charger") ||
    t.includes("tesla") ||
    t.includes("range") ||
    t.includes("volt")
  )
    return "Electric Vehicles";
  if (
    t.includes("sports car") ||
    t.includes("supercar") ||
    t.includes("ferrari") ||
    t.includes("lamborghini") ||
    t.includes("mclaren") ||
    t.includes("porsche") ||
    t.includes("0-60") ||
    t.includes("top speed")
  )
    return "Sports Cars & Supercars";
  if (
    t.includes("truck") ||
    t.includes("pickup") ||
    t.includes("off-road") ||
    t.includes("towing") ||
    t.includes("4wd") ||
    t.includes("overland")
  )
    return "Trucks & Off-Road";
  if (
    t.includes("suv") ||
    t.includes("crossover") ||
    t.includes("minivan")
  )
    return "SUVs & Crossovers";
  if (
    t.includes("luxury") ||
    t.includes("bmw") ||
    t.includes("mercedes") ||
    t.includes("audi") ||
    t.includes("lexus") ||
    t.includes("genesis")
  )
    return "Luxury & Performance";
  if (
    t.includes("sedan") ||
    t.includes("coupe") ||
    t.includes("hatchback") ||
    t.includes("wagon")
  )
    return "Sedans & Coupes";
  if (
    t.includes("concept") ||
    t.includes("design") ||
    t.includes("prototype") ||
    t.includes("styling")
  )
    return "Concepts & Design";
  return "Automotive Industry";
}

const CAR_TAGS = [
  "car", "cars", "vehicle", "suv", "sedan", "coupe", "truck", "electric vehicle",
  "ev", "hybrid", "tesla", "ford", "chevrolet", "bmw", "mercedes", "audi", "porsche",
  "ferrari", "lamborghini", "mclaren", "toyota", "honda", "hyundai", "kia",
  "engine", "horsepower", "torque", "0-60", "top speed", "towing",
  "sedans & coupes", "suvs & crossovers", "trucks & off-road",
  "electric vehicles", "sports cars & supercars", "luxury & performance",
  "concepts & design", "automotive industry",
];

const NON_CAR_TITLE_KEYWORDS = [
  "sport", "soccer", "football", "nba", "nfl", "olympic", "tennis", "cricket",
  "election", "politics", "politician", "vote", "president", "congress",
  "war", "military", "army", "weapon", "conflict", "attack", "terror",
  "murder", "crime", "criminal", "police", "arrest",
  "movie", "film", "actor", "actress", "celebrity", "music", "album",
  "weather", "hurricane", "storm", "earthquake",
  "healthcare", "hospital", "disease", "cancer",
  "ai", "llm", "chatgpt", "openai", "gpt", "machine learning",
];

function escapeRegExp(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function wordBoundary(kw: string): RegExp {
  return new RegExp(`(^|[^a-z0-9])${escapeRegExp(kw.toLowerCase())}([^a-z0-9]|$)`);
}

function isCarPost(p: { title: string; tags: string[] }): boolean {
  const title = p.title.toLowerCase();
  const tagText = p.tags.join(" ").toLowerCase();
  const combined = title + " " + tagText;

  if (NON_CAR_TITLE_KEYWORDS.some((kw) => wordBoundary(kw).test(combined))) return false;

  return CAR_TAGS.some((kw) => wordBoundary(kw).test(combined));
}

export async function getLocalPosts(): Promise<TrendingPost[]> {
  try {
    const posts = await getAllPosts();
    return posts
      .filter(isCarPost)
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
      slug: "2025-toyota-gr86-review",
      title: "2025 Toyota GR86 Review: The Driver's Car That Refuses to Grow Up",
      date: today,
      excerpt:
        "The Toyota GR86 remains one of the purest driving experiences on the market. We break down the specs, the handling, and why it's still the benchmark for affordable sports cars.",
      source: "Car and Driver",
      sourceUrl: "#",
      category: "Sports Cars & Supercars",
      image: "https://picsum.photos/seed/gr86/800/450",
    },
    {
      slug: "tesla-model-3-vs-hyundai-ioniq-6",
      title: "Tesla Model 3 vs Hyundai Ioniq 6: The EV Sedan Battle",
      date: today,
      excerpt:
        "Two electric sedans, two very different philosophies. We compare range, charging, interior, and value to find out which one deserves your money.",
      source: "MotorTrend",
      sourceUrl: "#",
      category: "Electric Vehicles",
      image: "https://picsum.photos/seed/model3vs6/800/450",
    },
    {
      slug: "best-trucks-2025",
      title: "Best Trucks of 2025: F-150, Silverado, Tacoma, and More",
      date: today,
      excerpt:
        "From full-size haulers to midsize adventurers, we rank the best trucks you can buy right now based on towing, payload, features, and value.",
      source: "Edmunds",
      sourceUrl: "#",
      category: "Trucks & Off-Road",
      image: "https://picsum.photos/seed/besttrucks/800/450",
    },
    {
      slug: "porsche-911-gt3-rs-track",
      title: "Porsche 911 GT3 RS: Track Weapon or Street Legal Overkill?",
      date: today,
      excerpt:
        "The GT3 RS is Porsche's most extreme road car. We take it to the track to see if the aero, the weight, and the price tag all add up.",
      source: "Top Gear",
      sourceUrl: "#",
      category: "Sports Cars & Supercars",
      image: "https://picsum.photos/seed/gt3rs/800/450",
    },
    {
      slug: "ford-f-150-lightning-vs-chevy-silverado-ev",
      title: "Ford F-150 Lightning vs Chevy Silverado EV: Electric Truck Showdown",
      date: today,
      excerpt:
        "The two biggest names in trucks go electric. We compare range, towing, bed utility, and real-world usability to crown a winner.",
      source: "The Drive",
      sourceUrl: "#",
      category: "Electric Vehicles",
      image: "https://picsum.photos/seed/lightningvssilverado/800/450",
    },
    {
      slug: "cheapest-suvs-2025",
      title: "Cheapest SUVs of 2025 That Don't Feel Cheap",
      date: today,
      excerpt:
        "You don't need to spend a fortune to get a good SUV. Here are the best budget-friendly crossovers and SUVs that punch above their price.",
      source: "Edmunds",
      sourceUrl: "#",
      category: "SUVs & Crossovers",
      image: "https://picsum.photos/seed/cheapsuvs/800/450",
    },
  ];
}
