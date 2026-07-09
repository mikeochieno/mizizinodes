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
  "https://hnrss.org/newest?q=ai+OR+llm+OR+gpt+OR+neural+OR+transformer+OR+diffusion+OR+agent+OR+rag+OR+fine+tuning",
  "https://rss.nytimes.com/services/xml/rss/nyt/Technology.xml",
  "https://www.theverge.com/rss/ai-artificial-intelligence/index.xml",
  "https://techcrunch.com/category/artificial-intelligence/feed/",
  "https://www.artificialintelligence-news.com/feed/",
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

const AI_CATEGORIES = [
  "LLMs & Foundation Models",
  "AI Agents & Tools",
  "Machine Learning Research",
  "AI Engineering",
  "AI Ethics & Policy",
  "Computer Vision & Generative AI",
  "NLP & Speech",
  "AI Industry & Business",
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
      for (const item of feed.items.slice(0, 4)) {
        if (item.title && item.link) {
          items.push({ title: item.title, link: item.link, source: feed.title });
        }
      }
    } catch {}
  }
  return items;
}

function pickCategory(title, source) {
  const t = (title + " " + source).toLowerCase();
  if (t.includes("agent") || t.includes("tool") || t.includes("autogpt") || t.includes("function call"))
    return "AI Agents & Tools";
  if (t.includes("llm") || t.includes("gpt") || t.includes("foundation model") || t.includes("claude") || t.includes("gemini") || t.includes("llama") || t.includes("mistral") || t.includes("transformer"))
    return "LLMs & Foundation Models";
  if (t.includes("ml") || t.includes("training") || t.includes("fine-tun") || t.includes("backprop") || t.includes("gradient") || t.includes("loss") || t.includes("dataset") || t.includes("reinforcement"))
    return "Machine Learning Research";
  if (t.includes("compute") || t.includes("vision") || t.includes("diffusion") || t.includes("generat") || t.includes("image") || t.includes("video") || t.includes("stable diffusion") || t.includes("sora"))
    return "Computer Vision & Generative AI";
  if (t.includes("nlp") || t.includes("speech") || t.includes("language model") || t.includes("translation") || t.includes("rag") || t.includes("embedding") || t.includes("semantic"))
    return "NLP & Speech";
  if (t.includes("ethic") || t.includes("safety") || t.includes("alignment") || t.includes("bias") || t.includes("regulation") || t.includes("policy") || t.includes("governance") || t.includes("open source"))
    return "AI Ethics & Policy";
  if (t.includes("engineer") || t.includes("deploy") || t.includes("infra") || t.includes("pipeline") || t.includes("mllm") || t.includes("optimiz") || t.includes("inference") || t.includes("serving"))
    return "AI Engineering";
  return "AI Industry & Business";
}

function buildPrompt(topic, category) {
  return `You are a senior AI researcher and tech journalist. Write a deep, original analysis piece about this trending AI topic:

"${topic.title}" (source: ${topic.source})

This article must NOT be a shallow summary. It must deliver original analysis, comparisons, context, and insight. Follow these requirements:

STRUCTURE & FORMAT:
- Title: a compelling, specific headline (not generic)
- Date: today's date (${new Date().toISOString().split("T")[0]})
- Tags: 4-6 relevant tags including "${category.toLowerCase()}" (comma separated, lowercase)
- Author: MiziziNodes Editorial
- Excerpt: 2-3 sentence summary that hooks the reader and states the article's thesis
- Content: 1000-1500 words — well-structured with an introduction, 3-5 subheadings (##), and a conclusion
- IMAGE_PROMPT: a short search query (10-20 words) to find a relevant photo — describe the scene/subject visually

CONTENT REQUIREMENTS (must include at least 3 of these):
1. COMPARISON: Compare this development with previous approaches or competing solutions (e.g., Claude vs GPT vs Gemini, PyTorch vs JAX, etc.)
2. CONTEXT: Explain why this matters — what problem does it solve, what's the broader trend?
3. ANALYSIS: Give your own assessment — is this hype or real progress? What are the limitations?
4. TECHNICAL DEPTH: Include at least one concrete technical detail (architecture choice, benchmark result, training method, API pattern, etc.)
5. PRACTICAL IMPACT: How will this affect developers, researchers, or businesses?

TONE & STYLE:
- Analytical and insightful, not promotional
- Cite specific examples, papers, or products
- Acknowledge both strengths and weaknesses
- Write in clear, engaging prose — aim for something between a blog post and a newsletter analysis

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
    tags: (tagsMatch?.[1]?.trim() || "ai").split(",").map((t) => t.trim().toLowerCase()),
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
    max_tokens: 3500,
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
  console.log("🔍 Fetching trending AI topics from RSS feeds...");
  const trending = await fetchTrending();

  if (trending.length === 0) {
    console.error("❌ No trending topics found");
    process.exit(1);
  }

  const available = PROVIDERS.filter((p) => p.apiKey());
  console.log(`📰 Found ${trending.length} AI topics`);
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
