// Fetches configured RSS feeds, skips already-seen articles, downloads each
// featured image and flags low-res/missing ones, and writes candidates.json
// for Claude to turn into quotes.json in-session.
//
//   npm run fetch
//
import Parser from "rss-parser";
import { imageSize } from "image-size";
import { readFile, writeFile, mkdir } from "node:fs/promises";
import { existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join, extname } from "node:path";
import {
  slugify,
  classifyImage,
  filterUnseen,
  extractImageUrl,
  buildCandidate,
} from "./feed-utils.mjs";

const ROOT = dirname(fileURLToPath(import.meta.url));
const MIN_SHORT_SIDE = 600;
const PER_FEED = 10; // most-recent items pulled per feed before dedup

// Some publishers (Christian Post, CBN News) return HTML or block the
// request entirely unless it looks like a real browser. Send the same UA on
// both the feed fetch and the image download, since CDNs can be picky too.
const USER_AGENT =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36";

const parser = new Parser({
  headers: { "User-Agent": USER_AGENT },
  timeout: 15000,
  customFields: {
    item: [
      ["media:content", "media:content", { keepArray: false }],
      ["media:thumbnail", "media:thumbnail", { keepArray: false }],
      ["content:encoded", "content:encoded"],
    ],
  },
});

async function loadJson(path, fallback) {
  if (!existsSync(path)) return fallback;
  try {
    return JSON.parse(await readFile(path, "utf8"));
  } catch (err) {
    console.warn(`! could not parse ${path}: ${err.message} — using fallback`);
    return fallback;
  }
}

function extFromUrl(url) {
  const clean = url.split("?")[0];
  const ext = extname(clean).toLowerCase();
  return /^\.(jpe?g|png|webp|avif|gif)$/.test(ext) ? ext : ".jpg";
}

async function downloadImage(url, destPath) {
  const res = await fetch(url, { headers: { "User-Agent": USER_AGENT } });
  if (!res.ok) return null;
  const buf = Buffer.from(await res.arrayBuffer());
  await writeFile(destPath, buf);
  return buf;
}

async function main() {
  const { feeds } = await loadJson(join(ROOT, "feeds.json"), { feeds: [] });
  if (feeds.length === 0) {
    console.error("No feeds configured in feeds.json.");
    process.exit(1);
  }

  const seenUrls = await loadJson(join(ROOT, "seen.json"), []);
  const imagesDir = join(ROOT, "feed-images");
  await mkdir(imagesDir, { recursive: true });

  const candidates = [];
  const newlySeen = [];

  for (const feed of feeds) {
    let parsed;
    try {
      parsed = await parser.parseURL(feed.url);
    } catch (err) {
      console.warn(`! ${feed.name}: feed fetch failed (${err.message}) — skipping`);
      continue;
    }

    const fresh = filterUnseen((parsed.items || []).slice(0, PER_FEED), seenUrls);
    for (const item of fresh) {
      newlySeen.push(item.link);

      let image = null;
      let imageStatus = "needs-manual";
      const imgUrl = extractImageUrl(item);
      if (imgUrl) {
        try {
          const dest = join(imagesDir, `${slugify(item.title)}${extFromUrl(imgUrl)}`);
          const buf = await downloadImage(imgUrl, dest);
          if (buf) {
            const dims = imageSize(buf);
            imageStatus = classifyImage(dims, MIN_SHORT_SIDE);
            image = `feed-images/${dest.split("/").pop()}`;
          }
        } catch (err) {
          console.warn(`  ! ${feed.name}: image failed for "${item.title}" (${err.message})`);
        }
      }

      candidates.push(buildCandidate(item, { source: feed.name, image, imageStatus }));
      console.log(`✓ [${feed.name}] ${item.title} (${imageStatus})`);
    }
  }

  if (candidates.length === 0) {
    console.log("\nNothing new — every recent item is already in seen.json.");
    return;
  }

  await writeFile(
    join(ROOT, "candidates.json"),
    JSON.stringify({ generatedAt: new Date().toISOString(), count: candidates.length, items: candidates }, null, 2)
  );
  await writeFile(join(ROOT, "seen.json"), JSON.stringify([...seenUrls, ...newlySeen], null, 2));

  const needManual = candidates.filter((c) => c.imageStatus === "needs-manual").length;
  console.log(`\nDone — ${candidates.length} candidates in candidates.json (${needManual} need a manual photo).`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
