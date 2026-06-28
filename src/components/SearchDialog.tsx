"use client";

import { useEffect, useState, useRef } from "react";
import Link from "next/link";
import type { PostMeta } from "@/lib/posts";

type Props = {
  open: boolean;
  onClose: () => void;
};

export default function SearchDialog({ open, onClose }: Props) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<PostMeta[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);
  const [allPosts, setAllPosts] = useState<PostMeta[]>([]);

  useEffect(() => {
    fetch("/api/posts")
      .then((r) => r.json())
      .then(setAllPosts)
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (open) {
      setQuery("");
      setResults([]);
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [open]);

  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      return;
    }
    const q = query.toLowerCase();
    setResults(
      allPosts.filter(
        (p) =>
          p.title.toLowerCase().includes(q) ||
          p.excerpt.toLowerCase().includes(q) ||
          p.tags.some((t) => t.toLowerCase().includes(q))
      )
    );
  }, [query, allPosts]);

  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-start justify-center pt-[15vh]">
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-lg mx-4 bg-white dark:bg-zinc-900 rounded-2xl shadow-2xl border border-zinc-200 dark:border-zinc-700 overflow-hidden animate-slide-down">
        <div className="flex items-center gap-3 px-4 border-b border-zinc-200 dark:border-zinc-700">
          <svg className="w-5 h-5 text-zinc-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            ref={inputRef}
            type="text"
            placeholder="Search posts..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="flex-1 py-4 bg-transparent outline-none text-sm text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400"
          />
          <kbd className="hidden sm:inline-flex text-xs text-zinc-400 bg-zinc-100 dark:bg-zinc-800 px-1.5 py-0.5 rounded">
            ESC
          </kbd>
        </div>
        {results.length > 0 && (
          <div className="max-h-80 overflow-y-auto p-2">
            {results.map((p) => (
              <Link
                key={p.slug}
                href={`/blog/${p.slug}`}
                onClick={onClose}
                className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors group"
              >
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100 truncate group-hover:text-indigo-500 dark:group-hover:text-indigo-400 transition-colors">
                    {p.title}
                  </p>
                  <p className="text-xs text-zinc-500 truncate mt-0.5">{p.excerpt}</p>
                </div>
                <span className="text-xs text-zinc-400 shrink-0">{p.date}</span>
              </Link>
            ))}
          </div>
        )}
        {query.trim() && results.length === 0 && (
          <div className="p-8 text-center text-sm text-zinc-500">
            No posts found for &ldquo;{query}&rdquo;
          </div>
        )}
      </div>
    </div>
  );
}
