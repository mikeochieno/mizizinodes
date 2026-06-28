import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "About",
  description: "About this blog",
};

export default function AboutPage() {
  return (
    <div className="px-8 py-8 max-w-screen-2xl mx-auto">
      <div className="max-w-2xl">
        <h1 className="text-3xl font-bold tracking-tight text-black dark:text-white">About</h1>
        <div className="mt-4 space-y-4 text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed">
          <p>
            Welcome to my blog. This is a space where I share thoughts, ideas, and interesting
            things I come across in technology, development, and design.
          </p>
          <p>
            Posts are automatically curated from trending topics across the web, bringing you the
            latest in tech, AI, and development.
          </p>
          <p>Built with Next.js, Tailwind CSS, and RSS feeds.</p>
        </div>
      </div>
    </div>
  );
}
