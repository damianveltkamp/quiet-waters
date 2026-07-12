# Widget size preview toggle — design

**Date:** 2026-07-12
**Status:** Approved

## Problem

The widget config screen (`mobile/src/app/(tabs)/widget-config.tsx`) shows a single
fixed-size preview card. Apple offers three home-screen widget sizes (small, medium,
large). Users benefit from seeing what the Daily Verse widget looks like at each size
before adding it. The original mockup (`design/widget-config/`) shows a
`Small / Medium / Large` segmented control directly above the settings card.

## Decisions

1. **Preview-only toggle.** The selected size is local component state; nothing is
   persisted. iOS lets the user pick the widget size on the home screen — the app
   cannot set or restrict it — so the toggle is purely an educational preview.
   `WidgetConfig` is not changed.
2. **Faithful to on-device rendering.** The preview mirrors how the real widget
   (`mobile/widgets/QuietWatersWidget.tsx`) renders each family.
3. **Gradient background in both.** The real widget currently renders a *solid*
   background (`containerBackground(bgTop)`). This design changes both the native
   widget *and* the config-screen preview to render a vertical gradient
   (`bgTop → bgBottom`), so the preview keeps matching the widget.

## Faithful per-size behavior

The real widget has **two** layout branches, not three: `systemSmall` vs.
everything else (`systemMedium` and `systemLarge` render identically). Medium and
Large differ only in container shape.

| | Small | Medium | Large |
|---|---|---|---|
| Preview aspect ratio | 1 : 1 | ~2.14 : 1 (wide) | ~0.95 : 1 (tall) |
| Layout branch | `isSmall` | non-small | non-small |
| Verse font size | 14 | 18 | 18 |
| Verse line limit | 7 | 10 | 10 |
| Cross icon size | 12 | 16 | 16 |
| Reference font size | 9 | 11 | 11 |
| Padding | 12 | 16 | 16 |
| Spacing | 8 | 12 | 12 |

Aspect ratios are representative of the iPhone 15 size class (small 158×158,
medium 338×158, large 338×354) and are approximate — the goal is proportion, not
pixel-exactness.

Preview text uses React Native `numberOfLines={lineLimit}` +
`adjustsFontSizeToFit` + `minimumFontScale={0.5}` to mirror SwiftUI's
`lineLimit(...)` + `minimumScaleFactor(0.5)` auto-shrink/truncate.

## Components

### 1. Shared layout module — `mobile/src/features/widget/widgetLayout.ts`
Single source of truth for the per-family numbers, so the native widget and the
preview cannot drift.

```ts
export type WidgetFamily = 'small' | 'medium' | 'large';

export interface FamilyLayout {
  verseFontSize: number;
  verseLineLimit: number;
  crossSize: number;
  refFontSize: number;
  padding: number;
  spacing: number;
  aspectRatio: number; // width / height
}

export function familyLayout(family: WidgetFamily): FamilyLayout;
```

- The native widget imports this module and derives its values from
  `familyLayout(environment.widgetFamily === 'systemSmall' ? 'small' : 'medium')`
  (medium/large share styling; the widget only needs the small vs. non-small split).
- A unit test asserts the constants equal the values the widget previously
  hardcoded (regression guard against silent visual drift).

### 2. Preview component — `mobile/src/features/widget/WidgetPreview.tsx`
Presentational RN component:

```ts
interface WidgetPreviewProps {
  family: WidgetFamily;
  background: WallpaperBackground; // provides gradient colors, textColor, mutedColor
  verseText: string;
  reference: string;
}
```

Renders a rounded card at `familyLayout(family).aspectRatio` using a
`LinearGradient` (`bg.colors`, top → bottom), with the cross, serif verse, and
uppercase reference styled from `familyLayout(family)`.

### 3. Segmented control
A `Small / Medium / Large` pill control placed directly above the settings card,
matching the mockup. Reuse an existing segmented/toggle component from
`@/components` if one exists; otherwise add a small local `SizeSegmentedControl`.

### 4. Config screen wiring — `mobile/src/app/(tabs)/widget-config.tsx`
- Add `const [family, setFamily] = useState<WidgetFamily>('medium')` (default
  matches the mockup's selected state).
- Replace the inline preview `LinearGradient` block with
  `<WidgetPreview family={family} background={bg} verseText={...} reference={...} />`.
- Keep the current static sample verse (Matthew 11:28) — no live/random verse in
  the preview.
- Insert the segmented control between the preview area and the settings card.

### 5. Native widget gradient — `mobile/widgets/QuietWatersWidget.tsx`
`containerBackground(color)` and `background(color)` in `@expo/ui/swift-ui`
(v57.0.3) accept only a solid color, but `foregroundStyle` accepts a
`{ type: 'linearGradient', colors, startPoint, endPoint }` shape style, and a
`ZStack` primitive exists.

Approach: wrap the content `VStack` in a `ZStack` whose bottom layer is a
full-bleed shape filled via `foregroundStyle` with the linear gradient
(`[bgTop, bgBottom]`, `startPoint {x:0.5,y:0}` → `endPoint {x:0.5,y:1}`). Keep
`containerBackground(bgBottom, 'widget')` as the required solid fallback for the
widget container. `timeline.ts` already supplies `bgBottom` in `WidgetEntryProps`,
so no data-model or timeline changes are needed.

This is the highest-risk step: it requires a native rebuild and the gradient
layering may need on-device iteration.

## Data flow

`useWidgetStore.config.backgroundId` → resolve `WallpaperBackground` (as today)
→ `WidgetPreview` reads `bg.colors` / `bg.textColor` / `bg.mutedColor`.
Family is local UI state only. No store or persistence changes.

## Testing / verification

- **Unit:** `widgetLayout` constants match the widget's prior hardcoded values.
- **Config screen:** run the app, toggle all three sizes, confirm box shape,
  type/spacing per family, gradient, and verse auto-shrink/truncate behavior.
- **Native widget:** rebuild, add all three families to the simulator home
  screen, confirm the gradient renders and content is unchanged otherwise.

## Sequencing

Two phases, so the low-risk JS work is independently shippable:
- **Phase A (pure JS, low risk):** shared `widgetLayout` module + test,
  `WidgetPreview`, segmented control, config-screen wiring.
- **Phase B (native, higher risk):** widget gradient background, verified on the
  simulator.

## Out of scope (YAGNI)

- Persisting the selected size.
- Lock-screen widget (`QuietWatersLockWidget`) changes.
- New backgrounds or a live/random verse in the preview.
