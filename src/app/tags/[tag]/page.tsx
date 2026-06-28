import { notFound } from "next/navigation";
import type { Metadata } from "next";
import Link from "next/link";
import { getTrendingPosts, getLocalPosts } from "@/lib/trending";

type Props = { params: Promise<{ tag: string }> };

export async function generateStaticParams() {
  const posts = await getTrendingPosts();
  const local = await getLocalPosts();
  const cats = new Set([...posts.map((p) => p.category), ...local.map((p) => p.category)]);
  return Array.from(cats).map((tag) => ({ tag: tag.toLowerCase() }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { tag } = await params;
  return { title: `Category: ${tag}` };
}

export default async function TagPage({ params }: Props) {
  const { tag } = await params;
  const posts = await getTrendingPosts();
  const local = await getLocalPosts();
  const all = [...local, ...posts];
  const filtered = all.filter(
    (p) => p.category.toLowerCase() === tag.toLowerCase()
  );
  if (filtered.length === 0) notFound();

  return (
    <div className="px-8 py-8 max-w-screen-2xl mx-auto">
      <Link
        href="/blog"
        className="inline-flex items-center gap-1 text-sm text-zinc-500 hover:text-black dark:hover:text-white transition-colors"
      >
        &larr; Back to blog
      </Link>
      <h1 className="text-3xl font-bold mt-4 mb-1 text-black dark:text-white capitalize">
        {tag}
      </h1>
      <p className="text-sm text-zinc-500 mb-6">{filtered.length} articles</p>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {filtered.map((post) => (
          <TagCard key={post.slug} post={post} />
        ))}
      </div>
    </div>
  );
}

function TagCard({ post }: { post: { slug: string; title: string; date: string; excerpt: string; source: string; sourceUrl: string; category: string; image: string } }) {
  const isLocal = post.sourceUrl.startsWith("/blog/");
  return (
    <article className="group">
      <a href={post.sourceUrl} target={isLocal ? undefined : "_blank"} rel={isLocal ? undefined : "noopener noreferrer"} className="block text-inherit hover:text-inherit no-underline">
        <div className="overflow-hidden rounded-xl bg-zinc-100 dark:bg-zinc-900 mb-3">
          <img
            src={post.image}
            alt={post.title}
            className="w-full aspect-[16/9] object-cover group-hover:scale-[1.02] transition-transform duration-300"
            loading="lazy"
          />
        </div>
        <h2 className="text-xl font-bold leading-tight group-hover:underline">
          {post.title}
        </h2>
        <div className="flex items-center gap-2 mt-2 text-xs text-zinc-500">
          <span className="font-medium text-zinc-700 dark:text-zinc-300">{post.source}</span>
          <span className="w-1 h-1 rounded-full bg-zinc-300 dark:bg-zinc-600" />
          <time>{post.date}</time>
        </div>
      </a>
    </article>
  );
}
