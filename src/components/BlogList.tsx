"use client";

import { useState } from "react";
import BlogCard from "./BlogCard";
import type { PostMeta } from "@/lib/posts";

const PER_PAGE = 6;

export default function BlogList({ posts }: { posts: PostMeta[] }) {
  const [page, setPage] = useState(1);
  const totalPages = Math.ceil(posts.length / PER_PAGE);
  const paginatedPosts = posts.slice(0, page * PER_PAGE);

  return (
    <>
      <div className="space-y-6">
        {paginatedPosts.map((p) => (
          <BlogCard key={p.slug} post={p} />
        ))}
      </div>
      {page < totalPages && (
        <div className="mt-10 text-center">
          <button
            onClick={() => setPage((p) => p + 1)}
            className="inline-flex items-center gap-1.5 px-5 py-2 rounded-lg bg-zinc-800 dark:bg-zinc-100 text-white dark:text-zinc-900 text-sm font-medium hover:bg-zinc-700 dark:hover:bg-zinc-200 transition-colors"
          >
            Load more
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
        </div>
      )}
    </>
  );
}
