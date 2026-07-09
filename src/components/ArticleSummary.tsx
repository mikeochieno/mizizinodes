export default function ArticleSummary({ content }: { content: string }) {
  const lines = content
    .split("\n")
    .filter((l) => l.startsWith("- **") || l.startsWith("- "))
    .slice(0, 4);

  if (lines.length === 0) return null;

  return (
    <div className="p-4 rounded-xl bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800/50 mb-8">
      <h4 className="text-xs font-semibold uppercase tracking-wider text-amber-700 dark:text-amber-400 mb-2">
        Key takeaways
      </h4>
      <ul className="space-y-1">
        {lines.map((line, i) => (
          <li key={i} className="text-sm text-zinc-700 dark:text-zinc-300 leading-relaxed">
            {line.replace(/^[-*]\s*\*\*(.+?)\*\*:\s*/, "").replace(/^[-*]\s*/, "")}
          </li>
        ))}
      </ul>
    </div>
  );
}
