import Link from "next/link";
import { getAllPosts } from "@/lib/posts";

export default async function TopicClusters({
  currentSlug,
  tags,
  maxPerCluster = 3,
  maxClusters = 3,
}: {
  currentSlug: string;
  tags: string[];
  maxPerCluster?: number;
  maxClusters?: number;
}) {
  const allPosts = await getAllPosts();
  const others = allPosts.filter((p) => p.slug !== currentSlug);

  if (tags.length === 0 || others.length === 0) return null;

  const clusterTags = tags.slice(0, maxClusters);
  const clusters = clusterTags
    .map((tag) => {
      const related = others
        .filter((p) => p.tags.includes(tag) && new Set(p.tags).size > 0)
        .slice(0, maxPerCluster);
      return { tag, posts: related };
    })
    .filter((c) => c.posts.length > 0);

  if (clusters.length === 0) return null;

  return (
    <section className="mt-16 pt-10 border-t border-zinc-200 dark:border-zinc-800">
      <h2 className="text-xl font-bold mb-6">Explore by Topic</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {clusters.map(({ tag, posts }) => (
          <div key={tag}>
            <h3 className="font-semibold text-sm text-blue-600 dark:text-blue-400 mb-3">
              <Link href={`/tags/${tag}`} className="hover:underline">{tag}</Link>
            </h3>
            <ul className="space-y-3">
              {posts.map((p) => (
                <li key={p.slug}>
                  <Link
                    href={`/blog/${p.slug}`}
                    className="group block"
                  >
                    <div className="flex gap-3">
                      {p.image && (
                        <div className="shrink-0 w-16 h-12 rounded-md overflow-hidden bg-zinc-100 dark:bg-zinc-900">
                          <img
                            src={p.image}
                            alt=""
                            className="w-full h-full object-cover"
                            loading="lazy"
                          />
                        </div>
                      )}
                      <div className="min-w-0">
                        <p className="text-sm font-medium leading-snug group-hover:underline">
                          {p.title}
                        </p>
                        <p className="mt-0.5 text-xs text-zinc-500">{p.readingTime}</p>
                      </div>
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
            <Link
              href={`/tags/${tag}`}
              className="mt-2 inline-flex items-center gap-0.5 text-xs font-medium text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300"
            >
              View all &rarr;
            </Link>
          </div>
        ))}
      </div>
    </section>
  );
}
