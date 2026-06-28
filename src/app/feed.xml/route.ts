import { getTrendingPosts, getLocalPosts } from "@/lib/trending";

export async function GET() {
  const baseUrl = "https://localhost:3000";
  const posts = [...await getLocalPosts(), ...await getTrendingPosts()];

  const items = posts
    .map(
      (p) => `
    <entry>
      <title>${escapeXml(p.title)}</title>
      <link href="${p.sourceUrl}"/>
      <id>${p.sourceUrl}</id>
      <published>${new Date(p.date).toISOString()}</published>
      <summary type="html">${escapeXml(p.excerpt)}</summary>
      <category term="${escapeXml(p.category)}"/>
    </entry>`
    )
    .join("");

  const feed = `<?xml version="1.0" encoding="UTF-8"?>
<feed xmlns="http://www.w3.org/2005/Atom">
  <title>Blog — Trending</title>
  <link href="${baseUrl}/feed.xml" rel="self"/>
  <link href="${baseUrl}"/>
  <id>${baseUrl}/</id>
  <updated>${new Date().toISOString()}</updated>
  ${items}
</feed>`;

  return new Response(feed, {
    headers: {
      "Content-Type": "application/atom+xml; charset=utf-8",
    },
  });
}

function escapeXml(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}
