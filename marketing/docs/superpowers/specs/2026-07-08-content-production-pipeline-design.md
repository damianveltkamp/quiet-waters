# Quiet Waters — Content-Production Pipeline

**Date:** 2026-07-08
**Status:** Approved design, pending spec review

## Problem

Producing "influencer quote card" posts for the Quiet Waters Facebook page is
manual. For each card the current steps are:

1. Find a post on Facebook (Christian media).
2. Screenshot / grab its image.
3. Ask Claude to OCR the text from the image.
4. Source a subject photo separately.
5. Hand-edit `quotes.json`.
6. Run `npm run generate:quotes`.
7. Hand the card off.

Steps 1–4 are the bottleneck. A competitor (`therealcoachjosiah1`) appears to
post hourly by subscribing to RSS feeds of Christian media — an RSS item already
carries the headline text, a summary, and a featured image, which collapses
steps 1–4 into one automated fetch.

## Scope

**In scope (MVP):** automate content ingestion so we can hand a batch of
finished card PNGs to the cofounder.

**Out of scope:** posting and scheduling. The cofounder curates which cards go
live and schedules them via his own tool. He is the human-in-the-loop; this
pipeline never touches the Facebook API.

**Deliverable:** `out-quotes/<id>.png` — finished 1080×1350 quote cards, same as
today. Captions, source links, and review sheets are explicitly deferred to a
future extension.

## Content strategy

A **mix of RSS + AI-generated** content:

- **RSS** — news-style cards sourced from Christian-media feeds.
- **AI-generated** — evergreen faith/scripture quote cards written in-session to
  fill gaps so there is always content, independent of the news cycle.

## Data flow

```
RSS feeds ──► fetch-feeds.mjs ──► candidates.json  (+ images in feed-images/)
                    │                     │
              (dedup vs seen.json)        ▼
                              ┌─ Claude Code session ─┐
                              │ read candidates,        │
                              │ pick winners,           │
                              │ write quote + **gold**  │
                              │ markup into quotes.json │
                              └───────────┬────────────┘
                                          ▼
                          npm run generate:quotes  (existing, unchanged)
                                          ▼
                              out-quotes/<id>.png  ──► hand to cofounder
```

The only genuinely new code is `fetch-feeds.mjs` and its config. Everything
downstream (`quotes.json` → `generate-quotes.mjs` → `out-quotes/`) already
exists and is unchanged.

## Components

### 1. `feeds.json` (config)

Lists RSS sources. User-editable to add/remove publishers.

```json
{
  "feeds": [
    { "name": "Christian Post", "url": "https://www.christianpost.com/rss" },
    { "name": "CBN News",       "url": "https://www.cbn.com/cbnnews/rss" }
  ]
}
```

Seeded with a proposed starter set of Christian-media feeds (Christian Post,
CBN, Relevant, God Reports, Christian Headlines). The user approves/swaps the
list. Feed URLs are verified reachable during implementation.

### 2. `fetch-feeds.mjs` (the fetcher — purely mechanical, no LLM)

For each feed:

- Pull recent items: headline, summary, link, publish date, featured image URL.
  Use the `rss-parser` dependency to absorb feed-format quirks.
- Skip any item whose article URL is already in `seen.json` (fresh items only).
- Download each featured image to `feed-images/`, check resolution, and set
  `imageStatus`:
  - `"ok"` — image present and ≥ ~600px on its shorter side.
  - `"needs-manual"` — image missing or below threshold (flagged for a manual
    photo drop-in during the session).
- Write results to `candidates.json`.
- Append processed URLs to `seen.json`.

`candidates.json` item shape:

```json
{
  "source": "Christian Post",
  "title": "…",
  "summary": "…",
  "link": "https://…",
  "published": "2026-07-08T09:00:00Z",
  "image": "feed-images/<slug>.jpg",
  "imageStatus": "ok"
}
```

All editorial judgment stays out of this script — it only fetches, filters by
freshness, and flags image quality.

### 3. The Claude Code session (editorial + generation)

1. User runs `npm run fetch`.
2. In a session, Claude reads `candidates.json` and proposes the strongest
   items.
3. Claude writes the selected quotes into `quotes.json` with `**gold**` markup
   (double-asterisk phrases render as the gold highlight — existing template
   convention).
4. For any `"needs-manual"` item the user wants to keep, Claude helps drop a
   manual photo into `assets/photos/` and points the entry at it.
5. Claude adds any evergreen/AI-generated faith quotes directly to `quotes.json`
   in the same session (no feed needed).
6. Claude runs `npm run generate:quotes`.

## State & dedup

- `seen.json` — array of article URLs already processed. Committed to the repo
  so re-runs across machines/sessions never re-surface the same story.
- `feed-images/` and `candidates.json` are working artifacts; add to
  `.gitignore` (they are regenerated each fetch). Manually sourced photos live
  in the existing `assets/photos/` and are committed as today.

## Dependencies & config changes

- Add `rss-parser` to `package.json` dependencies.
- Add `npm run fetch` script pointing at `fetch-feeds.mjs`.
- Add `feed-images/` and `candidates.json` to `.gitignore`.

## Error handling

- A feed that fails to fetch (network/parse error) logs a warning and is
  skipped; the run continues with the other feeds.
- An image that fails to download marks the item `"needs-manual"` rather than
  aborting.
- If `candidates.json` comes back empty (everything already seen), the fetcher
  says so plainly so the user knows there's nothing new rather than a failure.

## Testing

- Unit test the image-resolution / `imageStatus` decision with fixture
  dimensions (missing, below-threshold, ok).
- Unit test dedup: an item whose URL is in `seen.json` is excluded.
- Feed parsing is exercised against a small saved RSS fixture (no live network
  in tests), following the existing `node --test` pattern.

## Future extensions (deferred)

- Draft caption + hashtags per card.
- Source link carried through for fact-checking / crediting.
- A single review sheet (Markdown/CSV/Notion) with an approve/reject column.
- Fully programmatic LLM rewriting (Claude API) for hands-off batches.
