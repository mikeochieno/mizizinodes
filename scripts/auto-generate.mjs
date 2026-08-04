#!/usr/bin/env node

import Parser from "rss-parser";
import OpenAI from "openai";
import { GoogleGenerativeAI } from "@google/generative-ai";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const postsDir = path.resolve(__dirname, "..", "content", "posts");

const RSS_FEEDS = [
  "https://www.caranddriver.com/rss/all/",
  "https://www.motortrend.com/feed/",
  "https://www.autoblog.com/rss.xml",
  "https://www.topgear.com/rss",
  "https://www.edmunds.com/rss/news/",
  "https://www.jalopnik.com/rss",
  "https://www.thedrive.com/feed",
  "https://www.caranddriver.com/rss/all/",
];

const parser = new Parser();

const PROVIDERS = [
  {
    name: "Gemini",
    type: "gemini",
    apiKey: () => process.env.GEMINI_API_KEY,
    model: "gemini-2.0-flash-lite",
  },
  {
    name: "Groq",
    type: "openai",
    apiKey: () => process.env.GROQ_API_KEY,
    baseURL: "https://api.groq.com/openai/v1",
    model: "llama-3.3-70b-versatile",
  },
  {
    name: "OpenRouter",
    type: "openai",
    apiKey: () => process.env.OPENROUTER_API_KEY,
    baseURL: "https://openrouter.ai/api/v1",
    model: "meta-llama/llama-3.1-8b-instruct:free",
  },
  {
    name: "OpenAI",
    type: "openai",
    apiKey: () => process.env.OPENCODE_API_KEY,
    model: "gpt-4o-mini",
  },
  {
    name: "DeepSeek",
    type: "openai",
    apiKey: () => process.env.DEEPSEEK_API_KEY,
    baseURL: "https://api.deepseek.com",
    model: "deepseek-chat",
  },
];

const CAR_CATEGORIES = [
  "Sedans & Coupes",
  "SUVs & Crossovers",
  "Trucks & Off-Road",
  "Electric Vehicles",
  "Sports Cars & Supercars",
  "Luxury & Performance",
  "Concepts & Design",
  "Automotive Industry",
];

function slugify(text) {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
    .slice(0, 60);
}

const CAR_KEYWORDS = [
  "car", "cars", "vehicle", "automobile", "suv", "sedan", "coupe", "truck", "pickup",
  "electric vehicle", "ev", "hybrid", "phev", "tesla", "ford", "chevrolet", "chevy",
  "bmw", "mercedes", "audi", "porsche", "ferrari", "lamborghini", "mclaren",
  "toyota", "honda", "hyundai", "kia", "nissan", "volkswagen", "vw",
  "engine", "horsepower", "torque", "mpg", "range", "battery", "drivetrain",
  "awd", "fwd", "rwd", "4wd", "transmission", "automatic", "manual",
  "turbo", "supercharger", "v8", "v6", "electric motor", "battery pack",
  "0-60", "top speed", "horsepower", "torque", "curb weight", "payload",
  "towing", "bed", "cargo", "interior", "infotainment", "safety rating",
  "crash test", "nhtsa", "iihs", "fuel economy", "epa", "emissions",
  "new car", "used car", "review", "comparison", "test drive", "first drive",
  "concept", "prototype", "production", "model year", "facelift", "refresh",
  "rally", "motorsport", "f1", "nascar", "indycar", "le mans", "drift",
  "off-road", "overland", "trail", "rock crawler", "mud", "suspension",
  "brake", "tire", "wheel", "exhaust", "intake", "turbo kit", "mod",
  "warranty", "recall", "dealership", "msrp", "invoice", "lease", "finance",
  "car news", "automotive", "motor", "drive", "driving", "road test",
];

function escapeRegExp(s) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function wordBoundary(kw) {
  return new RegExp(`(^|[^a-z0-9])${escapeRegExp(kw.toLowerCase())}([^a-z0-9]|$)`);
}

function isCarRelated(title, source) {
  const t = title.toLowerCase() + " " + source.toLowerCase();
  return CAR_KEYWORDS.some((kw) => wordBoundary(kw).test(t));
}

async function fetchTrending() {
  const items = [];
  for (const url of RSS_FEEDS) {
    try {
      const feed = await parser.parseURL(url);
      for (const item of feed.items.slice(0, 6)) {
        if (item.title && item.link && isCarRelated(item.title, feed.title || "")) {
          items.push({ title: item.title, link: item.link, source: feed.title });
        }
      }
    } catch {}
  }
  return items;
}

function pickCategory(title, source) {
  const t = (title + " " + source).toLowerCase();
  const has = (kw) => wordBoundary(kw).test(t);
  if (has("electric") || has("ev") || has("battery") || has("charger") || has("tesla") || has("range"))
    return "Electric Vehicles";
  if (has("sports car") || has("supercar") || has("ferrari") || has("lamborghini") || has("mclaren") || has("porsche") || has("0-60") || has("top speed"))
    return "Sports Cars & Supercars";
  if (has("truck") || has("pickup") || has("off-road") || has("towing") || has("payload") || has("4wd") || has("overland"))
    return "Trucks & Off-Road";
  if (has("suv") || has("crossover") || has("minivan"))
    return "SUVs & Crossovers";
  if (has("luxury") || has("bmw") || has("mercedes") || has("audi") || has("lexus") || has("genesis"))
    return "Luxury & Performance";
  if (has("sedan") || has("coupe") || has("hatchback") || has("wagon"))
    return "Sedans & Coupes";
  if (has("concept") || has("design") || has("prototype") || has("styling"))
    return "Concepts & Design";
  return "Automotive Industry";
}

function buildPrompt(topic, category) {
  return `You are an automotive journalist and car enthusiast. Write a compelling, in-depth article about this trending car topic:

"${topic.title}" (source: ${topic.source})

This article must NOT be a shallow summary. It must deliver real insight, specs, comparisons, and opinion. Follow these requirements:

STRUCTURE & FORMAT:
- Title: a compelling, specific headline (not generic)
- Date: today's date (${new Date().toISOString().split("T")[0]})
- Tags: 4-6 relevant tags including "${category.toLowerCase()}" (comma separated, lowercase)
- Author: MiziziNodes Editorial
- Excerpt: 2-3 sentence summary that hooks the reader and states the article's thesis — make it specific, not generic
- Content: 1500-2000 words — well-structured with an introduction, 4-6 subheadings (##), and a conclusion
- Use concrete examples, specific numbers, specs (horsepower, torque, 0-60, price), and named models/brands where possible
- IMAGE_PROMPT: a short search query (10-20 words) to find a relevant car photo — describe the scene/subject visually (e.g., "red Ferrari 296 GTB on mountain road at sunset")

CONTENT REQUIREMENTS (must include ALL of these):
1. SPECS & NUMBERS: Include real performance data — horsepower, torque, 0-60 times, top speed, fuel economy, range, price, curb weight. Use comparison tables where possible
2. COMPARISON: Compare this car/model/feature with direct competitors (e.g., Mustang vs Camaro vs Challenger, Model 3 vs Ioniq 6 vs Polestar 2) — use specific trim levels and pricing
3. CONTEXT: Explain why this matters in the current market. What's the trend? Who is this car for?
4. CRITICAL ASSESSMENT: Give your honest take — what's good, what's bad, what's missing? Don't just hype it
5. PRACTICAL IMPACT: How does this affect buyers, enthusiasts, or the industry? Include real pricing, availability, and value proposition
6. FUTURE OUTLOOK: What's next for this model/brand/segment? What questions remain?

TONE & STYLE:
- Enthusiastic but honest — like a knowledgeable friend who actually drives these cars
- Use car enthusiast language naturally (torque curve, power band, chassis dynamics, etc.)
- Acknowledge both strengths and weaknesses
- Write in clear, engaging prose — aim for something between a Car and Driver review and a Regular Cars review
- Include at least one comparison table or numbered list of key specs
- Each section should have a clear argument, not just descriptive text

Respond in this exact format:
TITLE: <title>
TAGS: <tag1, tag2, tag3, tag4, tag5>
EXCERPT: <excerpt>
IMAGE_PROMPT: <prompt>
CONTENT:
<content in markdown>`;
}

function parseResponse(text) {
  const titleMatch = text.match(/TITLE:\s*(.+)/);
  const tagsMatch = text.match(/TAGS:\s*(.+)/);
  const excerptMatch = text.match(/EXCERPT:\s*(.+)/);
  const imageMatch = text.match(/IMAGE_PROMPT:\s*(.+)/);
  const contentMatch = text.match(/CONTENT:\s*([\s\S]+)/);
  return {
    title: titleMatch?.[1]?.trim() || "",
    tags: (tagsMatch?.[1]?.trim() || "automotive").split(",").map((t) => t.trim().toLowerCase()),
    excerpt: excerptMatch?.[1]?.trim() || "",
    imagePrompt: imageMatch?.[1]?.trim() || "",
    content: contentMatch?.[1]?.trim() || "",
  };
}

function writePost(title, tags, excerpt, image, content) {
  const slug = slugify(title);
  if (!slug) throw new Error("Could not generate slug");

  const existing = fs.existsSync(postsDir) ? fs.readdirSync(postsDir).filter((f) => f.endsWith(".mdx")) : [];
  const existingSlugs = new Set(existing.map((f) => f.replace(/\.mdx$/, "")));

  let finalSlug = slug;
  let counter = 1;
  while (existingSlugs.has(finalSlug)) {
    finalSlug = `${slug}-${counter}`;
    counter++;
  }

  const date = new Date().toISOString().split("T")[0];
  const tagStr = tags.map((t) => `"${t}"`).join(", ");

  const frontmatter = `---
title: "${title.replace(/"/g, '\\"')}"
date: "${date}"
tags: [${tagStr}]
image: "${image}"
excerpt: "${excerpt.replace(/"/g, '\\"')}"
author: "MiziziNodes Editorial"
---

${content}
`;

  if (!fs.existsSync(postsDir)) {
    fs.mkdirSync(postsDir, { recursive: true });
  }

  const filePath = path.join(postsDir, `${finalSlug}.mdx`);
  fs.writeFileSync(filePath, frontmatter, "utf-8");
  console.log(`✅ [${providerName}] Generated: ${title} → content/posts/${finalSlug}.mdx`);
  return finalSlug;
}

const IMG_DIR = path.resolve(__dirname, "..", "public", "images");

async function searchImage(query, category) {
  const queries = [query, category].filter(Boolean);

  const pexelsKey = process.env.PEXELS_API_KEY;
  const unsplashKey = process.env.UNSPLASH_API_KEY;

  for (const q of queries) {
    if (pexelsKey) {
      try {
        const url = `https://api.pexels.com/v1/search?query=${encodeURIComponent(q)}&per_page=1&orientation=landscape`;
        const res = await fetch(url, { headers: { Authorization: pexelsKey } });
        const data = await res.json();
        const photo = data.photos?.[0];
        if (photo) {
          console.log(`  🖼  Pexels found image for "${q.slice(0, 50)}"`);
          const imgUrl = photo.src.large2x || photo.src.large;
          return { url: imgUrl, photographer: photo.photographer };
        }
      } catch (e) {
        console.log(`  🖼  Pexels error: ${e.message.slice(0, 80)}`);
      }
    }

    if (unsplashKey) {
      try {
        const url = `https://api.unsplash.com/search/photos?query=${encodeURIComponent(q)}&per_page=1&orientation=landscape`;
        const res = await fetch(url, { headers: { Authorization: `Client-ID ${unsplashKey}` } });
        const data = await res.json();
        const photo = data.results?.[0];
        if (photo) {
          console.log(`  🖼  Unsplash found image for "${q.slice(0, 50)}"`);
          return { url: photo.urls.regular, photographer: photo.user.name };
        }
      } catch (e) {
        console.log(`  🖼  Unsplash error: ${e.message.slice(0, 80)}`);
      }
    }
  }

  return null;
}

async function downloadImage(slug, imgResult) {
  if (!imgResult) return "";
  try {
    const res = await fetch(imgResult.url);
    if (!res.ok) return "";
    const buffer = Buffer.from(await res.arrayBuffer());
    if (!fs.existsSync(IMG_DIR)) fs.mkdirSync(IMG_DIR, { recursive: true });
    const ext = imgResult.url.match(/\.(jpg|jpeg|png|webp)/i)?.[1] || "jpg";
    const filename = `${slug}.${ext}`;
    fs.writeFileSync(path.join(IMG_DIR, filename), buffer);
    console.log(`  🖼  Image saved: /images/${filename}`);
    return `/images/${filename}`;
  } catch {
    return "";
  }
}

let providerName = "";

async function tryOpenAI(cfg, topic, category) {
  const client = new OpenAI({
    apiKey: cfg.apiKey(),
    baseURL: cfg.baseURL || undefined,
  });

  const response = await client.chat.completions.create({
    model: cfg.model,
    messages: [{ role: "user", content: buildPrompt(topic, category) }],
    temperature: 0.8,
    max_tokens: 5000,
  });

  const text = response.choices[0]?.message?.content;
  if (!text) throw new Error("Empty response");

  const { title, tags, excerpt, imagePrompt, content } = parseResponse(text);
  if (!title) throw new Error("Could not parse title from response");
  providerName = cfg.name;
  console.log(`  🖼  Searching image for: "${imagePrompt.slice(0, 80) || topic.title}"...`);
  const imgResult = await searchImage(imagePrompt || topic.title, category);
  const image = imgResult ? await downloadImage(slugify(title), imgResult) : "";
  writePost(title, tags, excerpt, image, content);
  if (image) console.log(`  🖼  Image set: ${image}`);
}

async function tryGemini(cfg, topic, category) {
  const genAI = new GoogleGenerativeAI(cfg.apiKey());
  const model = genAI.getGenerativeModel({ model: cfg.model });
  const result = await model.generateContent(buildPrompt(topic, category));
  const text = result.response.text();
  if (!text) throw new Error("Empty response");

  const { title, tags, excerpt, imagePrompt, content } = parseResponse(text);
  if (!title) throw new Error("Could not parse title from response");
  providerName = cfg.name;
  console.log(`  🖼  Searching image for: "${imagePrompt.slice(0, 80) || topic.title}"...`);
  const imgResult = await searchImage(imagePrompt || topic.title, category);
  const image = imgResult ? await downloadImage(slugify(title), imgResult) : "";
  writePost(title, tags, excerpt, image, content);
  if (image) console.log(`  🖼  Image set: ${image}`);
}

async function generateWithFallback(topic, category) {
  const available = PROVIDERS.filter((p) => p.apiKey());

  if (available.length === 0) {
    throw new Error("No API keys configured. Set GEMINI_API_KEY, GROQ_API_KEY, OPENROUTER_API_KEY, OPENCODE_API_KEY, or DEEPSEEK_API_KEY");
  }

  const errors = [];

  for (const cfg of available) {
    try {
      console.log(`  Trying ${cfg.name} (${cfg.model})...`);
      if (cfg.type === "gemini") {
        await tryGemini(cfg, topic, category);
      } else {
        await tryOpenAI(cfg, topic, category);
      }
      return true;
    } catch (err) {
      const msg = err.message || String(err);
      const status = err.status || err.code || "";
      console.log(`  ✕ ${cfg.name}: ${status ? `HTTP ${status} — ` : ""}${msg.slice(0, 120)}`);
      errors.push(`${cfg.name}: ${msg}`);
    }
  }

  throw new Error(`All providers failed:\n${errors.join("\n")}`);
}

async function main() {
  console.log("🔍 Fetching trending car topics from RSS feeds...");
  const trending = await fetchTrending();

  if (trending.length === 0) {
    console.error("❌ No trending topics found");
    process.exit(1);
  }

  const available = PROVIDERS.filter((p) => p.apiKey());
  console.log(`📰 Found ${trending.length} car topics`);
  console.log(`🔑 ${available.length} provider(s) configured: ${available.map((p) => p.name).join(", ") || "none"}`);
  console.log("");

  const count = Math.min(parseInt(process.env.POST_COUNT || "2"), 5);

  for (let i = 0; i < count; i++) {
    const topic = trending[i % trending.length];
    const category = pickCategory(topic.title, topic.source);
    console.log(`✍️  [${i + 1}/${count}] [${category}] "${topic.title}"`);
    try {
      await generateWithFallback(topic, category);
    } catch (err) {
      console.error(`  ❌ Skipped — ${err.message}`);
    }
    if (i < count - 1) {
      console.log("  ⏳ Waiting 10s...");
      await new Promise((r) => setTimeout(r, 10000));
    }
  }

  console.log("");
  console.log("✅ Done!");
}

main().catch((err) => {
  console.error("❌ Fatal:", err.message);
  process.exit(1);
});
