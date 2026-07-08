// Pure, dependency-free helpers for the RSS fetcher. All network/FS I/O lives
// in fetch-feeds.mjs; everything here is unit-tested against fixtures.

export function slugify(str, maxLen = 60) {
  const s = String(str)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, maxLen)
    .replace(/-+$/g, "");
  return s || "item";
}

export function classifyImage(dimensions, minShortSide = 600) {
  if (!dimensions || !dimensions.width || !dimensions.height) return "needs-manual";
  const shortSide = Math.min(dimensions.width, dimensions.height);
  return shortSide >= minShortSide ? "ok" : "needs-manual";
}

export function filterUnseen(items, seenUrls) {
  const seen = seenUrls instanceof Set ? seenUrls : new Set(seenUrls);
  return items.filter((it) => it && it.link && !seen.has(it.link));
}

export function extractImageUrl(item) {
  if (item.enclosure && item.enclosure.url && /^image\//.test(item.enclosure.type || "")) {
    return item.enclosure.url;
  }
  const media = item["media:content"] || item["media:thumbnail"];
  if (media) {
    const node = Array.isArray(media) ? media[0] : media;
    const url = node && (node.$ ? node.$.url : node.url);
    if (url) return url;
  }
  const html = item["content:encoded"] || item.content || "";
  const m = html.match(/<img[^>]+src=["']([^"']+)["']/i);
  if (m) return m[1];
  return null;
}

export function buildCandidate(item, { source, image = null, imageStatus }) {
  return {
    source,
    title: (item.title || "").trim(),
    summary: (item.contentSnippet || item.summary || item.content || "").trim(),
    link: item.link,
    published: item.isoDate || item.pubDate || null,
    image,
    imageStatus,
  };
}
