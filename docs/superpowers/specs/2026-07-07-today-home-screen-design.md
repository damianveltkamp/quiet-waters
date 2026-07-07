# Today Home Screen + Tab Shell — Design

**Date:** 2026-07-07
**Status:** Approved for planning

## Goal

Build the first screen users land on after the paywall: the **Today** home screen, plus the
three-tab navigation shell (**Today / Create / You**) that the design's bottom bar implies. This
replaces the current placeholder `/home` ("coming soon") screen.

Design reference: `design/homepage/Screenshot 2026-07-07 at 07.07.47.png`.

## Scope

In scope:
- Three-tab navigation shell (Today / Create / You) via Expo Router's `Tabs`.
- The Today screen, matching the design.
- A local verse-of-the-day content source (seeded with one verse for now).
- Share functionality for the verse (native share sheet).
- Placeholder screens for Create, You, and Prayer.

Out of scope (deferred):
- The **Save** button on the verse card — dropped for this pass.
- Real wallpaper creation (Create tab is a placeholder).
- Real prayer experience (Prayer screen is a placeholder).
- The full verse dataset — we seed one verse; sourcing the complete set is a later task.
- Any backend / remote fetching.

## Navigation structure

Expo Router tab group. No new navigation dependency (uses `expo-router`'s `Tabs`).

Key routing fact: an Expo Router group folder like `(tabs)` does **not** change URLs. A screen at
`app/(tabs)/home.tsx` still resolves to `/home`. Therefore the existing root redirect in
`app/index.tsx` (→ `/home`) and its tests (`index.test.tsx`) remain valid and untouched.

```
app/
  index.tsx            unchanged; still redirects to /home
  _layout.tsx          unchanged root Stack (auto-discovers the group + prayer)
  (tabs)/
    _layout.tsx        NEW: <Tabs> with 3 tabs, custom styling
    home.tsx           Today screen (replaces app/home.tsx)   -> /home
    create.tsx         NEW placeholder                        -> /create
    you.tsx            NEW placeholder                        -> /you
  prayer.tsx           NEW placeholder, pushed over the tabs  -> /prayer
```

- `app/home.tsx` and `app/__tests__/home.test.tsx` are removed; the Today screen and its test take
  their place inside `(tabs)`.
- **Prayer** is a stack route pushed *over* the tab bar (a focused activity you enter and exit via a
  back affordance), not a fourth tab. This keeps the design's 3-tab bar exactly as drawn.

### Tab bar styling
- Tabs: **Today / Create / You**.
- Icons: SF Symbols via `expo-symbols` — `house` (Today), a wallpaper/create glyph such as
  `photo` or `sparkles` (Create), `person` (You). Final glyph choice made during implementation to
  best match the design.
- Active tint `colors.primary`; inactive `colors.textFaint`; light bar background consistent with
  `colors.surface` / white. Headers hidden (screens render their own).

## Today screen (`app/(tabs)/home.tsx`)

Uses the existing `Screen variant="light"`, `Eyebrow`, and `ThemedText` primitives. Top to bottom:

1. **Header**
   - Eyebrow: formatted date, e.g. `TUESDAY · 5 JULY`, derived from the device date.
   - Title (`ThemedText variant="title"`): **time-based greeting** — "Good morning" (before ~12:00),
     "Good afternoon" (12:00–~17:00), "Good evening" (after ~17:00).

2. **Verse of the Day**
   - `Eyebrow`: "Verse of the day".
   - `VerseCard` (new component): blue gradient card. Renders the quote in serif
     (`ThemedText variant="quote"`), the reference in `eyebrow` styling, and a **single Share** pill.
   - Share pill uses `expo-glass-effect` for the frosted look and the `square.and.arrow.up` SF Symbol,
     labelled "Share".

3. **Make it yours**
   - `Eyebrow`: "Make it yours".
   - `WallpaperPromoCard` (new component): dark card with title "Create a wallpaper", a subtitle
     ("Set today's verse on your lock screen in seconds."), a small lock-screen preview thumbnail,
     and a "+" affordance. The whole card is pressable and navigates to the **Create** tab.

4. **Prayer action**
   - `ActionRow` (new, reusable component): white rounded row with a leading icon tile (a cross /
     `cross` SF Symbol), title "Prayer", subtitle "A moment to pause and pray", and a trailing
     chevron. Pressing navigates to `/prayer`.

## Content & Share

- **`src/content/verses.ts`**: a typed `Verse` shape (`text`, `reference`) and a `verses` array
  seeded with the one Psalm 118:24 verse from the design:
  > "This is the day the Lord has made; let us rejoice and be glad in it." — Psalm 118:24
- **`getVerseOfTheDay(date: Date): Verse`**: deterministic selection by day-of-year modulo
  `verses.length`. With one verse it always returns that verse; the logic is ready to scale when the
  full dataset lands.
- **Share**: React Native's built-in `Share.share({ message })` (native share sheet, no new
  dependency), sharing verse text + reference. Wrapped with the existing `tapFeedback()` haptic.

## New components

Each is a small, single-purpose, independently testable presentational component in `src/components`,
exported from `src/components/index.ts`, following existing conventions (theme tokens, `ThemedText`).

- `VerseCard` — props: `verse`, `reference`, `onShare`. Renders the gradient verse card + Share pill.
- `WallpaperPromoCard` — props: `onPress` (and optionally preview content). Renders the dark promo card.
- `ActionRow` — props: `icon`, `title`, `subtitle`, `onPress`. Reusable list-style row with chevron.

## Testing

- `getVerseOfTheDay` — deterministic result per date; returns the seeded verse.
- `VerseCard`, `WallpaperPromoCard`, `ActionRow` — render expected text and invoke their press/share
  callbacks.
- Today screen — renders the greeting and the verse text.
- `index.test.tsx` stays green (unchanged; `/home` route preserved).

## Risks / notes

- `expo-symbols` and `expo-glass-effect` are already installed; if the glass pill proves fiddly in
  practice, fall back to a solid/translucent `colors`-based pill — visual only, no scope change.
- The tab-bar and Prayer screen are placeholders by design; they exist to make navigation work
  end-to-end, not to be finished features.
