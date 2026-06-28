import { getAllStoredPosts, getStoredPost } from "./storage";

export type PostMeta = {
  slug: string;
  title: string;
  date: string;
  tags: string[];
  image?: string;
  excerpt: string;
  author: string;
  readingTime: string;
};

export async function getAllPosts(): Promise<PostMeta[]> {
  const posts = await getAllStoredPosts();
  return posts.map((p) => ({
    slug: p.slug,
    title: p.title,
    date: p.date,
    tags: p.tags,
    image: p.image,
    excerpt: p.excerpt,
    author: p.author,
    readingTime: calculateReadingTime(p.content),
  }));
}

export async function getPost(slug: string): Promise<{
  content: string;
  meta: PostMeta;
} | null> {
  const p = await getStoredPost(slug);
  if (!p) return null;
  return {
    content: p.content,
    meta: {
      slug: p.slug,
      title: p.title,
      date: p.date,
      tags: p.tags,
      excerpt: p.excerpt,
      author: p.author,
      readingTime: calculateReadingTime(p.content),
    },
  };
}

export async function getAllTags(): Promise<string[]> {
  const posts = await getAllPosts();
  const tags = new Set<string>();
  posts.forEach((p) => p.tags.forEach((t) => tags.add(t)));
  return Array.from(tags).sort();
}

export async function getPostsByTag(tag: string): Promise<PostMeta[]> {
  const posts = await getAllPosts();
  return posts.filter((p) => p.tags.includes(tag));
}

export async function getRelatedPosts(currentSlug: string, tags: string[], count = 3): Promise<PostMeta[]> {
  const posts = (await getAllPosts()).filter((p) => p.slug !== currentSlug);
  const scored = posts.map((p) => {
    const overlap = p.tags.filter((t) => tags.includes(t)).length;
    return { post: p, score: overlap };
  });
  scored.sort((a, b) => b.score - a.score);
  return scored.slice(0, count).map((s) => s.post);
}

export function extractHeadings(content: string): { id: string; text: string; level: number }[] {
  const headingRegex = /^(#{1,3})\s+(.+)$/gm;
  const headings: { id: string; text: string; level: number }[] = [];
  let match;
  while ((match = headingRegex.exec(content)) !== null) {
    const text = match[2].trim();
    const id = text
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");
    headings.push({ id, text, level: match[1].length });
  }
  return headings;
}

export async function getAllTagsWithCount(): Promise<{ tag: string; count: number }[]> {
  const posts = await getAllPosts();
  const map = new Map<string, number>();
  posts.forEach((p) => p.tags.forEach((t) => map.set(t, (map.get(t) || 0) + 1)));
  return Array.from(map.entries())
    .map(([tag, count]) => ({ tag, count }))
    .sort((a, b) => b.count - a.count);
}

function calculateReadingTime(content: string): string {
  const words = content.trim().split(/\s+/).length;
  const minutes = Math.max(1, Math.ceil(words / 200));
  return `${minutes} min read`;
}
