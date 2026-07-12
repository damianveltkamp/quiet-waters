# Spike: Can the native widget render a bundled image background?

**Date:** 2026-07-12
**Status:** Research complete — no production code changed.
**Installed versions (source of truth for this spike):** `expo-widgets@~57.0.3`, `@expo/ui@~57.0.3` (from `mobile/package.json`, verified by reading the actual `.d.ts` files shipped in `mobile/node_modules/@expo/ui/build/swift-ui/` and `mobile/node_modules/expo-widgets/`).

## TL;DR recommendation

**(b) Fallback path.** Ship the widget picker as gradient-only for now; the home-screen widget continues to show `fallbackColor` (already wired in Task 3) when the selected background is an image. Do not build Phase 2 image rendering on `@expo/ui/swift-ui` as currently shipped in SDK 57 — the type-level API doesn't support it, and there is existing empirical evidence in this repo that WidgetKit rejects the closest workaround.

---

## Step 1 — Can `@expo/ui/swift-ui` render an image as the widget background?

**No.** Checked the actual shipped type declarations, not just prose docs:

- `mobile/node_modules/@expo/ui/build/swift-ui/modifiers/containerBackground.d.ts`:
  ```ts
  export declare const containerBackground: (color: Color, container: ContainerBackgroundPlacement) => ModifierConfig;
  ```
  `color: Color` only — no `View`/`Image` overload. `ContainerBackgroundPlacement = 'widget' | 'navigation' | 'navigationSplitView'`.
- `mobile/node_modules/@expo/ui/build/swift-ui/modifiers/background.d.ts` — same shape: `background(color: Color, shape?: Shape)`. Color only.
- `mobile/node_modules/@expo/ui/build/swift-ui/modifiers/index.d.ts` — `overlay({ color?: Color, alignment? })` and `backgroundOverlay({ color?: Color, alignment? })` are also **color-only**, not view-accepting. There is no modifier anywhere in this package that composites a `View`/`Image` as a background or overlay.
- There is no `containerBackground(<Image>, 'widget')` overload, and no such form appears in the CHANGELOG (`mobile/node_modules/@expo/ui/CHANGELOG.md`) — the only `containerBackground` entry is `[iOS] Add containerBackground modifier (#44192)`, added color-only.

**The only way to get an image into the tree at all is as a literal child element** (e.g. `<Image uiImage={fileUri} />` inside a `ZStack`), not via any background/overlay modifier. `Image` (`mobile/node_modules/@expo/ui/build/swift-ui/Image/index.d.ts`) does support:
```ts
uiImage?: string; // 'file:///path/to/image.jpg' — "Performs a synchronous read operation that blocks the main thread."
```
(Added per CHANGELOG: `[iOS] Add support for local image uri (#43707)`.)

Combined with `resizable()`, `aspectRatio({ contentMode: 'fill' })`, `frame({...})`, and `clipped()` (all present in `modifiers/index.d.ts`), it is *technically* possible to make an `Image` fill a `ZStack` the way `Image(...).resizable().aspectRatio(contentMode: .fill).frame(...).clipped()` would in hand-written SwiftUI — that's the standard recipe for a full-bleed image layer.

**But this repo already has direct, empirical evidence that this exact pattern fails for widgets.** From `mobile/widgets/QuietWatersWidget.tsx` (current code, in production):
```
// WidgetKit (iOS 17+) requires the background to come through
// `.containerBackground(for: .widget)`, and expo-widgets' containerBackground
// modifier only accepts a solid Color — a gradient container background is not
// expressible here, and painting one as a full-bleed `ignoresSafeArea` layer
// trips WidgetKit's "adopt containerBackground API" error. So: solid bgTop.
```
The team already tried the "paint a full-bleed `ignoresSafeArea()` layer behind the content, and separately call `containerBackground(color, 'widget')` to satisfy the API" workaround — for a **gradient** — and WidgetKit rejected it at runtime with the "adopt containerBackground API" error. WidgetKit's check appears to key off "is there full-bleed content painted outside the sanctioned container-background call," not "is it specifically a gradient." There's no reason to expect an `Image` painted the same way (ZStack + `ignoreSafeArea()`) would be treated differently by WidgetKit than the gradient was — it's the same violation of the same iOS 17+ contract.

**Conclusion for Step 1:** unsupported today. `@expo/ui/swift-ui`'s `containerBackground` is color-only by type signature, and the one workaround shape available (full-bleed child + separate containerBackground color call) is already proven to fail in this exact codebase for an analogous case (gradient).

## Step 2 — How would `expo-widgets` bundle image assets, if the API allowed it?

Confirmed mechanism (for completeness / to inform a future PoC): `expo-widgets` does **not** use an Xcode asset catalog for JS-driven images. It uses a **shared App Group directory**:

```ts
import { widgetsDirectory } from 'expo-widgets';
// widgetsDirectory is a file:// URL to a directory shared between the app and its widgets.
```

Per the SDK docs (`docs/public/llms-sdk-v56.0.0.txt` mirrored at `https://docs.expo.dev/versions/latest/sdk/widgets/`): "Widgets cannot directly access files within an app's sandbox. To display images or other files in a widget, they must be placed in a shared app group container. `widgetsDirectory` ... is automatically configured by the `groupIdentifier` config plugin option" — i.e. no additional config-plugin asset option is needed beyond the `groupIdentifier` the app already sets for widget data sharing. The app would write a widget-sized image file into `widgetsDirectory` at runtime (e.g. during `updateTimeline`), then pass its `file://` path as `Image({ uiImage })`. No asset-catalog step, no prebuild asset config change.

This mechanism is sound and would work *if* Step 1's API gap didn't exist — worth keeping in mind as the exact plan for Phase 2 if a future SDK adds image container backgrounds.

## Step 3 — Widget memory budget / asset sizing

iOS widgets share a small, hard memory ceiling per extension process (commonly documented as roughly 30 MB for Home Screen widgets before the extension is killed; Lock Screen accessories are tighter). Two separate costs matter:

- **Decoded raster memory**, not file size: an RGBA bitmap costs `width × height × 4` bytes once decoded, regardless of source format (PNG/WebP/JPEG all decode to the same footprint). A `systemMedium` widget at 3x on the largest current iPhones is roughly 364×170pt → ~1092×510px decoded ≈ 2.2 MB — trivial against the ~30 MB budget on its own, but it stacks with SwiftUI/WidgetKit's own overhead and any other simultaneously-rendered widget instances (multiple widget families can render concurrently), so it should stay as small as the visible surface actually needs, not reuse a full wallpaper-resolution asset.
- **Main-thread blocking**: the `uiImage` doc comment is explicit — "Performs a synchronous read operation that blocks the main thread." A full-resolution wallpaper file (potentially several MB, non-trivial decode time) read synchronously during a widget timeline reload is a real jank/timeout risk independent of the memory ceiling.

**Recommendation if the image path is ever revisited:** Task 1's generation script should emit a dedicated small widget variant sized to the largest widget family actually rendered (e.g. `systemMedium` at 3x, ~1100×520px) in a compressed format (WebP or PNG), e.g. `scene-01.widget.webp`, rather than reusing the full-resolution wallpaper/lock-screen asset. This keeps both the decoded memory footprint and the synchronous read cost small. This is a note for the follow-up plan, not something to implement now.

## Honesty about uncertainty

The type-level unsupportability (Step 1) is based on reading the actual shipped `.d.ts` files for the exact installed versions (`@expo/ui@~57.0.3`), which is stronger evidence than prose docs (Context7 and docs.expo.dev summaries were consistent with this but less precise). The *empirical* WidgetKit rejection is inferred by analogy from the existing gradient failure recorded in `QuietWatersWidget.tsx` — it has not been separately re-tested with an `Image` in a real build for this spike (that would require writing widget code, which this research-only spike explicitly avoids). If the team wants certainty beyond "the API doesn't expose it and the closest workaround already failed for a similar case," a small throwaway PoC build (ZStack + Image + ignoreSafeArea, on a device/simulator) is the only way to be 100% sure — flagging that as an optional, cheap follow-up rather than a blocker, since the type-level evidence alone is already sufficient to justify not building Phase 2 on this API today.

## Recommendation detail

Go with **(b) fallback path**:
- Widget picker stays gradient-only (no "Images" section) for the native widget.
- `WidgetEntryProps`/timeline continues to pass `fallbackColor` for image-background scenes (Task 3's existing wiring), and the widget shows that solid color when the user's selected scene is an image.
- Revisit if/when `@expo/ui/swift-ui` ships a `containerBackground` overload that accepts a `View`/`Image`, or an equivalent sanctioned image-background API — watch the `@expo/ui` CHANGELOG for a future `containerBackground` or new widget-background entry.
- No follow-up `writing-plans` pass for Phase 2 image rendering is warranted right now; if the team wants belt-and-suspenders certainty, the cheap PoC build described above is the recommended next step before revisiting Phase 2, not a full implementation plan.
