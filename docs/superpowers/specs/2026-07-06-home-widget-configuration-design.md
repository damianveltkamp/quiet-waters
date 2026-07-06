# Home-Screen Widget Configuration — Design Spec

**Date:** 2026-07-06
**Status:** Design (visual mockup pending) — not yet planned for implementation
**Surface:** Home-screen widget (iOS) only

## Overview

Quiet Waters delivers Scripture through three surfaces: a home-screen widget, a
lock-screen widget, and a custom wallpaper. This spec covers the **configuration
screen for the home-screen widget** — where a user sets up how their Scripture
widget looks and behaves.

Configuration is **per-surface**: the lock-screen widget and wallpaper will each
get their own separate configuration flows in later work. The home-screen widget
is being built first because it is the most customizable surface.

## Goals

- Let a user configure a home-screen Scripture widget in a single, calm screen.
- Show a live preview that reflects settings and adapts across widget sizes.
- Keep choices bounded and on-brand — favor curated presets over granular knobs
  so the result always looks good and stays legible.

## Non-goals (out of scope for this spec)

- Lock-screen widget configuration (separate flow, later).
- Wallpaper configuration (separate flow, later).
- User camera-roll photo backgrounds (deferred; curated + solid/gradient only).
- Hand-picking / favoriting individual verses (deferred; collection-rotation only).
- Real-time / high-frequency verse updates (iOS widgets update on a scheduled
  timeline, not live).

## Configuration elements

### Content — *what* verse appears
- **Collection picker** — choose a theme (e.g. Psalms, Comfort, Strength,
  Gratitude, Peace). The app auto-rotates verses from the chosen collection.
- **Translation picker** — e.g. ESV, KJV, NIV, and a Dutch option (HSV/NBV).
- **Show reference toggle** — show/hide the citation (e.g. "Psalm 23:1").

### Background
- **Curated image gallery** — app-provided, calm, on-brand photos (nature / water
  / soft abstract), tuned for legibility.
- **Solid color / gradient** — simple, always-legible option.
- No camera-roll / user photo in this version.

### Timing
- One new verse **per day**.
- **Time-of-day picker** for when the verse refreshes (e.g. 7:00 AM).

### Text style
- **Style presets** (e.g. "Serene", "Bold", "Classic"). Each preset bundles
  **font + text color + legibility scrim** together. The user picks a preset
  rather than adjusting individual controls — prevents unreadable combinations and
  keeps the app's design-forward look consistent.

### Behavior
- **Tap action**: defaults to "open the app" for v1. Not surfaced as a control on
  this screen (revisit if needed).

## Live preview (centerpiece)

- A realistic widget preview sits at the top of the screen and updates as settings
  change.
- **No in-app size picker.** iOS users add small / medium / large from the system
  widget gallery; the extension declares supported families. The config screen
  instead lets the user **toggle the preview** between small / medium / large so
  they can confirm the design adapts. The design must hold up at all three sizes.

## iOS / platform constraints

- **Timeline-based updates.** Widgets refresh on a schedule provided to WidgetKit,
  not continuously. "Once daily at a chosen time" fits this model well.
- **iOS 18+ widget tinting.** Users can tint home-screen widgets, which may
  desaturate a photo background. Not a user-facing control here, but the design
  must not depend on subtle color that breaks under tinting.
- **React Native / Expo target.** The real app is built in Expo. Widget UI is
  authored via the official `expo-widgets` module (TypeScript/JSX over
  `@expo/ui/swift-ui`) — verify SDK requirements and confirm background-image and
  legibility-scrim support in `@expo/ui` before committing implementation details.
  Favor designs that are implementable natively.

## Open items to resolve after visual design

- Confirm `@expo/ui/swift-ui` supports the background-image + scrim approach the
  presets require (flagged during research; not yet verified).
- Confirm the target Expo SDK version supports `expo-widgets` (appears to be
  SDK 54+ / experimental).
- Decide the initial set of collections, translations, and style presets to ship.

## Layout direction

Single scrollable screen with clear sections (preview → content → background →
timing → text style → save). Not a multi-step wizard. Light and dark mode.

## Appendix: design prompt (for external visual design)

The following prompt is the brief handed to Claude to generate the visual mockup
before implementation.

```text
# Design brief: Widget configuration screen — "Quiet Waters"

## Product context
Quiet Waters is an iPhone-only Christian scripture app (built in Expo / React Native).
Its purpose: help people get closer to God by replacing idle phone time with
Scripture. It delivers verses through three surfaces — a home-screen widget, a
lock-screen widget, and a custom wallpaper. The brand tone is calm, reverent,
premium, and modern (it's a paid subscription app). The name evokes Psalm 23 —
"he leads me beside quiet waters" — so the aesthetic should feel still, peaceful,
and uncluttered. Design for both light and dark mode.

## What to design
A single mobile screen: the configuration screen for the HOME-SCREEN widget.
(The lock screen and wallpaper get their own separate config screens later — do
NOT design those here.) This is where the user sets up how their scripture widget
looks and behaves.

Please produce a high-fidelity, interactive mockup of this screen sized to an
iPhone (e.g. an HTML/CSS or React artifact framed as an iPhone). Show light and
dark variants if practical. Prioritize a clean, calm, premium visual language.

## Required elements on the screen

1. Live widget preview (the centerpiece).
   - A realistic preview of the widget rendered at the top, updating as the user
     changes settings below.
   - IMPORTANT iOS constraint: users do NOT pick a widget size in-app — iOS lets
     them add small / medium / large from its own widget gallery. So instead of a
     size picker, let the user TOGGLE the preview between small, medium, and large
     to see how their design adapts. The preview must look good at all three sizes.

2. Content settings
   - Collection picker: choose a verse theme (e.g. Psalms, Comfort, Strength,
     Gratitude, Peace). App auto-rotates verses from the chosen collection.
   - Translation picker: e.g. ESV, KJV, NIV (and a Dutch option like HSV/NBV).
   - "Show reference" toggle (e.g. show/hide "Psalm 23:1").

3. Background settings
   - Two background sources: (a) a curated image gallery of calm, on-brand photos
     (nature / water / soft abstract), and (b) solid color / gradient options.
   - No camera-roll / user-photo option in this version.

4. Timing
   - One new verse per day.
   - A time-of-day picker for when the verse refreshes (e.g. 7:00 AM).

5. Text style presets
   - A small set of designer-made presets (e.g. "Serene," "Bold," "Classic").
   - Each preset bundles font + text color + a legibility scrim together — the
     user picks one preset rather than tweaking individual knobs. Show them as
     visual swatches/thumbnails, not text labels alone.

6. Save / apply action at the bottom.

## Constraints & guidance
- Keep it to ONE scrollable screen with clear sections; don't over-fragment into
  a multi-step wizard.
- Text over background images must stay legible — the scrim baked into each style
  preset handles this; reflect that in the preview.
- Note: iOS 18+ lets users tint home-screen widgets, which can desaturate a photo
  background. Not something the user configures here, but the design shouldn't rely
  on subtle color that breaks when tinted.
- The real app is React Native / Expo, so favor a design that's implementable there
  (avoid effects that are hard to reproduce natively).

## Deliverable
An interactive visual mockup of this configuration screen, with the live widget
preview reacting to the settings. Offer 1–2 layout directions if you see a strong
alternative, but lead with your recommended one.
```
