# Design: RevenueCat purchases + PostHog per-screen A/B testing

Date: 2026-07-06
Status: Approved for planning

## Goal

Turn the hand-built 3-screen paywall (onboarding screens 10–12) into a real,
purchasing paywall backed by RevenueCat, and add a per-screen A/B testing
mechanism (via PostHog feature flags) that can vary any onboarding screen and
the paywall independently — while measuring which variants convert.

## Locked decisions

- **Purchases:** RevenueCat (`react-native-purchases`). Keep the existing
  hand-built screens; products/prices come from a RevenueCat **Offering** (live
  from the App Store), not hardcoded values.
- **Experiments:** PostHog (`posthog-react-native`) assigns per-screen variants
  via feature flags and measures conversion. Data region: **EU**
  (`https://eu.i.posthog.com`).
- **Access model:** **Hard paywall.** The `pro` entitlement gates entry to
  `/home`. No entitlement ⇒ user cannot reach home; they land on the paywall.
- **Build:** native via `expo run:ios` (an `ios/` project already exists). Both
  SDKs autolink / ship Expo config plugins. Expo SDK 57 — consult
  https://docs.expo.dev/versions/v57.0.0/ before writing native config.
- **Keys/products:** built against clearly-marked **placeholders** — nothing
  calls live services until real keys are added. Entitlement id: `pro`.
- **A/B coverage now:** build the mechanism; apply it to the **paywall** and
  **one onboarding screen** (screen 01, The Aspiration, headline) as the
  documented reference pattern. Remaining screens are wired later by the user.

## Architecture

### New / changed modules

| File | Responsibility | Public surface |
|---|---|---|
| `src/lib/revenuecat.ts` | Wrap the Purchases SDK; the only place that imports `react-native-purchases` | `initPurchases(appUserId?)`, `getCurrentOffering()`, `purchasePackage(pkg)`, `getCustomerInfo()`, `hasPro(customerInfo)`, `restore()`, `PRO_ENTITLEMENT` |
| `src/lib/experiments.ts` | Typed registry of experiments (flag key → variants + **default**) | `EXPERIMENTS`, `ExperimentKey`, `VariantOf<K>` |
| `src/hooks/useVariant.ts` | Read a PostHog flag; **always** return a valid variant (never blank/undefined while flags load) | `useVariant(key)` |
| `src/lib/analytics.ts` | Thin typed capture helpers over PostHog (paywall/purchase events) | `usePaywallAnalytics()` or `capture()` wrappers |
| `src/providers/AppProviders.tsx` | Mount `PostHogProvider`, kick off RevenueCat init, align RC ↔ PostHog identity | wraps the root `Stack` |
| `src/lib/config.ts` | Read publishable keys/host from `expo-constants` `extra` | `REVENUECAT_IOS_KEY`, `POSTHOG_KEY`, `POSTHOG_HOST` |
| `src/store/onboarding.ts` (edit) | Hold the `answers/bucket`; unchanged responsibility, no experiment logic here | (as today) |

Consumers (screens, tests) depend only on these interfaces — never directly on
`Purchases` or the `posthog` client. This keeps screens readable and lets tests
mock at one seam.

### Startup & gating

Root layout (`src/app/_layout.tsx`) wraps everything in `AppProviders`.
The entry gate (`src/app/index.tsx`) runs an async bootstrap on launch:

1. `initPurchases()` (anonymous `appUserID: null`; SDK generates an id).
2. Align identity: set PostHog `distinct_id` to the RevenueCat `appUserID` (via
   `posthog.identify(appUserID)`), so purchase events and flag exposures map to
   the same person. No user login exists.
3. `getCustomerInfo()` → route:
   - `hasPro(customerInfo)` true → `/home`
   - else `isOnboardingComplete()` true → **paywall intro** (`/onboarding/10-paywall-intro`)
   - else → onboarding start (`/onboarding/01-aspiration`)

A minimal loading state is shown until the bootstrap resolves. Failures fall
back to showing onboarding (fail-open into the funnel, consistent with the
existing `isOnboardingComplete` fail-safe).

### Paywall wiring (screens 10–12)

- Screen 12 (`12-paywall-plans.tsx`) loads `getCurrentOffering()` and maps its
  packages (annual + weekly) into the existing `PlanCard`s using RevenueCat's
  **localized** price strings and any intro/free-trial info. Yearly stays
  default-selected with its savings badge (badge % can later come from a flag).
- CTA calls `purchasePackage(selected)`. On success (entitlement active) →
  `setOnboardingComplete()` → `router.replace('/home')`. On `userCancelled`,
  stay on screen silently. On other errors, show a non-blocking message.
- Add a **Restore Purchases** control (App Store requirement) that calls
  `restore()` and, if it yields `pro`, routes to `/home`.
- Add **Terms of Use** and **Privacy Policy** links (App Store requirement for
  auto-renewing subscriptions). Placeholder URLs for now.
- Screens 10 & 11 keep their current content; screen 11's "Try for $0.00" CTA
  advances to screen 12 (no purchase there).

### Per-screen A/B mechanism

`EXPERIMENTS` declares each test once:

```ts
export const EXPERIMENTS = {
  'paywall-cta':          { variants: ['try_free', 'start_trial'] as const, default: 'try_free' },
  'aspiration-headline':  { variants: ['control', 'v2']          as const, default: 'control' },
} as const;
```

`useVariant('paywall-cta')` returns the assigned variant, or the declared
`default` when the flag is missing/unresolved (first launch before flags load,
offline, or flag not created in PostHog yet). PostHog auto-fires the
`$feature_flag_called` exposure event when a flag is read, so exposure is
tracked without extra code.

**Bootstrap defaults:** the PostHog client is initialized with `bootstrap`
feature-flag values seeded from `EXPERIMENTS` defaults, so the very first render
is deterministic and never flickers.

Adding a new test later = one line in `EXPERIMENTS` + a branch in the screen +
creating the matching flag/experiment in PostHog. No other code changes.

Wired now:
- **Paywall:** `paywall-cta` controls the screen-12 CTA copy (`Try for FREE` vs
  `Start my free trial`).
- **Reference onboarding screen:** `aspiration-headline` swaps screen-01's
  headline between control and a variant.

### Tying purchases to experiments (dashboard config — documented, not code)

1. RevenueCat dashboard → **Integrations → PostHog**: enable, point at the EU
   host, provide the PostHog project API key. This forwards subscription
   lifecycle events (trial start, conversion, renewal, cancellation) to PostHog.
2. RevenueCat is configured to send events keyed by the same `distinct_id` we
   aligned in startup, so PostHog experiments can use "trial started" /
   "subscription converted" as goal metrics.
3. In PostHog, each `EXPERIMENTS` entry maps to a feature flag (for simple
   splits) or an Experiment (for stats + goal metrics).

### Config & secrets

- `app.json` gets an `expo.extra` block with **publishable** keys only
  (RevenueCat public iOS SDK key `appl_…`, PostHog project key `phc_…`,
  PostHog host). These are client-safe by design.
- `src/lib/config.ts` reads them via `expo-constants` (`Constants.expoConfig.extra`).
- Config plugins added to `app.json` `plugins` as required by each SDK for
  SDK 57 (verify exact plugin names/props against the Expo 57 docs at build time).

## Testing (TDD)

Mock `react-native-purchases` and `posthog-react-native` in `jest.setup.js`.
New/updated tests:

- `revenuecat.test.ts`: `hasPro` true/false by entitlement; `purchasePackage`
  success path returns updated customerInfo; `userCancelled` is swallowed;
  `restore` surfaces entitlement.
- `useVariant.test.tsx`: returns `default` when flag absent/undefined; returns
  the flag's value when present; never returns a value outside the declared
  variants.
- `screens-10-12.test.tsx` (extend): screen 12 renders offering-derived prices
  (mocked), CTA triggers purchase, success routes to `/home`, Restore present.
- Routing gate test: entitlement → home; completed-no-entitlement → paywall
  intro; fresh → onboarding start.
- `01-aspiration` test: renders control by default; renders v2 headline when the
  flag returns `v2`.

## Out of scope (YAGNI)

- Android wiring (iPhone-only app).
- RevenueCat prebuilt Paywalls UI (`react-native-purchases-ui`) — custom UI kept.
- A/B-wiring every onboarding screen — mechanism only + two references.
- User accounts / login (purchases stay anonymous, restore covers reinstalls).
- Server-side flag evaluation or a custom experimentation backend.

## Risks / notes

- First-launch flag timing: mitigated by bootstrap defaults + `useVariant`
  fallback, so screens always render a valid variant.
- Hard paywall means a broken RevenueCat init could lock users out of home; the
  gate fails **open into onboarding**, and home stays entitlement-gated — a
  misconfig degrades to "everyone sees the paywall," never a crash-loop.
- App Store review: auto-renewing subs require visible price, trial terms,
  Terms/Privacy links, and Restore — all included above.
