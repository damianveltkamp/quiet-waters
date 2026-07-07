// Renders each entry in quotes.json as a 1080x1350 quote-card PNG.
//
//   npm install              # one-time (shared with the verse generator)
//   npm run generate:quotes  # writes out-quotes/<id>.png
//
// Uses your installed Google Chrome via puppeteer-core (no Chromium download).
// This is the "influencer quote card" format: subject photo on top, black quote
// panel below with **gold** highlighted phrases. Swap the `photo` in quotes.json
// for a real subject image (currently reuses the backgrounds as placeholders).

import puppeteer from "puppeteer-core";
import { readFile, mkdir, rm } from "node:fs/promises";
import { existsSync } from "node:fs";
import { fileURLToPath, pathToFileURL } from "node:url";
import { dirname, join } from "node:path";

const ROOT = dirname(fileURLToPath(import.meta.url));
const WIDTH = 1080;
const HEIGHT = 1350;

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

const { quotes } = JSON.parse(await readFile(join(ROOT, "quotes.json"), "utf8"));

// Validate up front so a bad entry fails before we launch Chrome.
for (const q of quotes) {
  if (!q.id || !q.quote || !q.photo) {
    console.error(`✗ quote entry missing id/quote/photo: ${JSON.stringify(q)}`);
    process.exit(1);
  }
  if (!existsSync(join(ROOT, q.photo))) {
    console.error(`✗ ${q.id}: photo not found: ${q.photo}`);
    process.exit(1);
  }
}

const REQUIRED_FILES = [
  "quote-template.html",
  "assets/fonts/CormorantGaramond_600SemiBold.ttf",
  "assets/fonts/HankenGrotesk_600SemiBold.ttf",
  "assets/fonts/HankenGrotesk_400Regular.ttf",
];
for (const file of REQUIRED_FILES) {
  if (!existsSync(join(ROOT, file))) {
    console.error(`Missing required asset: ${join(ROOT, file)}`);
    process.exit(1);
  }
}

const templateUrl = pathToFileURL(join(ROOT, "quote-template.html")).href;

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

  await rm(join(ROOT, "out-quotes"), { recursive: true, force: true });
  await mkdir(join(ROOT, "out-quotes"), { recursive: true });

  let count = 0;
  for (const q of quotes) {
    const result = await page.evaluate(
      (args) => window.renderPost(args),
      { quote: q.quote, attribution: q.attribution || "", handle: q.handle || "", photo: q.photo }
    );
    if (result.overflow) {
      console.warn(`  ! ${q.id}: quote still overflows at min size — consider shortening`);
    }
    const outPath = join(ROOT, "out-quotes", `${q.id}.png`);
    await page.screenshot({ path: outPath, clip: { x: 0, y: 0, width: WIDTH, height: HEIGHT } });
    count++;
    console.log(`✓ ${q.id}`);
  }
  console.log(`\nDone — ${count} quote cards in out-quotes/`);
} finally {
  await browser.close();
}
