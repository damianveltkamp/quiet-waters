# Daily Scripture Image Generator Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a batch generator in `quiet-waters/marketing` that renders curated KJV verses onto two branded backgrounds as 1080×1350 social-post PNGs, verse centered in the brand serif with the Quiet Waters logo beneath.

**Architecture:** A Node ESM script (`generate.mjs`) reads a curated `verses.json`, resolves each reference's text live from the mobile app's KJV JSON files, and drives the system Chrome via `puppeteer-core` to screenshot a self-contained `post-template.html`. Each verse renders twice (light + dark background). Verse resolution is a pure, unit-tested module (`resolve-verse.mjs`) with no I/O in its core so it can be tested without Chrome.

**Tech Stack:** Node.js (ESM, `"type":"module"`), `puppeteer-core` driving installed Google Chrome, `node:test` + `node:assert` for tests, HTML/CSS with local `@font-face` (.ttf), Cormorant Garamond + Hanken Grotesk.

## Global Constraints

- Node ESM only: `package.json` has `"type": "module"`; all files use `import`/`export`.
- Output size is exactly **1080×1350** (4:5). No other aspect ratios.
- KJV only. Text source is `../mobile/src/bible/data/KJV/<BOOKCODE>.json` (relative to `marketing/`), never copied into the project.
- KJV JSON shape: `{ code, name, chapters }` where `chapters` is a 2D array indexed `chapters[chapter-1][verse-1]` (references are 1-based).
- Every verse produces two PNGs: `out/light/<id>.png` and `out/dark/<id>.png`.
- Book codes are 3-letter USFM codes (`PSA`, `JHN`, `PHP`, …). Ranges are single-chapter only (`PSA 23:1-3`).
- Chrome resolution: honor `CHROME_PATH` env var, else standard macOS paths. Abort with a clear message if not found.
- No network at render time — fonts and images are local files.
- Use `puppeteer-core` (NOT `puppeteer`) so no Chromium is downloaded.

---

### Task 1: Project scaffold, dependency, and assets

**Files:**
- Create: `marketing/package.json`
- Create: `marketing/.gitignore`
- Create: `marketing/assets/fonts/` (populated by copy commands below)
- Create: `marketing/assets/quiet-waters-symbol-slate-transparent-1024.png` (copied)
- Create: `marketing/assets/quiet-waters-symbol-white-transparent-1024.png` (copied)

**Interfaces:**
- Consumes: nothing.
- Produces: `npm run generate` script wired to `node generate.mjs`; `npm test` wired to `node --test`; local font + logo assets at known paths used by `post-template.html` and `generate.mjs`.

- [ ] **Step 1: Write `package.json`**

```json
{
  "name": "quiet-waters-scripture-generator",
  "version": "1.0.0",
  "private": true,
  "type": "module",
  "description": "Renders curated KJV verses onto Quiet Waters backgrounds as 1080x1350 social PNGs.",
  "scripts": {
    "generate": "node generate.mjs",
    "test": "node --test"
  },
  "dependencies": {
    "puppeteer-core": "^24.0.0"
  }
}
```

- [ ] **Step 2: Write `.gitignore`**

```
node_modules/
out/
.DS_Store
```

- [ ] **Step 3: Install the dependency**

Run: `cd /Users/damianveltkamp/Documents/development/quiet-waters/marketing && npm install`
Expected: `node_modules/` created, `puppeteer-core` present, no Chromium download.

- [ ] **Step 4: Copy the four font weights**

Run:
```bash
cd /Users/damianveltkamp/Documents/development/quiet-waters/marketing
mkdir -p assets/fonts
FSRC=../mobile/node_modules/@expo-google-fonts
cp "$FSRC/cormorant-garamond/600SemiBold/CormorantGaramond_600SemiBold.ttf" assets/fonts/
cp "$FSRC/cormorant-garamond/500Medium_Italic/CormorantGaramond_500Medium_Italic.ttf" assets/fonts/
cp "$FSRC/hanken-grotesk/600SemiBold/HankenGrotesk_600SemiBold.ttf" assets/fonts/
cp "$FSRC/hanken-grotesk/400Regular/HankenGrotesk_400Regular.ttf" assets/fonts/
ls assets/fonts/
```
Expected: four `.ttf` files listed.

- [ ] **Step 5: Copy the two logo marks**

Run:
```bash
cd /Users/damianveltkamp/Documents/development/quiet-waters/marketing
cp ../design/assets/quiet-waters-symbol-slate-transparent-1024.png assets/
cp ../design/assets/quiet-waters-symbol-white-transparent-1024.png assets/
ls assets/*.png
```
Expected: both PNGs listed.

- [ ] **Step 6: Commit**

```bash
cd /Users/damianveltkamp/Documents/development/quiet-waters
git add marketing/package.json marketing/.gitignore marketing/assets
git commit -m "chore(marketing): scaffold scripture generator project + assets"
```

---

### Task 2: Reference parser

**Files:**
- Create: `marketing/resolve-verse.mjs`
- Test: `marketing/resolve-verse.test.mjs`

**Interfaces:**
- Consumes: nothing.
- Produces: `export function parseRef(ref: string): { bookCode: string, chapter: number, vStart: number, vEnd: number }`. Throws `Error` with a descriptive message on malformed input. For a single verse, `vEnd === vStart`.

- [ ] **Step 1: Write the failing test**

```js
// resolve-verse.test.mjs
import { test } from "node:test";
import assert from "node:assert/strict";
import { parseRef } from "./resolve-verse.mjs";

test("parseRef: single verse", () => {
  assert.deepEqual(parseRef("PSA 23:1"), { bookCode: "PSA", chapter: 23, vStart: 1, vEnd: 1 });
});

test("parseRef: range", () => {
  assert.deepEqual(parseRef("PSA 23:1-3"), { bookCode: "PSA", chapter: 23, vStart: 1, vEnd: 3 });
});

test("parseRef: tolerates extra whitespace and lowercase code", () => {
  assert.deepEqual(parseRef("  jhn 3:16 "), { bookCode: "JHN", chapter: 3, vStart: 16, vEnd: 16 });
});

test("parseRef: rejects malformed ref", () => {
  assert.throws(() => parseRef("PSA 23"), /malformed reference/i);
});

test("parseRef: rejects reversed range", () => {
  assert.throws(() => parseRef("PSA 23:5-2"), /range/i);
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd /Users/damianveltkamp/Documents/development/quiet-waters/marketing && node --test resolve-verse.test.mjs`
Expected: FAIL — `parseRef` is not exported / not defined.

- [ ] **Step 3: Write minimal implementation**

```js
// resolve-verse.mjs

const REF_RE = /^([1-3]?[A-Za-z]{2,3})\s+(\d+):(\d+)(?:-(\d+))?$/;

export function parseRef(ref) {
  const trimmed = String(ref).trim();
  const m = trimmed.match(REF_RE);
  if (!m) {
    throw new Error(`Malformed reference "${ref}" (expected like "PSA 23:1" or "PSA 23:1-3")`);
  }
  const bookCode = m[1].toUpperCase();
  const chapter = Number(m[2]);
  const vStart = Number(m[3]);
  const vEnd = m[4] !== undefined ? Number(m[4]) : vStart;
  if (vEnd < vStart) {
    throw new Error(`Invalid range in "${ref}": end verse ${vEnd} precedes start verse ${vStart}`);
  }
  return { bookCode, chapter, vStart, vEnd };
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cd /Users/damianveltkamp/Documents/development/quiet-waters/marketing && node --test resolve-verse.test.mjs`
Expected: PASS (5 tests).

- [ ] **Step 5: Commit**

```bash
cd /Users/damianveltkamp/Documents/development/quiet-waters
git add marketing/resolve-verse.mjs marketing/resolve-verse.test.mjs
git commit -m "feat(marketing): add verse reference parser"
```

---

### Task 3: Verse resolver (text + label from a loaded book)

**Files:**
- Modify: `marketing/resolve-verse.mjs`
- Modify: `marketing/resolve-verse.test.mjs`

**Interfaces:**
- Consumes: `parseRef` (Task 2).
- Produces: `export function resolveVerse(ref: string, book: { code, name, chapters: string[][] }): { text: string, label: string }`. `book` is the parsed KJV JSON object (caller loads it). `text` is the verse (or space-joined range) trimmed with internal whitespace normalized. `label` is uppercased `<BOOK NAME> <chapter>:<verse(s)>`. Throws on chapter/verse out of range.

- [ ] **Step 1: Write the failing test (append to existing test file)**

```js
import { resolveVerse } from "./resolve-verse.mjs";

const PSALMS = {
  code: "PSA",
  name: "Psalms",
  // chapters[22] === Psalm 23 (0-indexed); verses 1..2 shown
  chapters: (() => { const c = []; c[22] = ["The LORD is my shepherd; I shall not want.", "He maketh me to lie down in green pastures: he leadeth me beside the still waters."]; return c; })(),
};

test("resolveVerse: single verse text + label uses book name", () => {
  const r = resolveVerse("PSA 23:1", PSALMS);
  assert.equal(r.text, "The LORD is my shepherd; I shall not want.");
  assert.equal(r.label, "PSALMS 23:1");
});

test("resolveVerse: range joins verses and labels the span", () => {
  const r = resolveVerse("PSA 23:1-2", PSALMS);
  assert.equal(r.text, "The LORD is my shepherd; I shall not want. He maketh me to lie down in green pastures: he leadeth me beside the still waters.");
  assert.equal(r.label, "PSALMS 23:1-2");
});

test("resolveVerse: throws on out-of-range verse", () => {
  assert.throws(() => resolveVerse("PSA 23:99", PSALMS), /verse 99/i);
});

test("resolveVerse: throws on out-of-range chapter", () => {
  assert.throws(() => resolveVerse("PSA 200:1", PSALMS), /chapter 200/i);
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd /Users/damianveltkamp/Documents/development/quiet-waters/marketing && node --test resolve-verse.test.mjs`
Expected: FAIL — `resolveVerse` not defined.

- [ ] **Step 3: Write minimal implementation (append to `resolve-verse.mjs`)**

```js
export function resolveVerse(ref, book) {
  const { bookCode, chapter, vStart, vEnd } = parseRef(ref);
  const chapters = book.chapters || [];
  const chapterArr = chapters[chapter - 1];
  if (!Array.isArray(chapterArr)) {
    throw new Error(`${bookCode}: chapter ${chapter} does not exist`);
  }
  const parts = [];
  for (let v = vStart; v <= vEnd; v++) {
    const verseText = chapterArr[v - 1];
    if (typeof verseText !== "string") {
      throw new Error(`${bookCode} ${chapter}: verse ${v} does not exist`);
    }
    parts.push(verseText.trim());
  }
  const text = parts.join(" ").replace(/\s+/g, " ").trim();
  const versePart = vEnd > vStart ? `${vStart}-${vEnd}` : `${vStart}`;
  const label = `${book.name} ${chapter}:${versePart}`.toUpperCase();
  return { text, label };
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cd /Users/damianveltkamp/Documents/development/quiet-waters/marketing && node --test resolve-verse.test.mjs`
Expected: PASS (9 tests total).

- [ ] **Step 5: Commit**

```bash
cd /Users/damianveltkamp/Documents/development/quiet-waters
git add marketing/resolve-verse.mjs marketing/resolve-verse.test.mjs
git commit -m "feat(marketing): resolve verse text and label from KJV book"
```

---

### Task 4: Book loader (I/O wrapper over the KJV files)

**Files:**
- Modify: `marketing/resolve-verse.mjs`
- Test: `marketing/load-book.test.mjs`

**Interfaces:**
- Consumes: nothing new.
- Produces: `export function loadBook(bookCode: string, kjvDir: string): { code, name, chapters }`. Reads `<kjvDir>/<bookCode>.json` synchronously and parses it. Throws a clear error if the file is missing (unknown book code). Caches parsed books in-module so repeated refs to the same book don't re-read.

- [ ] **Step 1: Write the failing test**

```js
// load-book.test.mjs
import { test } from "node:test";
import assert from "node:assert/strict";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { loadBook } from "./resolve-verse.mjs";

const KJV_DIR = join(dirname(fileURLToPath(import.meta.url)), "..", "mobile", "src", "bible", "data", "KJV");

test("loadBook: loads a real KJV book with expected shape", () => {
  const book = loadBook("PSA", KJV_DIR);
  assert.equal(book.code, "PSA");
  assert.equal(book.name, "Psalms");
  assert.ok(Array.isArray(book.chapters));
  assert.equal(typeof book.chapters[22][0], "string"); // Psalm 23:1
});

test("loadBook: throws a clear error for an unknown book code", () => {
  assert.throws(() => loadBook("ZZZ", KJV_DIR), /unknown book|ZZZ/i);
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd /Users/damianveltkamp/Documents/development/quiet-waters/marketing && node --test load-book.test.mjs`
Expected: FAIL — `loadBook` not defined.

- [ ] **Step 3: Write minimal implementation (append to `resolve-verse.mjs`)**

```js
import { readFileSync } from "node:fs";
import { join } from "node:path";

const _bookCache = new Map();

export function loadBook(bookCode, kjvDir) {
  const key = `${kjvDir}::${bookCode}`;
  if (_bookCache.has(key)) return _bookCache.get(key);
  const path = join(kjvDir, `${bookCode}.json`);
  let raw;
  try {
    raw = readFileSync(path, "utf8");
  } catch {
    throw new Error(`Unknown book code "${bookCode}" (no file at ${path})`);
  }
  const book = JSON.parse(raw);
  _bookCache.set(key, book);
  return book;
}
```

Note: put the two `import` lines at the top of `resolve-verse.mjs` with the existing imports, not mid-file.

- [ ] **Step 4: Run test to verify it passes**

Run: `cd /Users/damianveltkamp/Documents/development/quiet-waters/marketing && node --test load-book.test.mjs`
Expected: PASS (2 tests).

- [ ] **Step 5: Run the full suite**

Run: `cd /Users/damianveltkamp/Documents/development/quiet-waters/marketing && npm test`
Expected: all tests across both files PASS.

- [ ] **Step 6: Commit**

```bash
cd /Users/damianveltkamp/Documents/development/quiet-waters
git add marketing/resolve-verse.mjs marketing/load-book.test.mjs
git commit -m "feat(marketing): add cached KJV book loader"
```

---

### Task 5: Curated `verses.json` starter list

**Files:**
- Create: `marketing/verses.json`
- Test: `marketing/verses.test.mjs`

**Interfaces:**
- Consumes: `parseRef`, `loadBook`, `resolveVerse`.
- Produces: `verses.json` with shape `{ verses: [{ id, ref }] }`. Guarded by a test that every entry resolves against the real KJV data — so a bad ref in the curated list fails CI, not a render.

- [ ] **Step 1: Write `verses.json` (seed list — user edits later)**

```json
{
  "verses": [
    { "id": "01-psalm-23-1",   "ref": "PSA 23:1" },
    { "id": "02-john-3-16",    "ref": "JHN 3:16" },
    { "id": "03-phil-4-13",    "ref": "PHP 4:13" },
    { "id": "04-phil-4-6-7",   "ref": "PHP 4:6-7" },
    { "id": "05-prov-3-5-6",   "ref": "PRO 3:5-6" },
    { "id": "06-isa-40-31",    "ref": "ISA 40:31" },
    { "id": "07-isa-41-10",    "ref": "ISA 41:10" },
    { "id": "08-jer-29-11",    "ref": "JER 29:11" },
    { "id": "09-rom-8-28",     "ref": "ROM 8:28" },
    { "id": "10-psalm-46-1",   "ref": "PSA 46:1" },
    { "id": "11-psalm-46-10",  "ref": "PSA 46:10" },
    { "id": "12-psalm-27-1",   "ref": "PSA 27:1" },
    { "id": "13-psalm-91-1-2", "ref": "PSA 91:1-2" },
    { "id": "14-psalm-121-1-2","ref": "PSA 121:1-2" },
    { "id": "15-matt-11-28",   "ref": "MAT 11:28" },
    { "id": "16-matt-6-33",    "ref": "MAT 6:33" },
    { "id": "17-josh-1-9",     "ref": "JOS 1:9" },
    { "id": "18-2cor-5-7",     "ref": "2CO 5:7" },
    { "id": "19-2tim-1-7",     "ref": "2TI 1:7" },
    { "id": "20-1cor-13-4-5",  "ref": "1CO 13:4-5" },
    { "id": "21-lam-3-22-23",  "ref": "LAM 3:22-23" },
    { "id": "22-psalm-118-24", "ref": "PSA 118:24" },
    { "id": "23-heb-11-1",     "ref": "HEB 11:1" },
    { "id": "24-john-14-27",   "ref": "JHN 14:27" },
    { "id": "25-1pet-5-7",     "ref": "1PE 5:7" }
  ]
}
```

- [ ] **Step 2: Write the guard test**

```js
// verses.test.mjs
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { loadBook, parseRef, resolveVerse } from "./resolve-verse.mjs";

const ROOT = dirname(fileURLToPath(import.meta.url));
const KJV_DIR = join(ROOT, "..", "mobile", "src", "bible", "data", "KJV");
const { verses } = JSON.parse(readFileSync(join(ROOT, "verses.json"), "utf8"));

test("verses.json: every entry has a unique id", () => {
  const ids = verses.map((v) => v.id);
  assert.equal(new Set(ids).size, ids.length);
});

test("verses.json: every ref resolves to real KJV text", () => {
  for (const { id, ref } of verses) {
    const { bookCode } = parseRef(ref);
    const book = loadBook(bookCode, KJV_DIR);
    const { text, label } = resolveVerse(ref, book);
    assert.ok(text.length > 0, `${id} (${ref}) produced empty text`);
    assert.ok(label.length > 0, `${id} (${ref}) produced empty label`);
  }
});
```

- [ ] **Step 3: Run the test**

Run: `cd /Users/damianveltkamp/Documents/development/quiet-waters/marketing && node --test verses.test.mjs`
Expected: PASS (2 tests). If any ref fails, fix that entry in `verses.json`.

- [ ] **Step 4: Commit**

```bash
cd /Users/damianveltkamp/Documents/development/quiet-waters
git add marketing/verses.json marketing/verses.test.mjs
git commit -m "feat(marketing): seed curated verse list with resolution guard"
```

---

### Task 6: `post-template.html` — layout, fonts, theming, auto-fit

**Files:**
- Create: `marketing/post-template.html`

**Interfaces:**
- Consumes: font files in `assets/fonts/`, logo PNGs in `assets/`, background images in `backgrounds/`.
- Produces: a page with a global `window.renderPost({ verseText, label, theme, background })` function that `generate.mjs` calls via `page.evaluate`. `theme` is `"light" | "dark"`, `background` is a relative image path. Returns after applying content, swapping theme/background, and running the auto-fit pass. Also exposes `window.__fitDone` boolean set true when auto-fit completes.

- [ ] **Step 1: Write the template**

Create `marketing/post-template.html` with exactly this content:

```html
<!doctype html>
<html>
<head>
<meta charset="utf-8" />
<style>
  @font-face {
    font-family: "Cormorant Garamond";
    src: url("assets/fonts/CormorantGaramond_600SemiBold.ttf") format("truetype");
    font-weight: 600; font-style: normal;
  }
  @font-face {
    font-family: "Hanken Grotesk";
    src: url("assets/fonts/HankenGrotesk_600SemiBold.ttf") format("truetype");
    font-weight: 600; font-style: normal;
  }
  * { margin: 0; padding: 0; box-sizing: border-box; }
  html, body { width: 1080px; height: 1350px; overflow: hidden; }
  #stage {
    position: relative; width: 1080px; height: 1350px;
    display: flex; align-items: center; justify-content: center;
  }
  #bg {
    position: absolute; inset: 0; width: 100%; height: 100%;
    object-fit: cover; z-index: 0;
  }
  #scrim {
    position: absolute; inset: 0; z-index: 1; pointer-events: none;
  }
  body.light #scrim {
    background: radial-gradient(ellipse 70% 45% at 50% 55%, rgba(244,248,249,0.55), rgba(244,248,249,0) 70%);
  }
  body.dark #scrim {
    background: radial-gradient(ellipse 70% 45% at 50% 55%, rgba(10,20,28,0.55), rgba(10,20,28,0) 70%);
  }
  #content {
    position: relative; z-index: 2;
    width: 84%; max-width: 840px;
    display: flex; flex-direction: column; align-items: center;
    text-align: center;
  }
  #verse {
    font-family: "Cormorant Garamond", serif; font-weight: 600;
    font-size: 72px; line-height: 1.18;
    letter-spacing: 0.5px;
  }
  #divider {
    width: 64px; height: 1px; margin: 44px 0 24px;
  }
  #label {
    font-family: "Hanken Grotesk", sans-serif; font-weight: 600;
    font-size: 22px; letter-spacing: 4px; text-transform: uppercase;
  }
  #logo {
    display: flex; flex-direction: column; align-items: center;
    margin-top: 72px;
  }
  #logo img { width: 84px; height: 84px; }
  #wordmark {
    font-family: "Hanken Grotesk", sans-serif; font-weight: 600;
    font-size: 20px; letter-spacing: 5px; text-transform: uppercase;
    margin-top: 14px;
  }
  /* Light theme colors */
  body.light #verse, body.light #label, body.light #wordmark { color: #1C3344; }
  body.light #divider { background: #1C3344; opacity: 0.5; }
  /* Dark theme colors */
  body.dark #verse, body.dark #label, body.dark #wordmark { color: #F4F8F9; }
  body.dark #divider { background: #F4F8F9; opacity: 0.6; }
</style>
</head>
<body class="light">
  <div id="stage">
    <img id="bg" alt="" />
    <div id="scrim"></div>
    <div id="content">
      <div id="verse"></div>
      <div id="divider"></div>
      <div id="label"></div>
      <div id="logo">
        <img id="logo-mark" alt="" />
        <div id="wordmark">Quiet Waters</div>
      </div>
    </div>
  </div>
<script>
  const LOGO = {
    light: "assets/quiet-waters-symbol-slate-transparent-1024.png",
    dark: "assets/quiet-waters-symbol-white-transparent-1024.png",
  };

  window.renderPost = async function ({ verseText, label, theme, background }) {
    window.__fitDone = false;
    document.body.className = theme;
    document.getElementById("bg").src = background;
    document.getElementById("logo-mark").src = LOGO[theme];
    document.getElementById("verse").textContent = "“" + verseText + "”";
    document.getElementById("label").textContent = label;

    // Wait for fonts and the two swapped images to be ready.
    await document.fonts.ready;
    await Promise.all([...document.images].map((img) =>
      img.complete ? Promise.resolve() : new Promise((r) => { img.onload = img.onerror = r; })
    ));

    // Auto-fit: shrink verse font-size until the content column height fits
    // within a max fraction of the stage, so short and long verses both center.
    const verse = document.getElementById("verse");
    const content = document.getElementById("content");
    const MAX_CONTENT_H = 1350 * 0.72;
    let size = 72;
    verse.style.fontSize = size + "px";
    while (content.offsetHeight > MAX_CONTENT_H && size > 34) {
      size -= 2;
      verse.style.fontSize = size + "px";
    }
    window.__lastVerseSize = size;
    window.__overflow = content.offsetHeight > MAX_CONTENT_H;
    window.__fitDone = true;
    return { size, overflow: window.__overflow };
  };
</script>
</body>
</html>
```

- [ ] **Step 2: Manually verify it opens (sanity check, no test framework)**

Run: `cd /Users/damianveltkamp/Documents/development/quiet-waters/marketing && node -e "import('node:fs').then(fs => { const h = fs.readFileSync('post-template.html','utf8'); if(!h.includes('window.renderPost')) throw new Error('renderPost missing'); console.log('template ok'); })"`
Expected: prints `template ok`.

- [ ] **Step 3: Commit**

```bash
cd /Users/damianveltkamp/Documents/development/quiet-waters
git add marketing/post-template.html
git commit -m "feat(marketing): add post template with theming and auto-fit"
```

---

### Task 7: `generate.mjs` — orchestrator

**Files:**
- Create: `marketing/generate.mjs`

**Interfaces:**
- Consumes: `loadBook`, `parseRef`, `resolveVerse` (from `resolve-verse.mjs`); `verses.json`; `post-template.html`; `window.renderPost` in the page.
- Produces: on `npm run generate`, writes `out/light/<id>.png` and `out/dark/<id>.png` for every verse. Exits non-zero with a clear message on any resolution or Chrome error.

- [ ] **Step 1: Write `generate.mjs`**

```js
// Renders each verse in verses.json onto both backgrounds as 1080x1350 PNGs.
//
//   npm install         # one-time
//   npm run generate    # writes out/light/*.png and out/dark/*.png
//
// Uses your installed Google Chrome via puppeteer-core (no Chromium download).
// Verse text is read live from ../mobile/src/bible/data/KJV.

import puppeteer from "puppeteer-core";
import { readFile, mkdir, rm } from "node:fs/promises";
import { existsSync } from "node:fs";
import { fileURLToPath, pathToFileURL } from "node:url";
import { dirname, join } from "node:path";
import { loadBook, parseRef, resolveVerse } from "./resolve-verse.mjs";

const ROOT = dirname(fileURLToPath(import.meta.url));
const KJV_DIR = join(ROOT, "..", "mobile", "src", "bible", "data", "KJV");

const WIDTH = 1080;
const HEIGHT = 1350;
const BACKGROUNDS = [
  { theme: "light", file: "backgrounds/achtergrond-.jpg" },
  { theme: "dark", file: "backgrounds/black-one-.jpg" },
];

const CHROME_CANDIDATES = [
  process.env.CHROME_PATH,
  "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
  "/Applications/Chromium.app/Contents/MacOS/Chromium",
].filter(Boolean);
const executablePath = CHROME_CANDIDATES.find((p) => existsSync(p));
if (!executablePath) {
  console.error("Could not find Chrome. Set CHROME_PATH to your Chrome binary.");
  process.exit(1);
}

// Resolve every verse up front so a bad ref fails before we launch Chrome.
const { verses } = JSON.parse(await readFile(join(ROOT, "verses.json"), "utf8"));
const resolved = [];
for (const { id, ref } of verses) {
  try {
    const { bookCode } = parseRef(ref);
    const book = loadBook(bookCode, KJV_DIR);
    const { text, label } = resolveVerse(ref, book);
    resolved.push({ id, text, label });
  } catch (err) {
    console.error(`✗ ${id} (${ref}): ${err.message}`);
    process.exit(1);
  }
}

const templateUrl = pathToFileURL(join(ROOT, "post-template.html")).href;

const browser = await puppeteer.launch({
  executablePath,
  headless: "new",
  args: ["--hide-scrollbars", "--force-color-profile=srgb"],
});

try {
  const page = await browser.newPage();
  await page.setViewport({ width: WIDTH, height: HEIGHT, deviceScaleFactor: 1 });
  await page.goto(templateUrl, { waitUntil: "networkidle0" });
  await page.evaluate(() => document.fonts.ready);

  // out/ always mirrors verses.json — wipe stale files from renamed ids.
  await rm(join(ROOT, "out"), { recursive: true, force: true });
  for (const bg of BACKGROUNDS) {
    await mkdir(join(ROOT, "out", bg.theme), { recursive: true });
  }

  let count = 0;
  for (const v of resolved) {
    for (const bg of BACKGROUNDS) {
      const result = await page.evaluate(
        (args) => window.renderPost(args),
        { verseText: v.text, label: v.label, theme: bg.theme, background: bg.file }
      );
      if (result.overflow) {
        console.warn(`  ! ${v.id} (${bg.theme}): verse still overflows at min size — consider shortening`);
      }
      const outPath = join(ROOT, "out", bg.theme, `${v.id}.png`);
      await page.screenshot({ path: outPath, clip: { x: 0, y: 0, width: WIDTH, height: HEIGHT } });
      count++;
    }
    console.log(`✓ ${v.id}`);
  }
  console.log(`\nDone — ${count} images (${resolved.length} verses × ${BACKGROUNDS.length} backgrounds) in out/`);
} finally {
  await browser.close();
}
```

- [ ] **Step 2: Run the generator end-to-end**

Run: `cd /Users/damianveltkamp/Documents/development/quiet-waters/marketing && npm run generate`
Expected: a `✓` line per verse, a final `Done — 50 images (25 verses × 2 backgrounds)` summary, no errors.

- [ ] **Step 3: Verify output files exist**

Run: `cd /Users/damianveltkamp/Documents/development/quiet-waters/marketing && ls out/light | wc -l && ls out/dark | wc -l`
Expected: `25` and `25`.

- [ ] **Step 4: Commit**

```bash
cd /Users/damianveltkamp/Documents/development/quiet-waters
git add marketing/generate.mjs
git commit -m "feat(marketing): add generate.mjs orchestrator"
```

---

### Task 8: Visual verification & README

**Files:**
- Create: `marketing/README.md`

**Interfaces:**
- Consumes: everything above.
- Produces: usage docs; a human-verified confirmation that images look right.

- [ ] **Step 1: Open representative outputs and inspect visually**

Open these six PNGs and confirm: verse centered and legible, curly quotes present, divider + reference label correct (`PSALMS 23:1` etc.), logo mark + "QUIET WATERS" beneath, correct text color per theme, no overflow/clipping.

Run:
```bash
cd /Users/damianveltkamp/Documents/development/quiet-waters/marketing
open out/light/01-psalm-23-1.png out/dark/01-psalm-23-1.png \
     out/light/02-john-3-16.png  out/dark/02-john-3-16.png \
     out/light/13-psalm-91-1-2.png out/dark/13-psalm-91-1-2.png
```
Expected: short verse, long verse, and a range all render cleanly on both themes.

- [ ] **Step 2: Write `README.md`**

```markdown
# Quiet Waters — Scripture Post Generator

Renders curated KJV verses onto the Quiet Waters backgrounds as 1080×1350
(4:5) social posts. Each verse renders on both the light and dark background.

## Setup (one-time)

    npm install

Requires Google Chrome installed (macOS default path is auto-detected;
override with `CHROME_PATH=/path/to/chrome`). Verse text is read live from
`../mobile/src/bible/data/KJV`, so the mobile repo must sit alongside this one.

## Generate

    npm run generate

Outputs to `out/light/<id>.png` and `out/dark/<id>.png`. The `out/` folder is
rebuilt each run to mirror `verses.json`.

## Adding verses

Edit `verses.json`:

    { "id": "26-psalm-1-1", "ref": "PSA 1:1" }

- `id` is the output filename (keep it unique and descriptive).
- `ref` is `<BOOKCODE> <chapter>:<verse>` or a single-chapter range
  `<BOOKCODE> <chapter>:<start>-<end>` (e.g. `PSA 23:1-3`).
- Book codes are the 3-letter codes in `../mobile/src/bible/data/KJV`
  (`PSA`, `JHN`, `PHP`, `1CO`, `2TI`, …).

Run `npm test` to confirm every ref resolves before generating.

## Tests

    npm test
```

- [ ] **Step 3: Run the full test suite one last time**

Run: `cd /Users/damianveltkamp/Documents/development/quiet-waters/marketing && npm test`
Expected: all tests PASS.

- [ ] **Step 4: Commit**

```bash
cd /Users/damianveltkamp/Documents/development/quiet-waters
git add marketing/README.md
git commit -m "docs(marketing): add scripture generator README"
```

---

## Notes for the implementer

- **Run order matters for tests that read real KJV data** (Tasks 4, 5): the mobile repo must be present at `../mobile`. It is.
- **The auto-fit loop lives in the browser** (`post-template.html`), not in Node — it needs real layout measurement. `generate.mjs` just awaits `renderPost` which resolves after the fit completes.
- **If a verse overflows** even at the 34px floor, the run warns but still emits the image; shorten the verse or split the range in `verses.json`.
- **Don't add `puppeteer`** (full) — only `puppeteer-core`, which reuses the installed Chrome.
```
