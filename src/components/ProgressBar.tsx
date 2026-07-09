"use client";

import { useEffect } from "react";

export default function ProgressBar() {
  useEffect(() => {
    const onScroll = () => {
      const bar = document.getElementById("progress-bar");
      if (!bar) return;
      const winScroll = document.body.scrollTop || document.documentElement.scrollTop;
      const height = document.documentElement.scrollHeight - document.documentElement.clientHeight;
      bar.style.width = `${(winScroll / height) * 100}%`;
    };
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return null;
}
