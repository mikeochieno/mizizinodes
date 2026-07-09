import Link from "next/link";

export default function Footer() {
  return (
    <footer className="border-t border-zinc-200 dark:border-zinc-800 mt-auto">
      <div className="px-8 py-6 max-w-screen-2xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3 text-sm text-zinc-500">
        <p>&copy; {new Date().getFullYear()} MiziziNodes. All rights reserved.</p>
        <div className="flex items-center gap-5">
          <Link href="/" className="hover:text-black dark:hover:text-white transition-colors">
            Home
          </Link>
          <Link
            href="/blog"
            className="hover:text-black dark:hover:text-white transition-colors"
          >
            Blog
          </Link>
          <Link
            href="/tags"
            className="hover:text-black dark:hover:text-white transition-colors"
          >
            Categories
          </Link>
          <Link
            href="/about"
            className="hover:text-black dark:hover:text-white transition-colors"
          >
            About
          </Link>
        </div>
      </div>
    </footer>
  );
}
