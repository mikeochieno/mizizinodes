import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "About",
  description: "About MiziziNodes — Cars, Reviews & Automotive News",
};

export default function AboutPage() {
  return (
    <div className="px-8 py-8 max-w-screen-2xl mx-auto">
      <div className="max-w-2xl">
        <h1 className="text-3xl font-bold tracking-tight text-black dark:text-white">About MiziziNodes</h1>
        <div className="mt-4 space-y-4 text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed">
          <p>
            MiziziNodes is your go-to source for everything cars — from in-depth reviews and
            head-to-head comparisons to the fastest cars on the planet and the latest automotive
            news. We cover specs, performance, design, and value so you can make smarter decisions.
          </p>
          <p>
            Whether you&apos;re a gearhead, a casual buyer, or just love cars, we break down what matters
            with clear analysis and real numbers — not just press releases.
          </p>
          <p>
            Built with Next.js, Tailwind CSS, and hosted on Vercel.
          </p>
        </div>
      </div>
    </div>
  );
}
