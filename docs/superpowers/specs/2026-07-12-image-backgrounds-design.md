# Image Backgrounds for Wallpaper & Widget — Design Spec

**Date:** 2026-07-12
**Status:** Design approved — ready for implementation planning
**Surfaces:** Wallpaper builder (RN canvas) + iOS home/lock-screen widget (native SwiftUI)

## Overview

Today the wallpaper builder and the widget let a user pick from six curated
**gradients** only. This adds **photographic/painterly image backgrounds** as a
second class of background alongside the gradients, across both surfaces. The
MVP ships a **bundled, curated set of ~20 Christian images** (nature/creation +
Jesus scenes).

## Goals

- Let a user choose an image background (not just a gradient) in the wallpaper
  builder, with the verse remaining legible over any photo.
- Extend the same choice to the widget where technically feasible.
- Keep the change source-agnostic: the wiring is identical whether the final
  image files are downloaded stock or self-generated.

## Non-goals (out of scope)

- Remote/CDN image catalog (bundled set only for MVP; revisit at 50+ images).
- User's own camera-roll photos as backgrounds.
- Per-image text-color theming (fixed white-text-over-scrim instead — see below).
- Android (iOS-only app).

## ⚠️ Licensing note (blocks ship, not build)

The 20 placeholder images currently in `~/Documents/bgs/` were sourced from
Pinterest. A Pinterest "Edited by AI" label does **not** clear copyright, and
these files carry unverified provenance (one had an artist signature and was
already swapped). **They are placeholders for building against only.** Before
release, replace them with **clean-owned files** — self-generated in the same
painterly style (recommended: you own the output outright) or licensed from free
commercial stock (Unsplash/Pexels/Freely Photos) / Lightstock. The
implementation does not change when the files are swapped.

## Design

### 1. Data model — one registry, discriminated union

`backgrounds.ts` stays the single registry so every id-based lookup
(`wallpaperDraft`, `widgetStore`, `timeline.backgroundById`) keeps working
unchanged. `WallpaperBackground` becomes a union:

```ts
interface BackgroundBase { id: string; name: string; textColor: string; mutedColor: string }

interface GradientBackground extends BackgroundBase {
  kind: 'gradient';
  colors: readonly [string, string]; // [top, bottom]
}
interface ImageBackground extends BackgroundBase {
  kind: 'image';
  source: ImageSourcePropType; // require('...') — RN canvas + picker thumbnail
  widgetAsset: string;         // asset-catalog name — native widget
  fallbackColor: string;       // dominant color, shown if the asset can't load
  scrim?: number;              // dark-overlay strength 0..1, default 0.4
}
type Background = GradientBackground | ImageBackground;
```

- The six existing gradients gain `kind: 'gradient'`; their `textColor` /
  `mutedColor` are unchanged.
- The image entries set `textColor: '#FFFFFF'` (fixed white — see legibility).
- `DEFAULT_BACKGROUND` stays a gradient.

**Rejected alternative:** a separate `IMAGE_BACKGROUNDS` array. It would force
the widget/timeline/store to know which list an id lives in. One registry keeps
lookups uniform.

### 2. Wallpaper canvas — legibility via scrim (Phase 1, low risk)

`WallpaperCanvas` switches on `background.kind`:

- `gradient` → today's `LinearGradient` (unchanged).
- `image` → `ImageBackground` (RN, `source`) + a **scrim** overlay + white text.
  - **Scrim:** a `LinearGradient` of `rgba(0,0,0,·)` — darker at top and bottom,
    lighter in the middle — strength driven by `scrim` (default `0.4`). This is
    what guarantees the verse stays readable over a bright or a dark photo alike.
  - Text/cross/reference use `background.textColor` (`#FFFFFF` for images).

`captureRef` in `export.ts` captures the composed RN view to PNG exactly as
today — **no change to the export path.**

### 3. Widget — bundled asset by name (Phase 2, behind a spike)

The native SwiftUI widget cannot receive a JS `require()` asset, so for the
fixed bundled set the approach is:

- Bundle **widget-sized** copies of the images into the widget extension's asset
  catalog.
- `timeline.ts` `WidgetEntryProps` gains an optional `backgroundImage?: string`
  (the widget asset name). `buildTimeline` sets it when the selected background
  is `kind: 'image'`; otherwise it is absent and the widget uses `bgTop`/`bgBottom`
  as today. `fallbackColor` populates `bgTop` for image backgrounds so a missing
  asset still renders a themed solid color.
- The SwiftUI widget (`QuietWatersWidget` / `QuietWatersLockWidget`): if
  `backgroundImage` is present, render the image as the container background with
  a scrim + white text; else render the color background (current behavior).

**Spike required before committing Phase 2** (validate against the pinned Expo
57 docs — `https://docs.expo.dev/versions/v57.0.0/`):

1. Does `@expo/ui/swift-ui` support an **image** as `containerBackground`, or a
   `ZStack` with an `Image` base layer? Today it only accepts a color string.
2. How does `expo-widgets` **bundle image assets into the widget extension**?

**Fallback if the spike fails:** the widget shows the image's `fallbackColor`
(still themed to the chosen photo) while the wallpaper shows the full image.
Phase 1 ships regardless of the spike outcome.

### 4. Selection UI

Both pickers — `wallpaper-backgrounds.tsx` and `widget-background.tsx` — gain two
sections:

- **Colors** — existing gradient swatches (`LinearGradient`), unchanged.
- **Images** — photo thumbnails using the image itself as the swatch.

Same selected-border treatment already in place. `wallpaperDraft` stores the full
`Background` object (already does — works with the union). `widgetStore` stores
`backgroundId: string` (already does — resolves via the registry). No persistence
migration needed; adding new ids is backward-compatible with `widget` store v1.

### 5. Asset pipeline

Source files are ~9.4 MB of mixed JPEG/PNG (one 5 MB PNG). Add a resize/convert
step:

- **Phone variant:** ~1290×2796, WebP → `mobile/assets/backgrounds/`.
- **Widget variant:** small (respecting the ~30 MB widget memory budget) →
  widget-extension asset catalog.
- Target total ≈ **6–9 MB** added to the bundle.

### 6. Sequencing

- **Phase 1 — wallpaper images:** data model + canvas scrim + wallpaper picker +
  asset pipeline. Fully shippable on its own.
- **Phase 2 — widget images:** spike → `WidgetEntryProps.backgroundImage` +
  native SwiftUI image background + widget picker section. Or the fallback-color
  path if the spike fails.

## Testing

- **Registry integrity** (`backgrounds.test.ts`): every `image` entry has
  `source`, `widgetAsset`, `fallbackColor`, valid `scrim`; ids unique across
  kinds.
- **Canvas** (`WallpaperCanvas.test.tsx`): `image` kind renders `ImageBackground`
  + scrim + white text; `gradient` kind unchanged.
- **Timeline** (`timeline.test.ts`): image background emits
  `backgroundImage` + `fallbackColor`-derived `bgTop`; gradient background emits
  color props as today.
- **Export** (`export.test.ts`): unchanged — captureRef still produces a PNG.
- **Pickers** (`wallpaper-backgrounds.test.tsx`): image section renders and
  selection updates the draft/store.
