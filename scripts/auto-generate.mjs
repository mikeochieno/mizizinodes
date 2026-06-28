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
  "https://hnrss.org/frontpage",
  "https://techcrunch.com/feed/",
  "https://www.theverge.com/rss/index.xml",
  "https://feeds.feedburner.com/TheNextWeb",
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
  "Cybersecurity",
  "Mobile & Apps",
  "Gaming",
  "Startups",
];

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

Respond in this exact format:
TITLE: <title>
TAGS: <tag1, tag2, tag3, tag4>
EXCERPT: <excerpt>
CONTENT:
<content in markdown>`;
}

function parseResponse(text) {
  const titleMatch = text.match(/TITLE:\s*(.+)/);
  const tagsMatch = text.match(/TAGS:\s*(.+)/);
  const excerptMatch = text.match(/EXCERPT:\s*(.+)/);
  const contentMatch = text.match(/CONTENT:\s*([\s\S]+)/);
  return {
    title: titleMatch?.[1]?.trim() || "",
    tags: (tagsMatch?.[1]?.trim() || "tech").split(",").map((t) => t.trim().toLowerCase()),
    excerpt: excerptMatch?.[1]?.trim() || "",
    content: contentMatch?.[1]?.trim() || "",
  };
}

function writePost(title, tags, excerpt, content) {
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
excerpt: "${excerpt.replace(/"/g, '\\"')}"
author: "AI Editor"
---

${content}
`;

  if (!fs.existsSync(postsDir)) {
    fs.mkdirSync(postsDir, { recursive: true });
  }

  const filePath = path.join(postsDir, `${finalSlug}.mdx`);
  fs.writeFileSync(filePath, frontmatter, "utf-8");
  console.log(`✅ [${providerName}] Generated: ${title} → content/posts/${finalSlug}.mdx`);
  return true;
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

  const { title, tags, excerpt, content } = parseResponse(text);
  if (!title) throw new Error("Could not parse title from response");
  providerName = cfg.name;
  writePost(title, tags, excerpt, content);
}

async function tryGemini(cfg, topic, category) {
  const genAI = new GoogleGenerativeAI(cfg.apiKey());
  const model = genAI.getGenerativeModel({ model: cfg.model });
  const result = await model.generateContent(buildPrompt(topic, category));
  const text = result.response.text();
  if (!text) throw new Error("Empty response");

  const { title, tags, excerpt, content } = parseResponse(text);
  if (!title) throw new Error("Could not parse title from response");
  providerName = cfg.name;
  writePost(title, tags, excerpt, content);
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

  const count = Math.min(parseInt(process.env.POST_COUNT || "3"), 5);

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
