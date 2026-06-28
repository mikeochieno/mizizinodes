import Link from "next/link";
import Script from "next/script";
import { getTrendingPosts, getLocalPosts } from "@/lib/trending";
import type { TrendingPost } from "@/lib/trending";
import { AdSlot } from "@/components/AdSense";

const siteUrl = process.env.SITE_URL || "https://mizizinodes.vercel.app";

export default async function Home() {
  const posts = await getTrendingPosts();
  const fromUs = await getLocalPosts();

  const featured = posts[0];
  const trending = posts.slice(1, 4);
  const rest = posts.slice(4, 10);
  const categories = groupByCategory(posts);

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: "MiziziNodes",
    url: siteUrl,
    description: "Curated tech news, AI breakthroughs, developer tools, and original articles from across the web.",
    potentialAction: {
      "@type": "SearchAction",
      target: `${siteUrl}/search?q={search_term_string}`,
      "query-input": "required name=search_term_string",
    },
  };

  return (
    <div className="px-8 max-w-screen-2xl mx-auto">
      <Script id="json-ld" type="application/ld+json" strategy="afterInteractive">
        {JSON.stringify(jsonLd)}
      </Script>
      <TrendingBar />

      {featured && <FeaturedStory post={featured} />}

      <section className="mt-10">
        <SectionHeader title="Trending Now" href="/blog" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {trending.map((post, i) => (
            <TrendingCard key={post.slug} post={post} rank={i + 2} />
          ))}
        </div>
      </section>

      <AdSlot slot="9200777134" className="my-8" />

      <section className="mt-12 pt-10 border-t border-zinc-200 dark:border-zinc-800">
        <SectionHeader title="Latest Stories" href="/blog" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {rest.map((post) => (
            <NewsCard key={post.slug} post={post} />
          ))}
        </div>
      </section>

      {Object.entries(categories).map(
        ([cat, catPosts]) =>
          catPosts.length >= 2 && (
            <section key={cat} className="mt-12 pt-10 border-t border-zinc-200 dark:border-zinc-800">
              <SectionHeader title={cat} />
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {catPosts.slice(0, 4).map((post) => (
                  <SmallCard key={post.slug} post={post} />
                ))}
              </div>
            </section>
          )
      )}

      {fromUs.length > 0 && (
        <section className="mt-12 pt-10 border-t border-zinc-200 dark:border-zinc-800">
          <SectionHeader title="More Stories" />
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {fromUs
              .filter((p) => !posts.slice(0, 10).find((pp) => pp.slug === p.slug))
              .slice(0, 4)
              .map((post) => (
                <FromUsCard key={post.slug} post={post} />
              ))}
          </div>
        </section>
      )}
    </div>
  );
}

function TrendingBar() {
  return (
    <div className="flex items-center gap-2 py-3 border-b border-zinc-200 dark:border-zinc-800 mb-8 overflow-x-auto">
      <span className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-rose-600 shrink-0">
        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
        </svg>
        Trending
      </span>
      <span className="w-px h-4 bg-zinc-300 dark:bg-zinc-700 shrink-0" />
      <span className="text-xs text-zinc-500 truncate">
        Original stories by MiziziNodes
      </span>
    </div>
  );
}

function SectionHeader({ title, href }: { title: string; href?: string }) {
  return (
    <div className="flex items-center justify-between mb-5">
        <h2 className="text-lg font-bold">{title}</h2>
      {href && (
        <Link href={href} className="text-sm font-medium text-blue-600 hover:text-blue-700 dark:hover:text-blue-400">
          View all &rarr;
        </Link>
      )}
    </div>
  );
}

function FeaturedStory({ post }: { post: TrendingPost }) {
  return (
    <section className="relative">
      <a href={post.sourceUrl} target="_blank" rel="noopener noreferrer" className="group block">
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-zinc-900 to-black dark:from-zinc-950 dark:to-black">
          <img
            src={post.image}
            alt={post.title}
            className="absolute inset-0 w-full h-full object-cover opacity-40 group-hover:opacity-50 transition-opacity duration-500"
          />
          <div className="relative px-6 py-10 sm:px-10 sm:py-16 lg:px-16 lg:py-20">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 backdrop-blur text-white text-xs font-semibold uppercase tracking-wider mb-4">
              Featured Story
            </span>
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white leading-tight max-w-3xl">
              {post.title}
            </h1>
            <p className="mt-4 text-base text-white/70 leading-relaxed max-w-2xl line-clamp-2">
              {post.excerpt}
            </p>
            <time className="block mt-5 text-sm text-white/50">{post.date}</time>
          </div>
        </div>
      </a>
    </section>
  );
}

function TrendingCard({ post, rank }: { post: TrendingPost; rank: number }) {
  return (
    <article className="group relative">
      <a href={post.sourceUrl} target="_blank" rel="noopener noreferrer" className="group block text-inherit hover:text-inherit no-underline">
        <div className="relative overflow-hidden rounded-xl bg-zinc-100 dark:bg-zinc-900 mb-3">
          <img
            src={post.image}
            alt={post.title}
            className="w-full aspect-[16/10] object-cover"
            loading="lazy"
          />
          <div className="absolute top-3 left-3 w-8 h-8 rounded-full bg-black/70 flex items-center justify-center">
            <span className="text-sm font-bold text-white">{rank}</span>
          </div>
        </div>
        <h2 className="text-2xl font-bold leading-tight group-hover:underline">
          {post.title}
        </h2>
        <time className="block mt-2 text-xs text-zinc-500">{post.date}</time>
      </a>
    </article>
  );
}

function NewsCard({ post }: { post: TrendingPost }) {
  return (
    <article className="group">
      <a href={post.sourceUrl} target="_blank" rel="noopener noreferrer" className="block text-inherit hover:text-inherit no-underline">
        <div className="overflow-hidden rounded-xl bg-zinc-100 dark:bg-zinc-900 mb-3">
          <img
            src={post.image}
            alt={post.title}
            className="w-full aspect-[16/9] object-cover"
            loading="lazy"
          />
        </div>
        <h2 className="text-xl font-bold leading-tight group-hover:underline">
          {post.title}
        </h2>
        <time className="block mt-2 text-xs text-zinc-500">{post.date}</time>
      </a>
    </article>
  );
}

function SmallCard({ post }: { post: TrendingPost }) {
  return (
    <article className="group border-b border-zinc-100 dark:border-zinc-800 pb-4">
      <a href={post.sourceUrl} target="_blank" rel="noopener noreferrer" className="block text-inherit hover:text-inherit no-underline">
        <div className="overflow-hidden rounded-lg bg-zinc-100 dark:bg-zinc-900 mb-2.5">
          <img
            src={post.image}
            alt={post.title}
            className="w-full aspect-[16/9] object-cover"
            loading="lazy"
          />
        </div>
        <h3 className="text-lg font-bold leading-tight group-hover:underline">
          {post.title}
        </h3>
        <time className="block mt-1.5 text-xs text-zinc-500">{post.date}</time>
      </a>
    </article>
  );
}

function FromUsCard({ post }: { post: TrendingPost }) {
  return (
    <article className="group">
      <a href={post.sourceUrl} className="block text-inherit hover:text-inherit no-underline">
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
        <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400 line-clamp-2">
          {post.excerpt}
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

function groupByCategory(posts: TrendingPost[]): Record<string, TrendingPost[]> {
  const groups: Record<string, TrendingPost[]> = {};
  for (const post of posts) {
    if (!groups[post.category]) groups[post.category] = [];
    groups[post.category].push(post);
  }
  return groups;
}
