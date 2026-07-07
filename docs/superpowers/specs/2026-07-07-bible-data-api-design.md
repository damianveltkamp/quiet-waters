# Bible Data + `getVerse` API — Design

**Date:** 2026-07-07
**Status:** Approved for planning

## Goal

Give the app a local, offline Bible data layer and a small typed API for reading it. This is
**infrastructure only** — the data plus a loader. No UI. It provides the foundation that a future
Bible reader screen will render, and the seam that the existing **verse-of-the-day** feature can
adopt later to render curated verses from the full Bible in a user-chosen translation.

## Background & key decisions

- **Source:** [AO Lab "Free Use Bible API"](https://bible.helloao.org/) — free, no API key, no rate
  limits, public-domain translations permitted for offline/commercial use. Endpoints are plain JSON
  over HTTP (e.g. `https://bible.helloao.org/api/BSB/complete.json`).
- **Licensing reality:** the most *popular* modern translations (NIV, ESV, NLT, CSB, NKJV, NASB) are
  copyrighted and require paid publisher licensing — they cannot be bundled or fetched from a free
  API. Of the well-known translations, only **KJV** is public domain. **BSB** (Berean Standard
  Bible) is a high-quality, public-domain *modern* translation used as the free stand-in for the
  NIV/ESV slot.
- **Translations shipped:** **KJV** (`eng_kjv` upstream, exposed as `KJV`) + **BSB** (`BSB`
  upstream). Both public domain. ~1.5 MB gzipped each (~3 MB total added to the download).
- **Bundled, not fetched at runtime:** the Bible is static text and the app must work offline
  (including in widgets). Data is bundled in the app; no runtime API dependency.
- **Download-on-demand for the rest of AO Lab's catalog is out of scope** for this pass (deferred;
  would add `expo-file-system`).

## Scope

In scope:
- A build-time generator script that downloads KJV + BSB, normalizes them, and writes committed
  per-book JSON plus a generated lazy-load index.
- A typed runtime API (`getVerse`, `getChapter`, `getBooks`, `listTranslations`,
  `resolveReference`, `getVerseByRef`).
- Canonical 66-book metadata and translation/license metadata.
- Unit tests against the committed data.

Out of scope (deferred, named future seams):
- Any UI — no reader screen, no navigation changes.
- Download-on-demand / additional translations / `expo-file-system` / `expo-asset`.
- Headings, footnotes, poetry formatting (verse text only for now).
- Any change to `src/content/verses.ts`, the Today screen, or the tab shell — those are owned by
  in-flight work by another agent. This feature only *exposes* an API that verse-of-the-day can
  adopt later.
- Paid/licensed translations (NIV/ESV/etc.).

## Coordination note

Another agent is concurrently building the Today home screen, the tab shell, and
`src/content/verses.ts` (curated verse-of-the-day with inline verse text) on the
`feat/today-home-screen` branch. To avoid collision, this feature is developed on its own branch in
an isolated worktree, lives entirely under a new `src/bible/` directory, and touches none of those
files. The `Verse` shape below is deliberately `{ text, reference }` — identical to the shape
`verses.ts` already uses — so verse-of-the-day can later swap inline text for `getVerseByRef(...)`
with no shape change.

## Module layout

All new files; no overlap with `src/content`.

```
mobile/src/bible/
  index.ts            public API surface
  types.ts            TranslationId, TranslationMeta, BookMeta, Verse, Reference
  books.ts            canonical 66-book table (code, name, abbreviations, testament, order)
  translations.ts     TRANSLATIONS metadata (id, name, license, licenseUrl)
  data/
    index.ts          GENERATED lazy require-map: { BSB: { GEN: () => require('./BSB/GEN.json'), … }, KJV: {…} }
    BSB/GEN.json …    GENERATED, one file per book (66 files)
    KJV/GEN.json …    GENERATED, one file per book (66 files)
  __tests__/
    bible.test.ts
mobile/scripts/
  build-bible-data.mjs   dev-only generator (not shipped in the app bundle)
```

## Data pipeline (`scripts/build-bible-data.mjs`)

Run manually when data needs (re)generating — not part of the app build or CI. Node 18+ (built-in
`fetch`).

Steps:
1. For each `{ id: 'BSB', upstream: 'BSB' }` and `{ id: 'KJV', upstream: 'eng_kjv' }`:
   - Fetch `https://bible.helloao.org/api/<upstream>/complete.json`.
   - For each book, walk `chapters[].chapter.content`; keep items with `type: "verse"`; for each,
     join the string entries of its `content` array (dropping non-string inline objects such as
     footnote references) into the verse text. Ignore `heading`, `line_break`, and `footnotes`.
   - Write the normalized per-book file to `src/bible/data/<id>/<CODE>.json`.
   - Capture the translation's `name` and `licenseUrl` from the upstream metadata.
2. Regenerate `src/bible/data/index.ts` (the lazy require-map).
3. Regenerate/update `src/bible/translations.ts` license metadata.

Generated output (JSON data files + `data/index.ts`) is **committed to git**, so app builds and CI
require no network access and the data is reproducible.

## Normalized data shape

Lean, verse-text-only. Verse `n` lives at chapter array index `n-1`.

```jsonc
// src/bible/data/BSB/GEN.json
{
  "code": "GEN",
  "name": "Genesis",
  "chapters": [
    ["In the beginning God created the heavens and the earth.", "Now the earth was formless…", "…"],
    ["Thus the heavens and the earth were completed…", "…"]
  ]
}
```

The shape can later gain optional fields (e.g. `headings`) for a reader without breaking `getVerse`.

## Runtime API (`src/bible/index.ts`)

```ts
export type TranslationId = 'BSB' | 'KJV';

export interface TranslationMeta {
  id: TranslationId;
  name: string;        // e.g. "Berean Standard Bible"
  license: string;     // e.g. "Public Domain"
  licenseUrl: string;
}

export interface BookMeta {
  code: string;        // USFM code, e.g. "GEN", "PSA", "1JN"
  name: string;        // e.g. "Genesis"
  testament: 'OT' | 'NT';
  order: number;       // 1..66
  chapterCount: number;
}

export interface Verse {
  text: string;
  reference: string;   // e.g. "Psalm 118:24" — matches src/content/verses.ts
}

export interface Reference {
  bookCode: string;
  chapter: number;
  verse: number;
}

listTranslations(): TranslationMeta[];
getBooks(): BookMeta[];
getChapter(translation: TranslationId, bookCode: string, chapter: number): string[];
getVerse(translation: TranslationId, bookCode: string, chapter: number, verse: number): Verse | undefined;
resolveReference(ref: string): Reference | undefined;                 // parses "Psalm 118:24", "1 John 3:16", "Gen 1:1"
getVerseByRef(translation: TranslationId, ref: string): Verse | undefined;  // resolveReference + getVerse; the adoption seam
```

Notes:
- Data is loaded lazily per book via the generated `data/index.ts` thunk-map; a book's JSON is parsed
  only on first access and cached by Metro's module system thereafter.
- `resolveReference` uses the canonical book table in `books.ts`, matching full names and common
  abbreviations (including numbered books like "1 John" / "1Jn"), case-insensitively, and normalizing
  singular/plural (e.g. "Psalm"/"Psalms"). Returns `undefined` for anything it can't parse.
- Out-of-range lookups (bad book, chapter, or verse) return `undefined` (or an empty array for
  `getChapter`) rather than throwing.

## Testing (test-first)

`src/bible/__tests__/bible.test.ts`, run against the committed data — deterministic and offline:

- `getVerse` returns known text for John 3:16 and Psalm 118:24 in **both** BSB and KJV.
- `getChapter('BSB', 'PSA', 119)` returns the correct number of verses (matches book metadata).
- `resolveReference` parses `"Psalm 118:24"`, `"1 John 3:16"`, `"Gen 1:1"`; returns `undefined` for
  `"not a reference"` and out-of-range books.
- `getVerseByRef('KJV', 'Psalm 118:24')` returns `{ text, reference }`.
- `listTranslations()` returns 2 entries, each with a non-empty `licenseUrl`.
- Out-of-range `getVerse` / `getChapter` return `undefined` / `[]`.

## Risks / notes

- **Metro JSON require:** the loader relies on Metro bundling `.json` via `require()` with static
  string literals (inside thunks for laziness). Metro supports this natively; verify against the
  Expo SDK 57 docs during implementation per `mobile/AGENTS.md`.
- **Verse content parts:** some verses' upstream `content` arrays contain inline non-string objects
  (footnote refs, poetry markers). The generator joins string parts only; spot-check a poetry
  passage (e.g. a Psalm) after generation to confirm text reads correctly.
- **Attribution:** both translations are public domain, but AO Lab supplies license files; surfacing
  `licenseUrl` via `TRANSLATIONS` lets a future About/Credits screen show proper attribution.
- **Data size in git:** ~12–14 MB of raw JSON committed across 132 files. Acceptable and static.
