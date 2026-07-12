# Wallpaper Text Color + Backdrop Opacity — Design

Date: 2026-07-12
Design reference: `design/wallpapers/wallpaper-creator-text-backdrop-config.png`

## Goal

Give the user two new controls in the wallpaper creator:

1. **Text color picker** — choose the verse/cross/reference color from a fixed
   4-swatch palette.
2. **Backdrop opacity slider** — adjust the strength of the full-screen dark
   overlay (scrim) behind the text, from 0% to 100%.

Scope is limited to these two controls. The existing Backgrounds sheet and its
background list are out of scope and stay unchanged.

## Key decisions

- The two controls live in a **new, separate form sheet** (partial-height,
  undimmed) so the live wallpaper stays visible above it while adjusting.
- Text color and backdrop opacity are **global draft settings**, independent of
  the selected background. They persist when the user switches background.
- The scrim becomes **universal** — applied to both gradient and image
  backgrounds — and its strength is driven by the slider.

## 1. Data model — `src/features/wallpaper/wallpaperDraft.ts`

Add two fields and their setters to the Zustand store:

```ts
textColor: string;        // hex, default '#FFFFFF'
backdropOpacity: number;  // 0..1, default 0.45
setTextColor: (c: string) => void;
setBackdropOpacity: (o: number) => void;
```

Defaults: `textColor = '#FFFFFF'`, `backdropOpacity = 0.45`.

Consequence: `background.textColor` / `background.mutedColor` no longer drive the
canvas. The draft `textColor` wins. The reference eyebrow color is derived from
`textColor` at reduced opacity (~0.75), so no separate muted token is needed.

The `textColor` / `mutedColor` fields on the `Background` type remain in place
but become unused by the canvas. Removing them is out of scope.

## 2. Rendering — `src/features/wallpaper/WallpaperCanvas.tsx`

Signature gains `textColor` and `backdropOpacity` props (passed from the draft
via the create screen).

- Verse text + cross tint use `textColor`.
- Reference eyebrow uses `textColor` at ~0.75 opacity (a derived rgba, computed
  from the hex; a small helper converts hex → rgba).
- The scrim is applied for **all** backgrounds (gradient and image), as a
  full-screen vertical gradient overlay driven by `s = backdropOpacity`:

  ```
  overlay colors = [ rgba(0,0,0, s), rgba(0,0,0, s * 0.35), rgba(0,0,0, s) ]
  ```

  - `s = 0` → fully transparent (true "off"), no visible darkening.
  - Keeps the vignette character (darker top/bottom, lighter middle) for
    legibility.

- The existing `background.scrim` field is retired; the slider value replaces it.

Tradeoff accepted: gradient backgrounds now get a dark overlay too (45% by
default), a visible change from today's look on light gradients. The user can
slide to 0.

## 3. New form sheet — `src/app/wallpaper-style.tsx`

A new route, registered in `src/app/_layout.tsx` with:

```ts
presentation: 'formSheet',
sheetGrabberVisible: true,
sheetAllowedDetents: [0.4],          // small partial-height sheet
sheetLargestUndimmedDetent: 0,       // wallpaper behind stays bright/undimmed
```

(Exact option names to be verified against the Expo SDK v57 / react-native-screens
4.25 docs before implementation, per `mobile/AGENTS.md`.)

Sheet content, top to bottom:

- **TEXT COLOR** section (eyebrow label). A row of 4 circular swatches:

  | Swatch     | Hex       | Token             |
  |------------|-----------|-------------------|
  | White      | `#FFFFFF` | existing          |
  | Navy       | `#1C3344` | `colors.primary`  |
  | Gold       | `#C9A96A` | **new** `colors.gold` |
  | Light Blue | `#9CC0D4` | `colors.accent`   |

  - Selected swatch shows a ring/border (same pattern as background swatches).
  - The white swatch shows a subtle border so it is visible on the light sheet.
  - Tapping sets `textColor`; the sheet is **not** dismissed.

- **BACKDROP OPACITY** section (eyebrow label + live `NN%` on the right).
  A `Slider` from `@expo/ui/universal` below: `min={0}`, `max={1}`,
  `value={backdropOpacity}`, `onValueChange={setBackdropOpacity}`.
  Percentage label = `Math.round(backdropOpacity * 100)`. Not dismissed on change.

## 4. Entry point — `src/app/(tabs)/create.tsx`

Add a third icon button to the action row, between "Search a verse" and the
Backgrounds icon:

`[ Search a verse ] [ Aa ] [ ▦ ]`

- The new "Aa" (text glyph) button navigates to `/wallpaper-style`.
- The create screen already reads the draft; it passes `textColor` and
  `backdropOpacity` into `WallpaperCanvas`.

## 5. New theme token — `src/theme/colors.ts`

Add `gold: '#C9A96A'` to the `colors` object.

## Testing

- `wallpaperDraft` test: new fields default correctly; setters update state.
- `WallpaperCanvas` test: renders scrim overlay for gradient backgrounds too;
  `backdropOpacity = 0` yields a transparent overlay; text uses `textColor`.
- `wallpaper-style` sheet test: swatch tap calls `setTextColor` and does not
  navigate back; slider change calls `setBackdropOpacity`; percentage label
  reflects the value.

## Out of scope

- Restructuring the Backgrounds sheet or merging its Colors/Images lists.
- Removing the now-unused `textColor` / `mutedColor` fields from `Background`.
- Changing the Backgrounds sheet presentation.
