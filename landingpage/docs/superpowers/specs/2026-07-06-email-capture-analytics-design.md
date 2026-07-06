# Email capture, wallpaper delivery & campaign analytics — Design

**Date:** 2026-07-06
**Status:** Approved (design)
**Component:** Quiet Waters landing page (`landingpage/`, Next.js 16 App Router)

## Goal

Turn the existing landing page's placeholder signup form into a working
lead-capture flow that:

1. Collects a visitor's email address.
2. Delivers a free gift (iPhone wallpaper) to that email.
3. Tracks page visits and signups so we can tell whether the social media
   campaign is driving traffic and conversions.

## Decisions

| Decision | Choice | Rationale |
|---|---|---|
| Email platform | **Kit (ConvertKit)** | Most generous free tier: 10,000 subscribers, unlimited broadcasts. The free-plan 1-automation limit does not bite (we use a Form incentive email, not an automation). Creator Network cross-promotion never shows because we use our own form + Kit's API, not Kit's hosted forms. |
| Wallpaper delivery | **Kit Form incentive email** | Kit hosts the wallpaper file and sends it in the incentive email after confirmation. No automation consumed. Keeps our code minimal and offloads deliverability/unsubscribe compliance. |
| Opt-in | **Double opt-in** | Better deliverability and list quality, GDPR-friendly, filters typo/fake emails. Acceptable one-click friction for a growing campaign list. |
| Analytics | **PostHog** | Already used by the Quiet Waters mobile app. Unifies the funnel (social click → signup → eventual app install), auto-captures UTM params and referrers, supports the signup conversion event and funnel breakdowns. |

## Architecture

```
Visitor ──▶ Landing page ──▶ PostHog ($pageview + UTM captured)
                │
        submits email
                ▼
      POST /api/subscribe  (server-side route, holds the secret Kit key)
                │
                ▼
        Kit API (adds subscriber to Form, double opt-in ON)
                │
     Kit sends confirmation email ──▶ user clicks ──▶ Kit sends
     incentive email with the wallpaper download
```

The form talks only to our own API route, never to Kit directly, so the Kit
API key stays server-side. Kit owns the email sending and the wallpaper file.

## Components

### Kit account + Form (external configuration)
- Create a Kit account.
- Prepare the wallpaper image (iPhone lock-screen dimensions).
- Create one **Form** with:
  - Double opt-in enabled.
  - An **incentive email** whose content includes the wallpaper download
    (file uploaded to Kit).
- Record the resulting `FORM_ID` and generate an API key.
- No automation is used, so this stays within the free plan.

### `app/api/subscribe/route.ts` (new)
- Next.js 16 App Router **Route Handler** (POST).
- Reads the raw request body `{ email }`.
- Re-validates the email server-side (same regex contract as the client).
- Calls the Kit API to subscribe the email to `KIT_FORM_ID`, passing the
  request referrer URL (including UTM params) so Kit records the source.
- Returns `{ ok: true }` on success, or a generic error JSON + appropriate
  status on failure. Never leaks the API key or raw Kit error details to the
  client (logs those server-side).

**Kit API version — RESOLVED (2026-07-06): use v4.** The account's API key is a
v4 key (`kit_…`, sent via the `X-Kit-Api-Key` header); the legacy v3 key is a
separate credential we are deliberately not using, since v4 is the current,
supported API. Kit's own developer docs confirm the double-opt-in path works
in v4: *"Adding subscribers to double opt-in forms will trigger sending an
Incentive Email. Subscribers already added to the specified form will not
receive the Incentive Email again. The subscribers being added to the form
must already exist."* The incentive email is simultaneously the confirmation
(double opt-in) and the lead-magnet (wallpaper) delivery.

Correct v4 flow (two calls, base `https://api.kit.com/v4`, header
`X-Kit-Api-Key`):
1. **Upsert subscriber** — `POST /v4/subscribers` with `{ email_address }`.
   Behaves as an upsert (creates if new, updates if existing); returns
   `{ subscriber: { id } }`.
2. **Add to the double-opt-in form** — `POST /v4/forms/{KIT_FORM_ID}/subscribers/{id}`
   with `{ referrer }` (the referrer carries UTM params). This triggers the
   incentive/confirmation email. Re-subscribing an existing form member does
   not re-send it (idempotent for the user).

`KIT_API_KEY` now holds the v4 key; `KIT_FORM_ID` is the numeric id of the
lead-magnet Form (which must have double opt-in enabled and an incentive email
configured with the wallpaper). Note: Kit's incentive email uploads PDFs
directly; for an image wallpaper, host the file and link it (or verify image
upload) when configuring the Form.

### `app/components/SignupForm.tsx` (modified)
- Replace the `localStorage` placeholder (current lines ~20–30) with a
  `fetch('/api/subscribe', { method: 'POST', body: JSON.stringify({ email }) })`.
- Keep the existing inline email validation and the existing success screen
  ("You're in. Welcome.").
- Add a **network/API error state**: on non-ok response or thrown fetch, show
  a gentle retry message and leave the form usable.
- On success, fire `posthog.capture('signup_submitted')`.
- Add a one-line consent/privacy microcopy under the form
  ("We'll send occasional emails. Unsubscribe anytime.").
- Add a submitting/pending state to prevent double submits.

### `app/providers.tsx` (new) + `app/layout.tsx` (modified)
- `providers.tsx` is a `"use client"` component that initializes `posthog-js`
  with `NEXT_PUBLIC_POSTHOG_KEY` / `NEXT_PUBLIC_POSTHOG_HOST` and enables
  automatic pageview capture.
- `layout.tsx` wraps `children` in the provider.

### Environment variables
| Name | Scope | Purpose |
|---|---|---|
| `KIT_API_KEY` | server only | Authenticate to Kit API |
| `KIT_FORM_ID` | server only | Target Form for subscription |
| `NEXT_PUBLIC_POSTHOG_KEY` | client | PostHog project key (safe to expose) |
| `NEXT_PUBLIC_POSTHOG_HOST` | client | PostHog ingestion host |

Stored in `.env.local` for development and in Vercel project settings for
preview/production.

## Data flow & campaign tracking

1. Visitor lands → PostHog captures `$pageview` with `utm_source`,
   `utm_medium`, `utm_campaign`, and referrer.
2. Visitor submits email → client validates → `POST /api/subscribe`.
3. Server validates → subscribes email to the Kit Form.
4. Kit sends the confirmation email → user clicks → Kit sends the incentive
   email with the wallpaper download.
5. Client shows the success screen and fires `signup_submitted`.

**Campaign measurement:** Social links carry UTM tags
(e.g. `?utm_source=instagram&utm_campaign=launch`). In PostHog, build a funnel
`$pageview → signup_submitted` broken down by `utm_source` to compare which
channel drives traffic and which converts.

## Error handling

- **Client:** invalid email → existing inline validation message. Network or
  Kit failure → gentle retry message; the form stays usable; no lost state.
- **Server:** re-validate the email; on Kit non-2xx, log the details
  server-side and return a generic error (do not leak the key or raw Kit
  response). Duplicate emails are handled gracefully by Kit (safe
  re-subscribe).

## Testing

- **Unit:** email validator; API route with a mocked Kit client covering
  success, Kit-error, and invalid-input cases.
- **Manual end-to-end (dev):** real submit → confirmation email arrives →
  wallpaper download works; verify `$pageview` and `signup_submitted` appear
  in PostHog; verify a UTM test link attributes the correct source.

## Out of scope (YAGNI)

- Multiple drip sequences / newsletters (single incentive email only for now).
- Self-hosted email storage or a custom database (Kit owns the list).
- A/B testing of the landing page (separate future effort).
- Cookie-consent banner UI (PostHog configured privacy-friendly; revisit if
  legal requires an explicit banner).
