import fs from "fs";
import path from "path";
import matter from "gray-matter";
import { kv } from "@vercel/kv";

const postsDir = path.join(process.cwd(), "content", "posts");
const POSTS_KEY = "blog:posts";

export type StoredPost = {
  slug: string;
  title: string;
  date: string;
  tags: string[];
  excerpt: string;
  author: string;
  content: string;
};

function isVercel(): boolean {
  return process.env.VERCEL === "1";
}

export async function getAllStoredPosts(): Promise<StoredPost[]> {
  if (isVercel()) {
    const posts = await kv.get<StoredPost[]>(POSTS_KEY);
    if (posts && posts.length > 0) return posts;
  }
  return getPostsFromFS();
}

export async function getStoredPost(slug: string): Promise<StoredPost | null> {
  const posts = await getAllStoredPosts();
  return posts.find((p) => p.slug === slug) || null;
}

export async function createStoredPost(data: StoredPost): Promise<void> {
  if (isVercel()) {
    const posts = await getAllStoredPosts();
    posts.push(data);
    await kv.set(POSTS_KEY, posts);
  } else {
    writePostToFS(data);
  }
}

export async function updateStoredPost(slug: string, data: StoredPost): Promise<void> {
  if (isVercel()) {
    const posts = await getAllStoredPosts();
    const idx = posts.findIndex((p) => p.slug === slug);
    if (idx >= 0) posts[idx] = data;
    await kv.set(POSTS_KEY, posts);
  } else {
    writePostToFS({ ...data, slug });
  }
}

export async function deleteStoredPost(slug: string): Promise<void> {
  if (isVercel()) {
    const posts = await getAllStoredPosts();
    const filtered = posts.filter((p) => p.slug !== slug);
    await kv.set(POSTS_KEY, filtered);
  } else {
    const filePath = path.join(postsDir, `${slug}.mdx`);
    if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
  }
}

function getPostsFromFS(): StoredPost[] {
  if (!fs.existsSync(postsDir)) return [];
  return fs
    .readdirSync(postsDir)
    .filter((f) => f.endsWith(".mdx"))
    .map((f) => {
      const slug = f.replace(/\.mdx$/, "");
      const source = fs.readFileSync(path.join(postsDir, f), "utf-8");
      const { data, content } = matter(source);
      return {
        slug,
        title: data.title || slug,
        date: data.date || "",
        tags: data.tags || [],
        excerpt: data.excerpt || "",
        author: data.author || "",
        content: content.trim(),
      };
    })
    .sort((a, b) => (a.date > b.date ? -1 : 1));
}

function writePostToFS(data: StoredPost): void {
  const tagStr = data.tags.map((t) => `"${t}"`).join(", ");
  const frontmatter = `---
title: "${data.title.replace(/"/g, '\\"')}"
date: "${data.date}"
tags: [${tagStr}]
excerpt: "${data.excerpt.replace(/"/g, '\\"')}"
author: "${data.author.replace(/"/g, '\\"')}"
---

${data.content}`;

  if (!fs.existsSync(postsDir)) {
    fs.mkdirSync(postsDir, { recursive: true });
  }
  fs.writeFileSync(path.join(postsDir, `${data.slug}.mdx`), frontmatter, "utf-8");
}
