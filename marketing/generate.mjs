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

// Missing background or font file: abort with the missing path.
const REQUIRED_FILES = [
  ...BACKGROUNDS.map((bg) => bg.file),
  "post-template.html",
  "assets/fonts/CormorantGaramond_600SemiBold.ttf",
  "assets/fonts/CormorantGaramond_500Medium_Italic.ttf",
  "assets/fonts/HankenGrotesk_600SemiBold.ttf",
  "assets/fonts/HankenGrotesk_400Regular.ttf",
];
for (const file of REQUIRED_FILES) {
  const filePath = join(ROOT, file);
  if (!existsSync(filePath)) {
    console.error(`Missing required asset: ${filePath}`);
    process.exit(1);
  }
}

const browser = await puppeteer.launch({
  executablePath,
  headless: true,
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
