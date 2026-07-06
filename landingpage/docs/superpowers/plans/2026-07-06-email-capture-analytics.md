# Email Capture, Wallpaper Delivery & Campaign Analytics — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Wire the landing page's signup form to Kit (ConvertKit) so visitors get a free iPhone wallpaper by email (double opt-in), and add PostHog analytics so we can measure whether the social campaign drives traffic and signups.

**Architecture:** The client form POSTs to an internal Next.js Route Handler (`/api/subscribe`) that holds the secret Kit API key server-side and subscribes the email to a Kit Form; Kit sends the double-opt-in confirmation and then the incentive email containing the wallpaper. PostHog is initialized in a client provider wrapping the layout, auto-capturing pageviews (with UTM params) and a `signup_submitted` conversion event.

**Tech Stack:** Next.js 16.2.9 (App Router), React 19, TypeScript, Tailwind v4, `posthog-js`, Vitest (new dev dependency for unit tests), Kit v3 REST API.

## Global Constraints

- **Next.js is 16.2.9 with breaking changes** — before writing any Next-specific code, read the relevant guide under `node_modules/next/dist/docs/`. Route Handlers use the native `Request`/`Response` Web APIs and export named HTTP-method functions (e.g. `export async function POST(request: Request)`). Confirmed in `node_modules/next/dist/docs/01-app/01-getting-started/15-route-handlers.md`.
- **Kit API key is a server-only secret.** It must never appear in client code or any `NEXT_PUBLIC_*` variable. Only the Route Handler talks to Kit.
- **Opt-in is double opt-in.** The Kit Form must be configured to require subscriber confirmation; the wallpaper is delivered via the Form's incentive email after confirmation.
- **Free-tier only.** Use one Kit Form with an incentive email (no Kit automation), staying within the free plan.
- **Preserve existing UI/copy.** Keep the current success screen ("You're in. Welcome."), button copy ("Get the lords scripture"), styling, and the brand voice. Additions only: a network-error state, a submitting state, and one line of consent microcopy.
- **Path alias:** `@/*` maps to the `landingpage/` root (`tsconfig.json`), so `@/lib/email` resolves to `landingpage/lib/email.ts`.
- **Env var names (exact):** `KIT_API_KEY`, `KIT_FORM_ID` (server-only); `NEXT_PUBLIC_POSTHOG_KEY`, `NEXT_PUBLIC_POSTHOG_HOST` (client).
- **All commands run from `landingpage/`** inside the worktree.

---

## File Structure

| File | Responsibility | Task |
|---|---|---|
| `vitest.config.ts` (create) | Test runner config with `@` alias, node env | 1 |
| `lib/email.ts` (create) | `isValidEmail(email)` — single source of email validation | 2 |
| `lib/email.test.ts` (create) | Unit tests for `isValidEmail` | 2 |
| `lib/kit.ts` (create) | `subscribeToKit(...)` — Kit v3 subscribe, reads env, maps result | 3 |
| `lib/kit.test.ts` (create) | Unit tests for `subscribeToKit` (mocked `fetch`) | 3 |
| `app/api/subscribe/route.ts` (create) | POST handler: validate → subscribe → JSON response | 4 |
| `app/api/subscribe/route.test.ts` (create) | Unit tests for the handler (mocked `subscribeToKit`) | 4 |
| `app/providers.tsx` (create) | Client PostHog provider (init + capture pageviews) | 5 |
| `app/layout.tsx` (modify) | Wrap `children` in the PostHog provider | 5 |
| `app/components/SignupForm.tsx` (modify) | Fetch to `/api/subscribe`, pending/error states, `signup_submitted` event, consent microcopy | 6 |
| `.env.local.example` (create) | Documents required env vars (no secrets) | 7 |
| `docs/superpowers/specs/2026-07-06-email-capture-analytics-design.md` | Design reference (already present) | — |

---

### Task 1: Test tooling (Vitest)

Adds a unit-test runner so later logic tasks can be built test-first. No test framework exists yet.

**Files:**
- Create: `vitest.config.ts`
- Modify: `package.json` (add `test` script + devDependency)
- Test: `lib/sanity.test.ts` (temporary sanity check, deleted at end of task)

**Interfaces:**
- Consumes: nothing.
- Produces: `npm test` runs Vitest once and exits; the `@` alias resolves in tests.

- [ ] **Step 1: Install Vitest**

Run: `npm install -D vitest`
Expected: `vitest` appears in `devDependencies`, install completes without errors.

- [ ] **Step 2: Create the Vitest config**

Create `vitest.config.ts`:

```ts
import { defineConfig } from "vitest/config";
import { fileURLToPath } from "node:url";

export default defineConfig({
  test: {
    environment: "node",
    include: ["**/*.test.ts"],
  },
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./", import.meta.url)),
    },
  },
});
```

- [ ] **Step 3: Add the test script**

In `package.json`, add to `"scripts"`:

```json
"test": "vitest run"
```

- [ ] **Step 4: Write a sanity test that verifies the `@` alias**

Create `lib/sanity.test.ts`:

```ts
import { describe, it, expect } from "vitest";

describe("test tooling", () => {
  it("runs", () => {
    expect(1 + 1).toBe(2);
  });
});
```

- [ ] **Step 5: Run the test to verify tooling works**

Run: `npm test`
Expected: PASS — 1 test passed.

- [ ] **Step 6: Delete the sanity test and commit**

```bash
rm lib/sanity.test.ts
git add vitest.config.ts package.json package-lock.json
git commit -m "test: add Vitest unit-test tooling"
```

---

### Task 2: Email validation module

Extract the email regex currently inlined in `SignupForm.tsx` into a shared module so the client and the server validate identically (DRY).

**Files:**
- Create: `lib/email.ts`
- Test: `lib/email.test.ts`

**Interfaces:**
- Consumes: nothing.
- Produces: `isValidEmail(email: string): boolean` — trims then tests the address; returns `true` for a syntactically valid email, `false` otherwise.

- [ ] **Step 1: Write the failing test**

Create `lib/email.test.ts`:

```ts
import { describe, it, expect } from "vitest";
import { isValidEmail } from "@/lib/email";

describe("isValidEmail", () => {
  it("accepts a normal address", () => {
    expect(isValidEmail("someone@example.com")).toBe(true);
  });

  it("trims surrounding whitespace before validating", () => {
    expect(isValidEmail("  someone@example.com  ")).toBe(true);
  });

  it("rejects a missing @", () => {
    expect(isValidEmail("someone.example.com")).toBe(false);
  });

  it("rejects a missing domain", () => {
    expect(isValidEmail("someone@")).toBe(false);
  });

  it("rejects an empty string", () => {
    expect(isValidEmail("")).toBe(false);
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npm test -- lib/email.test.ts`
Expected: FAIL — cannot resolve `@/lib/email` (module not found).

- [ ] **Step 3: Write the minimal implementation**

Create `lib/email.ts`:

```ts
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function isValidEmail(email: string): boolean {
  return EMAIL_RE.test(email.trim());
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `npm test -- lib/email.test.ts`
Expected: PASS — 5 tests passed.

- [ ] **Step 5: Commit**

```bash
git add lib/email.ts lib/email.test.ts
git commit -m "feat: shared email validation module"
```

---

### Task 3: Kit client module

Encapsulates the Kit v3 subscribe call. The endpoint is `POST https://api.convertkit.com/v3/forms/{form_id}/subscribe` with a JSON body containing `api_key` and `email` (verified live: returns 401 `"API Key not present"` without a key). When the target Form is set to double opt-in, this call triggers Kit's confirmation email and, after confirmation, the incentive email with the wallpaper.

**Files:**
- Create: `lib/kit.ts`
- Test: `lib/kit.test.ts`

**Interfaces:**
- Consumes: env vars `KIT_API_KEY`, `KIT_FORM_ID`.
- Produces:
  - `type KitResult = { ok: true } | { ok: false; status: number }`
  - `async function subscribeToKit(params: { email: string; referrer?: string }): Promise<KitResult>` — returns `{ ok: true }` on a 2xx Kit response, `{ ok: false, status }` on any non-2xx, and `{ ok: false, status: 500 }` when env vars are missing.

- [ ] **Step 1: Write the failing test**

Create `lib/kit.test.ts`:

```ts
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { subscribeToKit } from "@/lib/kit";

describe("subscribeToKit", () => {
  beforeEach(() => {
    process.env.KIT_API_KEY = "test-key";
    process.env.KIT_FORM_ID = "12345";
    vi.restoreAllMocks();
  });

  afterEach(() => {
    delete process.env.KIT_API_KEY;
    delete process.env.KIT_FORM_ID;
  });

  it("posts email + api_key to the form subscribe endpoint and returns ok", async () => {
    const fetchMock = vi
      .spyOn(globalThis, "fetch")
      .mockResolvedValue(new Response(JSON.stringify({ subscription: {} }), { status: 200 }));

    const result = await subscribeToKit({
      email: "a@b.com",
      referrer: "https://quietwaters.app/?utm_source=instagram",
    });

    expect(result).toEqual({ ok: true });
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe("https://api.convertkit.com/v3/forms/12345/subscribe");
    expect(init?.method).toBe("POST");
    const body = JSON.parse((init?.body as string) ?? "{}");
    expect(body.api_key).toBe("test-key");
    expect(body.email).toBe("a@b.com");
    expect(body.referrer).toBe("https://quietwaters.app/?utm_source=instagram");
  });

  it("returns the status on a Kit error response", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(new Response("{}", { status: 422 }));
    const result = await subscribeToKit({ email: "a@b.com" });
    expect(result).toEqual({ ok: false, status: 422 });
  });

  it("returns status 500 when env vars are missing", async () => {
    delete process.env.KIT_API_KEY;
    const result = await subscribeToKit({ email: "a@b.com" });
    expect(result).toEqual({ ok: false, status: 500 });
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npm test -- lib/kit.test.ts`
Expected: FAIL — cannot resolve `@/lib/kit`.

- [ ] **Step 3: Write the minimal implementation**

Create `lib/kit.ts`:

```ts
const KIT_FORMS_URL = "https://api.convertkit.com/v3/forms";

export type KitResult = { ok: true } | { ok: false; status: number };

export async function subscribeToKit(params: {
  email: string;
  referrer?: string;
}): Promise<KitResult> {
  const apiKey = process.env.KIT_API_KEY;
  const formId = process.env.KIT_FORM_ID;

  if (!apiKey || !formId) {
    return { ok: false, status: 500 };
  }

  const res = await fetch(`${KIT_FORMS_URL}/${formId}/subscribe`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      api_key: apiKey,
      email: params.email,
      referrer: params.referrer,
    }),
  });

  return res.ok ? { ok: true } : { ok: false, status: res.status };
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `npm test -- lib/kit.test.ts`
Expected: PASS — 3 tests passed.

- [ ] **Step 5: Commit**

```bash
git add lib/kit.ts lib/kit.test.ts
git commit -m "feat: Kit v3 subscribe client"
```

---

### Task 4: Subscribe Route Handler

The internal API endpoint the form posts to. Validates the email server-side, extracts the referrer (which carries UTM params) from the `referer` header, calls `subscribeToKit`, and returns JSON — never leaking the Kit key or raw Kit errors.

**Files:**
- Create: `app/api/subscribe/route.ts`
- Test: `app/api/subscribe/route.test.ts`

**Interfaces:**
- Consumes: `isValidEmail` (Task 2), `subscribeToKit` + `KitResult` (Task 3).
- Produces: `export async function POST(request: Request): Promise<Response>` mounted at `/api/subscribe`. Responses: `200 {ok:true}` success; `400 {error}` invalid body/email; `502 {error}` Kit failure.

- [ ] **Step 1: Write the failing test**

Create `app/api/subscribe/route.test.ts`:

```ts
import { describe, it, expect, vi, beforeEach } from "vitest";
import { POST } from "@/app/api/subscribe/route";

vi.mock("@/lib/kit", () => ({
  subscribeToKit: vi.fn(),
}));

import { subscribeToKit } from "@/lib/kit";

function postRequest(body: unknown, headers: Record<string, string> = {}) {
  return new Request("http://localhost/api/subscribe", {
    method: "POST",
    headers: { "Content-Type": "application/json", ...headers },
    body: JSON.stringify(body),
  });
}

describe("POST /api/subscribe", () => {
  beforeEach(() => {
    vi.mocked(subscribeToKit).mockReset();
  });

  it("returns 200 and calls Kit for a valid email", async () => {
    vi.mocked(subscribeToKit).mockResolvedValue({ ok: true });
    const res = await POST(postRequest({ email: "a@b.com" }, { referer: "https://qw.app/?utm_source=tiktok" }));
    expect(res.status).toBe(200);
    await expect(res.json()).resolves.toEqual({ ok: true });
    expect(subscribeToKit).toHaveBeenCalledWith({
      email: "a@b.com",
      referrer: "https://qw.app/?utm_source=tiktok",
    });
  });

  it("returns 400 for an invalid email and does not call Kit", async () => {
    const res = await POST(postRequest({ email: "nope" }));
    expect(res.status).toBe(400);
    expect(subscribeToKit).not.toHaveBeenCalled();
  });

  it("returns 400 for a non-JSON body", async () => {
    const req = new Request("http://localhost/api/subscribe", { method: "POST", body: "not json" });
    const res = await POST(req);
    expect(res.status).toBe(400);
  });

  it("returns 502 when Kit fails", async () => {
    vi.mocked(subscribeToKit).mockResolvedValue({ ok: false, status: 422 });
    const res = await POST(postRequest({ email: "a@b.com" }));
    expect(res.status).toBe(502);
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npm test -- app/api/subscribe/route.test.ts`
Expected: FAIL — cannot resolve `@/app/api/subscribe/route`.

- [ ] **Step 3: Write the minimal implementation**

Create `app/api/subscribe/route.ts`:

```ts
import { isValidEmail } from "@/lib/email";
import { subscribeToKit } from "@/lib/kit";

export async function POST(request: Request): Promise<Response> {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid request." }, { status: 400 });
  }

  const rawEmail =
    body && typeof body === "object" && "email" in body && typeof (body as { email: unknown }).email === "string"
      ? (body as { email: string }).email.trim()
      : "";

  if (!isValidEmail(rawEmail)) {
    return Response.json({ error: "Please enter a valid email address." }, { status: 400 });
  }

  const referrer = request.headers.get("referer") ?? undefined;
  const result = await subscribeToKit({ email: rawEmail, referrer });

  if (!result.ok) {
    console.error("Kit subscribe failed", { status: result.status });
    return Response.json({ error: "Subscription failed. Please try again." }, { status: 502 });
  }

  return Response.json({ ok: true });
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `npm test -- app/api/subscribe/route.test.ts`
Expected: PASS — 4 tests passed.

- [ ] **Step 5: Run the full suite + lint**

Run: `npm test && npm run lint`
Expected: all tests pass; lint reports no errors.

- [ ] **Step 6: Commit**

```bash
git add app/api/subscribe/route.ts app/api/subscribe/route.test.ts
git commit -m "feat: /api/subscribe route handler"
```

---

### Task 5: PostHog provider + layout wiring

Initializes PostHog on the client and wraps the app so pageviews (with UTM params, captured automatically by PostHog from the URL) are recorded. If the key is absent (e.g. local dev without env), it degrades to a no-op and never crashes.

**Files:**
- Create: `app/providers.tsx`
- Modify: `app/layout.tsx`

**Interfaces:**
- Consumes: env `NEXT_PUBLIC_POSTHOG_KEY`, `NEXT_PUBLIC_POSTHOG_HOST`.
- Produces: `PHProvider` — a client component that provides the PostHog context (via `posthog-js/react`) to descendants, enabling `usePostHog()` in Task 6.

- [ ] **Step 1: Install posthog-js**

Run: `npm install posthog-js`
Expected: `posthog-js` appears in `dependencies`.

- [ ] **Step 2: Create the provider**

Create `app/providers.tsx`:

```tsx
"use client";

import { useEffect } from "react";
import posthog from "posthog-js";
import { PostHogProvider } from "posthog-js/react";

let initialized = false;

export function PHProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    const key = process.env.NEXT_PUBLIC_POSTHOG_KEY;
    if (!initialized && key) {
      posthog.init(key, {
        api_host: process.env.NEXT_PUBLIC_POSTHOG_HOST || "https://us.i.posthog.com",
        capture_pageview: true,
        person_profiles: "identified_only",
      });
      initialized = true;
    }
  }, []);

  return <PostHogProvider client={posthog}>{children}</PostHogProvider>;
}
```

- [ ] **Step 3: Wrap the layout**

Modify `app/layout.tsx` — import the provider and wrap `children`. Change the `<body>` element from:

```tsx
      <body>{children}</body>
```

to:

```tsx
      <body>
        <PHProvider>{children}</PHProvider>
      </body>
```

And add near the top with the other imports:

```tsx
import { PHProvider } from "./providers";
```

- [ ] **Step 4: Verify it builds and the provider mounts (manual)**

Create a throwaway `.env.local` with a real PostHog project key (from the PostHog project used by the Quiet Waters mobile app, or a new web project), then:

Run: `npm run dev`
In a browser, open the landing page. Verify:
- The page renders unchanged (no console errors from PostHog).
- In DevTools → Network, a request to the PostHog host (`/e/` or `/i/v0/e/`) fires on load — the `$pageview`.
- Append `?utm_source=test&utm_campaign=verify` to the URL, reload, and confirm the pageview request includes those UTM values (visible later in PostHog's Activity view).

Stop the dev server when done.

- [ ] **Step 5: Commit**

```bash
git add app/providers.tsx app/layout.tsx package.json package-lock.json
git commit -m "feat: PostHog analytics provider"
```

---

### Task 6: SignupForm integration

Replace the `localStorage` placeholder with a real POST to `/api/subscribe`, add submitting/error states, fire the `signup_submitted` PostHog event on success, and add one line of consent microcopy. Keep the existing success screen and styling.

**Files:**
- Modify: `app/components/SignupForm.tsx`

**Interfaces:**
- Consumes: `isValidEmail` (Task 2), `POST /api/subscribe` (Task 4), `usePostHog` (Task 5).
- Produces: no exports beyond the existing default component.

- [ ] **Step 1: Replace the component body**

Replace the entire contents of `app/components/SignupForm.tsx` with:

```tsx
"use client";

import { useState } from "react";
import { usePostHog } from "posthog-js/react";
import { isValidEmail } from "@/lib/email";

export default function SignupForm() {
  const posthog = usePostHog();
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const value = email.trim();
    if (!isValidEmail(value)) {
      setError("Please enter a valid email address.");
      return;
    }

    setSubmitting(true);
    setError("");
    try {
      const res = await fetch("/api/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: value }),
      });
      if (!res.ok) {
        throw new Error("subscribe failed");
      }
      posthog?.capture("signup_submitted");
      setSubmitted(true);
    } catch {
      setError("Something went wrong on our end. Please try again in a moment.");
    } finally {
      setSubmitting(false);
    }
  }

  if (submitted) {
    return (
      <div className="rounded-[18px] border border-field-line bg-white px-7 py-[26px]">
        <div className="mb-2.5 flex items-center gap-2.5">
          <span className="inline-flex h-[30px] w-[30px] items-center justify-center rounded-full bg-[#e4f0f2]">
            <svg
              width="15"
              height="15"
              viewBox="0 0 24 24"
              fill="none"
              aria-hidden="true"
            >
              <path
                d="M5 13l4 4L19 7"
                stroke="#3e8e5b"
                strokeWidth="2.6"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </span>
          <span className="font-serif text-2xl font-medium text-ink">
            You&apos;re in. Welcome.
          </span>
        </div>
        <p className="m-0 text-[15px] leading-[1.6] text-body">
          Check your inbox to confirm your email — then The Stillness Collection
          is on its way. Take a breath; we&apos;ll be gentle with it.
        </p>
      </div>
    );
  }

  return (
    <>
      <form onSubmit={handleSubmit} className="flex flex-col flex-wrap gap-2.5">
        <input
          type="email"
          value={email}
          onChange={(e) => {
            setEmail(e.target.value);
            setError("");
          }}
          placeholder="Your email address"
          aria-label="Your email address"
          disabled={submitting}
          className="min-w-0 flex-1 rounded-[30px] border border-field-line bg-white px-[22px] py-4 text-base text-ink outline-none transition focus:border-water focus:shadow-[0_0_0_4px_rgba(156,192,212,0.25)] disabled:opacity-60"
        />
        <button
          type="submit"
          disabled={submitting}
          className="w-fit flex-none cursor-pointer rounded-[30px] border-none bg-slate px-7 py-4 text-[15px] font-semibold whitespace-nowrap text-[#eaf1f4] transition-colors hover:bg-ink disabled:cursor-not-allowed disabled:opacity-70"
        >
          {submitting ? "Sending…" : "Get the lords scripture"}
        </button>
      </form>

      <p className="mt-2.5 pl-1.5 text-[12px] leading-[1.4] text-muted">
        We&apos;ll send occasional emails. Unsubscribe anytime.
      </p>

      {error && (
        <div className="mt-2.5 pl-1.5 text-[13px] font-medium leading-[1.4] text-[#b07a6a]">
          {error}
        </div>
      )}
    </>
  );
}
```

> Note: the success-screen copy now mentions confirming email first, matching the double-opt-in flow. If `text-muted` is not a defined Tailwind color token in this project, use `text-body` instead (check `globals.css`/theme before finalizing).

- [ ] **Step 2: Verify lint + full test suite**

Run: `npm run lint && npm test`
Expected: no lint errors; all unit tests pass.

- [ ] **Step 3: Manual verification (dev server, mocked-safe)**

Run: `npm run dev`. On the landing page:
- Submit an invalid email (`abc`) → inline "Please enter a valid email address." shows; no network request.
- Submit a valid email with the dev server running but **no** `KIT_API_KEY` set → the route returns 502, and the form shows the "Something went wrong…" retry message (confirms the error path). The button shows "Sending…" while in flight and re-enables after.
- (Full success path is verified end-to-end in Task 7 once Kit is configured.)

Stop the dev server when done.

- [ ] **Step 4: Commit**

```bash
git add app/components/SignupForm.tsx
git commit -m "feat: wire signup form to /api/subscribe + PostHog event"
```

---

### Task 7: Kit + PostHog configuration and end-to-end verification

External setup (Kit account, Form, wallpaper, env vars) plus the real end-to-end confirmation of the whole flow. This is the task that proves the feature works for a real visitor.

**Files:**
- Create: `.env.local.example`
- (No app code changes.)

**Interfaces:**
- Consumes: everything from Tasks 2–6.
- Produces: a working deployed flow; documented env vars.

- [ ] **Step 1: Create the Kit account and Form**

1. Sign up at kit.com (free Newsletter plan).
2. Create a **Form** (name it e.g. "Quiet Waters — Stillness Collection").
3. In the Form's settings, enable **double opt-in** ("Require subscribers to confirm their subscription" / "Send subscriber confirmation email").
4. Under the Form's **Incentive email** settings, enable "Send incentive email", upload the iPhone wallpaper as the downloadable file (or set the incentive to link to it), and write brief brand-matching copy.
5. Note the Form's numeric **ID** (visible in the Form's URL / embed settings) → this is `KIT_FORM_ID`.

- [ ] **Step 2: Prepare the wallpaper asset**

Export the iPhone lock-screen wallpaper (recommend 1290×2796 px, PNG or high-quality JPG). Upload it to the Kit incentive email in Step 1.4. (If not final yet, upload a placeholder and swap later — no code change needed.)

- [ ] **Step 3: Get the Kit API key**

In Kit → Account settings → Advanced / Developer, copy the **API Key** (v3 key used by the `api_key` body field) → this is `KIT_API_KEY`.

- [ ] **Step 4: Get PostHog project credentials**

Use the same PostHog project as the Quiet Waters mobile app (so the funnel unifies) or create a new web project. Copy the **Project API Key** → `NEXT_PUBLIC_POSTHOG_KEY`, and the project's ingestion host (`https://us.i.posthog.com` or `https://eu.i.posthog.com`) → `NEXT_PUBLIC_POSTHOG_HOST`.

- [ ] **Step 5: Write `.env.local` and the example file**

Create `.env.local.example` (committed, no secrets):

```bash
# Kit (ConvertKit) — server-only secrets, never expose to the client
KIT_API_KEY=
KIT_FORM_ID=

# PostHog — safe to expose to the client
NEXT_PUBLIC_POSTHOG_KEY=
NEXT_PUBLIC_POSTHOG_HOST=https://us.i.posthog.com
```

Create `.env.local` (NOT committed — Next.js gitignores `.env*.local` by default; verify with `git check-ignore .env.local`) with the real values from Steps 1–4.

- [ ] **Step 6: End-to-end verification (dev)**

Run: `npm run dev`. Then, using a real email inbox you control:
- Load the page with `?utm_source=e2e-test&utm_campaign=launch`.
- Submit your real email. Confirm the success screen ("You're in. Welcome.") appears.
- Confirm a **confirmation email** arrives from Kit. Click the confirmation link.
- Confirm the **incentive email with the wallpaper** then arrives and the wallpaper downloads/opens correctly.
- In PostHog → Activity/Events, confirm a `$pageview` (with `utm_source=e2e-test`) and a `signup_submitted` event were recorded.
- In Kit → subscribers, confirm your email is present and confirmed.

- [ ] **Step 7: Add env vars to Vercel**

Add `KIT_API_KEY`, `KIT_FORM_ID`, `NEXT_PUBLIC_POSTHOG_KEY`, `NEXT_PUBLIC_POSTHOG_HOST` to the Vercel project (Production + Preview) via the dashboard or `vercel env add`. Do not commit secrets.

- [ ] **Step 8: Commit the example env file**

```bash
git add .env.local.example
git commit -m "docs: document required env vars for Kit + PostHog"
```

- [ ] **Step 9: Campaign wiring note**

For measuring the campaign, ensure social posts link to the landing page with UTM params, e.g. `https://<domain>/?utm_source=instagram&utm_medium=social&utm_campaign=launch`. In PostHog, build an Insight/Funnel `$pageview → signup_submitted` broken down by `utm_source` to compare channels.

---

## Self-Review

**Spec coverage:**
- Collect emails → Tasks 3, 4, 6 (Kit client, route, form). ✅
- Deliver wallpaper by email (double opt-in) → Task 7 (Kit Form + incentive email + double opt-in setting). ✅
- Track page visits + campaign → Task 5 (PostHog pageviews + UTM) and Task 6/7 (`signup_submitted` event, funnel note). ✅
- Server-side secret handling → Task 4 route + Global Constraints. ✅
- Error handling (client + server) → Tasks 4 and 6. ✅
- Testing (unit + manual e2e) → Tasks 1–4 (unit), 5–7 (manual). ✅
- Kit API version verification → the endpoint was probed live (v3 `forms/{id}/subscribe`, 401 without key) and is used in Task 3; Task 7 Step 6 verifies the double-opt-in + incentive behavior end-to-end. ✅

**Placeholder scan:** No "TBD"/"handle edge cases"/"write tests for the above" — every code step contains full code; every test step contains full test code. ✅

**Type consistency:** `isValidEmail(string): boolean` used identically in Tasks 2, 4, 6. `subscribeToKit({email, referrer})` / `KitResult` defined in Task 3 and consumed with matching shape in Task 4. `PHProvider` defined in Task 5 and used in `layout.tsx`; `usePostHog` used in Task 6. Env var names identical everywhere. ✅
