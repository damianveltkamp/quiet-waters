# RevenueCat + PostHog setup

## 1. Keys (`app.json` → `expo.extra`)
- `revenueCatIosKey`: currently a **Test Store key** (`test_…`) — good for testing purchases in dev/Expo Go/sandbox WITHOUT App Store Connect products. **Before the real App Store build**, replace it with the **Apple App Store public SDK key** (`appl_…`) from RevenueCat → Project → API keys.
- `posthogKey`: PostHog **US** → Project settings → **Project API key** (`phc_…`).
- `posthogHost`: `https://us.i.posthog.com` (US region — already set).

## 2. RevenueCat
- Create entitlement **`pro`**.
- Create two products in App Store Connect (yearly + weekly auto-renewing subs)
  with a 3-day free trial intro offer; attach both to the `pro` entitlement.
- Create the **current Offering** with an **Annual** package and a **Weekly** package.
- Integrations → **PostHog**: enable, host `https://us.i.posthog.com`, paste the
  PostHog project key. This forwards trial-start/conversion events to PostHog.

## 3. PostHog experiments
Create a feature flag per key in `src/lib/experiments.ts`. Flag key MUST equal
the registry key, and variant keys MUST match. For each flag, set the **release
condition rollout to 100%** (who's enrolled) — this is separate from the
**variant split** (which arm they get). "Out of rollout bound" in the logs means
the release rollout is below 100%.

- **`paywall-content`** → variants `a`, `b`. Drives the whole paywall's copy via
  a **JSON payload per variant** (see below). Prices are NOT in the payload —
  they come from the RevenueCat offering.
- **`aspiration-headline`** → variants `control`, `v2` (simple variant, no payload).

Goal metric: the RevenueCat "trial started" / "subscription" events (matched by
the aligned `distinct_id`).

### paywall-content payload shape
Attach this JSON to each variant (edit the copy per arm). Any missing/invalid
field falls back to the baked-in default in `experiments.ts`, so a partial
payload is safe. `icon` must be one of `lock` | `bell` | `sparkle`.

```json
{
  "title": "We'll remind you before your trial ends.",
  "timeline": [
    { "icon": "lock",    "title": "Today",     "body": "Unlock full access…" },
    { "icon": "bell",    "title": "In 2 days", "body": "We'll send a reminder…" },
    { "icon": "sparkle", "title": "In 3 days", "body": "Your subscription begins…" }
  ],
  "yearlyBadge": "SAVE 92%",
  "cta": "Try for FREE"
}
```

## 4. Adding a new experiment
1. Add one line to `EXPERIMENTS` in `src/lib/experiments.ts`.
2. In the screen, either:
   - simple variant → `const v = useVariant('your-key')` and branch on `v`; or
   - remote content → add a default payload + a `use…Content()` hook (see
     `usePaywallContent.ts`) that validates the payload over a default.
3. Create the matching flag in PostHog (release rollout 100%). Exposure is
   auto-tracked via `$feature_flag_called`.
