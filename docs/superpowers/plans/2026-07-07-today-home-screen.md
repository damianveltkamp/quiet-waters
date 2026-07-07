# Today Home Screen + Tab Shell Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the post-paywall **Today** home screen and the three-tab navigation shell (Today / Create / You), replacing the placeholder `/home` screen.

**Architecture:** Introduce an Expo Router `(tabs)` group (which does not change URLs, so `/home` and its redirect/tests are preserved). The Today screen composes three new presentational components (`VerseCard`, `WallpaperPromoCard`, `ActionRow`) over a local verse-of-the-day content source and pure date/greeting helpers. Create, You, and Prayer are placeholder screens; Prayer is a stack route pushed over the tab bar.

**Tech Stack:** Expo (~57), Expo Router, React Native 0.86, TypeScript, `react-native-svg` (inline icon glyphs — the codebase's existing icon convention), `expo-linear-gradient`, React Native's built-in `Share` API, `expo-haptics` (via `@/lib/haptics`), Jest + `@testing-library/react-native`.

## Global Constraints

- Path alias: `@/*` → `mobile/src/*`. All imports use it.
- All commands run from `mobile/`.
- Use theme tokens only from `@/theme` (`colors`, `spacing`, `typography`); never hardcode palette hex except the translucent white overlays already specified in this plan.
- Text uses `ThemedText` / `Eyebrow`; font families are the existing `HankenGrotesk_*` / `CormorantGaramond_*` names — no new fonts.
- Icons are inline `react-native-svg` glyphs (follow `TimelineStep`), NOT `expo-symbols`.
- Interactive controls fire `tapFeedback()` from `@/lib/haptics` before their callback.
- iPhone-only app; portrait.
- TDD: write the failing test first, watch it fail, implement, watch it pass, commit after each task.
- Test runner: `npx jest <path>`.

---

### Task 1: Verse-of-the-day content source

**Files:**
- Create: `mobile/src/content/verses.ts`
- Test: `mobile/src/content/__tests__/verses.test.ts`

**Interfaces:**
- Consumes: nothing.
- Produces: `interface Verse { text: string; reference: string }`; `const verses: Verse[]`; `getVerseOfTheDay(date: Date): Verse`.

- [ ] **Step 1: Write the failing test**

```ts
// mobile/src/content/__tests__/verses.test.ts
import { getVerseOfTheDay, verses } from '@/content/verses';

test('returns a verse that exists in the list', () => {
  expect(verses).toContain(getVerseOfTheDay(new Date(2026, 6, 7)));
});

test('is deterministic for the same calendar day', () => {
  expect(getVerseOfTheDay(new Date(2026, 6, 7))).toEqual(getVerseOfTheDay(new Date(2026, 6, 7)));
});

test('returns the seeded Psalm while only one verse exists', () => {
  expect(getVerseOfTheDay(new Date(2026, 0, 1)).reference).toBe('Psalm 118:24');
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx jest src/content/__tests__/verses.test.ts`
Expected: FAIL — cannot find module `@/content/verses`.

- [ ] **Step 3: Write minimal implementation**

```ts
// mobile/src/content/verses.ts
export interface Verse {
  text: string;
  reference: string;
}

export const verses: Verse[] = [
  {
    text: 'This is the day the Lord has made; let us rejoice and be glad in it.',
    reference: 'Psalm 118:24',
  },
];

// Deterministic verse per calendar day. Scales to a larger `verses` list later.
export function getVerseOfTheDay(date: Date): Verse {
  const startOfYear = new Date(date.getFullYear(), 0, 0);
  const dayOfYear = Math.floor((date.getTime() - startOfYear.getTime()) / 86_400_000);
  return verses[dayOfYear % verses.length];
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx jest src/content/__tests__/verses.test.ts`
Expected: PASS (3 tests).

- [ ] **Step 5: Commit**

```bash
git add mobile/src/content/verses.ts mobile/src/content/__tests__/verses.test.ts
git commit -m "feat(mobile): add verse-of-the-day content source"
```

---

### Task 2: Date and greeting helpers

**Files:**
- Create: `mobile/src/lib/datetime.ts`
- Test: `mobile/src/lib/__tests__/datetime.test.ts`

**Interfaces:**
- Consumes: nothing.
- Produces: `formatHeaderDate(date: Date): string` (e.g. `"TUESDAY · 7 JULY"`); `greeting(date: Date): string` (`"Good morning"` / `"Good afternoon"` / `"Good evening"`).

- [ ] **Step 1: Write the failing test**

```ts
// mobile/src/lib/__tests__/datetime.test.ts
import { formatHeaderDate, greeting } from '@/lib/datetime';

test('formats the header date as WEEKDAY · D MONTH', () => {
  expect(formatHeaderDate(new Date(2026, 6, 7))).toBe('TUESDAY · 7 JULY');
});

test('greets by time of day', () => {
  expect(greeting(new Date(2026, 6, 7, 8))).toBe('Good morning');
  expect(greeting(new Date(2026, 6, 7, 13))).toBe('Good afternoon');
  expect(greeting(new Date(2026, 6, 7, 20))).toBe('Good evening');
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx jest src/lib/__tests__/datetime.test.ts`
Expected: FAIL — cannot find module `@/lib/datetime`.

- [ ] **Step 3: Write minimal implementation**

```ts
// mobile/src/lib/datetime.ts
const WEEKDAYS = ['SUNDAY', 'MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY'];
const MONTHS = [
  'JANUARY', 'FEBRUARY', 'MARCH', 'APRIL', 'MAY', 'JUNE',
  'JULY', 'AUGUST', 'SEPTEMBER', 'OCTOBER', 'NOVEMBER', 'DECEMBER',
];

export function formatHeaderDate(date: Date): string {
  return `${WEEKDAYS[date.getDay()]} · ${date.getDate()} ${MONTHS[date.getMonth()]}`;
}

export function greeting(date: Date): string {
  const hour = date.getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  return 'Good evening';
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx jest src/lib/__tests__/datetime.test.ts`
Expected: PASS (2 tests).

- [ ] **Step 5: Commit**

```bash
git add mobile/src/lib/datetime.ts mobile/src/lib/__tests__/datetime.test.ts
git commit -m "feat(mobile): add date/greeting helpers"
```

---

### Task 3: VerseCard component

**Files:**
- Create: `mobile/src/components/VerseCard.tsx`
- Modify: `mobile/src/components/index.ts`
- Test: `mobile/src/components/__tests__/VerseCard.test.tsx`

**Interfaces:**
- Consumes: `ThemedText`, `colors`, `spacing`, `tapFeedback`.
- Produces: `VerseCard` with props `{ verse: string; reference: string; onShare: () => void }`.

- [ ] **Step 1: Write the failing test**

```tsx
// mobile/src/components/__tests__/VerseCard.test.tsx
import { render, screen, fireEvent } from '@testing-library/react-native';
import { VerseCard } from '@/components';
import { tapFeedback } from '@/lib/haptics';

jest.mock('@/lib/haptics', () => ({ tapFeedback: jest.fn() }));

test('renders the verse and reference', async () => {
  await render(
    <VerseCard verse="This is the day the Lord has made." reference="Psalm 118:24" onShare={() => {}} />,
  );
  expect(screen.getByText(/This is the day the Lord has made\./)).toBeOnTheScreen();
  expect(screen.getByText('Psalm 118:24')).toBeOnTheScreen();
});

test('fires haptic and onShare when Share is pressed', async () => {
  const onShare = jest.fn();
  await render(<VerseCard verse="x" reference="y" onShare={onShare} />);
  fireEvent.press(screen.getByText('Share'));
  expect(tapFeedback).toHaveBeenCalledTimes(1);
  expect(onShare).toHaveBeenCalledTimes(1);
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx jest src/components/__tests__/VerseCard.test.tsx`
Expected: FAIL — `VerseCard` is not exported from `@/components`.

- [ ] **Step 3: Write minimal implementation**

```tsx
// mobile/src/components/VerseCard.tsx
import { View, Pressable } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { LinearGradient } from 'expo-linear-gradient';
import { ThemedText } from './ThemedText';
import { colors, spacing } from '@/theme';
import { tapFeedback } from '@/lib/haptics';

interface Props {
  verse: string;
  reference: string;
  onShare: () => void;
}

function ShareIcon({ color }: { color: string }) {
  return (
    <Svg width={16} height={16} viewBox="0 0 24 24" fill="none">
      <Path d="M12 3v13M12 3l-4 4M12 3l4 4" stroke={color} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" />
      <Path d="M5 12v7a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-7" stroke={color} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

export function VerseCard({ verse, reference, onShare }: Props) {
  const handleShare = () => {
    tapFeedback();
    onShare();
  };
  return (
    <LinearGradient colors={[colors.mid, colors.primary]} style={{ borderRadius: 28, padding: spacing.lg, gap: spacing.md }}>
      <View style={{ paddingVertical: spacing.md, alignItems: 'center' }}>
        <ThemedText variant="quote" color={colors.white} align="center">{`“${verse}”`}</ThemedText>
      </View>
      <ThemedText variant="eyebrow" color={colors.accent} align="center">{reference}</ThemedText>
      <Pressable
        onPress={handleShare}
        style={({ pressed }) => ({
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'center',
          gap: spacing.sm,
          alignSelf: 'stretch',
          paddingVertical: spacing.md,
          borderRadius: 999,
          backgroundColor: 'rgba(255,255,255,0.14)',
          borderWidth: 1,
          borderColor: 'rgba(255,255,255,0.22)',
          opacity: pressed ? 0.8 : 1,
        })}
      >
        <ShareIcon color={colors.white} />
        <ThemedText variant="button" color={colors.white}>Share</ThemedText>
      </Pressable>
    </LinearGradient>
  );
}
```

Add to `mobile/src/components/index.ts` (append after existing exports):

```ts
export { VerseCard } from './VerseCard';
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx jest src/components/__tests__/VerseCard.test.tsx`
Expected: PASS (2 tests).

- [ ] **Step 5: Commit**

```bash
git add mobile/src/components/VerseCard.tsx mobile/src/components/index.ts mobile/src/components/__tests__/VerseCard.test.tsx
git commit -m "feat(mobile): add VerseCard component"
```

---

### Task 4: WallpaperPromoCard component

**Files:**
- Create: `mobile/src/components/WallpaperPromoCard.tsx`
- Modify: `mobile/src/components/index.ts`
- Test: `mobile/src/components/__tests__/WallpaperPromoCard.test.tsx`

**Interfaces:**
- Consumes: `ThemedText`, `colors`, `spacing`, `tapFeedback`.
- Produces: `WallpaperPromoCard` with props `{ onPress: () => void }`.

- [ ] **Step 1: Write the failing test**

```tsx
// mobile/src/components/__tests__/WallpaperPromoCard.test.tsx
import { render, screen, fireEvent } from '@testing-library/react-native';
import { WallpaperPromoCard } from '@/components';
import { tapFeedback } from '@/lib/haptics';

jest.mock('@/lib/haptics', () => ({ tapFeedback: jest.fn() }));

test('renders the promo title', async () => {
  await render(<WallpaperPromoCard onPress={() => {}} />);
  expect(screen.getByText('Create a wallpaper')).toBeOnTheScreen();
});

test('fires haptic and onPress when tapped', async () => {
  const onPress = jest.fn();
  await render(<WallpaperPromoCard onPress={onPress} />);
  fireEvent.press(screen.getByText('Create a wallpaper'));
  expect(tapFeedback).toHaveBeenCalledTimes(1);
  expect(onPress).toHaveBeenCalledTimes(1);
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx jest src/components/__tests__/WallpaperPromoCard.test.tsx`
Expected: FAIL — `WallpaperPromoCard` is not exported from `@/components`.

- [ ] **Step 3: Write minimal implementation**

```tsx
// mobile/src/components/WallpaperPromoCard.tsx
import { View, Pressable } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { ThemedText } from './ThemedText';
import { colors, spacing } from '@/theme';
import { tapFeedback } from '@/lib/haptics';

interface Props {
  onPress: () => void;
}

function PlusIcon({ color }: { color: string }) {
  return (
    <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
      <Path d="M12 5v14M5 12h14" stroke={color} strokeWidth={2} strokeLinecap="round" />
    </Svg>
  );
}

export function WallpaperPromoCard({ onPress }: Props) {
  const handlePress = () => {
    tapFeedback();
    onPress();
  };
  return (
    <Pressable
      onPress={handlePress}
      style={({ pressed }) => ({
        flexDirection: 'row',
        backgroundColor: colors.primary,
        borderRadius: 24,
        padding: spacing.lg,
        gap: spacing.md,
        opacity: pressed ? 0.92 : 1,
      })}
    >
      <View style={{ flex: 1, justifyContent: 'center', gap: spacing.xs }}>
        <ThemedText variant="title" color={colors.white} style={{ fontSize: 26, lineHeight: 30 }}>
          Create a wallpaper
        </ThemedText>
        <ThemedText variant="caption" color={colors.soft}>
          Set today’s verse on your lock screen in seconds.
        </ThemedText>
      </View>
      <View
        style={{
          width: 72,
          height: 96,
          borderRadius: 14,
          backgroundColor: colors.deep,
          borderWidth: 1,
          borderColor: colors.mid,
          alignItems: 'center',
          justifyContent: 'center',
          padding: spacing.sm,
        }}
      >
        <ThemedText variant="caption" color={colors.soft} align="center" style={{ fontSize: 9 }}>
          quiet waters
        </ThemedText>
        <View
          style={{
            position: 'absolute',
            bottom: -10,
            width: 28,
            height: 28,
            borderRadius: 14,
            backgroundColor: colors.accent,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <PlusIcon color={colors.primary} />
        </View>
      </View>
    </Pressable>
  );
}
```

Add to `mobile/src/components/index.ts`:

```ts
export { WallpaperPromoCard } from './WallpaperPromoCard';
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx jest src/components/__tests__/WallpaperPromoCard.test.tsx`
Expected: PASS (2 tests).

- [ ] **Step 5: Commit**

```bash
git add mobile/src/components/WallpaperPromoCard.tsx mobile/src/components/index.ts mobile/src/components/__tests__/WallpaperPromoCard.test.tsx
git commit -m "feat(mobile): add WallpaperPromoCard component"
```

---

### Task 5: ActionRow component

**Files:**
- Create: `mobile/src/components/ActionRow.tsx`
- Modify: `mobile/src/components/index.ts`
- Test: `mobile/src/components/__tests__/ActionRow.test.tsx`

**Interfaces:**
- Consumes: `ThemedText`, `colors`, `spacing`, `tapFeedback`.
- Produces: `ActionRow` with props `{ icon: 'cross'; title: string; subtitle: string; onPress: () => void }`.

- [ ] **Step 1: Write the failing test**

```tsx
// mobile/src/components/__tests__/ActionRow.test.tsx
import { render, screen, fireEvent } from '@testing-library/react-native';
import { ActionRow } from '@/components';
import { tapFeedback } from '@/lib/haptics';

jest.mock('@/lib/haptics', () => ({ tapFeedback: jest.fn() }));

test('renders title and subtitle', async () => {
  await render(<ActionRow icon="cross" title="Prayer" subtitle="A moment to pause and pray" onPress={() => {}} />);
  expect(screen.getByText('Prayer')).toBeOnTheScreen();
  expect(screen.getByText('A moment to pause and pray')).toBeOnTheScreen();
});

test('fires haptic and onPress when tapped', async () => {
  const onPress = jest.fn();
  await render(<ActionRow icon="cross" title="Prayer" subtitle="s" onPress={onPress} />);
  fireEvent.press(screen.getByText('Prayer'));
  expect(tapFeedback).toHaveBeenCalledTimes(1);
  expect(onPress).toHaveBeenCalledTimes(1);
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx jest src/components/__tests__/ActionRow.test.tsx`
Expected: FAIL — `ActionRow` is not exported from `@/components`.

- [ ] **Step 3: Write minimal implementation**

```tsx
// mobile/src/components/ActionRow.tsx
import { View, Pressable } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { ThemedText } from './ThemedText';
import { colors, spacing } from '@/theme';
import { tapFeedback } from '@/lib/haptics';

type IconName = 'cross';

interface Props {
  icon: IconName;
  title: string;
  subtitle: string;
  onPress: () => void;
}

function RowIcon({ icon, color }: { icon: IconName; color: string }) {
  switch (icon) {
    case 'cross':
      return (
        <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
          <Path d="M12 4v16M7 9h10" stroke={color} strokeWidth={1.8} strokeLinecap="round" />
        </Svg>
      );
  }
}

function Chevron({ color }: { color: string }) {
  return (
    <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
      <Path d="M9 6l6 6-6 6" stroke={color} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

export function ActionRow({ icon, title, subtitle, onPress }: Props) {
  const handlePress = () => {
    tapFeedback();
    onPress();
  };
  return (
    <Pressable
      onPress={handlePress}
      style={({ pressed }) => ({
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.md,
        backgroundColor: colors.white,
        borderRadius: 20,
        padding: spacing.md,
        opacity: pressed ? 0.9 : 1,
      })}
    >
      <View
        style={{
          width: 48,
          height: 48,
          borderRadius: 14,
          backgroundColor: colors.paleAlt,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <RowIcon icon={icon} color={colors.primary} />
      </View>
      <View style={{ flex: 1, gap: 2 }}>
        <ThemedText variant="body" color={colors.primary} style={{ fontFamily: 'HankenGrotesk_600SemiBold' }}>
          {title}
        </ThemedText>
        <ThemedText variant="caption" color={colors.textFaint}>{subtitle}</ThemedText>
      </View>
      <Chevron color={colors.soft} />
    </Pressable>
  );
}
```

Add to `mobile/src/components/index.ts`:

```ts
export { ActionRow } from './ActionRow';
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx jest src/components/__tests__/ActionRow.test.tsx`
Expected: PASS (2 tests).

- [ ] **Step 5: Commit**

```bash
git add mobile/src/components/ActionRow.tsx mobile/src/components/index.ts mobile/src/components/__tests__/ActionRow.test.tsx
git commit -m "feat(mobile): add ActionRow component"
```

---

### Task 6: Today screen (move /home into the tabs group)

**Files:**
- Create: `mobile/src/app/(tabs)/home.tsx`
- Create: `mobile/src/app/(tabs)/__tests__/home.test.tsx`
- Delete: `mobile/src/app/home.tsx`
- Delete: `mobile/src/app/__tests__/home.test.tsx`

**Interfaces:**
- Consumes: `Screen`, `Eyebrow`, `ThemedText`, `VerseCard`, `WallpaperPromoCard`, `ActionRow` from `@/components`; `getVerseOfTheDay` from `@/content/verses`; `formatHeaderDate`, `greeting` from `@/lib/datetime`; `useRouter` from `expo-router`; `Share` from `react-native`.
- Produces: default-exported `Home` screen at route `/home` (unchanged URL — `(tabs)` group does not affect the path, so `app/index.tsx` and `index.test.tsx` stay valid). Navigates to `/create` and `/prayer` via `router.push`.

- [ ] **Step 1: Write the failing test**

```tsx
// mobile/src/app/(tabs)/__tests__/home.test.tsx
import { render, screen } from '@testing-library/react-native';

const mockPush = jest.fn();
jest.mock('expo-router', () => ({ useRouter: () => ({ push: mockPush }) }));

import Home from '@/app/(tabs)/home';

test('shows a time-based greeting', async () => {
  await render(<Home />);
  expect(screen.getByText(/Good (morning|afternoon|evening)/)).toBeOnTheScreen();
});

test('shows the verse of the day reference', async () => {
  await render(<Home />);
  expect(screen.getByText('Psalm 118:24')).toBeOnTheScreen();
});
```

- [ ] **Step 2: Delete the old home screen + test, then run the new test to verify it fails**

```bash
git rm mobile/src/app/home.tsx mobile/src/app/__tests__/home.test.tsx
```

Run: `npx jest "src/app/(tabs)/__tests__/home.test.tsx"`
Expected: FAIL — cannot find module `@/app/(tabs)/home`.

- [ ] **Step 3: Write the Today screen**

```tsx
// mobile/src/app/(tabs)/home.tsx
import { View, ScrollView, Share } from 'react-native';
import { useRouter } from 'expo-router';
import { Screen, Eyebrow, ThemedText, VerseCard, WallpaperPromoCard, ActionRow } from '@/components';
import { spacing } from '@/theme';
import { getVerseOfTheDay } from '@/content/verses';
import { formatHeaderDate, greeting } from '@/lib/datetime';

export default function Home() {
  const router = useRouter();
  const now = new Date();
  const verse = getVerseOfTheDay(now);

  const handleShare = () => {
    Share.share({ message: `“${verse.text}” — ${verse.reference}` });
  };

  return (
    <Screen variant="light">
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingVertical: spacing.lg, gap: spacing.lg }}
      >
        <View style={{ gap: spacing.xs }}>
          <Eyebrow>{formatHeaderDate(now)}</Eyebrow>
          <ThemedText variant="title">{greeting(now)}</ThemedText>
        </View>

        <View style={{ gap: spacing.sm }}>
          <Eyebrow>Verse of the day</Eyebrow>
          <VerseCard verse={verse.text} reference={verse.reference} onShare={handleShare} />
        </View>

        <View style={{ gap: spacing.sm }}>
          <Eyebrow>Make it yours</Eyebrow>
          <WallpaperPromoCard onPress={() => router.push('/create')} />
          <ActionRow icon="cross" title="Prayer" subtitle="A moment to pause and pray" onPress={() => router.push('/prayer')} />
        </View>
      </ScrollView>
    </Screen>
  );
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx jest "src/app/(tabs)/__tests__/home.test.tsx" src/app/__tests__/index.test.tsx`
Expected: PASS — new home tests pass; `index.test.tsx` still routes to `/home` (5 tests) since the URL is unchanged.

- [ ] **Step 5: Commit**

```bash
git add "mobile/src/app/(tabs)/home.tsx" "mobile/src/app/(tabs)/__tests__/home.test.tsx"
git commit -m "feat(mobile): build the Today home screen"
```

---

### Task 7: Tab navigation shell + Create / You / Prayer placeholders

**Files:**
- Create: `mobile/src/app/(tabs)/_layout.tsx`
- Create: `mobile/src/app/(tabs)/create.tsx`
- Create: `mobile/src/app/(tabs)/you.tsx`
- Create: `mobile/src/app/prayer.tsx`
- Test: `mobile/src/app/__tests__/tabs-placeholders.test.tsx`

**Interfaces:**
- Consumes: `Tabs` from `expo-router`; `useRouter` from `expo-router`; `Screen`, `ThemedText`, `Eyebrow`, `PlaceholderBox` from `@/components`; `colors`, `spacing` from `@/theme`; `react-native-svg`.
- Produces: tab navigator with tabs `home` (Today), `create` (Create), `you` (You); default-exported placeholder screens `Create`, `You`, `Prayer`. Prayer sits at route `/prayer` (root stack, pushed over the tabs) and calls `router.back()` to dismiss.

- [ ] **Step 1: Write the failing test**

```tsx
// mobile/src/app/__tests__/tabs-placeholders.test.tsx
import { render, screen } from '@testing-library/react-native';

const mockBack = jest.fn();
jest.mock('expo-router', () => ({ useRouter: () => ({ back: mockBack }) }));

import Create from '@/app/(tabs)/create';
import You from '@/app/(tabs)/you';
import Prayer from '@/app/prayer';

test('Create screen renders its placeholder', async () => {
  await render(<Create />);
  expect(screen.getByText('Create a wallpaper')).toBeOnTheScreen();
});

test('You screen renders its heading', async () => {
  await render(<You />);
  expect(screen.getByText('Your space')).toBeOnTheScreen();
});

test('Prayer screen renders a close affordance', async () => {
  await render(<Prayer />);
  expect(screen.getByText('Close')).toBeOnTheScreen();
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx jest src/app/__tests__/tabs-placeholders.test.tsx`
Expected: FAIL — cannot find module `@/app/(tabs)/create`.

- [ ] **Step 3: Write the tab layout and placeholder screens**

```tsx
// mobile/src/app/(tabs)/_layout.tsx
import { Tabs } from 'expo-router';
import Svg, { Path, Rect, Circle } from 'react-native-svg';
import { colors } from '@/theme';

function HomeIcon({ color }: { color: string }) {
  return (
    <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
      <Path d="M4 10.5L12 4l8 6.5V19a1 1 0 0 1-1 1h-4v-6h-6v6H5a1 1 0 0 1-1-1v-8.5Z" stroke={color} strokeWidth={1.8} strokeLinejoin="round" />
    </Svg>
  );
}

function CreateIcon({ color }: { color: string }) {
  return (
    <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
      <Rect x={4} y={4} width={16} height={16} rx={3} stroke={color} strokeWidth={1.8} />
      <Path d="M12 9v6M9 12h6" stroke={color} strokeWidth={1.8} strokeLinecap="round" />
    </Svg>
  );
}

function YouIcon({ color }: { color: string }) {
  return (
    <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
      <Circle cx={12} cy={8} r={4} stroke={color} strokeWidth={1.8} />
      <Path d="M4 20c0-3.3 3.6-6 8-6s8 2.7 8 6" stroke={color} strokeWidth={1.8} strokeLinecap="round" />
    </Svg>
  );
}

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textFaint,
        tabBarStyle: { backgroundColor: colors.surface, borderTopColor: colors.paleAlt },
        tabBarLabelStyle: { fontFamily: 'HankenGrotesk_500Medium', fontSize: 11 },
      }}
    >
      <Tabs.Screen name="home" options={{ title: 'Today', tabBarIcon: ({ color }) => <HomeIcon color={color} /> }} />
      <Tabs.Screen name="create" options={{ title: 'Create', tabBarIcon: ({ color }) => <CreateIcon color={color} /> }} />
      <Tabs.Screen name="you" options={{ title: 'You', tabBarIcon: ({ color }) => <YouIcon color={color} /> }} />
    </Tabs>
  );
}
```

```tsx
// mobile/src/app/(tabs)/create.tsx
import { View } from 'react-native';
import { Screen, Eyebrow, ThemedText, PlaceholderBox } from '@/components';
import { spacing } from '@/theme';

export default function Create() {
  return (
    <Screen variant="light">
      <View style={{ flex: 1, paddingTop: spacing.xl, gap: spacing.sm }}>
        <Eyebrow>Create</Eyebrow>
        <ThemedText variant="title">Create a wallpaper</ThemedText>
        <View style={{ flex: 1, marginVertical: spacing.lg }}>
          <PlaceholderBox label="Wallpaper Creator" sublabel="feature UI to be placed here" />
        </View>
      </View>
    </Screen>
  );
}
```

```tsx
// mobile/src/app/(tabs)/you.tsx
import { View } from 'react-native';
import { Screen, Eyebrow, ThemedText, PlaceholderBox } from '@/components';
import { spacing } from '@/theme';

export default function You() {
  return (
    <Screen variant="light">
      <View style={{ flex: 1, paddingTop: spacing.xl, gap: spacing.sm }}>
        <Eyebrow>You</Eyebrow>
        <ThemedText variant="title">Your space</ThemedText>
        <View style={{ flex: 1, marginVertical: spacing.lg }}>
          <PlaceholderBox label="Your Space" sublabel="profile & settings to be placed here" />
        </View>
      </View>
    </Screen>
  );
}
```

```tsx
// mobile/src/app/prayer.tsx
import { View, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { Screen, ThemedText, PlaceholderBox } from '@/components';
import { spacing, colors } from '@/theme';

export default function Prayer() {
  const router = useRouter();
  return (
    <Screen variant="light">
      <View style={{ flex: 1, paddingTop: spacing.md, gap: spacing.sm }}>
        <Pressable onPress={() => router.back()} hitSlop={12}>
          <ThemedText variant="button" color={colors.primary}>Close</ThemedText>
        </Pressable>
        <View style={{ flex: 1, marginVertical: spacing.lg }}>
          <PlaceholderBox label="Prayer" sublabel="a moment to pause and pray" />
        </View>
      </View>
    </Screen>
  );
}
```

- [ ] **Step 4: Run test to verify it passes, then run the full suite**

Run: `npx jest src/app/__tests__/tabs-placeholders.test.tsx`
Expected: PASS (3 tests).

Run: `npx jest`
Expected: PASS — entire suite green.

- [ ] **Step 5: Commit**

```bash
git add "mobile/src/app/(tabs)/_layout.tsx" "mobile/src/app/(tabs)/create.tsx" "mobile/src/app/(tabs)/you.tsx" mobile/src/app/prayer.tsx mobile/src/app/__tests__/tabs-placeholders.test.tsx
git commit -m "feat(mobile): add Today/Create/You tab shell and Prayer screen"
```

---

## Self-Review

**Spec coverage:**
- Three-tab shell (Today/Create/You) → Task 7. ✓
- Today screen layout (header, verse card, promo card, prayer row) → Task 6. ✓
- Local verse-of-the-day source seeded with one verse → Task 1. ✓
- Share via native sheet, Save dropped → Task 3 (VerseCard has only Share) + Task 6 (`Share.share`). ✓
- Create/You/Prayer placeholders; Prayer pushed over tabs → Task 7. ✓
- `/home` URL + `index.tsx`/`index.test.tsx` preserved → Task 6 (group doesn't change URL; verified in Step 4). ✓
- Time-based greeting; formatted date → Task 2 + Task 6. ✓
- Icons as inline SVG (not expo-symbols); glass pill fallback to translucent pill → Tasks 3/5/7 use SVG, Task 3 uses `rgba` pill. ✓

**Placeholder scan:** No TBD/TODO/"handle edge cases"; every code step shows full code. ✓

**Type consistency:** `Verse`/`getVerseOfTheDay` (Task 1) consumed in Task 6; `VerseCard`/`WallpaperPromoCard`/`ActionRow` prop shapes defined in Tasks 3–5 match their usage in Task 6; `ActionRow` `icon: 'cross'` matches Task 6's `icon="cross"`; `formatHeaderDate`/`greeting` (Task 2) match Task 6. ✓
