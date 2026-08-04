import * as cheerio from "cheerio";
import type { AnyNode } from "domhandler";

type CheerioEl = cheerio.Cheerio<AnyNode>;

const USER_AGENT =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36";

const ARTICLE_SELECTORS = [
  "article .article-body",
  "article .article-body-content",
  "article .entry-content",
  "article .post-content",
  "article .content",
  "article",
  "main .article-body",
  "main .article-body-content",
  "main .entry-content",
  "main .post-content",
  "main .content",
  ".article-body-content",
  ".article-body",
  ".entry-content",
  ".post-content",
  ".article-content",
  ".story-body",
  ".article-text",
  "main",
];

const REMOVE_SELECTORS = [
  "script",
  "style",
  "noscript",
  "iframe",
  "nav",
  "header",
  "footer",
  "form",
  "button",
  "aside",
  "figure figcaption",
  ".advertisement",
  ".ad-container",
  ".ad-wrapper",
  ".ads",
  ".ad",
  ".newsletter",
  ".newsletter-signup",
  ".related",
  ".related-content",
  ".share",
  ".share-buttons",
  ".social",
  ".social-share",
  ".comments",
  ".tags",
  ".byline",
  ".author",
  ".promo",
  ".sponsor",
  ".recommended",
  ".outbrain",
  ".taboola",
  "[data-ad]",
  "[id*='ad-']",
  "[class*='ad-']",
  "[class*='-ad']",
  "[class*='advert']",
];

type ExtractResult = {
  html: string;
  text: string;
  title: string;
};

let cache = new Map<string, { data: ExtractResult; timestamp: number }>();
const CACHE_DURATION = 12 * 60 * 60 * 1000;

function pickContent($: cheerio.CheerioAPI): CheerioEl | null {
  for (const selector of ARTICLE_SELECTORS) {
    const el = $(selector);
    if (el.length > 0) {
      const clone = el.first().clone();
      clone.find(REMOVE_SELECTORS.join(",")).remove();
      const html = clone.html() || "";
      const text = clone.text() || "";
      if (text.replace(/\s+/g, "").length > 300) {
        return clone;
      }
    }
  }
  return null;
}

function cleanHtml($: cheerio.CheerioAPI, el: CheerioEl): string {
  el.find("img").each((_, img) => {
    const $img = $(img);
    const src =
      $img.attr("data-src") ||
      $img.attr("data-lazy-src") ||
      $img.attr("src") ||
      $img.attr("data-original");
    if (src) $img.attr("src", src);
    if (src) {
      $img.attr("loading", "lazy");
      const alt = $img.attr("alt") || "";
      $img.attr("alt", alt);
    } else {
      $img.remove();
    }
  });

  el.find("a").each((_, a) => {
    const $a = $(a);
    const href = $a.attr("href") || "";
    if (href.startsWith("javascript:") || href.startsWith("data:")) {
      $a.remove();
      return;
    }
    $a.attr("target", "_blank");
    $a.attr("rel", "noopener noreferrer");
  });

  el.find("*").each((_, node) => {
    const $node = $(node);
    const keys = Object.keys(node.attribs || {});
    for (const key of keys) {
      if (key.startsWith("on")) {
        $node.removeAttr(key);
      }
    }
    const style = $node.attr("style") || "";
    if (/expression|javascript:/i.test(style)) {
      $node.removeAttr("style");
    }
  });

  el.find("h1, h2, h3, h4").each((_, h) => {
    const $h = $(h);
    const id = ($h.text() || "")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");
    if (id) $h.attr("id", id);
  });

  return el.html() || "";
}

export async function fetchArticleContent(url: string): Promise<ExtractResult | null> {
  const cached = cache.get(url);
  if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
    return cached.data;
  }

  try {
    const res = await fetch(url, {
      headers: {
        "User-Agent": USER_AGENT,
        Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.9",
      },
      redirect: "follow",
      signal: AbortSignal.timeout(15000),
    });

    if (!res.ok) return null;

    const html = await res.text();
    const $ = cheerio.load(html);

    const ogTitle = $('meta[property="og:title"]').attr("content");
    const h1 = $("h1").first().text().trim();
    const title = ogTitle || h1 || "";

    const content = pickContent($);
    if (!content) return null;

    const clean = cleanHtml($, content);
    if (clean.replace(/<[^>]*>/g, "").trim().length < 300) return null;

    const result: ExtractResult = {
      html: clean,
      text: content.text() || "",
      title,
    };
    cache.set(url, { data: result, timestamp: Date.now() });
    return result;
  } catch {
    return null;
  }
}
