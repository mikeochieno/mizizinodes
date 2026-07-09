import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "About",
  description: "About MiziziNodes — AI Research & Analysis",
};

export default function AboutPage() {
  return (
    <div className="px-8 py-8 max-w-screen-2xl mx-auto">
      <div className="max-w-2xl">
        <h1 className="text-3xl font-bold tracking-tight text-black dark:text-white">About MiziziNodes</h1>
        <div className="mt-4 space-y-4 text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed">
          <p>
            MiziziNodes delivers in-depth analysis of the AI landscape — from LLM comparisons and
            agent tutorials to machine learning research and industry trends. We focus on original
            analysis, technical depth, and practical insights for developers, researchers, and
            builders working with AI.
          </p>
          <p>
            Every article includes comparison, context, and critical assessment — not just
            summarization. We cover models, tools, benchmarks, and techniques that matter right now.
          </p>
          <p>
            Built with Next.js, Tailwind CSS, and hosted on Vercel.
          </p>
        </div>
      </div>
    </div>
  );
}
