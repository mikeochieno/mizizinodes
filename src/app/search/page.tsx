import type { Metadata } from "next";
import { getTrendingPosts, getLocalPosts } from "@/lib/trending";
import type { TrendingPost } from "@/lib/trending";

type Props = { searchParams: Promise<{ q?: string }> };

export const metadata: Metadata = {
  title: "Search",
  description: "Search articles",
};

export default async function SearchPage({ searchParams }: Props) {
  const { q } = await searchParams;
  const posts = [...await getLocalPosts(), ...await getTrendingPosts()];

  const query = (q || "").trim().toLowerCase();
  const results = query
    ? posts.filter(
        (p) =>
          p.title.toLowerCase().includes(query) ||
          p.excerpt.toLowerCase().includes(query) ||
          p.category.toLowerCase().includes(query) ||
          p.source.toLowerCase().includes(query)
      )
    : [];

  return (
    <div className="px-8 py-8 max-w-screen-2xl mx-auto">
      <form action="/search" method="GET" className="mb-8">
        <div className="flex items-center gap-3">
          <input
            type="text"
            name="q"
            defaultValue={q || ""}
            placeholder="Search articles..."
            autoFocus
            className="flex-1 h-12 px-4 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-black dark:text-white text-base outline-none focus:border-blue-500 dark:focus:border-blue-400 transition-colors"
          />
          <button
            type="submit"
            className="h-12 px-5 rounded-xl bg-black dark:bg-white text-white dark:text-black text-sm font-medium hover:bg-zinc-800 dark:hover:bg-zinc-200 transition-colors"
          >
            Search
          </button>
        </div>
      </form>

      {query && (
        <p className="text-sm text-zinc-500 mb-6">
          {results.length} result{results.length !== 1 ? "s" : ""} for &quot;{q}&quot;
        </p>
      )}

      {query && results.length === 0 && (
        <p className="text-zinc-500">No articles found. Try a different search term.</p>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {results.map((post) => (
          <ResultCard key={post.slug} post={post} query={query} />
        ))}
      </div>
    </div>
  );
}

function ResultCard({ post, query }: { post: TrendingPost; query: string }) {
  const highlight = (text: string) => {
    if (!query) return text;
    const idx = text.toLowerCase().indexOf(query);
    if (idx === -1) return text;
    return (
      <>
        {text.slice(0, idx)}
        <mark className="bg-yellow-200 dark:bg-yellow-800 text-inherit rounded-sm px-0.5">
          {text.slice(idx, idx + query.length)}
        </mark>
        {text.slice(idx + query.length)}
      </>
    );
  };

  const isLocal = post.sourceUrl.startsWith("/blog/");

  return (
    <article className="group">
      <a href={post.sourceUrl} target={isLocal ? undefined : "_blank"} rel={isLocal ? undefined : "noopener noreferrer"} className="block text-inherit hover:text-inherit no-underline">
        <div className="overflow-hidden rounded-xl bg-zinc-100 dark:bg-zinc-900 mb-3">
          <img
            src={post.image}
            alt=""
            className="w-full aspect-[16/9] object-cover group-hover:scale-[1.02] transition-transform duration-300"
            loading="lazy"
          />
        </div>
        <h2 className="text-xl font-bold leading-tight group-hover:underline">
          {highlight(post.title)}
        </h2>
        <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400 line-clamp-2">
          {highlight(post.excerpt)}
        </p>
        <div className="flex items-center gap-2 mt-2 text-xs text-zinc-500">
          <span className="font-medium text-zinc-700 dark:text-zinc-300">{post.source}</span>
          <span className="w-1 h-1 rounded-full bg-zinc-300 dark:bg-zinc-600" />
          <time>{post.date}</time>
        </div>
      </a>
    </article>
  );
}
