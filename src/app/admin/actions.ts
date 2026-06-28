"use server";

import { revalidatePath } from "next/cache";
import { getAllStoredPosts, createStoredPost, updateStoredPost, deleteStoredPost, type StoredPost } from "@/lib/storage";

function checkPassword(password: string) {
  const expected = process.env.BLOG_PASSWORD || "admin";
  if (password !== expected) {
    throw new Error("Invalid password");
  }
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
    .slice(0, 80);
}

export type PostDraft = {
  title: string;
  date: string;
  tags: string[];
  excerpt: string;
  author: string;
  content: string;
};

export async function verifyPassword(password: string): Promise<boolean> {
  const expected = process.env.BLOG_PASSWORD || "admin";
  return password === expected;
}

export async function createPost(password: string, data: PostDraft) {
  checkPassword(password);

  let slug = slugify(data.title);
  if (!slug) throw new Error("Title must produce a valid slug");

  const existing = await getAllStoredPosts();
  const existingSlugs = new Set(existing.map((p) => p.slug));

  let finalSlug = slug;
  let counter = 1;
  while (existingSlugs.has(finalSlug)) {
    finalSlug = `${slug}-${counter}`;
    counter++;
  }

  const post: StoredPost = {
    slug: finalSlug,
    title: data.title,
    date: data.date,
    tags: data.tags,
    excerpt: data.excerpt,
    author: data.author,
    content: data.content,
  };

  await createStoredPost(post);
  revalidatePath("/");
  revalidatePath("/blog");
}

export async function updatePost(password: string, slug: string, data: PostDraft) {
  checkPassword(password);

  const post: StoredPost = {
    slug,
    title: data.title,
    date: data.date,
    tags: data.tags,
    excerpt: data.excerpt,
    author: data.author,
    content: data.content,
  };

  await updateStoredPost(slug, post);
  revalidatePath("/");
  revalidatePath("/blog");
  revalidatePath(`/blog/${slug}`);
}

export async function deletePost(password: string, slug: string) {
  checkPassword(password);
  await deleteStoredPost(slug);
  revalidatePath("/");
  revalidatePath("/blog");
}

export async function getPostDraft(slug: string): Promise<PostDraft | null> {
  const posts = await getAllStoredPosts();
  const p = posts.find((p) => p.slug === slug);
  if (!p) return null;
  return {
    title: p.title,
    date: p.date,
    tags: p.tags,
    excerpt: p.excerpt,
    author: p.author,
    content: p.content,
  };
}

export async function listPosts(): Promise<{ slug: string; title: string; date: string }[]> {
  const posts = await getAllStoredPosts();
  return posts
    .map((p) => ({ slug: p.slug, title: p.title, date: p.date }))
    .sort((a, b) => (a.date > b.date ? -1 : 1));
}
