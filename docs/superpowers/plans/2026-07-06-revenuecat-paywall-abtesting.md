# RevenueCat Paywall + PostHog A/B Testing Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Turn the hand-built paywall (onboarding screens 10–12) into a real RevenueCat-backed purchasing flow, and add a per-screen A/B testing mechanism (PostHog feature flags) applied to the paywall and one reference onboarding screen.

**Architecture:** A thin `revenuecat.ts` wrapper is the only module importing `react-native-purchases`; screens depend on its interface. A typed `EXPERIMENTS` registry + `useVariant` hook wrap PostHog feature flags so every screen always renders a valid variant (falling back to a declared default). `AppProviders` mounts the PostHog client (seeded with bootstrap defaults); the entry gate initializes RevenueCat, aligns the two identities, checks the `pro` entitlement, and routes. Hard paywall: `/home` is only reachable with the entitlement.

**Tech Stack:** Expo SDK 57, expo-router, React 19, TypeScript, Zustand, `react-native-purchases`, `posthog-react-native`, Jest + `@testing-library/react-native`.

## Global Constraints

- Platform: **iPhone only**. Do not add Android wiring.
- Build: native via `expo run:ios` (an `ios/` project exists). No Expo Go.
- Expo SDK 57 — before editing `app.json` native config or installing, consult https://docs.expo.dev/versions/v57.0.0/ and each SDK's Expo install docs.
- Keys are **publishable placeholders**: RevenueCat iOS key `appl_PLACEHOLDER`, PostHog key `phc_PLACEHOLDER`, PostHog host `https://eu.i.posthog.com` (EU region). No live calls until real keys are added.
- Entitlement identifier: **`pro`**.
- Path alias `@/` maps to `mobile/src/`. All new files live under `mobile/src/`.
- TDD: write the failing test first, watch it fail, implement minimally, watch it pass, commit. Run tests from `mobile/` with `npm test`.
- The only module allowed to `import ... from 'react-native-purchases'` is `src/lib/revenuecat.ts`. The only modules allowed to import `posthog-react-native` are `src/providers/AppProviders.tsx` and `src/hooks/useVariant.ts` (plus `usePostHog` in screens for `capture`).

---

### Task 1: Install SDKs, config module, and Jest mocks

**Files:**
- Modify: `mobile/package.json` (deps via installer)
- Modify: `mobile/app.json` (add `expo.extra` + any required plugins)
- Create: `mobile/src/lib/config.ts`
- Modify: `mobile/jest.setup.js`
- Test: `mobile/src/lib/__tests__/config.test.ts`

**Interfaces:**
- Produces: `config.ts` exports `REVENUECAT_IOS_KEY: string`, `POSTHOG_KEY: string`, `POSTHOG_HOST: string`.
- Produces: global Jest mocks for `react-native-purchases` and `posthog-react-native` so existing and new component tests render without native modules.

- [ ] **Step 1: Install the SDKs**

From `mobile/`:
```bash
npx expo install react-native-purchases posthog-react-native
```
Then, if `expo run:ios` uses CocoaPods locally, install pods:
```bash
npx pod-install
```
(If the `ios/` folder is generated via prebuild, run `npx expo prebuild -p ios` instead. Verify against the Expo 57 docs which applies to this repo.)

- [ ] **Step 2: Add publishable config to `app.json`**

Add an `extra` block inside `expo` (sibling of `plugins`):
```json
"extra": {
  "revenueCatIosKey": "appl_PLACEHOLDER",
  "posthogKey": "phc_PLACEHOLDER",
  "posthogHost": "https://eu.i.posthog.com"
}
```

- [ ] **Step 3: Write the failing config test**

`mobile/src/lib/__tests__/config.test.ts`:
```ts
import { REVENUECAT_IOS_KEY, POSTHOG_KEY, POSTHOG_HOST } from '@/lib/config';

test('config exposes non-empty publishable values with EU host default', () => {
  expect(REVENUECAT_IOS_KEY).toMatch(/^appl_/);
  expect(POSTHOG_KEY).toMatch(/^phc_/);
  expect(POSTHOG_HOST).toBe('https://eu.i.posthog.com');
});
```

- [ ] **Step 4: Run it, expect failure**

Run: `npm test -- config.test`
Expected: FAIL — `Cannot find module '@/lib/config'`.

- [ ] **Step 5: Implement `config.ts`**

`mobile/src/lib/config.ts`:
```ts
import Constants from 'expo-constants';

const extra = (Constants.expoConfig?.extra ?? {}) as Record<string, string | undefined>;

export const REVENUECAT_IOS_KEY = extra.revenueCatIosKey ?? 'appl_PLACEHOLDER';
export const POSTHOG_KEY = extra.posthogKey ?? 'phc_PLACEHOLDER';
export const POSTHOG_HOST = extra.posthogHost ?? 'https://eu.i.posthog.com';
```

- [ ] **Step 6: Add global Jest mocks**

Append to `mobile/jest.setup.js`:
```js
jest.mock('react-native-purchases', () => ({
  __esModule: true,
  default: {
    configure: jest.fn(),
    setLogLevel: jest.fn(),
    LOG_LEVEL: { DEBUG: 'DEBUG' },
    getOfferings: jest.fn().mockResolvedValue({ current: null }),
    getCustomerInfo: jest.fn().mockResolvedValue({ entitlements: { active: {} } }),
    getAppUserID: jest.fn().mockResolvedValue('anon-test'),
    purchasePackage: jest.fn(),
    restorePurchases: jest.fn().mockResolvedValue({ entitlements: { active: {} } }),
  },
}));

jest.mock('posthog-react-native', () => ({
  PostHog: jest.fn().mockImplementation(() => ({ identify: jest.fn(), capture: jest.fn() })),
  PostHogProvider: ({ children }) => children,
  usePostHog: () => ({ identify: jest.fn(), capture: jest.fn() }),
  useFeatureFlag: () => undefined,
}));
```

- [ ] **Step 7: Run the whole suite, expect green**

Run: `npm test`
Expected: config test PASSES; all pre-existing tests still PASS (mocks keep native SDKs out).

- [ ] **Step 8: Commit**

```bash
git add mobile/package.json mobile/package-lock.json mobile/app.json mobile/src/lib/config.ts mobile/src/lib/__tests__/config.test.ts mobile/jest.setup.js
git commit -m "chore(mobile): add RevenueCat + PostHog SDKs, config, jest mocks"
```

---

### Task 2: RevenueCat wrapper (`revenuecat.ts`)

**Files:**
- Create: `mobile/src/lib/revenuecat.ts`
- Test: `mobile/src/lib/__tests__/revenuecat.test.ts`

**Interfaces:**
- Consumes: `REVENUECAT_IOS_KEY` from `@/lib/config`.
- Produces:
  - `PRO_ENTITLEMENT = 'pro'`
  - `initPurchases(appUserId?: string | null): void`
  - `getCurrentOffering(): Promise<PurchasesOffering | null>`
  - `getCustomerInfo(): Promise<CustomerInfo>`
  - `getAppUserId(): Promise<string>`
  - `hasPro(info: CustomerInfo): boolean`
  - `purchasePackage(pkg: PurchasesPackage): Promise<CustomerInfo>`
  - `restore(): Promise<CustomerInfo>`

- [ ] **Step 1: Write the failing test**

`mobile/src/lib/__tests__/revenuecat.test.ts`:
```ts
import Purchases from 'react-native-purchases';
import {
  hasPro, PRO_ENTITLEMENT, initPurchases, purchasePackage, restore, getCurrentOffering,
} from '@/lib/revenuecat';

const infoWith = (active: Record<string, unknown>) => ({ entitlements: { active } }) as any;

test('hasPro is true only when the pro entitlement is active', () => {
  expect(hasPro(infoWith({ [PRO_ENTITLEMENT]: {} }))).toBe(true);
  expect(hasPro(infoWith({}))).toBe(false);
  expect(hasPro(infoWith({ other: {} }))).toBe(false);
});

test('initPurchases configures with the publishable key', () => {
  initPurchases(null);
  expect(Purchases.configure).toHaveBeenCalledWith(
    expect.objectContaining({ apiKey: expect.stringMatching(/^appl_/), appUserID: null }),
  );
});

test('purchasePackage returns the updated customerInfo', async () => {
  const info = infoWith({ [PRO_ENTITLEMENT]: {} });
  (Purchases.purchasePackage as jest.Mock).mockResolvedValueOnce({ customerInfo: info });
  await expect(purchasePackage({} as any)).resolves.toBe(info);
});

test('getCurrentOffering returns null when there is no current offering', async () => {
  await expect(getCurrentOffering()).resolves.toBeNull();
});

test('restore resolves to customerInfo', async () => {
  await expect(restore()).resolves.toEqual({ entitlements: { active: {} } });
});
```

- [ ] **Step 2: Run it, expect failure**

Run: `npm test -- revenuecat.test`
Expected: FAIL — `Cannot find module '@/lib/revenuecat'`.

- [ ] **Step 3: Implement `revenuecat.ts`**

`mobile/src/lib/revenuecat.ts`:
```ts
import Purchases, {
  type CustomerInfo,
  type PurchasesOffering,
  type PurchasesPackage,
} from 'react-native-purchases';
import { REVENUECAT_IOS_KEY } from './config';

export const PRO_ENTITLEMENT = 'pro';

export function initPurchases(appUserId: string | null = null): void {
  Purchases.configure({ apiKey: REVENUECAT_IOS_KEY, appUserID: appUserId });
}

export async function getCurrentOffering(): Promise<PurchasesOffering | null> {
  const offerings = await Purchases.getOfferings();
  return offerings.current ?? null;
}

export async function getCustomerInfo(): Promise<CustomerInfo> {
  return Purchases.getCustomerInfo();
}

export async function getAppUserId(): Promise<string> {
  return Purchases.getAppUserID();
}

export function hasPro(info: CustomerInfo): boolean {
  return info.entitlements.active[PRO_ENTITLEMENT] !== undefined;
}

export async function purchasePackage(pkg: PurchasesPackage): Promise<CustomerInfo> {
  const { customerInfo } = await Purchases.purchasePackage(pkg);
  return customerInfo;
}

export async function restore(): Promise<CustomerInfo> {
  return Purchases.restorePurchases();
}
```

- [ ] **Step 4: Run it, expect green**

Run: `npm test -- revenuecat.test`
Expected: PASS (all 5).

- [ ] **Step 5: Commit**

```bash
git add mobile/src/lib/revenuecat.ts mobile/src/lib/__tests__/revenuecat.test.ts
git commit -m "feat(mobile): RevenueCat wrapper (offerings, purchase, entitlement, restore)"
```

---

### Task 3: Experiments registry + `useVariant` hook

**Files:**
- Create: `mobile/src/lib/experiments.ts`
- Create: `mobile/src/hooks/useVariant.ts`
- Test: `mobile/src/lib/__tests__/experiments.test.ts`
- Test: `mobile/src/hooks/__tests__/useVariant.test.tsx`

**Interfaces:**
- Consumes: `useFeatureFlag` from `posthog-react-native`.
- Produces:
  - `EXPERIMENTS` — `Record<string, { variants: readonly string[]; default: string }>` (as-const)
  - `type ExperimentKey = keyof typeof EXPERIMENTS`
  - `type VariantOf<K>` — union of that experiment's variant literals
  - `bootstrapFlags: Record<string, string>` — `{ [key]: default }` for PostHog bootstrap
  - `useVariant<K extends ExperimentKey>(key: K): VariantOf<K>`

- [ ] **Step 1: Write the failing registry test**

`mobile/src/lib/__tests__/experiments.test.ts`:
```ts
import { EXPERIMENTS, bootstrapFlags } from '@/lib/experiments';

test('every experiment lists its default among its variants', () => {
  for (const [key, exp] of Object.entries(EXPERIMENTS)) {
    expect(exp.variants).toContain(exp.default);
    expect(bootstrapFlags[key]).toBe(exp.default);
  }
});

test('the paywall-cta and aspiration-headline experiments exist', () => {
  expect(EXPERIMENTS['paywall-cta'].variants).toEqual(['try_free', 'start_trial']);
  expect(EXPERIMENTS['aspiration-headline'].variants).toEqual(['control', 'v2']);
});
```

- [ ] **Step 2: Run it, expect failure**

Run: `npm test -- experiments.test`
Expected: FAIL — `Cannot find module '@/lib/experiments'`.

- [ ] **Step 3: Implement `experiments.ts`**

`mobile/src/lib/experiments.ts`:
```ts
export const EXPERIMENTS = {
  'paywall-cta': { variants: ['try_free', 'start_trial'], default: 'try_free' },
  'aspiration-headline': { variants: ['control', 'v2'], default: 'control' },
} as const;

export type ExperimentKey = keyof typeof EXPERIMENTS;
export type VariantOf<K extends ExperimentKey> = (typeof EXPERIMENTS)[K]['variants'][number];

export const bootstrapFlags: Record<string, string> = Object.fromEntries(
  Object.entries(EXPERIMENTS).map(([key, exp]) => [key, exp.default]),
);
```

- [ ] **Step 4: Run it, expect green**

Run: `npm test -- experiments.test`
Expected: PASS.

- [ ] **Step 5: Write the failing `useVariant` test**

`mobile/src/hooks/__tests__/useVariant.test.tsx`:
```tsx
import { Text } from 'react-native';
import { render, screen } from '@testing-library/react-native';
import * as posthog from 'posthog-react-native';
import { useVariant } from '@/hooks/useVariant';

const Probe = () => <Text>{useVariant('aspiration-headline')}</Text>;

test('returns the default when the flag is undefined', () => {
  jest.spyOn(posthog, 'useFeatureFlag').mockReturnValue(undefined);
  render(<Probe />);
  expect(screen.getByText('control')).toBeTruthy();
});

test('returns the flag value when it is a declared variant', () => {
  jest.spyOn(posthog, 'useFeatureFlag').mockReturnValue('v2');
  render(<Probe />);
  expect(screen.getByText('v2')).toBeTruthy();
});

test('falls back to default when the flag value is not a declared variant', () => {
  jest.spyOn(posthog, 'useFeatureFlag').mockReturnValue('garbage');
  render(<Probe />);
  expect(screen.getByText('control')).toBeTruthy();
});
```

- [ ] **Step 6: Run it, expect failure**

Run: `npm test -- useVariant.test`
Expected: FAIL — `Cannot find module '@/hooks/useVariant'`.

- [ ] **Step 7: Implement `useVariant.ts`**

`mobile/src/hooks/useVariant.ts`:
```ts
import { useFeatureFlag } from 'posthog-react-native';
import { EXPERIMENTS, type ExperimentKey, type VariantOf } from '@/lib/experiments';

export function useVariant<K extends ExperimentKey>(key: K): VariantOf<K> {
  const raw = useFeatureFlag(key);
  const exp = EXPERIMENTS[key];
  if (typeof raw === 'string' && (exp.variants as readonly string[]).includes(raw)) {
    return raw as VariantOf<K>;
  }
  return exp.default as VariantOf<K>;
}
```

- [ ] **Step 8: Run it, expect green**

Run: `npm test -- useVariant.test`
Expected: PASS (all 3).

- [ ] **Step 9: Commit**

```bash
git add mobile/src/lib/experiments.ts mobile/src/hooks/useVariant.ts mobile/src/lib/__tests__/experiments.test.ts mobile/src/hooks/__tests__/useVariant.test.tsx
git commit -m "feat(mobile): experiments registry + useVariant flag hook with safe defaults"
```

---

### Task 4: `AppProviders` + root layout wiring

**Files:**
- Create: `mobile/src/providers/AppProviders.tsx`
- Modify: `mobile/src/app/_layout.tsx:32-36` (wrap `Stack` in `AppProviders`)
- Test: `mobile/src/providers/__tests__/AppProviders.test.tsx`

**Interfaces:**
- Consumes: `POSTHOG_KEY`, `POSTHOG_HOST` from `@/lib/config`; `bootstrapFlags` from `@/lib/experiments`.
- Produces: `AppProviders({ children }: { children: ReactNode })` — mounts a memoized PostHog client (bootstrapped with `bootstrapFlags`) via `PostHogProvider` with autocapture enabled.

- [ ] **Step 1: Write the failing test**

`mobile/src/providers/__tests__/AppProviders.test.tsx`:
```tsx
import { Text } from 'react-native';
import { render, screen } from '@testing-library/react-native';
import { AppProviders } from '@/providers/AppProviders';

test('renders children inside the providers', () => {
  render(
    <AppProviders>
      <Text>hello</Text>
    </AppProviders>,
  );
  expect(screen.getByText('hello')).toBeTruthy();
});
```

- [ ] **Step 2: Run it, expect failure**

Run: `npm test -- AppProviders.test`
Expected: FAIL — `Cannot find module '@/providers/AppProviders'`.

- [ ] **Step 3: Implement `AppProviders.tsx`**

`mobile/src/providers/AppProviders.tsx`:
```tsx
import { PostHog, PostHogProvider } from 'posthog-react-native';
import { useMemo, type ReactNode } from 'react';
import { POSTHOG_KEY, POSTHOG_HOST } from '@/lib/config';
import { bootstrapFlags } from '@/lib/experiments';

export function AppProviders({ children }: { children: ReactNode }) {
  const client = useMemo(
    () =>
      new PostHog(POSTHOG_KEY, {
        host: POSTHOG_HOST,
        bootstrap: { featureFlags: bootstrapFlags },
      }),
    [],
  );

  return (
    <PostHogProvider client={client} autocapture>
      {children}
    </PostHogProvider>
  );
}
```
(Verify the `bootstrap` option shape and `PostHogProvider` `client` prop against the installed `posthog-react-native` version's docs. If `bootstrap` is unsupported in that version, pass the defaults through the constructor's documented flag-preload option instead — the observable requirement is: flags resolve to `bootstrapFlags` values before the first render.)

- [ ] **Step 4: Run it, expect green**

Run: `npm test -- AppProviders.test`
Expected: PASS (the global mock's `PostHogProvider` renders children).

- [ ] **Step 5: Wrap the root `Stack`**

In `mobile/src/app/_layout.tsx`, add the import and wrap. Replace the returned JSX (lines 32-36):
```tsx
  return (
    <SafeAreaProvider>
      <AppProviders>
        <Stack screenOptions={{ headerShown: false }} />
      </AppProviders>
    </SafeAreaProvider>
  );
```
Add at the top with the other imports:
```tsx
import { AppProviders } from '@/providers/AppProviders';
```

- [ ] **Step 6: Run the full suite, expect green**

Run: `npm test`
Expected: all PASS.

- [ ] **Step 7: Commit**

```bash
git add mobile/src/providers/AppProviders.tsx mobile/src/providers/__tests__/AppProviders.test.tsx mobile/src/app/_layout.tsx
git commit -m "feat(mobile): mount PostHog provider with bootstrap flags at root"
```

---

### Task 5: Entry gate — init RevenueCat, align identity, route by entitlement

**Files:**
- Modify: `mobile/src/app/index.tsx` (full rewrite)
- Test: `mobile/src/app/__tests__/index.test.tsx` (rewrite)

**Interfaces:**
- Consumes: `initPurchases`, `getAppUserId`, `getCustomerInfo`, `hasPro` from `@/lib/revenuecat`; `isOnboardingComplete` from `@/lib/storage`; `usePostHog` from `posthog-react-native`; `Redirect` from `expo-router`.
- Produces: default `Index` component that redirects to one of `/home`, `/onboarding/10-paywall-intro`, `/onboarding/01-aspiration`.

- [ ] **Step 1: Rewrite the failing test**

Replace `mobile/src/app/__tests__/index.test.tsx` with:
```tsx
import { render, waitFor } from '@testing-library/react-native';

const mockRedirect = jest.fn(() => null);
jest.mock('expo-router', () => ({ Redirect: (props: any) => mockRedirect(props) }));
jest.mock('@/lib/storage', () => ({ isOnboardingComplete: jest.fn() }));
jest.mock('@/lib/revenuecat', () => ({
  initPurchases: jest.fn(),
  getAppUserId: jest.fn().mockResolvedValue('anon-1'),
  getCustomerInfo: jest.fn(),
  hasPro: jest.fn(),
}));

import { isOnboardingComplete } from '@/lib/storage';
import { getCustomerInfo, hasPro, initPurchases } from '@/lib/revenuecat';
import Index from '@/app/index';

beforeEach(() => {
  jest.clearAllMocks();
  (getCustomerInfo as jest.Mock).mockResolvedValue({ entitlements: { active: {} } });
});

test('routes to /home when the pro entitlement is active', async () => {
  (hasPro as jest.Mock).mockReturnValue(true);
  render(<Index />);
  await waitFor(() => expect(mockRedirect).toHaveBeenCalledWith({ href: '/home' }));
  expect(initPurchases).toHaveBeenCalled();
});

test('routes to the paywall intro when onboarding is done but no entitlement', async () => {
  (hasPro as jest.Mock).mockReturnValue(false);
  (isOnboardingComplete as jest.Mock).mockResolvedValue(true);
  render(<Index />);
  await waitFor(() =>
    expect(mockRedirect).toHaveBeenCalledWith({ href: '/onboarding/10-paywall-intro' }),
  );
});

test('routes to onboarding start for a fresh user', async () => {
  (hasPro as jest.Mock).mockReturnValue(false);
  (isOnboardingComplete as jest.Mock).mockResolvedValue(false);
  render(<Index />);
  await waitFor(() =>
    expect(mockRedirect).toHaveBeenCalledWith({ href: '/onboarding/01-aspiration' }),
  );
});
```

- [ ] **Step 2: Run it, expect failure**

Run: `npm test -- index.test`
Expected: FAIL — current `Index` doesn't call RevenueCat / new routes.

- [ ] **Step 3: Rewrite `index.tsx`**

`mobile/src/app/index.tsx`:
```tsx
import { Redirect } from 'expo-router';
import { useEffect, useState } from 'react';
import { usePostHog } from 'posthog-react-native';
import { isOnboardingComplete } from '@/lib/storage';
import { getAppUserId, getCustomerInfo, hasPro, initPurchases } from '@/lib/revenuecat';

type Target = '/home' | '/onboarding/10-paywall-intro' | '/onboarding/01-aspiration';

export default function Index() {
  const posthog = usePostHog();
  const [target, setTarget] = useState<Target | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      let next: Target = '/onboarding/01-aspiration';
      try {
        initPurchases(null);
        const appUserId = await getAppUserId();
        posthog?.identify(appUserId);
        const info = await getCustomerInfo();
        if (hasPro(info)) {
          next = '/home';
        } else if (await isOnboardingComplete()) {
          next = '/onboarding/10-paywall-intro';
        }
      } catch {
        // fail open into the onboarding funnel; /home stays entitlement-gated
        next = (await isOnboardingComplete())
          ? '/onboarding/10-paywall-intro'
          : '/onboarding/01-aspiration';
      }
      if (!cancelled) setTarget(next);
    })();
    return () => {
      cancelled = true;
    };
  }, [posthog]);

  if (target === null) return null;
  return <Redirect href={target} />;
}
```

- [ ] **Step 4: Run it, expect green**

Run: `npm test -- index.test`
Expected: PASS (all 3).

- [ ] **Step 5: Commit**

```bash
git add mobile/src/app/index.tsx mobile/src/app/__tests__/index.test.tsx
git commit -m "feat(mobile): entitlement-gated entry routing + RC/PostHog identity align"
```

---

### Task 6: Paywall screen 12 — offerings, purchase, restore, CTA A/B, links

**Files:**
- Modify: `mobile/src/app/onboarding/12-paywall-plans.tsx` (full rewrite)
- Test: `mobile/src/app/onboarding/__tests__/screens-10-12.test.tsx` (extend/rewrite the screen-12 tests)

**Interfaces:**
- Consumes: `getCurrentOffering`, `purchasePackage`, `hasPro`, `restore` from `@/lib/revenuecat`; `useVariant` from `@/hooks/useVariant`; `usePostHog`; `setOnboardingComplete` from `@/lib/storage`; `openBrowserAsync` from `expo-web-browser`.
- Uses RevenueCat `PurchasesOffering.annual` / `.weekly` package accessors and `pkg.product.priceString` (localized) for display.
- Produces: default `PaywallPlans` component.

- [ ] **Step 1: Rewrite the screen-12 tests**

Replace `mobile/src/app/onboarding/__tests__/screens-10-12.test.tsx` with:
```tsx
import { render, screen, fireEvent, waitFor } from '@testing-library/react-native';

const mockReplace = jest.fn();
jest.mock('expo-router', () => ({ useRouter: () => ({ push: jest.fn(), replace: mockReplace }) }));
jest.mock('@/lib/storage', () => ({ setOnboardingComplete: jest.fn().mockResolvedValue(undefined) }));
jest.mock('expo-web-browser', () => ({ openBrowserAsync: jest.fn() }));
jest.mock('@/hooks/useVariant', () => ({ useVariant: jest.fn(() => 'try_free') }));

const annual = { product: { priceString: '$59.99' } };
const weekly = { product: { priceString: '$4.99' } };
jest.mock('@/lib/revenuecat', () => ({
  getCurrentOffering: jest.fn().mockResolvedValue({ annual, weekly }),
  purchasePackage: jest.fn(),
  restore: jest.fn(),
  hasPro: jest.fn(),
}));

import { setOnboardingComplete } from '@/lib/storage';
import { getCurrentOffering, purchasePackage, restore, hasPro } from '@/lib/revenuecat';
import { useVariant } from '@/hooks/useVariant';
import Plans from '@/app/onboarding/12-paywall-plans';

beforeEach(() => {
  jest.clearAllMocks();
  (getCurrentOffering as jest.Mock).mockResolvedValue({ annual, weekly });
  (useVariant as jest.Mock).mockReturnValue('try_free');
});

test('renders localized prices from the current offering', async () => {
  render(<Plans />);
  await waitFor(() => expect(screen.getByText('$59.99')).toBeTruthy());
  expect(screen.getByText('$4.99')).toBeTruthy();
});

test('yearly plan is selected by default', async () => {
  render(<Plans />);
  await waitFor(() => expect(screen.getByTestId('plan-card-yearly')).toBeTruthy());
  expect(screen.getByTestId('plan-card-yearly').props.accessibilityState.selected).toBe(true);
});

test('CTA copy follows the paywall-cta variant', async () => {
  (useVariant as jest.Mock).mockReturnValue('start_trial');
  render(<Plans />);
  await waitFor(() => expect(screen.getByText('Start my free trial')).toBeTruthy());
});

test('successful purchase persists flag and routes home', async () => {
  (purchasePackage as jest.Mock).mockResolvedValue({ entitlements: { active: { pro: {} } } });
  (hasPro as jest.Mock).mockReturnValue(true);
  render(<Plans />);
  await waitFor(() => expect(screen.getByText('Try for FREE')).toBeTruthy());
  fireEvent.press(screen.getByText('Try for FREE'));
  await waitFor(() => {
    expect(purchasePackage).toHaveBeenCalledWith(annual);
    expect(setOnboardingComplete).toHaveBeenCalled();
    expect(mockReplace).toHaveBeenCalledWith('/home');
  });
});

test('cancelled purchase does not route home', async () => {
  (purchasePackage as jest.Mock).mockRejectedValue({ userCancelled: true });
  render(<Plans />);
  await waitFor(() => expect(screen.getByText('Try for FREE')).toBeTruthy());
  fireEvent.press(screen.getByText('Try for FREE'));
  await waitFor(() => expect(purchasePackage).toHaveBeenCalled());
  expect(mockReplace).not.toHaveBeenCalled();
  expect(setOnboardingComplete).not.toHaveBeenCalled();
});

test('restore routes home when it yields the pro entitlement', async () => {
  (restore as jest.Mock).mockResolvedValue({ entitlements: { active: { pro: {} } } });
  (hasPro as jest.Mock).mockReturnValue(true);
  render(<Plans />);
  await waitFor(() => expect(screen.getByText('Restore Purchases')).toBeTruthy());
  fireEvent.press(screen.getByText('Restore Purchases'));
  await waitFor(() => expect(mockReplace).toHaveBeenCalledWith('/home'));
});
```

- [ ] **Step 2: Run it, expect failure**

Run: `npm test -- screens-10-12`
Expected: FAIL — screen still hardcodes prices, no restore, no variant CTA.

- [ ] **Step 3: Rewrite `12-paywall-plans.tsx`**

`mobile/src/app/onboarding/12-paywall-plans.tsx`:
```tsx
import { useEffect, useState } from 'react';
import { Pressable, View } from 'react-native';
import { useRouter } from 'expo-router';
import { usePostHog } from 'posthog-react-native';
import { openBrowserAsync } from 'expo-web-browser';
import type { PurchasesOffering, PurchasesPackage } from 'react-native-purchases';
import { Screen, ThemedText, CTAButton, TimelineStep, PlanCard } from '@/components';
import { setOnboardingComplete } from '@/lib/storage';
import { getCurrentOffering, purchasePackage, restore, hasPro } from '@/lib/revenuecat';
import { useVariant } from '@/hooks/useVariant';
import { spacing, colors } from '@/theme';

const TERMS_URL = 'https://quietwaters.app/terms';
const PRIVACY_URL = 'https://quietwaters.app/privacy';

export default function PaywallPlans() {
  const router = useRouter();
  const posthog = usePostHog();
  const ctaVariant = useVariant('paywall-cta');
  const [offering, setOffering] = useState<PurchasesOffering | null>(null);
  const [plan, setPlan] = useState<'yearly' | 'weekly'>('yearly');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    getCurrentOffering().then(setOffering).catch(() => setOffering(null));
    posthog?.capture('paywall_viewed');
  }, [posthog]);

  const annual = offering?.annual ?? null;
  const weekly = offering?.weekly ?? null;
  const selectedPkg: PurchasesPackage | null = plan === 'yearly' ? annual : weekly;
  const ctaLabel = ctaVariant === 'start_trial' ? 'Start my free trial' : 'Try for FREE';

  const goHome = async () => {
    await setOnboardingComplete();
    router.replace('/home');
  };

  const onPurchase = async () => {
    if (!selectedPkg || busy) return;
    setBusy(true);
    posthog?.capture('paywall_cta_pressed', { plan, variant: ctaVariant });
    try {
      const info = await purchasePackage(selectedPkg);
      if (hasPro(info)) await goHome();
    } catch (e: any) {
      if (!e?.userCancelled) posthog?.capture('paywall_purchase_error');
    } finally {
      setBusy(false);
    }
  };

  const onRestore = async () => {
    if (busy) return;
    setBusy(true);
    try {
      const info = await restore();
      if (hasPro(info)) await goHome();
    } catch {
      // no-op: nothing to restore
    } finally {
      setBusy(false);
    }
  };

  return (
    <Screen variant="light">
      <View style={{ flex: 1, paddingTop: spacing.lg, gap: spacing.md }}>
        <ThemedText variant="title" align="center">We'll remind you before your trial ends.</ThemedText>
        <View style={{ marginVertical: spacing.md }}>
          <TimelineStep icon="lock" title="Today" body="Unlock full access to Quiet Waters and start getting closer to God." />
          <TimelineStep icon="bell" title="In 2 days" body="We'll send a reminder before your trial ends." />
          <TimelineStep icon="sparkle" title="In 3 days" body="Your subscription begins unless you cancel before." isLast />
        </View>
        <PlanCard title="Yearly" priceLabel={annual?.product.priceString ?? '—'} subLabel="Best value" periodLabel="/ year"
          selected={plan === 'yearly'} badge="SAVE 92%" onPress={() => setPlan('yearly')} />
        <PlanCard title="Weekly" priceLabel={weekly?.product.priceString ?? '—'} subLabel="Billed weekly" periodLabel="/ week"
          selected={plan === 'weekly'} onPress={() => setPlan('weekly')} />
      </View>
      <View style={{ paddingBottom: spacing.lg, gap: spacing.sm }}>
        <CTAButton label={ctaLabel} onPress={onPurchase} />
        <View style={{ flexDirection: 'row', justifyContent: 'center', gap: spacing.md }}>
          <Pressable onPress={onRestore}><ThemedText variant="caption" color={colors.textFaint}>Restore Purchases</ThemedText></Pressable>
          <Pressable onPress={() => openBrowserAsync(TERMS_URL)}><ThemedText variant="caption" color={colors.textFaint}>Terms</ThemedText></Pressable>
          <Pressable onPress={() => openBrowserAsync(PRIVACY_URL)}><ThemedText variant="caption" color={colors.textFaint}>Privacy</ThemedText></Pressable>
        </View>
      </View>
    </Screen>
  );
}
```
Note: `PurchasesOffering.annual`/`.weekly` are the standard convenience accessors for packages configured with the Annual/Weekly duration in the RevenueCat dashboard. If the dashboard uses custom package identifiers instead, read from `offering.availablePackages` and match by `packageType` — confirm the offering's package setup when real keys are added.

- [ ] **Step 4: Run it, expect green**

Run: `npm test -- screens-10-12`
Expected: PASS (all 6).

- [ ] **Step 5: Commit**

```bash
git add mobile/src/app/onboarding/12-paywall-plans.tsx mobile/src/app/onboarding/__tests__/screens-10-12.test.tsx
git commit -m "feat(mobile): wire paywall to RC offerings, purchase, restore, CTA A/B"
```

---

### Task 7: Reference A/B on screen 01 (aspiration headline)

**Files:**
- Modify: `mobile/src/app/onboarding/01-aspiration.tsx:22-25` (headline via variant)
- Test: `mobile/src/app/onboarding/__tests__/screens-01-02.test.tsx` (add variant tests)

**Interfaces:**
- Consumes: `useVariant('aspiration-headline')` from `@/hooks/useVariant`.

- [ ] **Step 1: Add failing variant tests**

Append to `mobile/src/app/onboarding/__tests__/screens-01-02.test.tsx` (add the mock at the top of the file if not present — place `jest.mock('@/hooks/useVariant', ...)` with the other mocks):
```tsx
import { useVariant } from '@/hooks/useVariant';
jest.mock('@/hooks/useVariant', () => ({ useVariant: jest.fn(() => 'control') }));

// ... existing imports of Aspiration / render remain ...

test('aspiration shows the control headline by default', () => {
  (useVariant as jest.Mock).mockReturnValue('control');
  render(<Aspiration />);
  expect(screen.getByText(/closer to God\./)).toBeTruthy();
});

test('aspiration shows the v2 headline when assigned', () => {
  (useVariant as jest.Mock).mockReturnValue('v2');
  render(<Aspiration />);
  expect(screen.getByText(/Draw nearer to God/)).toBeTruthy();
});
```
(If `screen`/`render`/`Aspiration` are already imported at the top of the file, do not re-import them. Match the file's existing import style.)

- [ ] **Step 2: Run it, expect failure**

Run: `npm test -- screens-01-02`
Expected: FAIL — v2 headline text not present.

- [ ] **Step 3: Wire the variant into `01-aspiration.tsx`**

Add the import:
```tsx
import { useVariant } from '@/hooks/useVariant';
```
Inside `Aspiration`, above the `return`:
```tsx
  const headlineVariant = useVariant('aspiration-headline');
  const headline =
    headlineVariant === 'v2' ? 'Draw nearer to God\neach day.' : 'You want to feel\ncloser to God.';
```
Replace the title `ThemedText` (lines 23-25) with:
```tsx
        <ThemedText variant="title" align="center">
          {headline}
        </ThemedText>
```

- [ ] **Step 4: Run it, expect green**

Run: `npm test -- screens-01-02`
Expected: PASS.

- [ ] **Step 5: Run the full suite**

Run: `npm test`
Expected: all PASS.

- [ ] **Step 6: Commit**

```bash
git add mobile/src/app/onboarding/01-aspiration.tsx mobile/src/app/onboarding/__tests__/screens-01-02.test.tsx
git commit -m "feat(mobile): reference A/B test on aspiration headline"
```

---

### Task 8: Setup runbook (dashboard config + keys)

**Files:**
- Create: `mobile/docs/revenuecat-posthog-setup.md`

**Interfaces:** none (documentation).

- [ ] **Step 1: Write the runbook**

`mobile/docs/revenuecat-posthog-setup.md`:
```markdown
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
```

- [ ] **Step 2: Commit**

```bash
git add mobile/docs/revenuecat-posthog-setup.md
git commit -m "docs(mobile): RevenueCat + PostHog setup runbook"
```

---

## Self-Review

**Spec coverage:**
- RevenueCat wrapper + offerings + purchase + entitlement + restore → Tasks 2, 6. ✔
- PostHog per-screen A/B mechanism (registry + hook + bootstrap defaults) → Tasks 3, 4. ✔
- Hard-paywall entitlement gating + fail-open + identity align → Task 5. ✔
- Paywall UI keeps custom design, RC prices, CTA A/B, Restore, Terms/Privacy → Task 6. ✔
- Reference onboarding A/B (screen 01) → Task 7. ✔
- EU host, placeholder keys, `pro` entitlement, config via `expo-constants` → Tasks 1, 8. ✔
- Dashboard config (RC↔PostHog integration, flag creation) → Task 8. ✔
- Tests for wrapper, hook, paywall, gate, screen 01 → Tasks 2,3,5,6,7. ✔

**Placeholder scan:** No TBD/TODO. Every code step shows full code. External-API caveats (offering package accessors, PostHog `bootstrap` shape) are flagged with a concrete fallback, not left vague.

**Type consistency:** `hasPro(info)`, `purchasePackage(pkg): CustomerInfo`, `getCurrentOffering(): PurchasesOffering | null`, `useVariant(key): VariantOf<K>`, `bootstrapFlags`, entitlement `'pro'`, flag keys `paywall-cta` / `aspiration-headline` — used consistently across tasks and tests.
