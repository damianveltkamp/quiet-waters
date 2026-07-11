# Quiet Waters Widgets — Design Spec

**Date:** 2026-07-11
**Status:** Design approved — ready for implementation planning
**Surfaces:** Home-screen widget (iOS, configurable) + lock-screen widget (iOS, fixed)

> Supersedes the brief-stage `2026-07-06-home-widget-configuration-design.md`.
> That document was the prompt used to generate the visual mockup
> (`design/widget-config/`). This spec reflects the decisions made after seeing
> the mockup and is the source of truth for implementation. Notable changes from
> the brief: content/collection and translation pickers are dropped (random
> verse from the whole Bible), backgrounds are the app's six curated gradients
> only (no image gallery or style presets), and refresh gains an "every hour"
> option alongside the daily time.

## Overview

A configurable **home-screen widget** and a simple **lock-screen widget** that
display a random Bible verse, refreshing on a schedule. Built on the official
**`expo-widgets`** package: the widget UI is authored in TypeScript with
`expo/ui`, and content is driven from JS. No hand-written Swift.

## Goals

- Let a user configure a calm, on-brand home-screen Scripture widget in a single
  screen, with a live preview.
- Ship a simple lock-screen widget that shows the same daily verse with no
  configuration.
- Keep the JS app as the single source of content and scheduling; the widget is
  a thin declarative renderer of props supplied by the app.

## Non-goals (out of scope)

- Content/collection selection, translation selection, and text-style presets
  (dropped — the widget shows a random verse in the app's shipped translation).
- Camera-roll / user-photo backgrounds (curated gradients only).
- Guaranteed-fresh background refresh via iOS Background Tasks or push
  notifications (see "Refresh model" — the buffer approach is intentionally
  chosen instead).
- Android widgets (iOS-only app).

## Configuration screen (React Native)

A new route (e.g. `app/widget-config.tsx`), matching the approved mockup minus
the Content row and the Dark toggle. Single scrollable screen:

- **Live preview card** (centerpiece) — verse + cross glyph + reference,
  reflecting the selected background. Rendered at a single representative size
  (Medium, as in the mockup).
- **No size toggle.** iOS decides the widget family when the user adds the widget
  from the system gallery, and a user can place multiple sizes; the app cannot
  force a family. A size control on the config screen would therefore do nothing
  to the real widget and would mislead the user into thinking it sets the on-home
  size — so it is deliberately omitted. The widget design must still hold up at
  all three home families (the widget declares support for all three), but that
  is a design concern, not a user control.
- **Background row** — opens a picker of the existing six gradient `BACKGROUNDS`
  (`src/features/wallpaper/backgrounds.ts`), reusing the wallpaper-backgrounds
  picker pattern. Persisted.
- **Refresh row** — opens a picker with two modes: **Daily at [time]** (time
  picker, default 7:00 AM) or **Every hour**. Persisted.
- **Save widget** button — persists config, regenerates the verse buffer, pushes
  the timeline to WidgetKit, and shows a short "long-press your home screen to
  add the Quiet Waters widget" hint (iOS does not allow the app to place widgets
  programmatically).

## State & data flow

- **Config** persisted via zustand + MMKV:
  `{ backgroundId: string, refresh: { mode: 'daily' | 'hourly', time?: 'HH:mm' } }`.
  (Size is intentionally absent — see the "No size toggle" note above.)
- On **save** and on **every app launch**: generate a buffer of random verses
  via the existing `pickRandomVerse`, build timeline entries `{ date, props }`,
  and call the widget module's `updateTimeline`. App launch tops the buffer back
  up (the buffer model below).
- Each entry's **props** carry everything the widget needs to render without
  further app involvement: `verseText`, `reference`, and the background's
  `colors` / `textColor` / `mutedColor` (from the selected `WallpaperBackground`).

## Refresh model (B1 — precompute-on-launch with a generous buffer)

- The app precomputes a batch of upcoming verses and schedules them as a
  WidgetKit timeline. iOS advances through the entries on schedule without
  running the app.
- Buffer sizes: **~30 entries** for the daily mode (about a month), **~168
  entries** for the hourly mode (about 7 days). These are regenerated/topped up
  on every app launch and on save.
- Known trade-off: if the buffer runs out before the app is next opened, the
  widget "freezes" on the last precomputed verse until the next launch. Accepted
  deliberately — a background-task or push-based "always fresh" approach is
  materially more work, still not truly guaranteed by iOS, and (for push) needs a
  server. Can be revisited later if analytics justify it.

## Widget UI (TypeScript via `expo/ui`)

- **Home widget** — families `systemSmall`, `systemMedium`, `systemLarge`;
  rendering mode `fullColor`. Renders background fill + cross glyph + verse text +
  reference, laid out per family (Small shows a shorter/truncated verse;
  Medium/Large show more). Consumes the entry props.
- **Lock widget** — family `accessoryRectangular`; rendering mode `vibrant`.
  Shows verse text + reference only (the lock screen is monochrome/vibrant, so no
  background is rendered). `accessoryInline` / `accessoryCircular` kept minimal or
  omitted.
- Tapping either widget opens the app (`widgetURL`).

## `app.json` plugin config

Add the `expo-widgets` plugin with:

- a widget `bundleIdentifier` (e.g. `com.quietwaters.app.widgets`),
- an App Group `groupIdentifier` (e.g. `group.com.quietwaters.app`),
- two widget definitions: the home widget (`systemSmall/Medium/Large`) and the
  lock widget (`accessoryRectangular` + any minimal accessory families).

## Testing

- Unit-test the **verse-buffer + timeline builder** with a deterministic injected
  `rand` (mirroring `src/features/wallpaper/__tests__/randomVerse.test.ts`):
  correct entry count per mode, correct entry timestamps (daily at chosen time,
  hourly on the hour), and correct props shape.
- Unit-test the **config store** persistence (defaults, round-trip through MMKV).
- Widget rendering itself is verified manually on a device / simulator.

## Items to verify at build time (clean fallbacks, not blockers)

- **`expo-widgets` availability for SDK 57** — confirm the published version when
  installing (docs show latest + v56).
- **Gradients inside widgets** — if `expo/ui` does not support `LinearGradient`
  in a widget context, fall back to the background's top color as a solid fill
  (the mockup's gradient is subtle, so this degrades gracefully).
- **App Group provisioning** — requires an entitlement in the Apple Developer
  account; needs a native rebuild via the existing dev client.

## New files (rough)

- `src/features/widget/` — config store, verse-buffer + timeline builder, and
  their tests.
- Widget component file(s) per the `expo-widgets` convention.
- `app/widget-config.tsx` — the configuration route.
- `app.json` — the `expo-widgets` plugin block.
