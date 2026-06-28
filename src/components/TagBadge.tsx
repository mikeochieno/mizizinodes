import Link from "next/link";

export default function TagBadge({ tag }: { tag: string }) {
  return (
    <Link
      href={`/tags/${encodeURIComponent(tag)}`}
      className="inline-flex text-xs font-medium px-2.5 py-1 rounded-full bg-zinc-100 dark:bg-blue-900/30 text-zinc-700 dark:text-zinc-100 group-hover:bg-accent group-hover:text-white dark:group-hover:bg-blue-900/50 dark:group-hover:text-blue-200 transition-all"
    >
      {tag}
    </Link>
  );
}
