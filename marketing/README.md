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
