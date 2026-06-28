"use client";

import { useEffect, useState } from "react";

type Heading = { id: string; text: string; level: number };

export default function TableOfContents({ headings }: { headings: Heading[] }) {
  const [activeId, setActiveId] = useState("");

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) setActiveId(entry.target.id);
        });
      },
      { rootMargin: "-80px 0px -60% 0px" }
    );
    headings.forEach((h) => {
      const el = document.getElementById(h.id);
      if (el) observer.observe(el);
    });
    return () => observer.disconnect();
  }, [headings]);

  return (
    <nav>
      <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-600 mb-3">
        On this page
      </h3>
      <ul className="space-y-2">
        {headings.map((h) => (
          <li key={h.id}>
            <a
              href={`#${h.id}`}
              className={`block text-sm transition-colors ${
                h.level === 3 ? "pl-4" : ""
              } ${
                activeId === h.id
                  ? "text-blue-600 font-medium"
                  : "text-zinc-600 hover:text-black dark:hover:text-zinc-300"
              }`}
            >
              {h.text}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  );
}
