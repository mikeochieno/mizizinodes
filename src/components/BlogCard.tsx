import Link from "next/link";
import TagBadge from "./TagBadge";
import type { PostMeta } from "@/lib/posts";

export default function BlogCard({ post }: { post: PostMeta }) {
  return (
    <article className="group relative">
      <div className="absolute -inset-x-3 -inset-y-2 rounded-xl bg-zinc-900/[0.07] dark:bg-zinc-900/50 opacity-0 group-hover:opacity-100 transition-all duration-300 -z-10" />
      <Link href={`/blog/${post.slug}`} className="block">
        <h2 className="text-base font-semibold text-zinc-900 dark:text-zinc-100 group-hover:text-accent dark:group-hover:text-blue-400 transition-colors duration-300">
          {post.title}
        </h2>
        <div className="flex flex-wrap items-center gap-x-2.5 mt-1 text-xs text-zinc-500 dark:text-zinc-400 group-hover:text-white/70 dark:group-hover:text-zinc-400 transition-colors duration-300">
          <time className="tabular-nums">{post.date}</time>
          <span className="w-1 h-1 rounded-full bg-zinc-300 dark:bg-zinc-600 group-hover:bg-white/40 dark:group-hover:bg-zinc-500 transition-colors duration-300" />
          <span>{post.readingTime}</span>
          {post.author && (
            <>
              <span className="w-1 h-1 rounded-full bg-zinc-300 dark:bg-zinc-600 group-hover:bg-white/40 dark:group-hover:bg-zinc-500 transition-colors duration-300" />
              <span>{post.author}</span>
            </>
          )}
        </div>
        {post.excerpt && (
          <p className="mt-1.5 text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed line-clamp-2 group-hover:text-white/80 dark:group-hover:text-zinc-400 transition-colors duration-300">
            {post.excerpt}
          </p>
        )}
      </Link>
      {post.tags.length > 0 && (
        <div className="flex flex-wrap gap-1 mt-2">
          {post.tags.map((t) => (
            <TagBadge key={t} tag={t} />
          ))}
        </div>
      )}
    </article>
  );
}
