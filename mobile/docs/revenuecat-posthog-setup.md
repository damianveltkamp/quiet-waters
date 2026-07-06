# RevenueCat + PostHog setup

## 1. Keys (replace placeholders in `app.json` → `expo.extra`)
- `revenueCatIosKey`: RevenueCat → Project → API keys → **Apple public SDK key** (`appl_…`).
- `posthogKey`: PostHog (EU) → Project settings → **Project API key** (`phc_…`).
- `posthogHost`: `https://eu.i.posthog.com` (already set).

## 2. RevenueCat
- Create entitlement **`pro`**.
- Create two products in App Store Connect (yearly + weekly auto-renewing subs)
  with a 3-day free trial intro offer; attach both to the `pro` entitlement.
- Create the **current Offering** with an **Annual** package and a **Weekly** package.
- Integrations → **PostHog**: enable, host `https://eu.i.posthog.com`, paste the
  PostHog project key. This forwards trial-start/conversion events to PostHog.

## 3. PostHog experiments
- Create a feature flag / experiment per key in `src/lib/experiments.ts`:
  - `paywall-cta` → variants `try_free`, `start_trial`
  - `aspiration-headline` → variants `control`, `v2`
- Flag key MUST equal the registry key. Variant keys MUST match the registry.
- Goal metric: the RevenueCat "trial started" / "subscription" events (matched
  by the aligned `distinct_id`).

## 4. Adding a new per-screen test
1. Add one line to `EXPERIMENTS` in `src/lib/experiments.ts`.
2. In the screen: `const v = useVariant('your-key')` and branch on `v`.
3. Create the matching flag/experiment in PostHog. Done — exposure is auto-tracked.
