import type { Metadata } from "next";
import Link from "next/link";
import { getTrendingPosts, getLocalPosts } from "@/lib/trending";
import type { TrendingPost } from "@/lib/trending";
import { AdSlot } from "@/components/AdSense";

export const metadata: Metadata = {
  title: "Blog",
  description: "All AI research articles and analysis — MiziziNodes",
};

type Props = { searchParams: Promise<{ page?: string }> };

const PER_PAGE = 24;

export default async function BlogPage({ searchParams }: Props) {
  const { page } = await searchParams;
  const currentPage = Math.max(1, parseInt(page || "1", 10));
  const trending = await getTrendingPosts();
  const local = await getLocalPosts();
  const all = [...local, ...trending];
  const totalPages = Math.ceil(all.length / PER_PAGE);
  const posts = all.slice((currentPage - 1) * PER_PAGE, currentPage * PER_PAGE);

  return (
    <div className="px-8 py-8 max-w-screen-2xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight text-black dark:text-white">
          All Posts
        </h1>
        <p className="text-sm text-zinc-500 mt-1">
          {all.length} articles
        </p>
      </div>
      <AdSlot slot="9200777134" className="mb-8" />
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-x-6 gap-y-8">
        {posts.map((post) => (
          <BlogCard key={post.slug} post={post} />
        ))}
      </div>
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 mt-12">
          {currentPage > 1 && (
            <Link
              href={`/blog?page=${currentPage - 1}`}
              className="px-4 py-2 rounded-xl text-sm font-medium bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors"
            >
              &larr; Previous
            </Link>
          )}
          {Array.from({ length: Math.min(totalPages, 7) }, (_, i) => {
            let pageNum: number;
            if (totalPages <= 7) {
              pageNum = i + 1;
            } else if (currentPage <= 4) {
              pageNum = i + 1;
            } else if (currentPage >= totalPages - 3) {
              pageNum = totalPages - 6 + i;
            } else {
              pageNum = currentPage - 3 + i;
            }
            return (
              <Link
                key={pageNum}
                href={`/blog?page=${pageNum}`}
                className={`w-9 h-9 rounded-xl text-sm font-medium flex items-center justify-center transition-colors ${
                  pageNum === currentPage
                    ? "bg-black dark:bg-white text-white dark:text-black"
                    : "text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800"
                }`}
              >
                {pageNum}
              </Link>
            );
          })}
          {currentPage < totalPages && (
            <Link
              href={`/blog?page=${currentPage + 1}`}
              className="px-4 py-2 rounded-xl text-sm font-medium bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors"
            >
              Next &rarr;
            </Link>
          )}
        </div>
      )}
    </div>
  );
}

function BlogCard({ post }: { post: TrendingPost }) {
  return (
    <article className="group">
      <Link href={`/blog/${post.slug}`} className="block text-inherit hover:text-inherit no-underline">
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
      </Link>
    </article>
  );
}
