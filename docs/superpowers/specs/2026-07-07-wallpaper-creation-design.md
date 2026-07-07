# Wallpaper Creation — Design

**Date:** 2026-07-07
**Status:** Approved (design), pending implementation plan

## Summary

Build the wallpaper creation feature on the **Create** tab. The user picks a Bible
verse and a gradient background, sees a live full-screen preview, and taps **Set as
wallpaper** to render the preview to a full-resolution PNG and save it to the iOS
Photos library. Because iOS has no public API to set the lock-screen wallpaper
directly, "Set as wallpaper" means *save to Photos + a short hint to finish in
Settings*.

This first version uses **predefined gradient backgrounds only**. Image backgrounds
are deferred to a later feature.

## Goals

- Full-bleed live preview of the wallpaper (gradient + cross + verse + reference).
- Verse selection: browse (book → chapter → verse), free-text search, and "Surprise me".
- Six predefined gradient backgrounds, each with legible auto-adapted text colors.
- Export the preview to a crisp, retina-resolution PNG saved to Photos, with a
  confirmation toast and a one-line hint to set it in Settings.

## Non-goals (deferred)

- Image backgrounds / photo picker.
- The "QUIET WATERS" wordmark on the wallpaper.
- A saved-wallpapers gallery (e.g. in the "You" tab).
- Remembering the last verse/background between sessions.
- The three decorative dots shown above the search pill in the mockup (removed).

## Confirmed decisions

| Question | Decision |
|---|---|
| What does "Set as wallpaper" do? | Render to full-res PNG, save to Photos (write-only permission), show toast + a "set it in Settings › Wallpaper" hint. |
| Verse selection depth | Full drill-down: book → chapter → verse. Plus free-text search and "Surprise me". |
| The three dots on the creator screen | Removed for now. |
| Persistence | Export-only. No gallery, no remembering last selection. |
| Fixed wallpaper elements | Cross symbol + verse + reference. No wordmark. |
| Text contrast on light gradients | Auto-adapt per background — each preset declares its own text colors. |
| "Surprise me" source | Entire Bible (random book → chapter → verse, retrying until a defined verse). |
| Default translation | KJV (matches the mockup). |
| Default state on open | Verse: "He leads me beside quiet waters" / Psalm 23:2. Background: Deep Night. |

## Architecture

**Approach:** Native form-sheets via expo-router modal routes + a small zustand draft
store + a single `WallpaperCanvas` component that serves as both the live preview and
the capture target.

Rationale: matches the mockups' native-sheet look (grabber handle, peek-behind),
adds no dependency for the sheets (`react-native-screens` is already installed), keeps
each piece small and independently testable, and reuses the existing zustand pattern
(`src/store/onboarding.ts`).

### Module layout

```
src/features/wallpaper/
  backgrounds.ts        # 6 gradient presets; each declares its own text colors
  wallpaperDraft.ts     # zustand store: { verse, background, translation, setters }
  export.ts             # saveWallpaperToPhotos(ref): permission -> captureRef -> save
  WallpaperCanvas.tsx   # the composition; used for BOTH preview and capture

src/app/(tabs)/create.tsx      # full-bleed canvas + floating controls + toast
src/app/create/verse-picker.tsx   # native form-sheet route (book/chapter/verse/search/surprise)
src/app/create/backgrounds.tsx    # native form-sheet route (gradient swatch grid)

src/components/Toast.tsx       # small auto-hiding "Wallpaper saved" pill
```

The two picker routes live under `src/app/create/` and are registered with
`presentation: 'formSheet'` (iOS native sheet with detents / grabber) so they slide up
over the creator while the preview peeks behind.

### Data model

**`backgrounds.ts`** — an array of presets:

```ts
interface WallpaperBackground {
  id: string;
  name: string;               // e.g. "Deep Night"
  colors: [string, string];   // [top, bottom] for LinearGradient
  textColor: string;          // main verse + cross color
  mutedColor: string;         // reference eyebrow color
}
```

Six presets seeded from the mockup and the existing palette (`src/theme/colors.ts`):
`Deep Night`, `Still Water`, `First Light`, `Open Sky`, `Morning Mist`, `Horizon`.
Dark presets use white/pale text; light presets (e.g. Morning Mist, Open Sky) use
`primary`/`textMuted` ink. Exact hex values are finalized during implementation;
the invariant is that **every preset ships legible text colors** (enforced by a test).

**`wallpaperDraft.ts`** — zustand store holding the current draft:

```ts
interface WallpaperDraft {
  verse: { text: string; reference: string };
  translation: TranslationId;   // default 'KJV'
  background: WallpaperBackground;  // default Deep Night
  setVerse(text: string, reference: string): void;
  setTranslation(id: TranslationId): void;
  setBackground(bg: WallpaperBackground): void;
}
```

Initialized to the default verse/background. The picker sheets write to it; the creator
screen and `WallpaperCanvas` read from it.

### Components

**`WallpaperCanvas`** — given `{ verseText, reference, background }`, renders a
full-screen composition:
- `expo-linear-gradient` background using `background.colors`
- cross symbol (existing `symbol-white.png` asset, tinted or a colored variant)
- quote in Cormorant italic (matching `LockScreenPreview` / `typography.quote`)
- reference eyebrow

All text/symbol colors come from the preset (`textColor` / `mutedColor`). This single
component is rendered full-bleed as the live preview **and** captured by ref for export
— no separate off-screen copy.

**`create.tsx`** — full-bleed `WallpaperCanvas` behind floating bottom controls:
- "Search a verse" pill → opens verse-picker route
- grid-icon button → opens backgrounds route
- "Set as wallpaper" CTA → runs export flow
- hosts the `Toast`

**`verse-picker.tsx`** — native form-sheet with internal step state
(`book | chapter | verse`) and a back affordance:
- **Surprise me** — random valid verse across the entire Bible (random book → chapter →
  verse, retry until `getVerse` returns a defined verse, skipping textual-variant gaps)
- **Translation dropdown** — KJV / BSB (from `listTranslations()`)
- **OT/NT segmented toggle** — filters `getBooks()` into the book grid
- Book grid → chapter grid (from `chapterCount`) → verse list (from `getChapter()` length)
- **Search field** — free-text reference via `getVerseByRef()` (e.g. "John 3:16")

On selection, writes `{ text, reference }` (+ translation) to the draft store and
dismisses.

**`backgrounds.tsx`** — native form-sheet: "Backgrounds" title + close (×), 2-column
swatch grid with names and a selected state. Tapping updates the draft store live so
the preview behind updates immediately.

**`Toast.tsx`** — small auto-hiding dark pill with a green check (mockup 4), used for
"Wallpaper saved".

### Export flow (`export.ts`)

`saveWallpaperToPhotos(canvasRef)`:
1. `MediaLibrary.requestPermissionsAsync()` (write-only). If denied → return `denied`.
2. `captureRef(canvasRef, { format: 'png' })` → local uri. Capturing at default device
   pixel ratio yields a retina-resolution image (e.g. ~1179×2556 on a 3× device) — real
   wallpaper resolution, crisp text, no upscaling.
3. `MediaLibrary.saveToLibraryAsync(uri)`.
4. Return `saved`.

The screen reacts to the result: on `saved`, fire a success haptic (existing
`src/lib/haptics.ts`), show the toast, and append the one-line hint
"Set it via Settings › Wallpaper." On `denied`, show a hint to enable Photos access.

### New dependencies & native config

- `react-native-view-shot` (v4+, New-Architecture compatible — Fabric + TurboModules).
- `expo-media-library` + its config plugin, adding `NSPhotoLibraryAddUsageDescription`
  to Info.plist (write-only save needs no full-library permission on iOS 11+).
- Run `expo prebuild` / pod install to pick up the native modules (project has a
  committed `ios/` dir).

Both versions must match Expo SDK 57 — verify against
https://docs.expo.dev/versions/v57.0.0/ during implementation.

## Error handling

- **Photos permission denied:** export returns `denied`; screen shows a hint to enable
  Photos access in Settings. No crash, no silent failure.
- **Capture failure:** `captureRef` rejection is caught; screen shows a generic
  "Couldn't save wallpaper" message.
- **Empty/variant verse from Surprise me:** the random loop retries until `getVerse`
  returns a defined verse, so gaps in textual variants never surface an empty wallpaper.
- **Invalid search reference:** `getVerseByRef` returns undefined → inline "verse not
  found" feedback in the search field; draft unchanged.

## Testing strategy

- **Unit**
  - `backgrounds`: preset array shape; every preset declares `textColor` and
    `mutedColor` (legibility invariant).
  - `wallpaperDraft`: default state and each setter transition.
  - Surprise-me selection: with the loader mocked, always returns a *defined* verse and
    retries past empty results.
  - `export`: mock `captureRef` and media-library; assert the
    permission → capture → save ordering, the `saved` path, and the `denied` path.
- **Component**
  - `WallpaperCanvas`: renders verse + reference using the preset's text color.
  - `verse-picker`: step navigation (book → chapter → verse), OT/NT filtering, search
    success/failure, and that selection updates the draft.
  - `backgrounds`: selecting a swatch updates the draft.
  - `create`: default state renders; "Set as wallpaper" invokes the export flow and
    shows the toast on success.

## Open implementation details (decided during build, not blocking)

- Exact gradient hex values per preset.
- Cross symbol color variants (tinted asset vs. colored SVG) for light vs. dark presets.
- Toast auto-hide duration and animation.
