# Quiet Waters — Onboarding Flow (Design Spec)

**Date:** 2026-07-05
**Milestone:** #1 — Foundation + Onboarding
**Status:** Approved design, ready for implementation planning

---

## 1. Overview

Quiet Waters is an **iPhone-only** app for Christians that turns idle phone time into
time with Scripture — via custom wallpapers, Home/Lock-screen widgets, and Live
Activities. This spec covers the **first milestone only**: the project foundation and
the complete 12-screen onboarding flow.

### In scope
- New Expo (React Native + TypeScript) project scaffold under `mobile/`
- Design system (colors, typography, spacing) from the brand kit
- All 12 onboarding screens, matched to the mockups
- Haptic feedback on all CTAs + the tap-and-hold prayer button
- Calculated "hours" numbers driven by the user's screen-3 answer
- Notification permission request (screen 9)
- On-device persistence of an "onboarding complete" flag

### Out of scope (later milestones)
- **RevenueCat / real purchases** — paywall screens (10–12) are visual only; the final
  CTA completes onboarding without charging
- **Wallpaper creator** (screen 7) — rendered as a dashed placeholder box
- **App home screenshot** (screen 10) — rendered as a dashed placeholder box
- **Widgets & Live Activities** — the native Swift island (`expo-apple-targets`)
- **Main app** — home, verse library, settings (screen 12 routes to a placeholder home)
- **Scheduling** daily notifications (we only *request* permission here)

### Product constraints (known iOS realities)
- iOS **cannot** auto-apply a wallpaper; a future creator will save to Photos and the
  user applies it manually.
- Widgets/Live Activities are native-only; deferred to a later milestone but the stack
  (Expo dev builds, not Expo Go) is chosen to support them.

---

## 2. Stack & Tooling

- **Expo** (latest SDK), **TypeScript**, **Expo Router** (file-based routing; same mental
  model as Next.js `app/`).
- **Dev builds** via `expo run:ios` (not Expo Go), to stay compatible with future native
  targets.
- On-device only: no backend, no accounts, no cloud sync.

### Libraries
| Need | Library |
|---|---|
| Fonts (Cormorant Garamond, Hanken Grotesk) | `@expo-google-fonts/cormorant-garamond`, `@expo-google-fonts/hanken-grotesk`, `expo-font` |
| Haptics | `expo-haptics` |
| Animations (ring, transitions) | `react-native-reanimated` |
| Gradients (dark screens) | `expo-linear-gradient` |
| Vector shapes / icons | `react-native-svg` |
| Notification permission | `expo-notifications` |
| State | `zustand` |
| Persist completion flag | `@react-native-async-storage/async-storage` |
| Splash while fonts load | `expo-splash-screen` |

---

## 3. Project Structure

Expo app is a new sibling of the existing `landingpage/`; nothing existing is touched.

```
quiet-waters/
├─ landingpage/                 (existing Next.js — untouched)
├─ design/                      (existing brand kit + assets)
├─ onboarding.md                (existing content spec)
├─ docs/superpowers/specs/      (this spec)
└─ mobile/                      (NEW — the Expo app)
   ├─ app/
   │  ├─ _layout.tsx            # root: font loading + splash gate
   │  ├─ index.tsx              # entry: route to onboarding or placeholder home
   │  ├─ home.tsx               # placeholder home (post-onboarding)
   │  └─ onboarding/
   │     ├─ _layout.tsx         # forward-only stack, no back button
   │     ├─ 01-aspiration.tsx
   │     ├─ 02-problem.tsx
   │     ├─ 03-question.tsx
   │     ├─ 04-stakes.tsx
   │     ├─ 05-promise.tsx
   │     ├─ 06-vow.tsx
   │     ├─ 07-wow.tsx
   │     ├─ 08-land.tsx
   │     ├─ 09-permissions.tsx
   │     ├─ 10-paywall-intro.tsx
   │     ├─ 11-paywall-reminder.tsx
   │     └─ 12-paywall-plans.tsx
   ├─ src/
   │  ├─ theme/                 # colors.ts, typography.ts, spacing.ts, index.ts
   │  ├─ components/            # shared components (see §5)
   │  ├─ store/                 # onboarding.ts (Zustand)
   │  └─ lib/                   # calculations.ts, haptics.ts, storage.ts
   └─ assets/
      ├─ fonts/
      └─ images/                # logo/symbol PNGs copied from design/assets
```

---

## 4. Design System (`src/theme/`)

### Colors (from brand kit)
- Primary `#1C3344`, deep `#2C4456`, mid `#5E8298`, soft `#8AA2B0`
- Accent light-blue `#9CC0D4`, pale `#C9DCE5`, `#E2ECEF`
- Surfaces off-white `#F4F8F9`, `#F2F6F7`, white `#FFFFFF`
- Muted text `#4C5C67`, `#7C8C97`
- Success green (screen-8 "ready" pill) — sampled from mockup
- Light gradient (screens 1,3,4,5,7,8,9,10,11,12) and dark gradient (screens 2,6) pairs

### Typography
- **Cormorant Garamond** (serif): headlines, big numbers, italic quotes
- **Hanken Grotesk** (sans): eyebrows, body, buttons, captions
- Variants: `display` (big numbers), `title`, `eyebrow` (uppercase + letter-spacing),
  `body`, `quote` (serif italic), `caption`

### Spacing
- 4-pt based scale (`xs 4, sm 8, md 16, lg 24, xl 32, 2xl 48`).

---

## 5. Shared Components (`src/components/`)

- **`<Screen variant="light|dark">`** — safe-area wrapper + `expo-linear-gradient`
  background per variant.
- **`<ThemedText variant=…>`** — single text component exposing all typography variants.
- **`<Eyebrow>`** — uppercase, letter-spaced kicker.
- **`<CTAButton variant="primary|secondary" onPress>`** — dark pill (primary) / light-blue
  pill (secondary, screen 2). **Fires `Haptics.impactAsync(Medium)` on every press**,
  centralizing CTA haptics.
- **`<Divider>`** — short centered rule under headlines.
- **`<PrayerButton onComplete>`** — screen-6 tap-and-hold ring (see §7).
- **`<LockScreenPreview>`** — dark phone-lock mockup (clock, cross, verse); reused on
  screens 5 & 8.
- **`<NotificationPreview>`** — screen-9 notification card.
- **`<RadioOption selected onPress>`** — screen-3 selectable rows.
- **`<PlanCard>`** — screen-12 subscription cards (with "SAVE 92%" badge).
- **`<TimelineStep>`** — screen-12 Today / 2 days / 3 days rows.
- **`<ScreenTimeCard>` + `<BarChart>`** — screen-2 card + bar chart (plain Views, no chart lib).
- **`<PlaceholderBox label sublabel>`** — dashed box for screens 7 & 10.

Each screen file composes these; screens hold layout + copy, components hold reusable UI.

---

## 6. Screen-by-Screen

Copy and layout match the mockups in
`2nd-brain/saas/christian-apps/design/onboarding/`. All CTAs use `<CTAButton>`.

| # | Beat | Bg | Key elements | CTA → |
|---|---|---|---|---|
| 1 | Aspiration | light | cross symbol, eyebrow "A PLACE TO BEGIN", "You want to feel closer to God." | Begin your journey → 2 |
| 2 | Problem | **dark** | eyebrow "THE MODERN DAY", `<ScreenTimeCard>` "4h+" + `<BarChart>`, italic quote | I want that *(secondary)* → 3 |
| 3 | Question | light | "How much time…", 6 `<RadioOption>` (`4-5` preselected), stores answer | Continue → 4 |
| 4 | Stakes | light | eyebrow, **calculated** `hoursPerYear` (e.g. 1,642), "X full days", italic | Show me how → 5 |
| 5 | Promise | light | eyebrow "THE PROMISE", `<LockScreenPreview>`, feature tags (Wallpapers/Widgets/Live Activities) | See how it works → 6 |
| 6 | Vow | **dark** | eyebrow "A QUIET VOW", calculated `vowHours` (e.g. 164), `<PrayerButton>` | *hold completes → auto-advance → 7* |
| 7 | WOW | light | eyebrow, `<PlaceholderBox>` "Wallpaper Creator" | Make it mine → 8 |
| 8 | Land & widen | light | green "YOUR FIRST BACKGROUND IS READY" pill, `<LockScreenPreview>`, italic | Continue → 9 |
| 9 | Permissions | light | eyebrow "ONE LAST STEP", `<NotificationPreview>`, requests notif permission | Get daily scriptures → 10 |
| 10 | Paywall intro | light | "We want you to try…", `<PlaceholderBox>` "App Home Screen" | Continue → 11 |
| 11 | Paywall reminder | light | bell icon, "We'll remind you…" | Try for $0.00 → 12 |
| 12 | Paywall plans | light | `<TimelineStep>` ×3, 2 `<PlanCard>` (Yearly preselected), no purchase | Try for FREE → complete → home |

**Screen-3 options (from mockup, authoritative):** `1-3`, `3-4`, `4-5`, `5-6`, `6-7`, `7+`.
This overrides the duplicated/gapped list in `onboarding.md` (`1-3, 3-4, 4-5, 4-5, 5-7, 7+`).

**Screen 12 plans (display only):** Yearly `$59.99/yr` ("Only $1.15/week", "SAVE 92%",
preselected) and Weekly `$4.99/week`. Selecting a plan is visual; the CTA completes
onboarding without a purchase.

---

## 7. Logic

### Calculations (`src/lib/calculations.ts` — pure, unit-tested)
Midpoints per bucket: `1-3→2`, `3-4→3.5`, `4-5→4.5`, `5-6→5.5`, `6-7→6.5`, `7+→7.5`.
- `hoursPerYear = round(midpoint × 365)` → screen 4 big number
- `fullDays     = round(hoursPerYear / 24)` → screen 4 "X full days"
- `vowHours     = round(hoursPerYear / 10)` → screen 6 "X hours"

Rendered with locale grouping (`1,642`). Verified against mockups: `4-5` → 4.5 × 365 =
**1,642** → /24 = **68** days → /10 = **164** hours. All three mockup numbers agree.

### State (`src/store/onboarding.ts` — Zustand)
- Holds the selected hours bucket (in-memory during the flow).
- Screens 4 and 6 read it and derive their numbers via `calculations.ts`.
- Default selection matches the mockup preselection (`4-5`).

### Haptics (`src/lib/haptics.ts`)
- **CTA taps:** `Haptics.impactAsync(Medium)` on every `<CTAButton>` press (centralized).
- **Prayer button (screen 6):** on press-in, start ring fill (Reanimated, ~3s) **and** a
  repeating **1000ms haptic pulse** (`impactAsync`). On release before completion → clear
  interval, reset ring. On completion → `notificationAsync(Success)`, clear interval,
  auto-advance to screen 7. Interval cleared on unmount.

### Navigation & persistence
- Forward-only Expo Router stack; **no back button** (matches mockups). Advance via
  `router.push`.
- Screen 12 CTA → set `onboardingComplete = true` in AsyncStorage → route to placeholder
  `home`.
- `app/index.tsx` on launch: flag set → skip onboarding; else → screen 1.

---

## 8. Error Handling & Edge Cases

- **Fonts:** `expo-splash-screen` held until fonts load; render only when ready (no flash).
- **Notification denial:** granted or denied, always advance (never blocks).
- **AsyncStorage read failure:** default to showing onboarding (fail-safe).
- **Hold interrupted / app backgrounded mid-hold:** interval cleared, ring resets.

---

## 9. Testing

- **Unit (Jest + React Native Testing Library):**
  - `calculations.ts` — all 6 buckets → expected `hoursPerYear` / `fullDays` / `vowHours`
  - Zustand store transitions (select bucket → derived values)
  - `<RadioOption>` selection behavior
  - `<CTAButton>` fires haptic on press (mock `expo-haptics`)
- **Component smoke tests:** each of the 12 screens renders without crashing.
- Animations and real device haptics are not unit-tested; the logic around them is
  isolated so it remains testable.

---

## 10. Open Items / Assumptions

- Placeholder `home` screen is a minimal stub; real home is a later milestone.
- Verse text shown inside previews (screens 5, 8, 9) uses bundled public-domain wording
  (e.g. Psalm 23:2 "He leads me beside quiet waters"); full bundled verse dataset +
  translation choice (KJV vs WEB) is finalized in the Wallpaper Creator milestone.
- Success-green and exact gradient stops are sampled from the mockups during build.
