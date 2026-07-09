import { notFound } from "next/navigation";
import type { Metadata } from "next";
import Script from "next/script";
import Link from "next/link";
import { getPostBySlug, getTrendingPosts, getLocalPosts } from "@/lib/trending";
import { getPost, getRelatedPosts, extractHeadings } from "@/lib/posts";

type Props = { params: Promise<{ slug: string }> };

const siteUrl = process.env.SITE_URL || "https://mizizinodes.vercel.app";

export async function generateStaticParams() {
  const [posts, local] = await Promise.all([getTrendingPosts(), getLocalPosts()]);
  return [...local, ...posts].map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const post = await getPostBySlug(slug);
  if (!post) return {};
  return {
    title: post.title,
    description: post.excerpt,
    openGraph: {
      title: post.title,
      description: post.excerpt,
      type: "article",
      publishedTime: post.date,
      url: `${siteUrl}/blog/${post.slug}`,
      images: post.image ? [{ url: post.image }] : [],
    },
    twitter: {
      card: "summary_large_image",
      title: post.title,
      description: post.excerpt,
      images: post.image ? [post.image] : [],
    },
  };
}

export default async function PostPage({ params }: Props) {
  const { slug } = await params;
  const post = await getPostBySlug(slug);
  if (!post) notFound();

  const localPost = post.sourceUrl.startsWith("/blog/") ? await getPost(slug) : null;

  const headings = localPost ? extractHeadings(localPost.content) : [];
  const related = localPost ? await getRelatedPosts(slug, localPost.meta.tags, 4) : [];

  const articleJsonLd = {
    "@context": "https://schema.org",
    "@type": "NewsArticle",
    headline: post.title,
    description: post.excerpt,
    image: post.image,
    datePublished: post.date,
    author: {
      "@type": "Person",
      name: post.source || "MiziziNodes",
    },
    publisher: {
      "@type": "Organization",
      name: "MiziziNodes",
      url: siteUrl,
    },
    mainEntityOfPage: {
      "@type": "WebPage",
      "@id": `${siteUrl}/blog/${post.slug}`,
    },
  };

  return (
    <div className="px-8 py-8 max-w-screen-2xl mx-auto">
      <Script id="article-json-ld" type="application/ld+json" strategy="afterInteractive">
        {JSON.stringify(articleJsonLd)}
      </Script>
      <Link
        href="/blog"
        className="inline-flex items-center gap-1 text-sm text-zinc-500 hover:text-black dark:hover:text-white transition-colors"
      >
        &larr; Back to blog
      </Link>

      <article className="mt-6 max-w-3xl">
        <span className="inline-block text-xs font-semibold uppercase tracking-wider text-blue-600 dark:text-blue-400 mb-3">
          {post.category}
        </span>
        <h1 className="text-3xl sm:text-4xl font-bold tracking-tight leading-tight">
          {post.title}
        </h1>
        <div className="flex items-center gap-2 mt-3 text-sm text-zinc-500">
          <span className="font-medium text-zinc-700 dark:text-zinc-300">{post.source}</span>
          <span className="w-1 h-1 rounded-full bg-zinc-300 dark:bg-zinc-600" />
          <time>{post.date}</time>
          {localPost && (
            <>
              <span className="w-1 h-1 rounded-full bg-zinc-300 dark:bg-zinc-600" />
              <span>{localPost.meta.readingTime}</span>
            </>
          )}
        </div>

        {post.image && (
          <img src={post.image} alt={post.title} className="mt-6 w-full rounded-xl object-cover aspect-video" />
        )}

        {localPost ? (
          <div className="mt-6 flex gap-8">
            {headings.length > 1 && (
              <aside className="hidden lg:block w-56 shrink-0">
                <div className="sticky top-20">
                  <h4 className="text-xs font-semibold uppercase tracking-wider text-zinc-500 mb-3">
                    In this article
                  </h4>
                  <nav className="space-y-1.5">
                    {headings.map((h) => (
                      <a
                        key={h.id}
                        href={`#${h.id}`}
                        className="block text-sm text-zinc-500 hover:text-black dark:hover:text-white transition-colors leading-snug"
                        style={{ paddingLeft: `${(h.level - 2) * 12}px` }}
                      >
                        {h.text}
                      </a>
                    ))}
                  </nav>
                </div>
              </aside>
            )}
            <div
              className="prose prose-zinc dark:prose-invert max-w-none min-w-0 flex-1"
              dangerouslySetInnerHTML={{ __html: mdToHtml(localPost.content) }}
            />
          </div>
        ) : (
          <>
            <p className="mt-6 text-base text-zinc-700 dark:text-zinc-300 leading-relaxed">
              {post.excerpt}
            </p>
            <p className="mt-4 text-sm text-zinc-500">
              This article was curated from an external source.
            </p>
            <div className="mt-4">
              <a
                href={post.sourceUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-black dark:bg-white text-white dark:text-black text-sm font-medium hover:bg-zinc-800 dark:hover:bg-zinc-200 transition-colors"
              >
                Read full article &rarr;
              </a>
            </div>
          </>
        )}
      </article>

      {related.length > 0 && (
        <section className="mt-16 pt-10 border-t border-zinc-200 dark:border-zinc-800 max-w-3xl">
          <h2 className="text-xl font-bold mb-6">Related Articles</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {related.map((r) => (
              <Link
                key={r.slug}
                href={`/blog/${r.slug}`}
                className="group block"
              >
                {r.image && (
                  <div className="overflow-hidden rounded-xl bg-zinc-100 dark:bg-zinc-900 mb-3">
                    <img
                      src={r.image}
                      alt={r.title}
                      className="w-full aspect-[16/9] object-cover group-hover:scale-[1.02] transition-transform duration-300"
                      loading="lazy"
                    />
                  </div>
                )}
                <h3 className="font-bold leading-snug group-hover:underline">{r.title}</h3>
                <p className="mt-1 text-sm text-zinc-500 line-clamp-2">{r.excerpt}</p>
              </Link>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

function mdToHtml(md: string): string {
  let html = md
    .replace(/^### (.+)$/gm, (_, t) => {
      const id = t.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
      return `<h3 id="${id}">${t}</h3>`;
    })
    .replace(/^## (.+)$/gm, (_, t) => {
      const id = t.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
      return `<h2 id="${id}">${t}</h2>`;
    })
    .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
    .replace(/\*(.+?)\*/g, "<em>$1</em>")
    .replace(/`(.+?)`/g, "<code>$1</code>")
    .replace(/^> (.+)$/gm, "<blockquote>$1</blockquote>")
    .replace(/```[\s\S]*?```/g, (m) => {
      const code = m.replace(/```\w*\n?/, "").replace(/\n?```$/, "");
      return `<pre>${code}</pre>`;
    })
    .replace(/^[\-*] (.+)$/gm, "<li>$1</li>")
    .replace(/(<li>.*<\/li>\n?)+/g, "<ul>$&</ul>")
    .replace(/\n\n/g, "</p><p>")
    .replace(/^([^<].+)$/gm, (m) => {
      if (m.startsWith("<")) return m;
      return `<p>${m}</p>`;
    });
  return html;
}
