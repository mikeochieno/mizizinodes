import type { Metadata } from "next";
import Link from "next/link";
import { getAllTagsWithCount } from "@/lib/posts";

export const metadata: Metadata = {
  title: "Categories",
  description: "Browse articles by category",
};

export default async function TagsPage() {
  const tags = await getAllTagsWithCount();

  return (
    <div className="px-8 py-8 max-w-screen-2xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight text-black dark:text-white">
          Categories
        </h1>
        <p className="text-sm text-zinc-500 mt-1">
          {tags.length} categories
        </p>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
        {tags.map(({ tag, count }) => (
          <Link
            key={tag}
            href={`/tags/${encodeURIComponent(tag)}`}
            className="group block p-5 rounded-xl border border-zinc-200 dark:border-zinc-800 hover:border-zinc-400 dark:hover:border-zinc-600 transition-colors"
          >
            <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors capitalize">
              {tag}
            </h2>
            <p className="text-xs text-zinc-500 mt-1">
              {count} article{count !== 1 ? "s" : ""}
            </p>
          </Link>
        ))}
        {tags.length === 0 && (
          <p className="text-sm text-zinc-500 col-span-full text-center py-12">
            No categories found.
          </p>
        )}
      </div>
    </div>
  );
}
