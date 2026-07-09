"use client";

import { useEffect, useRef } from "react";

export default function GiscusComments({ slug }: { slug: string }) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!ref.current || ref.current.hasChildNodes()) return;
    const s = document.createElement("script");
    s.src = "https://giscus.app/client.js";
    s.setAttribute("data-repo", "mikeochieno/mizizinodes");
    s.setAttribute("data-repo-id", "R_kgDOTHkdLg");
    s.setAttribute("data-category", "General");
    s.setAttribute("data-category-id", "DIC_kwDOTHkdLs4DA3Ih");
    s.setAttribute("data-mapping", "pathname");
    s.setAttribute("data-strict", "0");
    s.setAttribute("data-reactions-enabled", "1");
    s.setAttribute("data-emit-metadata", "0");
    s.setAttribute("data-input-position", "bottom");
    s.setAttribute("data-theme", "preferred_color_scheme");
    s.setAttribute("data-lang", "en");
    s.setAttribute("crossorigin", "anonymous");
    s.async = true;
    ref.current.appendChild(s);
  }, [slug]);

  return <div ref={ref} className="mt-10" />;
}
