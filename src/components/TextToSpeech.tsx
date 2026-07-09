"use client";

import { useState, useCallback } from "react";

export default function TextToSpeech({ text }: { text: string }) {
  const [playing, setPlaying] = useState(false);

  const toggle = useCallback(() => {
    if (playing) {
      window.speechSynthesis.cancel();
      setPlaying(false);
    } else {
      const plain = text.replace(/<[^>]+>/g, "").slice(0, 3000);
      const utterance = new SpeechSynthesisUtterance(plain);
      utterance.rate = 0.9;
      utterance.onend = () => setPlaying(false);
      window.speechSynthesis.speak(utterance);
      setPlaying(true);
    }
  }, [text, playing]);

  return (
    <button
      onClick={toggle}
      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-zinc-100 dark:bg-zinc-800 text-xs font-medium text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-700 hover:text-black dark:hover:text-white transition-colors"
      aria-label={playing ? "Stop reading" : "Listen to article"}
    >
      {playing ? (
        <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor"><path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z"/></svg>
      ) : (
        <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 5L6 9H2v6h4l5 4V5z"/><path d="M19.07 4.93a10 10 0 010 14.14M15.54 8.46a5 5 0 010 7.07"/></svg>
      )}
      {playing ? "Stop" : "Listen"}
    </button>
  );
}
