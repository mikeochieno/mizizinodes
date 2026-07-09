import Link from "next/link";
import { getRelatedPosts } from "@/lib/posts";

export default async function NextArticle({ currentSlug, tags }: { currentSlug: string; tags: string[] }) {
  const related = await getRelatedPosts(currentSlug, tags, 1);
  const next = related[0];
  if (!next) return null;

  return (
    <div className="mt-10 pt-8 border-t border-zinc-200 dark:border-zinc-800">
      <Link href={`/blog/${next.slug}`} className="group block">
        <span className="text-xs font-medium text-zinc-500 uppercase tracking-wider">Next article</span>
        <h3 className="mt-1 text-lg font-bold group-hover:underline">{next.title}</h3>
        {next.excerpt && (
          <p className="mt-1 text-sm text-zinc-500 line-clamp-2">{next.excerpt}</p>
        )}
      </Link>
    </div>
  );
}
