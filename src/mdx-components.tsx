import type { MDXComponents } from "mdx/types";

function headingId(text: string): string {
  return text.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

function extractText(children: React.ReactNode): string {
  if (typeof children === "string") return children;
  if (Array.isArray(children)) return children.map(extractText).join("");
  if (children && typeof children === "object" && "props" in children) {
    return extractText((children as unknown as { props: { children: React.ReactNode } }).props.children);
  }
  return "";
}

export function useMDXComponents(components: MDXComponents): MDXComponents {
  return {
    h1: ({ children, id, ...props }) => {
      const text = extractText(children);
      const resolvedId = id || headingId(text);
      return (
        <h1 id={resolvedId} className="text-3xl font-bold mt-8 mb-4 scroll-mt-24" {...props}>
          {children}
        </h1>
      );
    },
    h2: ({ children, id, ...props }) => {
      const text = extractText(children);
      const resolvedId = id || headingId(text);
      return (
        <h2 id={resolvedId} className="text-2xl font-semibold mt-10 mb-4 scroll-mt-24 group" {...props}>
          <a href={`#${resolvedId}`} className="no-underline hover:text-blue-500 transition-colors">
            {children}
          </a>
        </h2>
      );
    },
    h3: ({ children, id, ...props }) => {
      const text = extractText(children);
      const resolvedId = id || headingId(text);
      return (
        <h3 id={resolvedId} className="text-xl font-semibold mt-8 mb-3 scroll-mt-24 group" {...props}>
          <a href={`#${resolvedId}`} className="no-underline hover:text-blue-500 transition-colors">
            {children}
          </a>
        </h3>
      );
    },
    p: ({ children, ...props }) => (
      <p className="text-base leading-7 mb-4" {...props}>
        {children}
      </p>
    ),
    a: ({ children, ...props }) => (
      <a className="text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-zinc-100 underline underline-offset-2 decoration-zinc-100 dark:decoration-blue-700" {...props}>
        {children}
      </a>
    ),
    ul: ({ children, ...props }) => (
      <ul className="list-disc pl-6 mb-4 space-y-1.5" {...props}>
        {children}
      </ul>
    ),
    ol: ({ children, ...props }) => (
      <ol className="list-decimal pl-6 mb-4 space-y-1.5" {...props}>
        {children}
      </ol>
    ),
    blockquote: ({ children, ...props }) => (
      <blockquote className="border-l-3 border-blue-500 dark:border-blue-400 bg-zinc-100 dark:bg-zinc-900 pl-4 pr-4 py-3 rounded-r-lg my-6" {...props}>
        {children}
      </blockquote>
    ),
    code: ({ children, ...props }) => (
      <code className="bg-zinc-200/70 dark:bg-zinc-800 rounded-md px-1.5 py-0.5 text-sm font-mono text-blue-600 dark:text-blue-400" {...props}>
        {children}
      </code>
    ),
    pre: ({ children, ...props }) => (
      <pre className="bg-zinc-100 dark:bg-black rounded-xl p-4 overflow-x-auto mb-6 text-sm text-zinc-800 dark:text-zinc-100 border border-zinc-200 dark:border-zinc-800" {...props}>
        {children}
      </pre>
    ),
    img: ({ alt, ...props }) => (
      <img className="rounded-xl my-8 max-w-full shadow-md" alt={alt} {...props} />
    ),
    hr: () => <hr className="my-10 border-zinc-200 dark:border-zinc-800" />,
    ...components,
  };
}
