import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "About",
  description: "About MiziziNodes — Tech News & Insights",
};

export default function AboutPage() {
  return (
    <div className="px-8 py-8 max-w-screen-2xl mx-auto">
      <div className="max-w-2xl">
        <h1 className="text-3xl font-bold tracking-tight text-black dark:text-white">About MiziziNodes</h1>
        <div className="mt-4 space-y-4 text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed">
          <p>
            MiziziNodes brings you the latest in technology, AI breakthroughs, developer tools, and
            original analysis from across the web. We curate and cover trending stories in tech,
            science, sports, and culture.
          </p>
          <p>
            Our content is powered by automated curation that scans emerging trends and topics,
            ensuring you never miss what matters in the fast-moving world of technology.
          </p>
          <p>
            Built with Next.js, Tailwind CSS, and hosted on Vercel.
          </p>
        </div>
      </div>
    </div>
  );
}
