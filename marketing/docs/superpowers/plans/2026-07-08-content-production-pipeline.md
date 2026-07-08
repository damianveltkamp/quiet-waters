# Content-Production Pipeline Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add an RSS fetcher that replaces the manual find/screenshot/OCR/photo-hunt steps, producing a `candidates.json` file that Claude reads in-session to write `quotes.json`, which the existing `generate-quotes.mjs` turns into cards.

**Architecture:** Split by responsibility, matching the existing codebase. Pure, testable logic (image classification, slug, dedup, item normalization, image-URL extraction) lives in `feed-utils.mjs` with fixture-based `node:test` tests. Network + filesystem I/O (RSS fetch, image download, reading/writing JSON) lives in a thin runner `fetch-feeds.mjs` with no unit test, exactly like the existing `generate.mjs`/`resolve-verse.mjs` split.

**Tech Stack:** Node.js ES modules (`.mjs`), `node --test`, `rss-parser` (feed parsing), `image-size` (read image dimensions from the downloaded buffer without decoding), global `fetch` (image download).

## Global Constraints

- ES modules only (`"type": "module"`), `.mjs` extension — copied from existing files.
- Tests use `node:test` + `node:assert/strict`, no live network in tests — use fixtures (spec: "Feed parsing is exercised against a small saved RSS fixture").
- `npm test` runs `node --test` and must stay green.
- Image quality threshold: an image is `"ok"` when its **shorter side ≥ 600px**, else `"needs-manual"` (spec).
- Dedup key is the article **URL** (spec).
- `seen.json` is committed; `feed-images/` and `candidates.json` are gitignored (spec).
- The runner must **never abort the whole run** on one bad feed/image — log a warning and continue (spec: error handling).
- Use Context7 to confirm the `rss-parser` and `image-size` APIs before writing the runner (global user instruction: always use Context7 for library docs).

---

### Task 1: Project wiring — dependencies, config, gitignore, npm script

**Files:**
- Modify: `package.json` (add deps + `fetch` script)
- Create: `feeds.json`
- Modify: `.gitignore`
- Test: `feeds.test.mjs`

**Interfaces:**
- Consumes: nothing (first task).
- Produces: `feeds.json` with shape `{ "feeds": [{ "name": string, "url": string }, ...] }`, consumed by Task 3's runner. `rss-parser` and `image-size` available as dependencies.

- [ ] **Step 1: Add the RSS starter config**

Create `feeds.json`. These are the proposed starter feeds from the spec; Step 5 verifies each is reachable and returns valid RSS, swapping any that are dead.

```json
{
  "feeds": [
    { "name": "Relevant Magazine", "url": "https://relevantmagazine.com/feed/" },
    { "name": "God Reports", "url": "https://godreports.com/feed/" },
    { "name": "Christian Post", "url": "https://www.christianpost.com/rss/most-recent" },
    { "name": "CBN News", "url": "https://www2.cbn.com/rss/cbnnews.xml" },
    { "name": "Christian Headlines", "url": "https://www.christianheadlines.com/rss/" }
  ]
}
```

- [ ] **Step 2: Write the failing test for the config shape**

Create `feeds.test.mjs`:

```javascript
// feeds.test.mjs
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const ROOT = dirname(fileURLToPath(import.meta.url));
const { feeds } = JSON.parse(readFileSync(join(ROOT, "feeds.json"), "utf8"));

test("feeds.json: is a non-empty array", () => {
  assert.ok(Array.isArray(feeds));
  assert.ok(feeds.length > 0);
});

test("feeds.json: every feed has a name and an http(s) url", () => {
  for (const f of feeds) {
    assert.ok(f.name && typeof f.name === "string", `feed missing name: ${JSON.stringify(f)}`);
    assert.match(f.url, /^https?:\/\//, `feed url not http(s): ${JSON.stringify(f)}`);
  }
});

test("feeds.json: urls are unique", () => {
  const urls = feeds.map((f) => f.url);
  assert.equal(new Set(urls).size, urls.length);
});
```

- [ ] **Step 3: Run the test to verify it passes**

Run: `npm test`
Expected: PASS — the 3 new `feeds.json` tests pass alongside the existing 13.

- [ ] **Step 4: Add dependencies and the npm script**

Run:
```bash
npm install rss-parser image-size
```

Then edit `package.json` `scripts` to add the `fetch` line (keep the others):

```json
  "scripts": {
    "generate": "node generate.mjs",
    "generate:quotes": "node generate-quotes.mjs",
    "fetch": "node fetch-feeds.mjs",
    "test": "node --test"
  },
```

- [ ] **Step 5: Verify each feed URL is reachable and returns RSS**

Run (for each url in `feeds.json`):
```bash
curl -sSL -o /dev/null -w "%{http_code} %{content_type}\n" "https://relevantmagazine.com/feed/"
```
Expected: `200` with an XML/RSS content-type. For any URL that returns non-200 or HTML, find that publisher's real feed URL (their WordPress sites expose `/feed/`; others link a feed from their homepage `<link type="application/rss+xml">`) and replace it in `feeds.json`. Do not leave a dead feed in the config.

- [ ] **Step 6: Update .gitignore**

Add two lines to `.gitignore` (below `out-quotes/`):

```
feed-images/
candidates.json
```

- [ ] **Step 7: Commit**

```bash
git add package.json package-lock.json feeds.json feeds.test.mjs .gitignore
git commit -m "feat(marketing): add feeds config, rss deps, and fetch script wiring"
```

---

### Task 2: `feed-utils.mjs` — pure helpers (TDD)

**Files:**
- Create: `feed-utils.mjs`
- Test: `feed-utils.test.mjs`

**Interfaces:**
- Consumes: nothing (pure functions).
- Produces, for Task 3's runner:
  - `slugify(str: string, maxLen = 60): string` — filename-safe slug; returns `"item"` for empty input.
  - `classifyImage(dimensions: {width, height} | null, minShortSide = 600): "ok" | "needs-manual"` — `"needs-manual"` when dimensions are missing/zero or shorter side < `minShortSide`.
  - `filterUnseen(items: Array<{link}>, seenUrls: Set<string> | string[]): Array` — items whose `link` is truthy and not in `seenUrls`.
  - `extractImageUrl(item: object): string | null` — best featured-image URL from an rss-parser item (enclosure → media:content/thumbnail → first `<img>` in content), else `null`.
  - `buildCandidate(item, { source, image, imageStatus }): object` — normalized candidate `{ source, title, summary, link, published, image, imageStatus }`.

- [ ] **Step 1: Write the failing tests**

Create `feed-utils.test.mjs`:

```javascript
// feed-utils.test.mjs
import { test } from "node:test";
import assert from "node:assert/strict";
import {
  slugify,
  classifyImage,
  filterUnseen,
  extractImageUrl,
  buildCandidate,
} from "./feed-utils.mjs";

test("slugify: lowercases, replaces runs of non-alphanumerics with single dash, trims", () => {
  assert.equal(slugify("  Hello, World!!  "), "hello-world");
});

test("slugify: caps length and never leaves a trailing dash", () => {
  const s = slugify("a".repeat(80) + " tail", 10);
  assert.ok(s.length <= 10);
  assert.doesNotMatch(s, /-$/);
});

test("slugify: empty/garbage input falls back to 'item'", () => {
  assert.equal(slugify("!!!"), "item");
  assert.equal(slugify(""), "item");
});

test("classifyImage: ok when shorter side >= threshold", () => {
  assert.equal(classifyImage({ width: 1200, height: 600 }, 600), "ok");
});

test("classifyImage: needs-manual when shorter side below threshold", () => {
  assert.equal(classifyImage({ width: 1200, height: 400 }, 600), "needs-manual");
});

test("classifyImage: needs-manual when dimensions missing or zero", () => {
  assert.equal(classifyImage(null, 600), "needs-manual");
  assert.equal(classifyImage({ width: 0, height: 0 }, 600), "needs-manual");
});

test("filterUnseen: drops items whose link is in the seen set", () => {
  const items = [{ link: "a" }, { link: "b" }, { link: "c" }];
  const out = filterUnseen(items, new Set(["b"]));
  assert.deepEqual(out.map((i) => i.link), ["a", "c"]);
});

test("filterUnseen: accepts a plain array of seen urls and drops linkless items", () => {
  const items = [{ link: "a" }, { title: "no link" }, { link: "d" }];
  const out = filterUnseen(items, ["a"]);
  assert.deepEqual(out.map((i) => i.link), ["d"]);
});

test("extractImageUrl: prefers an image enclosure", () => {
  const item = { enclosure: { url: "http://x/img.jpg", type: "image/jpeg" } };
  assert.equal(extractImageUrl(item), "http://x/img.jpg");
});

test("extractImageUrl: falls back to media:content url", () => {
  const item = { "media:content": { $: { url: "http://x/m.jpg" } } };
  assert.equal(extractImageUrl(item), "http://x/m.jpg");
});

test("extractImageUrl: falls back to first <img> in content", () => {
  const item = { content: "<p>hi</p><img src='http://x/inline.png' />" };
  assert.equal(extractImageUrl(item), "http://x/inline.png");
});

test("extractImageUrl: returns null when nothing present", () => {
  assert.equal(extractImageUrl({ title: "no images here" }), null);
});

test("buildCandidate: normalizes fields and trims", () => {
  const item = {
    title: "  Big News  ",
    contentSnippet: "  a summary  ",
    link: "http://x/story",
    isoDate: "2026-07-08T09:00:00Z",
  };
  const c = buildCandidate(item, { source: "God Reports", image: "feed-images/x.jpg", imageStatus: "ok" });
  assert.deepEqual(c, {
    source: "God Reports",
    title: "Big News",
    summary: "a summary",
    link: "http://x/story",
    published: "2026-07-08T09:00:00Z",
    image: "feed-images/x.jpg",
    imageStatus: "ok",
  });
});
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `node --test feed-utils.test.mjs`
Expected: FAIL — `Cannot find module './feed-utils.mjs'`.

- [ ] **Step 3: Write the implementation**

Create `feed-utils.mjs`:

```javascript
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
```

- [ ] **Step 4: Run the tests to verify they pass**

Run: `node --test feed-utils.test.mjs`
Expected: PASS — all `feed-utils` tests green.

- [ ] **Step 5: Run the full suite**

Run: `npm test`
Expected: PASS — existing 13 + `feeds.json` 3 + `feed-utils` tests, 0 failures.

- [ ] **Step 6: Commit**

```bash
git add feed-utils.mjs feed-utils.test.mjs
git commit -m "feat(marketing): add pure feed-utils helpers with tests"
```

---

### Task 3: `fetch-feeds.mjs` — the runner

**Files:**
- Create: `fetch-feeds.mjs`
- Create (at runtime): `seen.json` (committed), `candidates.json` + `feed-images/` (gitignored)

**Interfaces:**
- Consumes: `feeds.json` (Task 1); `slugify`, `classifyImage`, `filterUnseen`, `extractImageUrl`, `buildCandidate` (Task 2); `rss-parser`, `image-size` (Task 1 deps).
- Produces: `candidates.json` = `{ "generatedAt": ISOString, "count": number, "items": Candidate[] }` where `Candidate` is Task 2's `buildCandidate` output. This file is what Claude reads in-session to write `quotes.json`.

- [ ] **Step 1: Confirm library APIs via Context7**

Before writing code, use Context7 to confirm:
- `rss-parser`: default export is a `Parser` class; `new Parser({ customFields })` and `await parser.parseURL(url)` returns `{ items: [...] }`. Confirm how to register `media:content`/`media:thumbnail`/`content:encoded` as custom fields so `extractImageUrl` receives them.
- `image-size`: confirm the v2 named export `imageSize(buffer)` returns `{ width, height, type }` (older versions default-export a function). Match the import to the installed version.

- [ ] **Step 2: Write the runner**

Create `fetch-feeds.mjs`:

```javascript
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

const parser = new Parser({
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
  const res = await fetch(url);
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
```

- [ ] **Step 3: Smoke-test against the real feeds**

Run: `npm run fetch`
Expected: per-item `✓ [source] title (ok|needs-manual)` lines, then a summary. Confirm `candidates.json` exists with `items` matching the Task 2 candidate shape, `feed-images/` contains downloaded images, and `seen.json` now lists the processed URLs.

- [ ] **Step 4: Verify dedup on a second run**

Run: `npm run fetch` again immediately.
Expected: `Nothing new — every recent item is already in seen.json.` (No new candidates, because the URLs are now in `seen.json`.)

- [ ] **Step 5: Confirm the full test suite still passes**

Run: `npm test`
Expected: PASS, 0 failures (the runner has no unit test by design; its logic is covered by `feed-utils` tests).

- [ ] **Step 6: Commit**

```bash
git add fetch-feeds.mjs seen.json
git commit -m "feat(marketing): add RSS fetch-feeds runner producing candidates.json"
```

---

### Task 4: Document the workflow in the README

**Files:**
- Modify: `README.md`

**Interfaces:**
- Consumes: the `npm run fetch` command (Task 1/3) and `candidates.json` (Task 3).
- Produces: nothing consumed by later tasks.

- [ ] **Step 1: Add a "Content pipeline" section to README.md**

Append to `README.md`:

```markdown
## Content pipeline (news cards)

Automates the raw-material gathering that used to be manual (find post →
screenshot → OCR → hunt for a photo).

1. `npm run fetch` — pulls recent items from the feeds in `feeds.json`, skips
   anything already in `seen.json`, downloads each featured image, and writes
   `candidates.json`. Items whose image is missing or under 600px are marked
   `"imageStatus": "needs-manual"`.
2. In a Claude Code session, Claude reads `candidates.json`, picks the strongest
   items, writes them into `quotes.json` with `**gold**` highlight markup, and
   helps drop in a manual photo for any `needs-manual` item.
3. `npm run generate:quotes` — renders the cards into `out-quotes/`.

Edit `feeds.json` to add or remove sources. `candidates.json` and `feed-images/`
are throwaway (gitignored); `seen.json` is committed so reruns only surface
fresh stories.
```

- [ ] **Step 2: Commit**

```bash
git add README.md
git commit -m "docs(marketing): document the RSS content pipeline workflow"
```

---

## Notes for the implementer

- **This is a worktree** at `.claude/worktrees/content-pipeline/marketing` on branch `worktree-content-pipeline`. Do not switch branches. The other agent's `feat/bible-reading` work must not be touched.
- The runner deliberately has **no unit test** — network/FS I/O is validated by the smoke test (Task 3 Steps 3–4), matching how `generate.mjs` is handled. All pure logic is tested in `feed-utils.test.mjs`.
- The KJV tests read `../mobile/src/bible/data/KJV`; that path exists inside the worktree, so `npm test` works unchanged.
```
