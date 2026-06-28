import type { Metadata } from "next";
import { getTrendingPosts, getLocalPosts } from "@/lib/trending";
import type { TrendingPost } from "@/lib/trending";
import { AdSlot } from "@/components/AdSense";

export const metadata: Metadata = {
  title: "Blog",
  description: "All blog posts",
};

export default async function BlogPage() {
  const trending = await getTrendingPosts();
  const local = await getLocalPosts();
  const posts = [...local, ...trending];

  return (
    <div className="px-8 py-8 max-w-screen-2xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight text-black dark:text-white">
          All Posts
        </h1>
        <p className="text-sm text-zinc-500 mt-1">
          {posts.length} articles
        </p>
      </div>
      <AdSlot slot="9200777134" className="mb-8" />
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-x-6 gap-y-8">
        {posts.map((post) => (
          <BlogCard key={post.slug} post={post} />
        ))}
      </div>
    </div>
  );
}

function BlogCard({ post }: { post: TrendingPost }) {
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
