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
  "https://trends.google.com/trending/rss?geo=US",
  "https://hnrss.org/frontpage",
  "https://feeds.bbci.co.uk/news/rss.xml",
  "https://www.espn.com/espn/rss/news",
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
];

function slugify(text) {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
    .slice(0, 60);
}

async function fetchTrending() {
  const items = [];
  for (const url of RSS_FEEDS) {
    try {
      const feed = await parser.parseURL(url);
      for (const item of feed.items.slice(0, 3)) {
        if (item.title && item.link) {
          items.push({ title: item.title, link: item.link, source: feed.title });
        }
      }
    } catch {}
  }
  return items;
}

const CATEGORIES = [
  "AI & Machine Learning",
  "Software Development",
  "Tech Industry",
  "Science & Space",
  "World News & Politics",
  "Sports",
  "Entertainment",
  "Business & Finance",
];

function shuffle(arr) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

function buildPrompt(topic, assignedCategory) {
  return `You are a tech journalist. Write a well-researched, engaging, original blog post about this trending topic:

"${topic.title}" (source: ${topic.source})

Requirements:
- Title: compelling headline
- Date: today's date (${new Date().toISOString().split("T")[0]})
- Tags: 4-5 relevant tags including "${assignedCategory.toLowerCase()}" (comma separated, lowercase)
- Author: AI Editor
- Excerpt: 2-3 sentence summary that hooks the reader
- Content: 600-1000 words, well-structured with paragraphs and subheadings (##), engaging tone, factual, feels like original journalism not a summary
- IMAGE_PROMPT: a short search query (10-20 words) to find a relevant photo for this article on a stock image site — describe the scene/subject visually, e.g. "close up of a person typing code on a laptop" or "soccer player celebrating a goal in stadium"

Respond in this exact format:
TITLE: <title>
TAGS: <tag1, tag2, tag3, tag4>
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
    tags: (tagsMatch?.[1]?.trim() || "tech").split(",").map((t) => t.trim().toLowerCase()),
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
  // tries Pexels → Unsplash, each with 2 queries (imagePrompt → category)
  const queries = [query, category].filter(Boolean);

  const pexelsKey = process.env.PEXELS_API_KEY;
  const unsplashKey = process.env.UNSPLASH_API_KEY;

  for (const q of queries) {
    // try Pexels
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

    // try Unsplash
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
    temperature: 0.7,
    max_tokens: 2000,
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
    throw new Error("No API keys configured. Set GEMINI_API_KEY, GROQ_API_KEY, OPENROUTER_API_KEY, or OPENCODE_API_KEY");
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
  console.log("🔍 Fetching trending topics from RSS feeds...");
  const trending = await fetchTrending();

  if (trending.length === 0) {
    console.error("❌ No trending topics found");
    process.exit(1);
  }

  const available = PROVIDERS.filter((p) => p.apiKey());
  console.log(`📰 Found ${trending.length} topics`);
  console.log(`🔑 ${available.length} provider(s) configured: ${available.map((p) => p.name).join(", ") || "none"}`);
  console.log("");

  shuffle(trending);
  const count = Math.min(parseInt(process.env.POST_COUNT || "2"), 5);

  for (let i = 0; i < count; i++) {
    const topic = trending[i % trending.length];
    const category = CATEGORIES[i % CATEGORIES.length];
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
