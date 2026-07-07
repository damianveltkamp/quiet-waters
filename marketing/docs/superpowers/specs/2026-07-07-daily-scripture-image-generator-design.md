# Daily Scripture Image Generator — Design

**Date:** 2026-07-07
**Status:** Approved for planning
**Location:** `quiet-waters/marketing`

## Purpose

A batch image generator that renders curated KJV scripture verses onto Quiet
Waters branded backgrounds, producing social-post PNGs (Instagram/Facebook
feed) with the verse centered in the brand serif typography and the Quiet
Waters logo beneath. Modeled on the existing `hazel-marketing` generator.

## Decisions (locked)

- **Type:** Batch generator. Run a command, get a folder of PNGs to post manually. No scheduling, no auto-posting.
- **Verse text source:** The full KJV JSON files in the mobile app
  (`quiet-waters/mobile/src/bible/data/KJV`) are the authoritative text source. Read live at generate time; never copied.
- **Verse selection:** A **curated** `verses.json` in the marketing directory holds hand-picked references. No random selection, no whole-Bible dump.
- **Output size:** 4:5 feed, **1080×1350** only.
- **Backgrounds:** Both provided backgrounds used — every verse renders **twice**, once on light and once on dark.
- **Logo:** Cross-and-ripples **mark + "QUIET WATERS" wordmark**, placed beneath the verse.
- **Fonts:** Cormorant Garamond (serif verse) + Hanken Grotesk (sans reference/wordmark), embedded as local `.ttf` files for offline reproducibility.

## Directory structure

```
marketing/
  package.json           # type:module, puppeteer-core dep, "generate" script
  verses.json            # curated references (hand-edited)
  generate.mjs           # the generator
  post-template.html     # layout + design system (CSS, @font-face)
  backgrounds/
    achtergrond-.jpg      # light (cream/gold cross, church interior)
    black-one-.jpg        # dark (glowing gold cross, dark cathedral)
  assets/
    fonts/                # copied .ttf weights (see Fonts)
    quiet-waters-symbol-slate-transparent-1024.png   # logo mark for light bg
    quiet-waters-symbol-white-transparent-1024.png   # logo mark for dark bg
  docs/superpowers/specs/ # this spec
  out/
    light/  01-psalm-23-1.png ...
    dark/   01-psalm-23-1.png ...
```

## Components

### 1. `verses.json` — curated reference list

References only; text pulled live from KJV JSON.

```json
{
  "verses": [
    { "id": "01-psalm-23-1", "ref": "PSA 23:1" },
    { "id": "02-john-3-16",  "ref": "JHN 3:16" },
    { "id": "03-phil-4-13",  "ref": "PHP 4:13" }
  ]
}
```

- `ref` grammar: `<BOOKCODE> <chapter>:<verse>` or a range `<BOOKCODE> <chapter>:<vStart>-<vEnd>`.
  - Book codes are the 3-letter USFM codes already used in the data (`PSA`, `JHN`, `PHP`, `ROM`, `ISA`, …).
  - Range example: `"PSA 23:1-3"`.
- `id` becomes the output filename stem (stable, human-readable).
- Ranges are **within a single chapter** only (no cross-chapter spans). This keeps lookup and reference-label formatting simple and covers the realistic marketing cases.

**Starter list:** I seed ~20–30 well-known, uplifting, marketing-appropriate verses (Psalms, John, Philippians, Isaiah, Romans, Proverbs, Matthew, etc.). User edits freely afterward.

### 2. Verse resolver (in `generate.mjs`)

Given a `ref`, produce `{ text, label }`.

- Parse `ref` into `{ bookCode, chapter, vStart, vEnd }`.
- Load `KJV/<bookCode>.json` → `{ code, name, chapters }` where `chapters[c][v]` is a 0-indexed 2D array; references are 1-based, so verse text = `chapters[chapter-1][v-1]`.
- **text:** For a single verse, the verse string. For a range, the verses joined with a single space into one flowing quote. Leading/trailing whitespace trimmed; internal spacing normalized.
- **label:** Human-readable, uppercased for the eyebrow, using the book's `name` from the JSON (not the code): e.g. `PSA 23:1` → `PSALM 23:1`; `PSA 23:1-3` → `PSALM 23:1-3`.
- **Errors are fatal and specific:** unknown book code, chapter/verse out of range, or malformed ref abort the run naming the offending `id` and `ref`, so a typo in `verses.json` never silently ships a blank image.

### 3. `post-template.html` — layout & design system

A single self-contained HTML page puppeteer drives. Fixed 1080×1350 stage.

- `@font-face` declarations pointing at local `.ttf` files in `assets/fonts/`.
- Background set via a full-bleed `<img>`/CSS background swapped per render.
- Content column centered horizontally; the verse block centered in the vertical space, logo group beneath it.

Layout (top→bottom within centered column):

```
  “<verse text>”              Cormorant Garamond 600, curly quotes, centered
      ———                     hairline divider rule
  <BOOK C:V>                  Hanken Grotesk 600, uppercase, letter-spaced (eyebrow)
      ✝  (mark)               Quiet Waters logo mark
  QUIET WATERS                Hanken Grotesk 600, uppercase, letter-spaced wordmark
```

- **Theme by background** (JS toggles a body class):
  - `light`: text `#1C3344` (brand primary), logo mark = slate PNG.
  - `dark`: text warm white (`#F4F8F9`/`#FFFFFF`), logo mark = white PNG.
- **Curly quotes:** verse wrapped in `“ ”`. If the verse text itself contains quotes, they're preserved inside.
- **Auto-fit:** verse font-size starts large and steps down (JS measures until the verse block fits within a max height / no overflow) so both short and long verses stay centered and legible. A max width (~78% of stage) keeps line length comfortable.
- **Legibility safety:** a soft radial/linear scrim behind the text block (very subtle, theme-appropriate) guards against the busiest parts of a background. Kept faint so it doesn't read as a box.

### 4. `generate.mjs` — orchestrator

Mirrors hazel's proven flow:

1. Resolve Chrome binary (`CHROME_PATH` env override → standard macOS paths). Abort with a clear message if not found.
2. Read `verses.json`; resolve every ref up front (fail fast on bad refs before launching Chrome).
3. Launch `puppeteer-core` with the system Chrome, `headless:"new"`, `--force-color-profile=srgb`.
4. `goto` the template `file://` URL; `await document.fonts.ready`.
5. Wipe & recreate `out/light` and `out/dark` so output always mirrors `verses.json` (no stale files from renamed ids).
6. For each verse × each background (light, dark):
   - Set viewport 1080×1350.
   - Inject `{ verseText, label, theme }` into the DOM; re-await `document.fonts.ready` and the auto-fit pass.
   - `screenshot` → `out/<theme>/<id>.png`.
7. Log per-verse progress and a final count (`N verses × 2 backgrounds = 2N images`).

### 5. Fonts

Copy these exact weights from `mobile/node_modules/@expo-google-fonts/*` into `assets/fonts/` (verified present):

- `CormorantGaramond_600SemiBold.ttf` — verse (matches app `display`/`title`).
- `CormorantGaramond_500Medium_Italic.ttf` — available if an italic verse variant is wanted.
- `HankenGrotesk_600SemiBold.ttf` — eyebrow reference + wordmark.
- `HankenGrotesk_400Regular.ttf` — any supporting text.

## Data flow

```
verses.json ──▶ resolver ──▶ { text, label }
                              │
KJV/<book>.json ──────────────┘
                              ▼
        post-template.html (theme=light) ──▶ out/light/<id>.png
        post-template.html (theme=dark)  ──▶ out/dark/<id>.png
```

## Error handling

- **No Chrome:** abort with instruction to set `CHROME_PATH`.
- **Bad ref / missing book / out-of-range verse:** abort before rendering, naming `id` + `ref`.
- **Missing background or font file:** abort with the missing path.
- **Overflowing verse after min font-size:** log a warning naming the `id` (verse too long for the frame) but still emit the image, so the user can spot it and shorten/re-range.

## Out of scope (YAGNI)

- Scheduling / cron / auto-posting.
- Additional aspect ratios (9:16, 1:1).
- The BSB translation (KJV only for now).
- Random or whole-Bible generation.
- Captions / alt-text / posting metadata.

## Testing / verification

- Run the generator on the seeded `verses.json`; confirm `2N` PNGs land in `out/light` and `out/dark`.
- Visually inspect a short verse (e.g. `PSA 23:1`), a long verse (e.g. `JHN 3:16`), and a range (e.g. `PSA 23:1-3`) on both backgrounds for fit, centering, legibility, and correct theming.
- Confirm the reference label formats correctly from the book `name` (e.g. `PHILIPPIANS 4:13`).
- Feed a deliberately bad ref to confirm the run aborts with a clear message.
```
