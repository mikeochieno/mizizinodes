#!/usr/bin/env node

import Parser from "rss-parser";
import OpenAI from "openai";
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
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

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

async function generatePost(topic) {
  const prompt = `You are a tech journalist. Write a well-researched, engaging blog post about this trending topic:

"${topic.title}" (source: ${topic.source})

Requirements:
- Title: compelling headline
- Date: today's date (${new Date().toISOString().split("T")[0]})
- Tags: 3-4 relevant tags (comma separated, lowercase)
- Author: AI Editor
- Excerpt: 1-2 sentence summary
- Content: 500-800 words, well-structured with paragraphs and subheadings (##), engaging tone, factual

Respond in this exact format:
TITLE: <title>
TAGS: <tag1, tag2, tag3>
EXCERPT: <excerpt>
CONTENT:
<content in markdown>
`;

  const response = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [{ role: "user", content: prompt }],
    temperature: 0.7,
    max_tokens: 1500,
  });

  const text = response.choices[0]?.message?.content;
  if (!text) throw new Error("No response from OpenAI");

  const titleMatch = text.match(/TITLE:\s*(.+)/);
  const tagsMatch = text.match(/TAGS:\s*(.+)/);
  const excerptMatch = text.match(/EXCERPT:\s*(.+)/);
  const contentMatch = text.match(/CONTENT:\s*([\s\S]+)/);

  const title = titleMatch?.[1]?.trim() || topic.title;
  const tags = (tagsMatch?.[1]?.trim() || "tech").split(",").map((t) => t.trim().toLowerCase());
  const excerpt = excerptMatch?.[1]?.trim() || "";
  const content = contentMatch?.[1]?.trim() || "";

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

  console.log(`✅ Generated: ${title} → content/posts/${finalSlug}.mdx`);
  return finalSlug;
}

async function main() {
  if (!process.env.OPENAI_API_KEY) {
    console.error("❌ OPENAI_API_KEY environment variable is required");
    process.exit(1);
  }

  console.log("🔍 Fetching trending topics...");
  const trending = await fetchTrending();

  if (trending.length === 0) {
    console.error("❌ No trending topics found from RSS feeds");
    process.exit(1);
  }

  console.log(`📰 Found ${trending.length} trending topics`);
  console.log("");

  const count = Math.min(parseInt(process.env.POST_COUNT || "1"), 3);

  for (let i = 0; i < count; i++) {
    const topic = trending[i];
    console.log(`✍️  Generating post ${i + 1}/${count}: "${topic.title}"...`);
    try {
      await generatePost(topic);
    } catch (err) {
      console.error(`❌ Failed to generate post for "${topic.title}":`, err.message);
    }
    if (i < count - 1) {
      console.log("⏳ Waiting 10s before next generation...");
      await new Promise((r) => setTimeout(r, 10000));
    }
  }

  console.log("");
  console.log("✅ Done! Generated posts will appear in the 'From Us' section.");
}

main().catch((err) => {
  console.error("❌ Script failed:", err);
  process.exit(1);
});
