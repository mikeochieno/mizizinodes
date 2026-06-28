"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { verifyPassword, createPost, updatePost, deletePost, listPosts, getPostDraft } from "./actions";
import type { PostDraft } from "./actions";

type PostSummary = { slug: string; title: string; date: string };

function mdToHtml(md: string): string {
  let html = md
    .replace(/^### (.+)$/gm, "<h3>$1</h3>")
    .replace(/^## (.+)$/gm, "<h2>$1</h2>")
    .replace(/^# (.+)$/gm, "<h1>$1</h1>")
    .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
    .replace(/\*(.+?)\*/g, "<em>$1</em>")
    .replace(/`(.+?)`/g, "<code class='bg-zinc-200/70 dark:bg-zinc-800 rounded px-1 py-0.5 text-sm text-blue-600 dark:text-blue-400'>$1</code>")
    .replace(/^> (.+)$/gm, "<blockquote class='border-l-2 border-blue-500 pl-3 italic my-2'>$1</blockquote>")
    .replace(/```[\s\S]*?```/g, (m) => {
      const code = m.replace(/```\w*\n?/, "").replace(/\n?```$/, "");
      return `<pre class='bg-zinc-100 dark:bg-black rounded-lg p-4 overflow-x-auto my-3 text-sm text-zinc-800 dark:text-zinc-100 border border-zinc-200 dark:border-zinc-800'>${code}</pre>`;
    })
    .replace(/^[\-*] (.+)$/gm, "<li>$1</li>")
    .replace(/(<li>.*<\/li>\n?)+/g, "<ul class='list-disc pl-5 mb-3 space-y-1'>$&</ul>")
    .replace(/\n\n/g, "</p><p class='mb-3 leading-relaxed'>")
    .replace(/^([^<].+)$/gm, (m) => {
      if (m.startsWith("<")) return m;
      return `<p class='mb-3 leading-relaxed'>${m}</p>`;
    });
  html = "<div class='prose'>" + html + "</div>";
  return html;
}

function LoginForm({ onLogin }: { onLogin: (pw: string) => void }) {
  const [password, setPassword] = useState("");
  const [error, setError] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(false);
    const ok = await verifyPassword(password);
    if (ok) {
      onLogin(password);
    } else {
      setError(true);
      setPassword("");
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-zinc-50 dark:bg-zinc-950">
      <form onSubmit={handleSubmit} className="w-full max-w-sm mx-4 p-8 rounded-2xl bg-white dark:bg-zinc-900 shadow-lg border border-zinc-200 dark:border-zinc-800">
        <h1 className="text-2xl font-bold tracking-tight mb-1 text-zinc-800 dark:text-zinc-100">Admin</h1>
        <p className="text-sm text-zinc-500 mb-6">Enter password to continue</p>
        <input
          ref={inputRef}
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Password"
          className="w-full px-4 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-sm outline-none focus:ring-2 focus:ring-blue-500/50 transition-shadow"
        />
        {error && <p className="text-sm text-red-500 mt-2">Wrong password</p>}
        <button
          type="submit"
          className="w-full mt-4 px-4 py-2.5 rounded-xl bg-zinc-800 dark:bg-zinc-100 text-white dark:text-zinc-900 text-sm font-medium hover:bg-zinc-700 dark:hover:bg-zinc-200 transition-colors"
        >
          Login
        </button>
      </form>
    </div>
  );
}

function PostList({
  posts,
  password,
  onEdit,
  onNew,
}: {
  posts: PostSummary[];
  password: string;
  onEdit: (slug: string) => void;
  onNew: () => void;
}) {
  const router = useRouter();
  const [deleting, setDeleting] = useState<string | null>(null);

  async function handleDelete(slug: string) {
    if (!window.confirm("Delete this post?")) return;
    setDeleting(slug);
    try {
      await deletePost(password, slug);
    } catch {
      setDeleting(null);
    }
  }

  return (
    <div className="max-w-4xl px-5 py-16">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-zinc-800 dark:text-zinc-100">Posts</h1>
          <p className="text-sm text-zinc-500 mt-1">{posts.length} total</p>
        </div>
        <button
          onClick={onNew}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-zinc-800 dark:bg-white text-white dark:text-zinc-900 text-sm font-medium hover:bg-zinc-700 dark:hover:bg-zinc-200 transition-colors"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          New Post
        </button>
      </div>
      <div className="space-y-2">
        {posts.map((p) => (
          <div
            key={p.slug}
            className="flex items-center justify-between px-4 py-3 rounded-xl hover:bg-zinc-50 dark:hover:bg-zinc-900/50 transition-colors group"
          >
            <div className="flex-1 min-w-0">
              <Link
                href={`/blog/${p.slug}`}
                className="text-sm font-medium text-zinc-700 dark:text-zinc-100 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
              >
                {p.title}
              </Link>
              <p className="text-xs text-zinc-500 mt-0.5">
                {p.date} &middot; {p.slug}
              </p>
            </div>
            <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
              <button
                onClick={() => onEdit(p.slug)}
                className="px-3 py-1.5 text-xs font-medium rounded-lg bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors"
              >
                Edit
              </button>
              <button
                onClick={() => handleDelete(p.slug)}
                disabled={deleting === p.slug}
                className="px-3 py-1.5 text-xs font-medium rounded-lg bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/50 transition-colors disabled:opacity-50"
              >
                {deleting === p.slug ? "..." : "Delete"}
              </button>
            </div>
          </div>
        ))}
        {posts.length === 0 && (
          <p className="text-sm text-zinc-500 italic py-8 text-center">No posts yet. Create one!</p>
        )}
      </div>
    </div>
  );
}

function Editor({
  password,
  initial,
  slug,
  onBack,
}: {
  password: string;
  initial?: PostDraft;
  slug?: string;
  onBack: () => void;
}) {
  const [title, setTitle] = useState(initial?.title || "");
  const [date, setDate] = useState(initial?.date || new Date().toISOString().split("T")[0]);
  const [tagsStr, setTagsStr] = useState(initial?.tags.join(", ") || "");
  const [author, setAuthor] = useState(initial?.author || "");
  const [excerpt, setExcerpt] = useState(initial?.excerpt || "");
  const [content, setContent] = useState(initial?.content || "");
  const [preview, setPreview] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError("");

    const tags = tagsStr
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean);

    const data: PostDraft = { title, date, tags, excerpt, author, content };

    try {
      if (slug) {
        await updatePost(password, slug, data);
      } else {
        await createPost(password, data);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save");
      setSaving(false);
    }
  }

  return (
    <div className="max-w-5xl px-5 py-8">
      <button
        onClick={onBack}
        className="inline-flex items-center gap-1 text-sm text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300 transition-colors mb-6"
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
        Back to posts
      </button>

      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-zinc-500 mb-1.5">Title</label>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              className="w-full px-3 py-2 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800/50 text-sm outline-none focus:ring-2 focus:ring-blue-500/50 transition-shadow"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-zinc-500 mb-1.5">Date</label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              required
              className="w-full px-3 py-2 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800/50 text-sm outline-none focus:ring-2 focus:ring-blue-500/50 transition-shadow"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-zinc-500 mb-1.5">Tags (comma separated)</label>
            <input
              value={tagsStr}
              onChange={(e) => setTagsStr(e.target.value)}
              placeholder="react, typescript"
              className="w-full px-3 py-2 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800/50 text-sm outline-none focus:ring-2 focus:ring-blue-500/50 transition-shadow"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-zinc-500 mb-1.5">Author</label>
            <input
              value={author}
              onChange={(e) => setAuthor(e.target.value)}
              required
              className="w-full px-3 py-2 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800/50 text-sm outline-none focus:ring-2 focus:ring-blue-500/50 transition-shadow"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-medium text-zinc-500 mb-1.5">Excerpt (optional)</label>
          <input
            value={excerpt}
            onChange={(e) => setExcerpt(e.target.value)}
            placeholder="Short description for the card"
            className="w-full px-3 py-2 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800/50 text-sm outline-none focus:ring-2 focus:ring-blue-500/50 transition-shadow"
          />
        </div>

        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="text-xs font-medium text-zinc-500">Content</label>
            <button
              type="button"
              onClick={() => setPreview(!preview)}
              className="text-xs text-blue-600 hover:text-blue-700 transition-colors"
            >
              {preview ? "Edit" : "Preview"}
            </button>
          </div>
          {preview ? (
            <div
              className="min-h-[300px] p-4 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800/50 prose-sm"
              dangerouslySetInnerHTML={{ __html: mdToHtml(content) }}
            />
          ) : (
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              required
              rows={16}
              className="w-full px-3 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800/50 text-sm font-mono outline-none focus:ring-2 focus:ring-blue-500/50 transition-shadow resize-y"
            />
          )}
        </div>

        {error && <p className="text-sm text-red-500">{error}</p>}

        <div className="flex items-center gap-3">
          <button
            type="submit"
            disabled={saving}
            className="px-6 py-2.5 rounded-xl bg-zinc-800 dark:bg-white text-white dark:text-zinc-900 text-sm font-medium hover:bg-zinc-700 dark:hover:bg-zinc-200 transition-colors disabled:opacity-50"
          >
            {saving ? "Saving..." : slug ? "Update Post" : "Publish Post"}
          </button>
          <button
            type="button"
            onClick={onBack}
            className="px-4 py-2.5 rounded-xl text-sm text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300 transition-colors"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}

export default function AdminPage() {
  const [password, setPassword] = useState<string | null>(null);
  const [posts, setPosts] = useState<PostSummary[]>([]);
  const [editing, setEditing] = useState<string | null>(null);
  const [editingDraft, setEditingDraft] = useState<PostDraft | undefined>(undefined);
  const [creating, setCreating] = useState(false);
  const [loaded, setLoaded] = useState(false);

  async function loadPosts(pw: string) {
    const p = await listPosts();
    setPosts(p);
    setLoaded(true);
  }

  function handleLogin(pw: string) {
    setPassword(pw);
    loadPosts(pw);
  }

  async function handleEdit(slug: string) {
    const draft = await getPostDraft(slug);
    if (draft) {
      setEditingDraft(draft);
      setEditing(slug);
      setCreating(false);
    }
  }

  function handleNew() {
    setEditing(null);
    setEditingDraft(undefined);
    setCreating(true);
  }

  function handleBack() {
    setEditing(null);
    setEditingDraft(undefined);
    setCreating(false);
    if (password) loadPosts(password);
  }

  if (!password) return <LoginForm onLogin={handleLogin} />;
  if (creating || editing) {
    return (
      <Editor
        password={password}
        initial={editingDraft}
        slug={editing || undefined}
        onBack={handleBack}
      />
    );
  }

  return (
    <>
      <div className="fixed top-4 right-4 z-50">
        <Link
          href="/"
          className="text-xs text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 transition-colors"
        >
          &larr; View site
        </Link>
      </div>
      <PostList posts={posts} password={password} onEdit={handleEdit} onNew={handleNew} />
    </>
  );
}
