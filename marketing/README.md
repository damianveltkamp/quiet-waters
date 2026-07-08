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
