# Quiet Waters Onboarding Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the Quiet Waters iPhone app foundation and its complete 12-screen onboarding flow in Expo/React Native.

**Architecture:** A new Expo Router app under `mobile/`. Pure logic (number calculations, state, storage, haptics) lives in `src/lib` and `src/store` and is unit-tested. Reusable UI primitives live in `src/components`. Each onboarding screen is a thin Expo Router route that composes those primitives. A forward-only stack drives the funnel; the screen-3 answer feeds calculated numbers on screens 4 and 6; completing screen 12 persists an on-device flag and routes to a placeholder home.

**Tech Stack:** Expo (SDK 53+), TypeScript, Expo Router, Zustand, React Native Reanimated, expo-haptics, expo-linear-gradient, react-native-svg, expo-notifications, expo-font (@expo-google-fonts), @react-native-async-storage/async-storage, expo-splash-screen. Tests: Jest + @testing-library/react-native (jest-expo preset).

## Global Constraints

- **Platform:** iOS/iPhone only. Dev builds via `expo run:ios` (not Expo Go).
- **Expo SDK:** 53 or newer (required for the future `expo-apple-targets` island). Toolchain present: Node 26, Xcode 26.6.
- **No backend, no accounts, no cloud sync.** All state on-device.
- **No RevenueCat / no real purchases** this milestone. Paywall CTAs are visual only.
- **Wallpaper creator (screen 7) and app-home screenshot (screen 10) are dashed placeholders.**
- **Haptics required:** every CTA press fires `Haptics.impactAsync(Medium)`; the screen-6 prayer button fires a haptic pulse every 1000ms while held.
- **Screen-3 options (authoritative, from mockup):** `1-3`, `3-4`, `4-5`, `5-6`, `6-7`, `7+`. Default preselection: `4-5`.
- **Number formula:** midpoints `1-3→2, 3-4→3.5, 4-5→4.5, 5-6→5.5, 6-7→6.5, 7+→7.5`; `hoursPerYear=round(midpoint×365)`, `fullDays=round(hoursPerYear/24)`, `vowHours=round(hoursPerYear/10)`. Displayed with locale grouping. (`4-5` → 1,642 / 68 / 164.)
- **Navigation:** forward-only, no visible back button, swipe-back gesture disabled.
- **Brand colors:** primary `#1C3344`, deep `#2C4456`, mid `#5E8298`, soft `#8AA2B0`, accent `#9CC0D4`, pale `#C9DCE5` / `#E2ECEF`, surface `#F4F8F9` / `#FFFFFF`, muted text `#4C5C67` / `#7C8C97`, success green `#3E7C5A` (sampled; refine against screen-8 mockup).
- **Fonts:** Cormorant Garamond (serif), Hanken Grotesk (sans).
- **Mockups (visual source of truth):** `/Users/damianveltkamp/Documents/development/2nd-brain/saas/christian-apps/design/onboarding/01..12-quiet-waters-onboarding.png`.
- **Design spec:** `docs/superpowers/specs/2026-07-05-quiet-waters-onboarding-design.md`.

---

## File Structure

```
mobile/
├─ app.json                      # Expo config (name, bundle id, plugins, splash)
├─ package.json
├─ tsconfig.json                 # paths alias "@/*" -> "src/*"
├─ babel.config.js               # reanimated plugin
├─ jest.config.js / jest setup
├─ app/
│  ├─ _layout.tsx                # font load + splash gate + Stack root
│  ├─ index.tsx                  # entry: flag -> /home else /onboarding/01-aspiration
│  ├─ home.tsx                   # placeholder home
│  └─ onboarding/
│     ├─ _layout.tsx             # forward-only Stack (headerShown:false, gestureEnabled:false)
│     ├─ 01-aspiration.tsx  … 12-paywall-plans.tsx
├─ src/
│  ├─ theme/{colors,typography,spacing,index}.ts
│  ├─ lib/{calculations,haptics,storage}.ts
│  ├─ store/onboarding.ts
│  └─ components/
│     ├─ ThemedText.tsx  Screen.tsx  Eyebrow.tsx  Divider.tsx
│     ├─ CTAButton.tsx  RadioOption.tsx  PrayerButton.tsx
│     ├─ LockScreenPreview.tsx  NotificationPreview.tsx  PlaceholderBox.tsx
│     ├─ ScreenTimeCard.tsx  BarChart.tsx  PlanCard.tsx  TimelineStep.tsx
│     └─ index.ts
└─ assets/{fonts,images}/
```

---

## Shared Types (defined in Task 4 / Task 5, referenced throughout)

```ts
// src/lib/calculations.ts
export type HoursBucket = '1-3' | '3-4' | '4-5' | '5-6' | '6-7' | '7+';
export const HOURS_BUCKETS: HoursBucket[];
export function bucketMidpoint(bucket: HoursBucket): number;
export function hoursPerYear(bucket: HoursBucket): number;
export function fullDays(bucket: HoursBucket): number;
export function vowHours(bucket: HoursBucket): number;
export function formatNumber(n: number): string;

// src/store/onboarding.ts
export interface OnboardingState { bucket: HoursBucket; setBucket: (b: HoursBucket) => void; }
export const useOnboardingStore: import('zustand').UseBoundStore<...>;

// src/lib/storage.ts
export function setOnboardingComplete(): Promise<void>;
export function isOnboardingComplete(): Promise<boolean>;

// src/lib/haptics.ts
export function tapFeedback(): void;      // impactAsync(Medium)
export function successFeedback(): void;   // notificationAsync(Success)
export function pulseFeedback(): void;     // impactAsync(Medium) — used by prayer interval
```

---

### Task 1: Scaffold the Expo app

**Files:**
- Create: `mobile/` (via create-expo-app), `mobile/tsconfig.json` (edit), `mobile/babel.config.js`, `mobile/app.json` (edit)

**Interfaces:**
- Produces: a bootable Expo Router app; the `@/*` → `src/*` path alias.

- [ ] **Step 1: Create the project**

```bash
cd /Users/damianveltkamp/Documents/development/quiet-waters
npx create-expo-app@latest mobile --template default
cd mobile
```

- [ ] **Step 2: Install runtime dependencies**

```bash
cd /Users/damianveltkamp/Documents/development/quiet-waters/mobile
npx expo install expo-haptics expo-linear-gradient react-native-svg expo-notifications \
  expo-font @expo-google-fonts/cormorant-garamond @expo-google-fonts/hanken-grotesk \
  react-native-reanimated @react-native-async-storage/async-storage expo-splash-screen
npm install zustand
```

- [ ] **Step 3: Install dev/test dependencies**

```bash
npm install --save-dev jest jest-expo @testing-library/react-native @types/jest
```

- [ ] **Step 4: Configure the path alias in `tsconfig.json`**

```json
{
  "extends": "expo/tsconfig.base",
  "compilerOptions": {
    "strict": true,
    "baseUrl": ".",
    "paths": { "@/*": ["src/*"] }
  },
  "include": ["**/*.ts", "**/*.tsx", ".expo/types/**/*.ts", "expo-env.d.ts"]
}
```

- [ ] **Step 5: Add the Reanimated Babel plugin (`babel.config.js`)**

```js
module.exports = function (api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    plugins: ['react-native-reanimated/plugin'],
  };
};
```

- [ ] **Step 6: Configure Jest in `package.json`**

Add to `package.json`:

```json
"scripts": { "test": "jest", "ios": "expo run:ios" },
"jest": {
  "preset": "jest-expo",
  "setupFilesAfterEnv": ["@testing-library/react-native/extend-expect"],
  "transformIgnorePatterns": [
    "node_modules/(?!((jest-)?react-native|@react-native(-community)?|expo(nent)?|@expo(nent)?/.*|@expo-google-fonts/.*|react-navigation|@react-navigation/.*|@unimodules/.*|unimodules|sentry-expo|native-base|react-native-svg|zustand))"
  ]
}
```

- [ ] **Step 7: Remove the starter `app/(tabs)` scaffold; keep a temporary blank `app/index.tsx`**

```tsx
import { Text, View } from 'react-native';
export default function Index() {
  return <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}><Text>Quiet Waters</Text></View>;
}
```

- [ ] **Step 8: Verify it boots**

Run: `cd /Users/damianveltkamp/Documents/development/quiet-waters/mobile && npx expo run:ios`
Expected: app launches in the iOS simulator showing "Quiet Waters".

- [ ] **Step 9: Commit**

```bash
git add mobile
git commit -m "feat(mobile): scaffold Expo Router app with tooling"
```

---

### Task 2: Theme tokens & font assets

**Files:**
- Create: `mobile/src/theme/colors.ts`, `typography.ts`, `spacing.ts`, `index.ts`
- Test: `mobile/src/theme/__tests__/theme.test.ts`
- Assets: copy logo PNGs from `design/assets/` into `mobile/assets/images/`

**Interfaces:**
- Produces: `colors`, `spacing`, `typography`, `gradients` from `@/theme`.

- [ ] **Step 1: Copy brand assets**

```bash
cd /Users/damianveltkamp/Documents/development/quiet-waters
mkdir -p mobile/assets/images
cp design/assets/quiet-waters-symbol-slate-transparent-1024.png mobile/assets/images/symbol-slate.png
cp design/assets/quiet-waters-symbol-white-transparent-1024.png mobile/assets/images/symbol-white.png
cp design/assets/quiet-waters-app-icon-slate-1024.png mobile/assets/images/icon.png
```

- [ ] **Step 2: Write the failing test (`src/theme/__tests__/theme.test.ts`)**

```ts
import { colors, spacing, typography, gradients } from '@/theme';

test('exposes brand primary color', () => {
  expect(colors.primary).toBe('#1C3344');
});
test('spacing scale is 4-pt based', () => {
  expect(spacing.md).toBe(16);
});
test('typography defines serif and sans families', () => {
  expect(typography.families.serif).toContain('Cormorant');
  expect(typography.families.sans).toContain('Hanken');
});
test('gradients define light and dark stop pairs', () => {
  expect(gradients.light).toHaveLength(2);
  expect(gradients.dark).toHaveLength(2);
});
```

- [ ] **Step 3: Run test to verify it fails**

Run: `npm test -- theme`
Expected: FAIL — cannot find module `@/theme`.

- [ ] **Step 4: Implement `colors.ts`**

```ts
export const colors = {
  primary: '#1C3344',
  deep: '#2C4456',
  mid: '#5E8298',
  soft: '#8AA2B0',
  accent: '#9CC0D4',
  pale: '#C9DCE5',
  paleAlt: '#E2ECEF',
  surface: '#F4F8F9',
  white: '#FFFFFF',
  textMuted: '#4C5C67',
  textFaint: '#7C8C97',
  success: '#3E7C5A',
} as const;

export const gradients = {
  light: ['#FFFFFF', '#E2ECEF'] as [string, string],
  dark: ['#1C3344', '#0F1F2B'] as [string, string],
};
```

- [ ] **Step 5: Implement `spacing.ts`**

```ts
export const spacing = { xs: 4, sm: 8, md: 16, lg: 24, xl: 32, xxl: 48 } as const;
```

- [ ] **Step 6: Implement `typography.ts`**

```ts
export const typography = {
  families: {
    serif: 'CormorantGaramond_500Medium',
    serifSemibold: 'CormorantGaramond_600SemiBold',
    serifItalic: 'CormorantGaramond_500Medium_Italic',
    sans: 'HankenGrotesk_400Regular',
    sansMedium: 'HankenGrotesk_500Medium',
    sansSemibold: 'HankenGrotesk_600SemiBold',
  },
  variants: {
    display: { fontFamily: 'CormorantGaramond_600SemiBold', fontSize: 64, lineHeight: 68 },
    title: { fontFamily: 'CormorantGaramond_600SemiBold', fontSize: 32, lineHeight: 38 },
    quote: { fontFamily: 'CormorantGaramond_500Medium_Italic', fontSize: 22, lineHeight: 30 },
    eyebrow: { fontFamily: 'HankenGrotesk_600SemiBold', fontSize: 12, letterSpacing: 2, textTransform: 'uppercase' as const },
    body: { fontFamily: 'HankenGrotesk_400Regular', fontSize: 16, lineHeight: 24 },
    caption: { fontFamily: 'HankenGrotesk_400Regular', fontSize: 13, lineHeight: 18 },
    button: { fontFamily: 'HankenGrotesk_600SemiBold', fontSize: 16 },
  },
} as const;
```

- [ ] **Step 7: Implement `index.ts`**

```ts
export { colors, gradients } from './colors';
export { spacing } from './spacing';
export { typography } from './typography';
```

- [ ] **Step 8: Run tests to verify pass**

Run: `npm test -- theme`
Expected: PASS (4 tests).

- [ ] **Step 9: Commit**

```bash
git add mobile/src/theme mobile/assets
git commit -m "feat(mobile): add theme tokens and brand assets"
```

---

### Task 3: Font loading, splash gate & entry routing

**Files:**
- Modify: `mobile/app/_layout.tsx`, `mobile/app/index.tsx`
- Create: `mobile/app/home.tsx`

**Interfaces:**
- Consumes: `isOnboardingComplete()` (Task 6 — until then, hard-code `false` and wire in Task 6). *Order note: implement Task 6 before this if executing strictly; otherwise stub `isOnboardingComplete` inline and replace.*
- Produces: font-gated app root; entry redirect.

- [ ] **Step 1: Implement `app/_layout.tsx` (font load + splash gate)**

```tsx
import { useFonts, CormorantGaramond_500Medium, CormorantGaramond_600SemiBold, CormorantGaramond_500Medium_Italic } from '@expo-google-fonts/cormorant-garamond';
import { HankenGrotesk_400Regular, HankenGrotesk_500Medium, HankenGrotesk_600SemiBold } from '@expo-google-fonts/hanken-grotesk';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [loaded] = useFonts({
    CormorantGaramond_500Medium, CormorantGaramond_600SemiBold, CormorantGaramond_500Medium_Italic,
    HankenGrotesk_400Regular, HankenGrotesk_500Medium, HankenGrotesk_600SemiBold,
  });
  useEffect(() => { if (loaded) SplashScreen.hideAsync(); }, [loaded]);
  if (!loaded) return null;
  return <Stack screenOptions={{ headerShown: false }} />;
}
```

- [ ] **Step 2: Implement `app/index.tsx` (entry redirect)**

```tsx
import { Redirect } from 'expo-router';
import { useEffect, useState } from 'react';
import { isOnboardingComplete } from '@/lib/storage';

export default function Index() {
  const [done, setDone] = useState<boolean | null>(null);
  useEffect(() => { isOnboardingComplete().then(setDone); }, []);
  if (done === null) return null;
  return <Redirect href={done ? '/home' : '/onboarding/01-aspiration'} />;
}
```

- [ ] **Step 3: Implement placeholder `app/home.tsx`**

```tsx
import { View } from 'react-native';
import { Screen } from '@/components';
import { ThemedText } from '@/components';

export default function Home() {
  return (
    <Screen variant="light">
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
        <ThemedText variant="title">Quiet Waters</ThemedText>
        <ThemedText variant="body">Home — coming soon</ThemedText>
      </View>
    </Screen>
  );
}
```

- [ ] **Step 4: Verify boot (after Screen/ThemedText exist)**

Run: `npx expo run:ios`
Expected: no font flash; app lands on onboarding screen 1 route (once screens exist) or errors only on not-yet-created routes.

- [ ] **Step 5: Commit**

```bash
git add mobile/app
git commit -m "feat(mobile): font gate and entry routing"
```

---

### Task 4: Number calculations (pure, TDD)

**Files:**
- Create: `mobile/src/lib/calculations.ts`
- Test: `mobile/src/lib/__tests__/calculations.test.ts`

**Interfaces:**
- Produces: `HoursBucket`, `HOURS_BUCKETS`, `bucketMidpoint`, `hoursPerYear`, `fullDays`, `vowHours`, `formatNumber` (signatures in Shared Types).

- [ ] **Step 1: Write the failing test**

```ts
import { bucketMidpoint, hoursPerYear, fullDays, vowHours, formatNumber, HOURS_BUCKETS } from '@/lib/calculations';

test('has six ordered buckets', () => {
  expect(HOURS_BUCKETS).toEqual(['1-3', '3-4', '4-5', '5-6', '6-7', '7+']);
});
test('midpoints', () => {
  expect(bucketMidpoint('1-3')).toBe(2);
  expect(bucketMidpoint('4-5')).toBe(4.5);
  expect(bucketMidpoint('7+')).toBe(7.5);
});
test('4-5 bucket matches mockup numbers', () => {
  expect(hoursPerYear('4-5')).toBe(1642);
  expect(fullDays('4-5')).toBe(68);
  expect(vowHours('4-5')).toBe(164);
});
test('formats with locale grouping', () => {
  expect(formatNumber(1642)).toBe('1,642');
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- calculations`
Expected: FAIL — module not found.

- [ ] **Step 3: Implement `calculations.ts`**

```ts
export type HoursBucket = '1-3' | '3-4' | '4-5' | '5-6' | '6-7' | '7+';
export const HOURS_BUCKETS: HoursBucket[] = ['1-3', '3-4', '4-5', '5-6', '6-7', '7+'];

const MIDPOINTS: Record<HoursBucket, number> = {
  '1-3': 2, '3-4': 3.5, '4-5': 4.5, '5-6': 5.5, '6-7': 6.5, '7+': 7.5,
};

export function bucketMidpoint(bucket: HoursBucket): number { return MIDPOINTS[bucket]; }
export function hoursPerYear(bucket: HoursBucket): number { return Math.round(bucketMidpoint(bucket) * 365); }
export function fullDays(bucket: HoursBucket): number { return Math.round(hoursPerYear(bucket) / 24); }
export function vowHours(bucket: HoursBucket): number { return Math.round(hoursPerYear(bucket) / 10); }
export function formatNumber(n: number): string { return n.toLocaleString('en-US'); }
```

- [ ] **Step 4: Run tests to verify pass**

Run: `npm test -- calculations`
Expected: PASS (4 tests).

- [ ] **Step 5: Commit**

```bash
git add mobile/src/lib/calculations.ts mobile/src/lib/__tests__/calculations.test.ts
git commit -m "feat(mobile): verse-time calculations"
```

---

### Task 5: Onboarding store (Zustand, TDD)

**Files:**
- Create: `mobile/src/store/onboarding.ts`
- Test: `mobile/src/store/__tests__/onboarding.test.ts`

**Interfaces:**
- Consumes: `HoursBucket` from `@/lib/calculations`.
- Produces: `useOnboardingStore` with `{ bucket, setBucket }`, default `bucket='4-5'`.

- [ ] **Step 1: Write the failing test**

```ts
import { useOnboardingStore } from '@/store/onboarding';

test('defaults to 4-5 bucket', () => {
  expect(useOnboardingStore.getState().bucket).toBe('4-5');
});
test('setBucket updates selection', () => {
  useOnboardingStore.getState().setBucket('7+');
  expect(useOnboardingStore.getState().bucket).toBe('7+');
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- onboarding`
Expected: FAIL — module not found.

- [ ] **Step 3: Implement `store/onboarding.ts`**

```ts
import { create } from 'zustand';
import type { HoursBucket } from '@/lib/calculations';

export interface OnboardingState {
  bucket: HoursBucket;
  setBucket: (b: HoursBucket) => void;
}

export const useOnboardingStore = create<OnboardingState>((set) => ({
  bucket: '4-5',
  setBucket: (bucket) => set({ bucket }),
}));
```

- [ ] **Step 4: Run tests to verify pass**

Run: `npm test -- onboarding`
Expected: PASS (2 tests).

- [ ] **Step 5: Commit**

```bash
git add mobile/src/store
git commit -m "feat(mobile): onboarding answer store"
```

---

### Task 6: Completion flag storage (TDD)

**Files:**
- Create: `mobile/src/lib/storage.ts`
- Test: `mobile/src/lib/__tests__/storage.test.ts`

**Interfaces:**
- Produces: `setOnboardingComplete()`, `isOnboardingComplete()`.

- [ ] **Step 1: Write the failing test (mock AsyncStorage)**

```ts
import AsyncStorage from '@react-native-async-storage/async-storage';
import { setOnboardingComplete, isOnboardingComplete } from '@/lib/storage';

jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock'));

beforeEach(async () => { await AsyncStorage.clear(); });

test('defaults to not complete', async () => {
  expect(await isOnboardingComplete()).toBe(false);
});
test('persists completion', async () => {
  await setOnboardingComplete();
  expect(await isOnboardingComplete()).toBe(true);
});
test('read failure fails safe to false', async () => {
  (AsyncStorage.getItem as jest.Mock).mockRejectedValueOnce(new Error('boom'));
  expect(await isOnboardingComplete()).toBe(false);
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- storage`
Expected: FAIL — module not found.

- [ ] **Step 3: Implement `storage.ts`**

```ts
import AsyncStorage from '@react-native-async-storage/async-storage';

const KEY = 'quietwaters.onboardingComplete';

export async function setOnboardingComplete(): Promise<void> {
  await AsyncStorage.setItem(KEY, 'true');
}

export async function isOnboardingComplete(): Promise<boolean> {
  try {
    return (await AsyncStorage.getItem(KEY)) === 'true';
  } catch {
    return false; // fail safe: show onboarding
  }
}
```

- [ ] **Step 4: Run tests to verify pass**

Run: `npm test -- storage`
Expected: PASS (3 tests).

- [ ] **Step 5: Commit**

```bash
git add mobile/src/lib/storage.ts mobile/src/lib/__tests__/storage.test.ts
git commit -m "feat(mobile): onboarding completion flag storage"
```

---

### Task 7: Haptics helper (TDD)

**Files:**
- Create: `mobile/src/lib/haptics.ts`
- Test: `mobile/src/lib/__tests__/haptics.test.ts`

**Interfaces:**
- Produces: `tapFeedback()`, `successFeedback()`, `pulseFeedback()`.

- [ ] **Step 1: Write the failing test (mock expo-haptics)**

```ts
import * as Haptics from 'expo-haptics';
import { tapFeedback, successFeedback, pulseFeedback } from '@/lib/haptics';

jest.mock('expo-haptics', () => ({
  impactAsync: jest.fn(),
  notificationAsync: jest.fn(),
  ImpactFeedbackStyle: { Medium: 'medium' },
  NotificationFeedbackType: { Success: 'success' },
}));

test('tap fires medium impact', () => {
  tapFeedback();
  expect(Haptics.impactAsync).toHaveBeenCalledWith('medium');
});
test('success fires success notification', () => {
  successFeedback();
  expect(Haptics.notificationAsync).toHaveBeenCalledWith('success');
});
test('pulse fires medium impact', () => {
  pulseFeedback();
  expect(Haptics.impactAsync).toHaveBeenCalledWith('medium');
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- haptics`
Expected: FAIL — module not found.

- [ ] **Step 3: Implement `haptics.ts`**

```ts
import * as Haptics from 'expo-haptics';

export function tapFeedback(): void { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); }
export function successFeedback(): void { Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success); }
export function pulseFeedback(): void { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); }
```

- [ ] **Step 4: Run tests to verify pass**

Run: `npm test -- haptics`
Expected: PASS (3 tests).

- [ ] **Step 5: Commit**

```bash
git add mobile/src/lib/haptics.ts mobile/src/lib/__tests__/haptics.test.ts
git commit -m "feat(mobile): haptics helpers"
```

---

### Task 8: Layout primitives — Screen, ThemedText, Eyebrow, Divider

**Files:**
- Create: `mobile/src/components/{Screen,ThemedText,Eyebrow,Divider}.tsx`, `mobile/src/components/index.ts`
- Test: `mobile/src/components/__tests__/primitives.test.tsx`

**Interfaces:**
- Consumes: `@/theme`.
- Produces:
  - `Screen({ variant: 'light'|'dark', children, contentStyle? })`
  - `ThemedText({ variant: keyof typeof typography.variants, color?, align?, children, style? })`
  - `Eyebrow({ children, color? })`
  - `Divider()`

- [ ] **Step 1: Write the failing test**

```tsx
import { render, screen } from '@testing-library/react-native';
import { ThemedText, Eyebrow } from '@/components';

test('ThemedText renders its text', () => {
  render(<ThemedText variant="title">Hello</ThemedText>);
  expect(screen.getByText('Hello')).toBeOnTheScreen();
});
test('Eyebrow uppercases via style', () => {
  render(<Eyebrow>begin</Eyebrow>);
  expect(screen.getByText('begin')).toBeOnTheScreen();
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- primitives`
Expected: FAIL — module not found.

- [ ] **Step 3: Implement `ThemedText.tsx`**

```tsx
import { Text, TextProps, StyleProp, TextStyle } from 'react-native';
import { typography, colors } from '@/theme';

type Variant = keyof typeof typography.variants;
interface Props extends TextProps {
  variant: Variant;
  color?: string;
  align?: 'left' | 'center' | 'right';
  style?: StyleProp<TextStyle>;
}
export function ThemedText({ variant, color = colors.primary, align = 'left', style, ...rest }: Props) {
  return <Text style={[typography.variants[variant], { color, textAlign: align }, style]} {...rest} />;
}
```

- [ ] **Step 4: Implement `Screen.tsx`**

```tsx
import { StyleProp, ViewStyle, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { gradients, spacing } from '@/theme';

interface Props { variant: 'light' | 'dark'; children: React.ReactNode; contentStyle?: StyleProp<ViewStyle>; }
export function Screen({ variant, children, contentStyle }: Props) {
  return (
    <LinearGradient colors={gradients[variant]} style={{ flex: 1 }}>
      <SafeAreaView style={{ flex: 1 }}>
        <View style={[{ flex: 1, paddingHorizontal: spacing.lg }, contentStyle]}>{children}</View>
      </SafeAreaView>
    </LinearGradient>
  );
}
```

Note: ensure `SafeAreaProvider` wraps the app — add it in `app/_layout.tsx` around `<Stack>` (import from `react-native-safe-area-context`, already an Expo dep).

- [ ] **Step 5: Implement `Eyebrow.tsx` and `Divider.tsx`**

```tsx
// Eyebrow.tsx
import { ThemedText } from './ThemedText';
import { colors } from '@/theme';
export function Eyebrow({ children, color = colors.mid }: { children: React.ReactNode; color?: string }) {
  return <ThemedText variant="eyebrow" color={color}>{children}</ThemedText>;
}
```

```tsx
// Divider.tsx
import { View } from 'react-native';
import { colors } from '@/theme';
export function Divider() {
  return <View style={{ width: 40, height: 1, backgroundColor: colors.soft, marginVertical: 16 }} />;
}
```

- [ ] **Step 6: Implement `components/index.ts`**

```ts
export { Screen } from './Screen';
export { ThemedText } from './ThemedText';
export { Eyebrow } from './Eyebrow';
export { Divider } from './Divider';
```

- [ ] **Step 7: Run tests to verify pass**

Run: `npm test -- primitives`
Expected: PASS (2 tests).

- [ ] **Step 8: Commit**

```bash
git add mobile/src/components mobile/app/_layout.tsx
git commit -m "feat(mobile): layout primitives (Screen, ThemedText, Eyebrow, Divider)"
```

---

### Task 9: CTAButton with haptics (TDD)

**Files:**
- Create: `mobile/src/components/CTAButton.tsx`; export from `components/index.ts`
- Test: `mobile/src/components/__tests__/CTAButton.test.tsx`

**Interfaces:**
- Consumes: `tapFeedback` (`@/lib/haptics`), theme.
- Produces: `CTAButton({ label, onPress, variant?: 'primary'|'secondary' })`.

- [ ] **Step 1: Write the failing test**

```tsx
import { render, screen, fireEvent } from '@testing-library/react-native';
import { CTAButton } from '@/components';
import { tapFeedback } from '@/lib/haptics';

jest.mock('@/lib/haptics', () => ({ tapFeedback: jest.fn() }));

test('fires haptic and onPress when pressed', () => {
  const onPress = jest.fn();
  render(<CTAButton label="Continue" onPress={onPress} />);
  fireEvent.press(screen.getByText('Continue'));
  expect(tapFeedback).toHaveBeenCalledTimes(1);
  expect(onPress).toHaveBeenCalledTimes(1);
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- CTAButton`
Expected: FAIL — module not found.

- [ ] **Step 3: Implement `CTAButton.tsx`**

```tsx
import { Pressable } from 'react-native';
import { ThemedText } from './ThemedText';
import { colors, spacing } from '@/theme';
import { tapFeedback } from '@/lib/haptics';

interface Props { label: string; onPress: () => void; variant?: 'primary' | 'secondary'; }
export function CTAButton({ label, onPress, variant = 'primary' }: Props) {
  const bg = variant === 'primary' ? colors.primary : colors.accent;
  const fg = variant === 'primary' ? colors.white : colors.primary;
  const handle = () => { tapFeedback(); onPress(); };
  return (
    <Pressable
      onPress={handle}
      style={({ pressed }) => ({
        backgroundColor: bg, opacity: pressed ? 0.9 : 1,
        borderRadius: 999, paddingVertical: spacing.md + 2, alignItems: 'center',
      })}
    >
      <ThemedText variant="button" color={fg}>{label}</ThemedText>
    </Pressable>
  );
}
```

- [ ] **Step 4: Run tests to verify pass**

Run: `npm test -- CTAButton`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add mobile/src/components/CTAButton.tsx mobile/src/components/index.ts mobile/src/components/__tests__/CTAButton.test.tsx
git commit -m "feat(mobile): CTAButton with built-in haptics"
```

---

### Task 10: RadioOption (TDD)

**Files:**
- Create: `mobile/src/components/RadioOption.tsx`; export from index
- Test: `mobile/src/components/__tests__/RadioOption.test.tsx`

**Interfaces:**
- Produces: `RadioOption({ label, selected, onPress })`.

- [ ] **Step 1: Write the failing test**

```tsx
import { render, screen, fireEvent } from '@testing-library/react-native';
import { RadioOption } from '@/components';

test('calls onPress with its label region', () => {
  const onPress = jest.fn();
  render(<RadioOption label="4-5 hours" selected={false} onPress={onPress} />);
  fireEvent.press(screen.getByText('4-5 hours'));
  expect(onPress).toHaveBeenCalledTimes(1);
});
test('renders selected state', () => {
  render(<RadioOption label="4-5 hours" selected onPress={() => {}} />);
  expect(screen.getByText('4-5 hours')).toBeOnTheScreen();
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- RadioOption`
Expected: FAIL — module not found.

- [ ] **Step 3: Implement `RadioOption.tsx`**

```tsx
import { Pressable, View } from 'react-native';
import { ThemedText } from './ThemedText';
import { colors, spacing } from '@/theme';

interface Props { label: string; selected: boolean; onPress: () => void; }
export function RadioOption({ label, selected, onPress }: Props) {
  return (
    <Pressable
      onPress={onPress}
      style={{
        flexDirection: 'row', alignItems: 'center', gap: spacing.md,
        backgroundColor: selected ? colors.primary : colors.white,
        borderRadius: 16, paddingVertical: spacing.md, paddingHorizontal: spacing.md,
        marginBottom: spacing.sm,
      }}
    >
      <View style={{
        width: 22, height: 22, borderRadius: 11, borderWidth: 2,
        borderColor: selected ? colors.white : colors.soft,
        alignItems: 'center', justifyContent: 'center',
      }}>
        {selected && <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: colors.white }} />}
      </View>
      <ThemedText variant="body" color={selected ? colors.white : colors.primary}>{label}</ThemedText>
    </Pressable>
  );
}
```

- [ ] **Step 4: Run tests to verify pass**

Run: `npm test -- RadioOption`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add mobile/src/components/RadioOption.tsx mobile/src/components/index.ts mobile/src/components/__tests__/RadioOption.test.tsx
git commit -m "feat(mobile): RadioOption"
```

---

### Task 11: PrayerButton — hold ring + 1s haptic pulse

**Files:**
- Create: `mobile/src/components/PrayerButton.tsx`; export from index
- Test: `mobile/src/components/__tests__/PrayerButton.test.tsx`

**Interfaces:**
- Consumes: `pulseFeedback`, `successFeedback` (`@/lib/haptics`); `react-native-reanimated`; `react-native-svg`.
- Produces: `PrayerButton({ onComplete, holdDurationMs? })` (default 3000). Fires `pulseFeedback` immediately on press-in and every 1000ms while held; on reaching full duration calls `successFeedback()` then `onComplete()`; on early release clears timers and resets.

- [ ] **Step 1: Write the failing test (fake timers)**

```tsx
import { render, screen, fireEvent, act } from '@testing-library/react-native';
import { PrayerButton } from '@/components';
import { pulseFeedback, successFeedback } from '@/lib/haptics';

jest.mock('@/lib/haptics', () => ({ pulseFeedback: jest.fn(), successFeedback: jest.fn() }));
jest.useFakeTimers();

test('pulses every second and completes after hold duration', () => {
  const onComplete = jest.fn();
  render(<PrayerButton onComplete={onComplete} holdDurationMs={3000} />);
  const btn = screen.getByTestId('prayer-button');

  fireEvent(btn, 'pressIn');
  expect(pulseFeedback).toHaveBeenCalledTimes(1);            // immediate pulse

  act(() => { jest.advanceTimersByTime(1000); });
  act(() => { jest.advanceTimersByTime(1000); });
  expect(pulseFeedback).toHaveBeenCalledTimes(3);            // t0 + 1s + 2s

  act(() => { jest.advanceTimersByTime(1000); });            // reaches 3s
  expect(successFeedback).toHaveBeenCalledTimes(1);
  expect(onComplete).toHaveBeenCalledTimes(1);
});

test('early release cancels without completing', () => {
  const onComplete = jest.fn();
  render(<PrayerButton onComplete={onComplete} holdDurationMs={3000} />);
  const btn = screen.getByTestId('prayer-button');
  fireEvent(btn, 'pressIn');
  act(() => { jest.advanceTimersByTime(1000); });
  fireEvent(btn, 'pressOut');
  act(() => { jest.advanceTimersByTime(5000); });
  expect(onComplete).not.toHaveBeenCalled();
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- PrayerButton`
Expected: FAIL — module not found.

- [ ] **Step 3: Implement `PrayerButton.tsx`**

```tsx
import { useEffect, useRef, useState } from 'react';
import { Pressable, View } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import { Image } from 'react-native';
import { colors } from '@/theme';
import { pulseFeedback, successFeedback } from '@/lib/haptics';

interface Props { onComplete: () => void; holdDurationMs?: number; }
const SIZE = 140, STROKE = 4, R = (SIZE - STROKE) / 2, C = 2 * Math.PI * R;

export function PrayerButton({ onComplete, holdDurationMs = 3000 }: Props) {
  const [progress, setProgress] = useState(0); // 0..1
  const pulseTimer = useRef<ReturnType<typeof setInterval> | null>(null);
  const progressTimer = useRef<ReturnType<typeof setInterval> | null>(null);
  const startedAt = useRef<number>(0);

  const clearAll = () => {
    if (pulseTimer.current) clearInterval(pulseTimer.current);
    if (progressTimer.current) clearInterval(progressTimer.current);
    pulseTimer.current = null; progressTimer.current = null;
  };
  useEffect(() => clearAll, []);

  const start = () => {
    startedAt.current = Date.now();
    setProgress(0);
    pulseFeedback();                                   // immediate pulse
    pulseTimer.current = setInterval(pulseFeedback, 1000);
    progressTimer.current = setInterval(() => {
      const elapsed = Date.now() - startedAt.current;
      const p = Math.min(elapsed / holdDurationMs, 1);
      setProgress(p);
      if (p >= 1) { clearAll(); successFeedback(); onComplete(); }
    }, 50);
  };
  const stop = () => { clearAll(); setProgress(0); };

  return (
    <Pressable testID="prayer-button" onPressIn={start} onPressOut={stop}
      style={{ width: SIZE, height: SIZE, alignItems: 'center', justifyContent: 'center' }}>
      <Svg width={SIZE} height={SIZE} style={{ position: 'absolute' }}>
        <Circle cx={SIZE/2} cy={SIZE/2} r={R} stroke={colors.deep} strokeWidth={STROKE} fill="none" />
        <Circle cx={SIZE/2} cy={SIZE/2} r={R} stroke={colors.accent} strokeWidth={STROKE} fill="none"
          strokeDasharray={C} strokeDashoffset={C * (1 - progress)} strokeLinecap="round"
          transform={`rotate(-90 ${SIZE/2} ${SIZE/2})`} />
      </Svg>
      <View style={{ width: SIZE-24, height: SIZE-24, borderRadius: (SIZE-24)/2, backgroundColor: colors.deep, alignItems: 'center', justifyContent: 'center' }}>
        <Image source={require('../../assets/images/symbol-white.png')} style={{ width: 36, height: 36, resizeMode: 'contain' }} />
      </View>
    </Pressable>
  );
}
```

Note: uses `setInterval` for progress (test-friendly with fake timers) rather than a Reanimated-only loop; the SVG ring reflects `progress` state. Visual smoothness at 50ms tick is sufficient.

- [ ] **Step 4: Run tests to verify pass**

Run: `npm test -- PrayerButton`
Expected: PASS (2 tests).

- [ ] **Step 5: Commit**

```bash
git add mobile/src/components/PrayerButton.tsx mobile/src/components/index.ts mobile/src/components/__tests__/PrayerButton.test.tsx
git commit -m "feat(mobile): tap-and-hold PrayerButton with 1s haptic pulse"
```

---

### Task 12: Presentational components

Build the remaining display components. Each gets a render smoke test in `mobile/src/components/__tests__/presentational.test.tsx`. Match visuals to the mockups; exact paddings/shadows are tuned during the verification pass (Task 20).

**Files:**
- Create: `LockScreenPreview.tsx`, `NotificationPreview.tsx`, `PlaceholderBox.tsx`, `ScreenTimeCard.tsx`, `BarChart.tsx`, `PlanCard.tsx`, `TimelineStep.tsx`; export all from `components/index.ts`
- Test: `mobile/src/components/__tests__/presentational.test.tsx`

**Interfaces (props):**
- `LockScreenPreview({ verse: string, reference: string, showTodayWidget?: boolean, showBranding?: boolean })` — dark rounded card: "Saturday, July 5", `9:41`, cross, verse (serif italic), reference (eyebrow). `showTodayWidget` renders the "TODAY'S VERSE / Be still, and know…" pill (screen 5). `showBranding` renders "QUIET WATERS" footer (screen 8).
- `NotificationPreview({ title: string, body: string })` — white rounded notif card with app icon, "QUIET WATERS", title, italic body, "now".
- `PlaceholderBox({ label: string, sublabel: string })` — dashed-border box with centered cross glyph + label (eyebrow) + sublabel (caption, monospace-ish faint).
- `ScreenTimeCard({ hoursLabel: string, caption: string })` — dark card: "SCREEN TIME" / "Global average", big serif `hoursLabel` ("4h+"), caption, `<BarChart>`, weekday letters M–S.
- `BarChart({ values: number[] })` — 7 vertical bars scaled to max; last two taller per mockup.
- `PlanCard({ title, priceLabel, subLabel, periodLabel, selected, badge?, onPress })` — subscription row; radio, title/sub, price/period, optional dark "SAVE 92%" badge.
- `TimelineStep({ icon: 'lock'|'bell'|'sparkle', title, body, isLast? })` — vertical connector + icon bubble + title/body.

- [ ] **Step 1: Write the smoke test**

```tsx
import { render, screen } from '@testing-library/react-native';
import { LockScreenPreview, NotificationPreview, PlaceholderBox, ScreenTimeCard, BarChart, PlanCard, TimelineStep } from '@/components';

test('LockScreenPreview shows verse and reference', () => {
  render(<LockScreenPreview verse="He leads me beside quiet waters." reference="Psalm 23:2" />);
  expect(screen.getByText('He leads me beside quiet waters.')).toBeOnTheScreen();
  expect(screen.getByText('Psalm 23:2')).toBeOnTheScreen();
});
test('NotificationPreview shows title and body', () => {
  render(<NotificationPreview title="Your verse for today" body="Be still, and know that I am God." />);
  expect(screen.getByText('Your verse for today')).toBeOnTheScreen();
});
test('PlaceholderBox shows label', () => {
  render(<PlaceholderBox label="Wallpaper Creator" sublabel="feature UI to be placed here" />);
  expect(screen.getByText('Wallpaper Creator')).toBeOnTheScreen();
});
test('ScreenTimeCard shows hours label', () => {
  render(<ScreenTimeCard hoursLabel="4h+" caption="the average person spends more than 4 hours per day on their phone" />);
  expect(screen.getByText('4h+')).toBeOnTheScreen();
});
test('BarChart renders without crashing', () => {
  render(<BarChart values={[3, 2, 4, 3, 3, 5, 5]} />);
});
test('PlanCard shows price and badge', () => {
  render(<PlanCard title="Yearly" priceLabel="$59.99" subLabel="Only $1.15 / week" periodLabel="/ year" selected badge="SAVE 92%" onPress={() => {}} />);
  expect(screen.getByText('$59.99')).toBeOnTheScreen();
  expect(screen.getByText('SAVE 92%')).toBeOnTheScreen();
});
test('TimelineStep shows title and body', () => {
  render(<TimelineStep icon="lock" title="Today" body="Unlock full access to Quiet Waters" />);
  expect(screen.getByText('Today')).toBeOnTheScreen();
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- presentational`
Expected: FAIL — modules not found.

- [ ] **Step 3: Implement the seven components**

Implement each using `ThemedText`, theme tokens, and `react-native-svg` (for the cross glyph in `PlaceholderBox`, icons in `TimelineStep`, and bars if preferred). Reference mockups 2, 5, 7, 8, 9, 10, 12. Key structures:

```tsx
// PlaceholderBox.tsx
import { View } from 'react-native';
import { Image } from 'react-native';
import { ThemedText } from './ThemedText';
import { colors, spacing } from '@/theme';
export function PlaceholderBox({ label, sublabel }: { label: string; sublabel: string }) {
  return (
    <View style={{ flex: 1, borderWidth: 1.5, borderColor: colors.pale, borderStyle: 'dashed',
      borderRadius: 20, alignItems: 'center', justifyContent: 'center', gap: spacing.sm, padding: spacing.lg }}>
      <View style={{ width: 56, height: 56, borderRadius: 12, borderWidth: 1, borderColor: colors.pale, alignItems: 'center', justifyContent: 'center' }}>
        <Image source={require('../../assets/images/symbol-slate.png')} style={{ width: 24, height: 24, resizeMode: 'contain' }} />
      </View>
      <ThemedText variant="eyebrow" color={colors.mid} align="center">{label}</ThemedText>
      <ThemedText variant="caption" color={colors.textFaint} align="center">{sublabel}</ThemedText>
    </View>
  );
}
```

```tsx
// LockScreenPreview.tsx (structure)
import { View, Image } from 'react-native';
import { ThemedText } from './ThemedText';
import { colors, spacing } from '@/theme';
interface Props { verse: string; reference: string; showTodayWidget?: boolean; showBranding?: boolean; }
export function LockScreenPreview({ verse, reference, showTodayWidget, showBranding }: Props) {
  return (
    <View style={{ backgroundColor: colors.primary, borderRadius: 28, padding: spacing.lg, alignItems: 'center', gap: spacing.sm }}>
      <ThemedText variant="caption" color={colors.pale} align="center">Saturday, July 5</ThemedText>
      <ThemedText variant="display" color={colors.white} style={{ fontSize: 56, lineHeight: 60 }}>9:41</ThemedText>
      <Image source={require('../../assets/images/symbol-white.png')} style={{ width: 20, height: 20, resizeMode: 'contain', marginVertical: spacing.sm }} />
      <ThemedText variant="quote" color={colors.white} align="center">{`“${verse}”`}</ThemedText>
      <ThemedText variant="eyebrow" color={colors.soft}>{reference}</ThemedText>
      {showTodayWidget && (
        <View style={{ marginTop: spacing.md, backgroundColor: colors.deep, borderRadius: 14, padding: spacing.md, alignSelf: 'stretch' }}>
          <ThemedText variant="eyebrow" color={colors.soft}>Today's verse</ThemedText>
          <ThemedText variant="quote" color={colors.pale}>Be still, and know…</ThemedText>
        </View>
      )}
      {showBranding && <ThemedText variant="eyebrow" color={colors.soft} style={{ marginTop: spacing.md }}>Quiet Waters</ThemedText>}
    </View>
  );
}
```

Implement `NotificationPreview`, `ScreenTimeCard`, `BarChart`, `PlanCard`, `TimelineStep` analogously against their mockups.

- [ ] **Step 4: Add all exports to `components/index.ts`**

```ts
export { CTAButton } from './CTAButton';
export { RadioOption } from './RadioOption';
export { PrayerButton } from './PrayerButton';
export { LockScreenPreview } from './LockScreenPreview';
export { NotificationPreview } from './NotificationPreview';
export { PlaceholderBox } from './PlaceholderBox';
export { ScreenTimeCard } from './ScreenTimeCard';
export { BarChart } from './BarChart';
export { PlanCard } from './PlanCard';
export { TimelineStep } from './TimelineStep';
```

- [ ] **Step 5: Run tests to verify pass**

Run: `npm test -- presentational`
Expected: PASS (7 tests).

- [ ] **Step 6: Commit**

```bash
git add mobile/src/components
git commit -m "feat(mobile): presentational onboarding components"
```

---

### Task 13: Onboarding stack layout + navigation helper

**Files:**
- Create: `mobile/app/onboarding/_layout.tsx`
- Create: `mobile/src/lib/onboardingRoutes.ts`
- Test: `mobile/src/lib/__tests__/onboardingRoutes.test.ts`

**Interfaces:**
- Produces: `ONBOARDING_ROUTES: string[]` (ordered) and `nextRoute(current: string): string | null`.

- [ ] **Step 1: Write the failing test**

```ts
import { ONBOARDING_ROUTES, nextRoute } from '@/lib/onboardingRoutes';

test('has 12 ordered routes', () => {
  expect(ONBOARDING_ROUTES).toHaveLength(12);
  expect(ONBOARDING_ROUTES[0]).toBe('/onboarding/01-aspiration');
});
test('nextRoute returns following route', () => {
  expect(nextRoute('/onboarding/01-aspiration')).toBe('/onboarding/02-problem');
});
test('nextRoute returns null past the end', () => {
  expect(nextRoute('/onboarding/12-paywall-plans')).toBeNull();
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- onboardingRoutes`
Expected: FAIL — module not found.

- [ ] **Step 3: Implement `onboardingRoutes.ts`**

```ts
export const ONBOARDING_ROUTES = [
  '/onboarding/01-aspiration', '/onboarding/02-problem', '/onboarding/03-question',
  '/onboarding/04-stakes', '/onboarding/05-promise', '/onboarding/06-vow',
  '/onboarding/07-wow', '/onboarding/08-land', '/onboarding/09-permissions',
  '/onboarding/10-paywall-intro', '/onboarding/11-paywall-reminder', '/onboarding/12-paywall-plans',
] as const;

export function nextRoute(current: string): string | null {
  const i = ONBOARDING_ROUTES.indexOf(current as (typeof ONBOARDING_ROUTES)[number]);
  if (i === -1 || i === ONBOARDING_ROUTES.length - 1) return null;
  return ONBOARDING_ROUTES[i + 1];
}
```

- [ ] **Step 4: Implement `app/onboarding/_layout.tsx`**

```tsx
import { Stack } from 'expo-router';
export default function OnboardingLayout() {
  return <Stack screenOptions={{ headerShown: false, gestureEnabled: false, animation: 'slide_from_right' }} />;
}
```

- [ ] **Step 5: Run tests to verify pass**

Run: `npm test -- onboardingRoutes`
Expected: PASS (3 tests).

- [ ] **Step 6: Commit**

```bash
git add mobile/app/onboarding/_layout.tsx mobile/src/lib/onboardingRoutes.ts mobile/src/lib/__tests__/onboardingRoutes.test.ts
git commit -m "feat(mobile): onboarding stack layout and route helper"
```

---

### Task 14: Screens 1–2 (Aspiration, Problem)

**Files:**
- Create: `mobile/app/onboarding/01-aspiration.tsx`, `02-problem.tsx`
- Test: `mobile/app/onboarding/__tests__/screens-01-02.test.tsx`

**Interfaces:**
- Consumes: `Screen`, `Eyebrow`, `ThemedText`, `Divider`, `CTAButton`, `ScreenTimeCard`; `useRouter` from expo-router; `nextRoute`.

- [ ] **Step 1: Write the smoke/nav test**

```tsx
import { render, screen, fireEvent } from '@testing-library/react-native';
import { router } from 'expo-router';
import Aspiration from '@/../app/onboarding/01-aspiration';

jest.mock('expo-router', () => ({ router: { push: jest.fn() }, useRouter: () => ({ push: jest.fn() }) }));

test('screen 1 shows headline and advances', () => {
  render(<Aspiration />);
  expect(screen.getByText(/closer to God/i)).toBeOnTheScreen();
  fireEvent.press(screen.getByText('Begin your journey'));
});
```

*(Note: import path for route files is `@/../app/...`; if that resolves awkwardly, colocate the test beside the route file and use a relative import.)*

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- screens-01-02`
Expected: FAIL — route module not found.

- [ ] **Step 3: Implement `01-aspiration.tsx`**

```tsx
import { View, Image } from 'react-native';
import { useRouter } from 'expo-router';
import { Screen, Eyebrow, ThemedText, Divider, CTAButton } from '@/components';
import { spacing, colors } from '@/theme';

export default function Aspiration() {
  const router = useRouter();
  return (
    <Screen variant="light">
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', gap: spacing.md }}>
        <Image source={require('../../assets/images/symbol-slate.png')} style={{ width: 44, height: 44, resizeMode: 'contain' }} />
        <Eyebrow>A Place To Begin</Eyebrow>
        <ThemedText variant="title" align="center">You want to feel{'\n'}closer to God.</ThemedText>
        <Divider />
        <ThemedText variant="body" color={colors.textMuted} align="center">
          You're not walking this path alone. Join Christians all over the world drawing closer to God.
        </ThemedText>
      </View>
      <View style={{ paddingBottom: spacing.lg }}>
        <CTAButton label="Begin your journey" onPress={() => router.push('/onboarding/02-problem')} />
      </View>
    </Screen>
  );
}
```

- [ ] **Step 4: Implement `02-problem.tsx`** (dark, `<ScreenTimeCard>`, secondary CTA)

```tsx
import { View } from 'react-native';
import { useRouter } from 'expo-router';
import { Screen, Eyebrow, ThemedText, CTAButton, ScreenTimeCard } from '@/components';
import { spacing, colors } from '@/theme';

export default function Problem() {
  const router = useRouter();
  return (
    <Screen variant="dark">
      <View style={{ flex: 1, justifyContent: 'center', gap: spacing.xl }}>
        <Eyebrow color={colors.soft}>The Modern Day</Eyebrow>
        <ScreenTimeCard hoursLabel="4h+" caption="the average person spends more than 4 hours per day on their phone" />
        <ThemedText variant="quote" color={colors.white} align="center">
          That time could be spent getting closer to God.
        </ThemedText>
      </View>
      <View style={{ paddingBottom: spacing.lg }}>
        <CTAButton label="I want that" variant="secondary" onPress={() => router.push('/onboarding/03-question')} />
      </View>
    </Screen>
  );
}
```

- [ ] **Step 5: Run tests to verify pass**

Run: `npm test -- screens-01-02`
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add mobile/app/onboarding/01-aspiration.tsx mobile/app/onboarding/02-problem.tsx mobile/app/onboarding/__tests__/screens-01-02.test.tsx
git commit -m "feat(mobile): onboarding screens 1-2"
```

---

### Task 15: Screens 3–4 (Question, Stakes) — store + calc integration

**Files:**
- Create: `mobile/app/onboarding/03-question.tsx`, `04-stakes.tsx`
- Test: `mobile/app/onboarding/__tests__/screens-03-04.test.tsx`

**Interfaces:**
- Consumes: `useOnboardingStore`, `HOURS_BUCKETS`, `hoursPerYear`, `fullDays`, `formatNumber`, `RadioOption`.

- [ ] **Step 1: Write the test (selection updates store; screen 4 shows calculated number)**

```tsx
import { render, screen, fireEvent } from '@testing-library/react-native';
import { useOnboardingStore } from '@/store/onboarding';
import Question from '@/../app/onboarding/03-question';
import Stakes from '@/../app/onboarding/04-stakes';

jest.mock('expo-router', () => ({ useRouter: () => ({ push: jest.fn() }) }));

test('selecting a bucket updates the store', () => {
  render(<Question />);
  fireEvent.press(screen.getByText('7+ hours'));
  expect(useOnboardingStore.getState().bucket).toBe('7+');
});
test('stakes screen shows calculated hours for current bucket', () => {
  useOnboardingStore.getState().setBucket('4-5');
  render(<Stakes />);
  expect(screen.getByText('1,642')).toBeOnTheScreen();
  expect(screen.getByText(/68 full days/i)).toBeOnTheScreen();
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- screens-03-04`
Expected: FAIL — route modules not found.

- [ ] **Step 3: Implement `03-question.tsx`**

```tsx
import { View } from 'react-native';
import { useRouter } from 'expo-router';
import { Screen, ThemedText, CTAButton, RadioOption } from '@/components';
import { useOnboardingStore } from '@/store/onboarding';
import { HOURS_BUCKETS } from '@/lib/calculations';
import { spacing, colors } from '@/theme';

const LABEL: Record<string, string> = {
  '1-3': '1-3 hours', '3-4': '3-4 hours', '4-5': '4-5 hours',
  '5-6': '5-6 hours', '6-7': '6-7 hours', '7+': '7+ hours',
};

export default function Question() {
  const router = useRouter();
  const { bucket, setBucket } = useOnboardingStore();
  return (
    <Screen variant="light">
      <View style={{ flex: 1, paddingTop: spacing.xl, gap: spacing.sm }}>
        <ThemedText variant="title">How much time do you spend on your phone each day?</ThemedText>
        <ThemedText variant="body" color={colors.textFaint} style={{ marginBottom: spacing.md }}>An honest guess is perfect.</ThemedText>
        {HOURS_BUCKETS.map((b) => (
          <RadioOption key={b} label={LABEL[b]} selected={bucket === b} onPress={() => setBucket(b)} />
        ))}
      </View>
      <View style={{ paddingBottom: spacing.lg }}>
        <CTAButton label="Continue" onPress={() => router.push('/onboarding/04-stakes')} />
      </View>
    </Screen>
  );
}
```

- [ ] **Step 4: Implement `04-stakes.tsx`**

```tsx
import { View } from 'react-native';
import { useRouter } from 'expo-router';
import { Screen, Eyebrow, ThemedText, Divider, CTAButton } from '@/components';
import { useOnboardingStore } from '@/store/onboarding';
import { hoursPerYear, fullDays, formatNumber } from '@/lib/calculations';
import { spacing, colors } from '@/theme';

export default function Stakes() {
  const router = useRouter();
  const bucket = useOnboardingStore((s) => s.bucket);
  return (
    <Screen variant="light">
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', gap: spacing.sm }}>
        <Eyebrow>At this rate, this year you'll spend</Eyebrow>
        <ThemedText variant="display">{formatNumber(hoursPerYear(bucket))}</ThemedText>
        <ThemedText variant="eyebrow" color={colors.mid}>Hours on your phone</ThemedText>
        <Divider />
        <ThemedText variant="title" align="center">
          That's {fullDays(bucket)} full days you could spend getting closer to God.
        </ThemedText>
        <ThemedText variant="quote" color={colors.textFaint} align="center">Imagine giving even a tenth of it back to Him.</ThemedText>
      </View>
      <View style={{ paddingBottom: spacing.lg }}>
        <CTAButton label="Show me how" onPress={() => router.push('/onboarding/05-promise')} />
      </View>
    </Screen>
  );
}
```

- [ ] **Step 5: Run tests to verify pass**

Run: `npm test -- screens-03-04`
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add mobile/app/onboarding/03-question.tsx mobile/app/onboarding/04-stakes.tsx mobile/app/onboarding/__tests__/screens-03-04.test.tsx
git commit -m "feat(mobile): onboarding screens 3-4 with calculated stakes"
```

---

### Task 16: Screens 5–6 (Promise, Vow) — preview + prayer auto-advance

**Files:**
- Create: `mobile/app/onboarding/05-promise.tsx`, `06-vow.tsx`
- Test: `mobile/app/onboarding/__tests__/screens-05-06.test.tsx`

**Interfaces:**
- Consumes: `LockScreenPreview`, `PrayerButton`, `vowHours`, `formatNumber`, store.

- [ ] **Step 1: Write the test (vow shows calculated hours; prayer completion navigates)**

```tsx
import { render, screen, fireEvent, act } from '@testing-library/react-native';
const push = jest.fn();
jest.mock('expo-router', () => ({ useRouter: () => ({ push }) }));
jest.mock('@/lib/haptics', () => ({ pulseFeedback: jest.fn(), successFeedback: jest.fn() }));
jest.useFakeTimers();
import { useOnboardingStore } from '@/store/onboarding';
import Vow from '@/../app/onboarding/06-vow';

test('vow shows calculated hours and advances after full hold', () => {
  useOnboardingStore.getState().setBucket('4-5');
  render(<Vow />);
  expect(screen.getByText(/164 hours/i)).toBeOnTheScreen();
  fireEvent(screen.getByTestId('prayer-button'), 'pressIn');
  act(() => { jest.advanceTimersByTime(3000); });
  expect(push).toHaveBeenCalledWith('/onboarding/07-wow');
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- screens-05-06`
Expected: FAIL — route modules not found.

- [ ] **Step 3: Implement `05-promise.tsx`**

```tsx
import { View } from 'react-native';
import { useRouter } from 'expo-router';
import { Screen, Eyebrow, ThemedText, CTAButton, LockScreenPreview } from '@/components';
import { spacing, colors } from '@/theme';

export default function Promise() {
  const router = useRouter();
  return (
    <Screen variant="light">
      <View style={{ flex: 1, paddingTop: spacing.xl, gap: spacing.md }}>
        <Eyebrow>The Promise</Eyebrow>
        <ThemedText variant="title">Meet His Word in the time you're already here.</ThemedText>
        <ThemedText variant="body" color={colors.textMuted}>
          Quiet Waters places Scripture right where you already look — no new habit to squeeze in.
        </ThemedText>
        <View style={{ alignItems: 'center', marginTop: spacing.md }}>
          <LockScreenPreview verse="He leads me beside quiet waters." reference="Psalm 23:2" showTodayWidget />
        </View>
        <View style={{ flexDirection: 'row', justifyContent: 'space-around', marginTop: spacing.md }}>
          <Eyebrow color={colors.textFaint}>Wallpapers</Eyebrow>
          <Eyebrow color={colors.textFaint}>Widgets</Eyebrow>
          <Eyebrow color={colors.textFaint}>Live Activities</Eyebrow>
        </View>
      </View>
      <View style={{ paddingBottom: spacing.lg }}>
        <CTAButton label="See how it works" onPress={() => router.push('/onboarding/06-vow')} />
      </View>
    </Screen>
  );
}
```

- [ ] **Step 4: Implement `06-vow.tsx`** (dark, no CTA; prayer completion advances)

```tsx
import { View } from 'react-native';
import { useRouter } from 'expo-router';
import { Screen, Eyebrow, ThemedText, PrayerButton } from '@/components';
import { useOnboardingStore } from '@/store/onboarding';
import { vowHours, formatNumber } from '@/lib/calculations';
import { spacing, colors } from '@/theme';

export default function Vow() {
  const router = useRouter();
  const bucket = useOnboardingStore((s) => s.bucket);
  return (
    <Screen variant="dark">
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', gap: spacing.lg }}>
        <Eyebrow color={colors.soft}>A Quiet Vow</Eyebrow>
        <ThemedText variant="title" color={colors.white} align="center">
          This year, I'll give{'\n'}<ThemedText variant="display" color={colors.accent}>{formatNumber(vowHours(bucket))} hours</ThemedText>{'\n'}to drawing closer to God.
        </ThemedText>
        <Eyebrow color={colors.soft}>Tap and hold to pray</Eyebrow>
        <PrayerButton onComplete={() => router.push('/onboarding/07-wow')} />
        <ThemedText variant="quote" color={colors.soft} align="center">Keep holding — and let this become your prayer.</ThemedText>
      </View>
    </Screen>
  );
}
```

- [ ] **Step 5: Run tests to verify pass**

Run: `npm test -- screens-05-06`
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add mobile/app/onboarding/05-promise.tsx mobile/app/onboarding/06-vow.tsx mobile/app/onboarding/__tests__/screens-05-06.test.tsx
git commit -m "feat(mobile): onboarding screens 5-6 with prayer auto-advance"
```

---

### Task 17: Screens 7–8 (WOW placeholder, Land & Widen)

**Files:**
- Create: `mobile/app/onboarding/07-wow.tsx`, `08-land.tsx`
- Test: `mobile/app/onboarding/__tests__/screens-07-08.test.tsx`

**Interfaces:**
- Consumes: `PlaceholderBox`, `LockScreenPreview`, `CTAButton`.

- [ ] **Step 1: Write the smoke test**

```tsx
import { render, screen } from '@testing-library/react-native';
jest.mock('expo-router', () => ({ useRouter: () => ({ push: jest.fn() }) }));
import Wow from '@/../app/onboarding/07-wow';
import Land from '@/../app/onboarding/08-land';

test('wow shows creator placeholder', () => {
  render(<Wow />);
  expect(screen.getByText('Wallpaper Creator')).toBeOnTheScreen();
});
test('land shows ready pill', () => {
  render(<Land />);
  expect(screen.getByText(/waiting for you/i)).toBeOnTheScreen();
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- screens-07-08`
Expected: FAIL.

- [ ] **Step 3: Implement `07-wow.tsx`**

```tsx
import { View } from 'react-native';
import { useRouter } from 'expo-router';
import { Screen, Eyebrow, ThemedText, CTAButton, PlaceholderBox } from '@/components';
import { spacing, colors } from '@/theme';

export default function Wow() {
  const router = useRouter();
  return (
    <Screen variant="light">
      <View style={{ flex: 1, paddingTop: spacing.xl, gap: spacing.sm }}>
        <Eyebrow>Let's Make Your First</Eyebrow>
        <ThemedText variant="title">Create a background that meets you every day.</ThemedText>
        <ThemedText variant="body" color={colors.textFaint}>Pick a verse and a scene — see it come to life.</ThemedText>
        <View style={{ flex: 1, marginVertical: spacing.lg }}>
          <PlaceholderBox label="Wallpaper Creator" sublabel="feature UI to be placed here" />
        </View>
      </View>
      <View style={{ paddingBottom: spacing.lg }}>
        <CTAButton label="Make it mine" onPress={() => router.push('/onboarding/08-land')} />
      </View>
    </Screen>
  );
}
```

- [ ] **Step 4: Implement `08-land.tsx`** (green ready pill + `<LockScreenPreview showBranding>`)

```tsx
import { View } from 'react-native';
import { useRouter } from 'expo-router';
import { Screen, ThemedText, CTAButton, LockScreenPreview } from '@/components';
import { spacing, colors } from '@/theme';

export default function Land() {
  const router = useRouter();
  return (
    <Screen variant="light">
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', gap: spacing.md }}>
        <View style={{ backgroundColor: '#E4F0E9', borderRadius: 999, paddingVertical: spacing.xs, paddingHorizontal: spacing.md }}>
          <ThemedText variant="eyebrow" color={colors.success}>✓ Your first background is ready</ThemedText>
        </View>
        <ThemedText variant="title" align="center">It's waiting for you.</ThemedText>
        <LockScreenPreview verse="He leads me beside quiet waters." reference="Psalm 23:2" showBranding />
        <ThemedText variant="quote" color={colors.textFaint} align="center">
          Now imagine this every time you reach for your phone — a new verse, every day.
        </ThemedText>
      </View>
      <View style={{ paddingBottom: spacing.lg }}>
        <CTAButton label="Continue" onPress={() => router.push('/onboarding/09-permissions')} />
      </View>
    </Screen>
  );
}
```

- [ ] **Step 5: Run tests to verify pass**

Run: `npm test -- screens-07-08`
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add mobile/app/onboarding/07-wow.tsx mobile/app/onboarding/08-land.tsx mobile/app/onboarding/__tests__/screens-07-08.test.tsx
git commit -m "feat(mobile): onboarding screens 7-8"
```

---

### Task 18: Screen 9 (Permissions) — notification request

**Files:**
- Create: `mobile/app/onboarding/09-permissions.tsx`
- Test: `mobile/app/onboarding/__tests__/screen-09.test.tsx`

**Interfaces:**
- Consumes: `NotificationPreview`, `CTAButton`, `expo-notifications` `requestPermissionsAsync`.

- [ ] **Step 1: Write the test (requests permission, always advances)**

```tsx
import { render, screen, fireEvent, waitFor } from '@testing-library/react-native';
import * as Notifications from 'expo-notifications';
const push = jest.fn();
jest.mock('expo-router', () => ({ useRouter: () => ({ push }) }));
jest.mock('expo-notifications', () => ({ requestPermissionsAsync: jest.fn().mockResolvedValue({ status: 'denied' }) }));
import Permissions from '@/../app/onboarding/09-permissions';

test('requests permission and advances even if denied', async () => {
  render(<Permissions />);
  fireEvent.press(screen.getByText('Get daily scriptures'));
  await waitFor(() => {
    expect(Notifications.requestPermissionsAsync).toHaveBeenCalled();
    expect(push).toHaveBeenCalledWith('/onboarding/10-paywall-intro');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- screen-09`
Expected: FAIL.

- [ ] **Step 3: Implement `09-permissions.tsx`**

```tsx
import { View } from 'react-native';
import { useRouter } from 'expo-router';
import * as Notifications from 'expo-notifications';
import { Screen, Eyebrow, ThemedText, CTAButton, NotificationPreview } from '@/components';
import { spacing, colors } from '@/theme';

export default function Permissions() {
  const router = useRouter();
  const handle = async () => {
    try { await Notifications.requestPermissionsAsync(); } catch { /* ignore */ }
    router.push('/onboarding/10-paywall-intro'); // advance regardless of outcome
  };
  return (
    <Screen variant="light">
      <View style={{ flex: 1, paddingTop: spacing.xl, gap: spacing.md }}>
        <Eyebrow>One Last Step</Eyebrow>
        <ThemedText variant="title">Let the Word reach you.</ThemedText>
        <ThemedText variant="body" color={colors.textMuted}>
          Allow notifications so Quiet Waters can bring Scripture to you each day.
        </ThemedText>
        <View style={{ marginTop: spacing.lg }}>
          <NotificationPreview title="Your verse for today" body="Be still, and know that I am God." />
        </View>
      </View>
      <View style={{ paddingBottom: spacing.lg }}>
        <CTAButton label="Get daily scriptures" onPress={handle} />
      </View>
    </Screen>
  );
}
```

- [ ] **Step 4: Run tests to verify pass**

Run: `npm test -- screen-09`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add mobile/app/onboarding/09-permissions.tsx mobile/app/onboarding/__tests__/screen-09.test.tsx
git commit -m "feat(mobile): onboarding screen 9 notification request"
```

---

### Task 19: Screens 10–12 (Paywall) + completion → home

**Files:**
- Create: `mobile/app/onboarding/10-paywall-intro.tsx`, `11-paywall-reminder.tsx`, `12-paywall-plans.tsx`
- Test: `mobile/app/onboarding/__tests__/screens-10-12.test.tsx`

**Interfaces:**
- Consumes: `PlaceholderBox`, `TimelineStep`, `PlanCard`, `CTAButton`, `setOnboardingComplete`, `useRouter().replace`.
- Local state on screen 12: selected plan (`'yearly' | 'weekly'`, default `'yearly'`).

- [ ] **Step 1: Write the test (screen 12 completes onboarding and routes home)**

```tsx
import { render, screen, fireEvent, waitFor } from '@testing-library/react-native';
const replace = jest.fn();
jest.mock('expo-router', () => ({ useRouter: () => ({ push: jest.fn(), replace }) }));
jest.mock('@/lib/storage', () => ({ setOnboardingComplete: jest.fn().mockResolvedValue(undefined) }));
import { setOnboardingComplete } from '@/lib/storage';
import Plans from '@/../app/onboarding/12-paywall-plans';

test('completing paywall persists flag and routes home', async () => {
  render(<Plans />);
  fireEvent.press(screen.getByText('Try for FREE'));
  await waitFor(() => {
    expect(setOnboardingComplete).toHaveBeenCalled();
    expect(replace).toHaveBeenCalledWith('/home');
  });
});
test('yearly plan is selected by default', () => {
  render(<Plans />);
  expect(screen.getByText('SAVE 92%')).toBeOnTheScreen();
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- screens-10-12`
Expected: FAIL.

- [ ] **Step 3: Implement `10-paywall-intro.tsx`**

```tsx
import { View } from 'react-native';
import { useRouter } from 'expo-router';
import { Screen, ThemedText, CTAButton, PlaceholderBox } from '@/components';
import { spacing } from '@/theme';

export default function PaywallIntro() {
  const router = useRouter();
  return (
    <Screen variant="light">
      <View style={{ flex: 1, paddingTop: spacing.xl, gap: spacing.lg }}>
        <ThemedText variant="title" align="center">We want you to try Quiet Waters for free.</ThemedText>
        <View style={{ flex: 1 }}>
          <PlaceholderBox label="App Home Screen" sublabel="screenshot to be placed here" />
        </View>
      </View>
      <View style={{ paddingBottom: spacing.lg }}>
        <CTAButton label="Continue" onPress={() => router.push('/onboarding/11-paywall-reminder')} />
      </View>
    </Screen>
  );
}
```

- [ ] **Step 4: Implement `11-paywall-reminder.tsx`** (bell icon via react-native-svg or symbol; CTA "Try for $0.00")

```tsx
import { View } from 'react-native';
import { useRouter } from 'expo-router';
import Svg, { Path } from 'react-native-svg';
import { Screen, ThemedText, CTAButton } from '@/components';
import { spacing, colors } from '@/theme';

export default function PaywallReminder() {
  const router = useRouter();
  return (
    <Screen variant="light">
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', gap: spacing.lg }}>
        <View style={{ width: 84, height: 84, borderRadius: 42, backgroundColor: colors.paleAlt, alignItems: 'center', justifyContent: 'center' }}>
          <Svg width={32} height={32} viewBox="0 0 24 24">
            <Path d="M12 2a6 6 0 00-6 6c0 5-2 6-2 6h16s-2-1-2-6a6 6 0 00-6-6zm0 20a2.5 2.5 0 002.45-2h-4.9A2.5 2.5 0 0012 22z" fill={colors.mid} />
          </Svg>
        </View>
        <ThemedText variant="title" align="center">We'll remind you before your trial ends.</ThemedText>
      </View>
      <View style={{ paddingBottom: spacing.lg }}>
        <CTAButton label="Try for $0.00" onPress={() => router.push('/onboarding/12-paywall-plans')} />
      </View>
    </Screen>
  );
}
```

- [ ] **Step 5: Implement `12-paywall-plans.tsx`** (timeline + plan cards + completion)

```tsx
import { useState } from 'react';
import { View } from 'react-native';
import { useRouter } from 'expo-router';
import { Screen, ThemedText, CTAButton, TimelineStep, PlanCard } from '@/components';
import { setOnboardingComplete } from '@/lib/storage';
import { spacing } from '@/theme';

export default function PaywallPlans() {
  const router = useRouter();
  const [plan, setPlan] = useState<'yearly' | 'weekly'>('yearly');
  const finish = async () => { await setOnboardingComplete(); router.replace('/home'); };
  return (
    <Screen variant="light">
      <View style={{ flex: 1, paddingTop: spacing.lg, gap: spacing.md }}>
        <ThemedText variant="title" align="center">We'll remind you before your trial ends.</ThemedText>
        <View style={{ marginVertical: spacing.md }}>
          <TimelineStep icon="lock" title="Today" body="Unlock full access to Quiet Waters and start getting closer to God." />
          <TimelineStep icon="bell" title="In 2 days" body="We'll send a reminder before your trial ends." />
          <TimelineStep icon="sparkle" title="In 3 days" body="Your subscription begins unless you cancel before." isLast />
        </View>
        <PlanCard title="Yearly" priceLabel="$59.99" subLabel="Only $1.15 / week" periodLabel="/ year"
          selected={plan === 'yearly'} badge="SAVE 92%" onPress={() => setPlan('yearly')} />
        <PlanCard title="Weekly" priceLabel="$4.99" subLabel="Billed every week" periodLabel="/ week"
          selected={plan === 'weekly'} onPress={() => setPlan('weekly')} />
      </View>
      <View style={{ paddingBottom: spacing.lg }}>
        <CTAButton label="Try for FREE" onPress={finish} />
      </View>
    </Screen>
  );
}
```

- [ ] **Step 6: Run tests to verify pass**

Run: `npm test -- screens-10-12`
Expected: PASS.

- [ ] **Step 7: Commit**

```bash
git add mobile/app/onboarding/10-paywall-intro.tsx mobile/app/onboarding/11-paywall-reminder.tsx mobile/app/onboarding/12-paywall-plans.tsx mobile/app/onboarding/__tests__/screens-10-12.test.tsx
git commit -m "feat(mobile): onboarding screens 10-12 paywall and completion"
```

---

### Task 20: End-to-end verification & visual polish

**Files:**
- Modify: any screen/component needing visual tuning against mockups
- (No new test files required; run the full suite + manual device pass)

- [ ] **Step 1: Run the full test suite**

Run: `cd mobile && npm test`
Expected: all suites PASS.

- [ ] **Step 2: Type-check**

Run: `npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 3: Launch on simulator and walk the full funnel**

Run: `npx expo run:ios`
Verify, screen by screen against the 12 mockups:
- Fonts render (serif headlines, sans body); no font flash on launch.
- Every CTA gives haptic feedback on a physical device (simulator has no haptics — note this; verify on device if available).
- Screen 3 selection persists into screens 4 (1,642 / 68 days) and 6 (164 hours) when `4-5` chosen; try another bucket and confirm numbers update.
- Screen 6 ring fills over ~3s, pulses each second (device), auto-advances on completion, resets on early release.
- Screen 9 shows the iOS notification permission dialog; advances whether allowed or denied.
- Screen 12 "Try for FREE" lands on the placeholder home; relaunch app → skips onboarding straight to home.

- [ ] **Step 4: Reset flag to re-test onboarding (dev convenience)**

Temporarily call `AsyncStorage.clear()` or delete the app from the simulator to replay onboarding.

- [ ] **Step 5: Tune spacing/colors/shadows** to match mockups where needed; keep changes within existing components.

- [ ] **Step 6: Final commit**

```bash
git add mobile
git commit -m "chore(mobile): onboarding visual polish and e2e verification"
```

---

## Self-Review Notes

- **Spec coverage:** All 12 screens (Tasks 14–19), theme (Task 2), fonts/splash (Task 3), calculations (Task 4), store (Task 5), completion flag (Task 6), haptics — CTA (Task 9) and 1s prayer pulse (Task 11), notification request (Task 18), forward-only nav (Task 13), on-device persistence + skip-on-relaunch (Tasks 6, 3, 19). Out-of-scope items (RevenueCat, real creator, home screenshot, widgets) are represented as placeholders/stubs per the spec.
- **Type consistency:** `HoursBucket`, `useOnboardingStore` (`bucket`/`setBucket`), `hoursPerYear`/`fullDays`/`vowHours`/`formatNumber`, `setOnboardingComplete`/`isOnboardingComplete`, `tapFeedback`/`successFeedback`/`pulseFeedback`, and component props are used identically across producing and consuming tasks.
- **Ordering note:** Task 3 consumes `isOnboardingComplete` (Task 6) and components (Task 8); when executing strictly in order, either reorder Task 6/8 before Task 3 or stub then replace. Flagged in Task 3.
- **Known env note:** iOS Simulator does not produce haptics; haptic behavior must be verified on a physical device.
```
