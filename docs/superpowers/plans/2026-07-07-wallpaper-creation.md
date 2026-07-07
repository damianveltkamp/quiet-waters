# Wallpaper Creation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Let a user pick a Bible verse + a gradient background, preview it full-screen, and save it to Photos as a wallpaper image.

**Architecture:** The Create tab renders a full-bleed `WallpaperCanvas` (the single source of truth for both the live preview and the exported image) behind floating controls. Two native form-sheets (verse picker, background picker) are expo-router modal routes that write the user's choices into a zustand draft store. "Set as wallpaper" captures the canvas to a retina PNG via `react-native-view-shot` and saves it with `expo-media-library`.

**Tech Stack:** Expo SDK 57, React Native 0.86 (New Architecture), expo-router, zustand, expo-linear-gradient, react-native-view-shot, expo-media-library, TypeScript, Jest + @testing-library/react-native.

## Global Constraints

- Target Expo SDK **57** exactly. Verify any new dependency version against https://docs.expo.dev/versions/v57.0.0/ before installing.
- New Architecture is enabled (`reactCompiler: true`); `react-native-view-shot` must be **v4+** (Fabric + TurboModules compatible).
- iOS only in practice (per project). Saving to Photos uses **write-only** permission (`NSPhotoLibraryAddUsageDescription`); do not request full library read access.
- Path alias `@/` → `mobile/src/`. Follow it.
- Default translation is **KJV**. Default verse is **"He leads me beside quiet waters." / Psalm 23:2**. Default background is **Deep Night**.
- Wallpaper shows only: cross symbol + verse + reference. **No wordmark.**
- Export-only: no gallery, no persistence between sessions.
- Follow existing patterns: presentational components in `src/components`, feature logic in `src/features/wallpaper`, zustand stores like `src/store/onboarding.ts`, tests colocated in `__tests__`.
- Run tests with `cd mobile && npx jest <path>`.

---

## File Structure

```
mobile/src/features/wallpaper/
  backgrounds.ts            # gradient presets + WallpaperBackground type + DEFAULT_BACKGROUND
  wallpaperDraft.ts         # zustand store: verse, translation, background + setters
  randomVerse.ts            # pickRandomVerse(): random valid verse across whole Bible
  export.ts                 # saveWallpaperToPhotos(ref): permission -> capture -> save
  WallpaperCanvas.tsx       # full-screen composition; preview AND capture target
  __tests__/
    backgrounds.test.ts
    wallpaperDraft.test.ts
    randomVerse.test.ts
    export.test.ts
    WallpaperCanvas.test.tsx

mobile/src/components/
  Toast.tsx                 # auto-hiding "Wallpaper saved" pill
  __tests__/Toast.test.tsx

mobile/src/app/
  (tabs)/create.tsx         # MODIFY: full-bleed canvas + controls + toast
  wallpaper-verse-picker.tsx    # form-sheet route
  wallpaper-backgrounds.tsx     # form-sheet route
  _layout.tsx               # MODIFY: register the two form-sheet routes
  __tests__/
    create.test.tsx
    wallpaper-verse-picker.test.tsx
    wallpaper-backgrounds.test.tsx

mobile/app.json             # MODIFY: expo-media-library config plugin
```

---

### Task 1: Add dependencies & native config

No unit test (build-time setup). This is the one task verified by a successful native build rather than a Jest test; it is a prerequisite for Task 6 (export).

**Files:**
- Modify: `mobile/package.json` (via installer)
- Modify: `mobile/app.json`

- [ ] **Step 1: Install the two libraries pinned to SDK 57**

```bash
cd mobile
npx expo install react-native-view-shot expo-media-library
```

`npx expo install` selects versions compatible with SDK 57. Confirm `react-native-view-shot` resolves to **4.x** in `package.json` (New Architecture support). If it resolves lower, run `npm install react-native-view-shot@^4`.

- [ ] **Step 2: Register the expo-media-library config plugin (write-only permission)**

Edit `mobile/app.json`, adding the plugin to the existing `plugins` array (keep `expo-router`, `expo-splash-screen`, `expo-font`):

```json
[
  "expo-media-library",
  {
    "photosPermission": "Quiet Waters saves your wallpapers to Photos.",
    "savePhotosPermission": "Quiet Waters saves your wallpapers to Photos.",
    "isAccessMediaLocationEnabled": false
  }
]
```

`savePhotosPermission` maps to `NSPhotoLibraryAddUsageDescription`.

- [ ] **Step 3: Regenerate native iOS project**

```bash
cd mobile
npx expo prebuild -p ios
```

Expected: completes without error; `ios/mobile/Info.plist` now contains `NSPhotoLibraryAddUsageDescription`.

- [ ] **Step 4: Verify the app still boots (type check + existing tests)**

```bash
cd mobile
npx tsc --noEmit && npx jest
```

Expected: type check passes; existing test suite is green.

- [ ] **Step 5: Commit**

Note: this repo intentionally gitignores `mobile/ios` (`/ios` in `mobile/.gitignore`) — the native project is regenerated from `app.json` via `expo prebuild` and is NOT tracked. Commit only the config files; do not force-add the generated `ios/` tree.

```bash
git add mobile/package.json mobile/package-lock.json mobile/app.json
git commit -m "chore(wallpaper): add view-shot + media-library deps and native config"
```

---

### Task 2: Gradient background presets

**Files:**
- Create: `mobile/src/features/wallpaper/backgrounds.ts`
- Test: `mobile/src/features/wallpaper/__tests__/backgrounds.test.ts`

**Interfaces:**
- Produces:
  - `interface WallpaperBackground { id: string; name: string; colors: readonly [string, string]; textColor: string; mutedColor: string }`
  - `const BACKGROUNDS: readonly WallpaperBackground[]`
  - `const DEFAULT_BACKGROUND: WallpaperBackground` (= Deep Night)

- [ ] **Step 1: Write the failing test**

`mobile/src/features/wallpaper/__tests__/backgrounds.test.ts`:

```ts
import { BACKGROUNDS, DEFAULT_BACKGROUND } from '@/features/wallpaper/backgrounds';

// Relative luminance per WCAG 2.1.
function luminance(hex: string): number {
  const n = hex.replace('#', '');
  const rgb = [0, 2, 4].map((i) => parseInt(n.slice(i, i + 2), 16) / 255);
  const lin = rgb.map((c) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4));
  return 0.2126 * lin[0] + 0.7152 * lin[1] + 0.0722 * lin[2];
}
function contrast(a: string, b: string): number {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
}

test('ships the six named presets in mockup order', () => {
  expect(BACKGROUNDS.map((b) => b.name)).toEqual([
    'Deep Night', 'Still Water', 'First Light', 'Open Sky', 'Morning Mist', 'Horizon',
  ]);
});

test('every preset has a unique id', () => {
  const ids = BACKGROUNDS.map((b) => b.id);
  expect(new Set(ids).size).toBe(ids.length);
});

test('text is legible against both gradient stops (contrast >= 3)', () => {
  for (const bg of BACKGROUNDS) {
    expect(contrast(bg.textColor, bg.colors[0])).toBeGreaterThanOrEqual(3);
    expect(contrast(bg.textColor, bg.colors[1])).toBeGreaterThanOrEqual(3);
  }
});

test('default background is Deep Night', () => {
  expect(DEFAULT_BACKGROUND.name).toBe('Deep Night');
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd mobile && npx jest src/features/wallpaper/__tests__/backgrounds.test.ts`
Expected: FAIL — cannot find module `@/features/wallpaper/backgrounds`.

- [ ] **Step 3: Write the implementation**

`mobile/src/features/wallpaper/backgrounds.ts`:

```ts
export interface WallpaperBackground {
  id: string;
  name: string;
  colors: readonly [string, string]; // [top, bottom] for LinearGradient
  textColor: string;                 // verse + cross color
  mutedColor: string;                // reference eyebrow color
}

export const BACKGROUNDS: readonly WallpaperBackground[] = [
  { id: 'deep-night',   name: 'Deep Night',   colors: ['#1C3344', '#0F1F2B'], textColor: '#FFFFFF', mutedColor: '#C9DCE5' },
  { id: 'still-water',  name: 'Still Water',  colors: ['#5E8298', '#3A5568'], textColor: '#FFFFFF', mutedColor: '#DCEAF0' },
  { id: 'first-light',  name: 'First Light',  colors: ['#8AA2B0', '#C9DCE5'], textColor: '#1C3344', mutedColor: '#4C5C67' },
  { id: 'open-sky',     name: 'Open Sky',     colors: ['#C9DCE5', '#9CC0D4'], textColor: '#1C3344', mutedColor: '#4C5C67' },
  { id: 'morning-mist', name: 'Morning Mist', colors: ['#F4F8F9', '#D6E3E9'], textColor: '#1C3344', mutedColor: '#4C5C67' },
  { id: 'horizon',      name: 'Horizon',      colors: ['#5E8298', '#1C3344'], textColor: '#FFFFFF', mutedColor: '#C9DCE5' },
] as const;

export const DEFAULT_BACKGROUND: WallpaperBackground = BACKGROUNDS[0];
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cd mobile && npx jest src/features/wallpaper/__tests__/backgrounds.test.ts`
Expected: PASS (all four tests).

- [ ] **Step 5: Commit**

```bash
git add mobile/src/features/wallpaper/backgrounds.ts mobile/src/features/wallpaper/__tests__/backgrounds.test.ts
git commit -m "feat(wallpaper): add gradient background presets"
```

---

### Task 2b: Wallpaper draft store

**Files:**
- Create: `mobile/src/features/wallpaper/wallpaperDraft.ts`
- Test: `mobile/src/features/wallpaper/__tests__/wallpaperDraft.test.ts`

**Interfaces:**
- Consumes: `DEFAULT_BACKGROUND`, `WallpaperBackground` from Task 2; `TranslationId` from `@/bible`.
- Produces:
  - `useWallpaperDraft` zustand hook with state:
    `verse: { text: string; reference: string }`, `translation: TranslationId`, `background: WallpaperBackground`
    and setters `setVerse(text, reference)`, `setTranslation(id)`, `setBackground(bg)`.

- [ ] **Step 1: Write the failing test**

`mobile/src/features/wallpaper/__tests__/wallpaperDraft.test.ts`:

```ts
import { useWallpaperDraft } from '@/features/wallpaper/wallpaperDraft';
import { BACKGROUNDS } from '@/features/wallpaper/backgrounds';

test('defaults to Psalm 23:2 / KJV / Deep Night', () => {
  const s = useWallpaperDraft.getState();
  expect(s.verse).toEqual({ text: 'He leads me beside quiet waters.', reference: 'Psalm 23:2' });
  expect(s.translation).toBe('KJV');
  expect(s.background.name).toBe('Deep Night');
});

test('setVerse replaces the verse', () => {
  useWallpaperDraft.getState().setVerse('For God so loved the world', 'John 3:16');
  expect(useWallpaperDraft.getState().verse).toEqual({
    text: 'For God so loved the world', reference: 'John 3:16',
  });
});

test('setTranslation and setBackground update state', () => {
  useWallpaperDraft.getState().setTranslation('BSB');
  useWallpaperDraft.getState().setBackground(BACKGROUNDS[5]);
  expect(useWallpaperDraft.getState().translation).toBe('BSB');
  expect(useWallpaperDraft.getState().background.name).toBe('Horizon');
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd mobile && npx jest src/features/wallpaper/__tests__/wallpaperDraft.test.ts`
Expected: FAIL — cannot find module `wallpaperDraft`.

- [ ] **Step 3: Write the implementation**

`mobile/src/features/wallpaper/wallpaperDraft.ts`:

```ts
import { create } from 'zustand';
import { DEFAULT_BACKGROUND, type WallpaperBackground } from './backgrounds';
import type { TranslationId } from '@/bible';

const DEFAULT_VERSE = { text: 'He leads me beside quiet waters.', reference: 'Psalm 23:2' };

export interface WallpaperDraftState {
  verse: { text: string; reference: string };
  translation: TranslationId;
  background: WallpaperBackground;
  setVerse: (text: string, reference: string) => void;
  setTranslation: (id: TranslationId) => void;
  setBackground: (bg: WallpaperBackground) => void;
}

export const useWallpaperDraft = create<WallpaperDraftState>((set) => ({
  verse: DEFAULT_VERSE,
  translation: 'KJV',
  background: DEFAULT_BACKGROUND,
  setVerse: (text, reference) => set({ verse: { text, reference } }),
  setTranslation: (translation) => set({ translation }),
  setBackground: (background) => set({ background }),
}));
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cd mobile && npx jest src/features/wallpaper/__tests__/wallpaperDraft.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add mobile/src/features/wallpaper/wallpaperDraft.ts mobile/src/features/wallpaper/__tests__/wallpaperDraft.test.ts
git commit -m "feat(wallpaper): add draft store for verse/translation/background"
```

---

### Task 3: Random-verse picker ("Surprise me")

**Files:**
- Create: `mobile/src/features/wallpaper/randomVerse.ts`
- Test: `mobile/src/features/wallpaper/__tests__/randomVerse.test.ts`

**Interfaces:**
- Consumes: `getBooks`, `getChapter`, `getVerse` from `@/bible`; `TranslationId`, `Verse` types.
- Produces: `pickRandomVerse(translation: TranslationId, rand?: () => number): Verse` — always returns a defined verse; retries past empty chapters / textual-variant gaps.

- [ ] **Step 1: Write the failing test**

`mobile/src/features/wallpaper/__tests__/randomVerse.test.ts`:

```ts
import { pickRandomVerse } from '@/features/wallpaper/randomVerse';

jest.mock('@/bible', () => ({
  getBooks: () => [{ code: 'GEN', name: 'Genesis', testament: 'OT', order: 1, chapterCount: 2 }],
  getChapter: jest.fn(),
  getVerse: jest.fn(),
}));

import { getChapter, getVerse } from '@/bible';

const mockChapter = getChapter as jest.Mock;
const mockVerse = getVerse as jest.Mock;

beforeEach(() => {
  mockChapter.mockReset();
  mockVerse.mockReset();
});

test('returns a defined verse, retrying past an undefined one', () => {
  // Deterministic rand sequence drives the two attempts.
  const seq = [0, 0, 0, 0, 0, 0]; // always book 0, chapter 1, verse 1
  let i = 0;
  const rand = () => seq[i++ % seq.length];

  mockChapter.mockReturnValue(['', 'In the beginning...']); // verse 1 is a gap
  // First attempt asks for verse 1 -> undefined; second attempt verse 1 again but
  // we make getVerse return undefined once, then a real verse.
  mockVerse
    .mockReturnValueOnce(undefined)
    .mockReturnValue({ text: 'In the beginning...', reference: 'Genesis 1:1' });

  const v = pickRandomVerse('KJV', rand);
  expect(v).toEqual({ text: 'In the beginning...', reference: 'Genesis 1:1' });
  expect(mockVerse).toHaveBeenCalledTimes(2); // retried once
});

test('skips empty chapters without calling getVerse', () => {
  const rand = () => 0;
  mockChapter.mockReturnValueOnce([]).mockReturnValue(['Verse text']);
  mockVerse.mockReturnValue({ text: 'Verse text', reference: 'Genesis 1:1' });

  const v = pickRandomVerse('KJV', rand);
  expect(v.text).toBe('Verse text');
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd mobile && npx jest src/features/wallpaper/__tests__/randomVerse.test.ts`
Expected: FAIL — cannot find module `randomVerse`.

- [ ] **Step 3: Write the implementation**

`mobile/src/features/wallpaper/randomVerse.ts`:

```ts
import { getBooks, getChapter, getVerse } from '@/bible';
import type { TranslationId, Verse } from '@/bible';

const FALLBACK: Verse = { text: 'He leads me beside quiet waters.', reference: 'Psalm 23:2' };

/**
 * Pick a random, defined verse from anywhere in the Bible. Retries past empty
 * chapters and textual-variant gaps (where getVerse returns undefined).
 * `rand` is injectable for deterministic tests; defaults to Math.random.
 */
export function pickRandomVerse(
  translation: TranslationId,
  rand: () => number = Math.random,
): Verse {
  const books = getBooks();
  for (let attempt = 0; attempt < 200; attempt++) {
    const book = books[Math.floor(rand() * books.length)];
    const chapter = Math.floor(rand() * book.chapterCount) + 1;
    const verses = getChapter(translation, book.code, chapter);
    if (verses.length === 0) continue;
    const verseNum = Math.floor(rand() * verses.length) + 1;
    const found = getVerse(translation, book.code, chapter, verseNum);
    if (found) return found;
  }
  return FALLBACK;
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cd mobile && npx jest src/features/wallpaper/__tests__/randomVerse.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add mobile/src/features/wallpaper/randomVerse.ts mobile/src/features/wallpaper/__tests__/randomVerse.test.ts
git commit -m "feat(wallpaper): add random-verse picker for Surprise me"
```

---

### Task 4: WallpaperCanvas component

**Files:**
- Create: `mobile/src/features/wallpaper/WallpaperCanvas.tsx`
- Test: `mobile/src/features/wallpaper/__tests__/WallpaperCanvas.test.tsx`

**Interfaces:**
- Consumes: `WallpaperBackground` from Task 2; `ThemedText` from `@/components/ThemedText`; `expo-linear-gradient`.
- Produces: `WallpaperCanvas(props: { verseText: string; reference: string; background: WallpaperBackground })` — a full-flex composition. Rendered full-bleed as preview and captured by ref for export.

- [ ] **Step 1: Write the failing test**

`mobile/src/features/wallpaper/__tests__/WallpaperCanvas.test.tsx`:

```tsx
import { render, screen } from '@testing-library/react-native';
import { WallpaperCanvas } from '@/features/wallpaper/WallpaperCanvas';
import { BACKGROUNDS } from '@/features/wallpaper/backgrounds';

test('renders the verse and reference', () => {
  render(
    <WallpaperCanvas
      verseText="He leads me beside quiet waters."
      reference="Psalm 23:2"
      background={BACKGROUNDS[0]}
    />,
  );
  expect(screen.getByText(/He leads me beside quiet waters\./)).toBeOnTheScreen();
  expect(screen.getByText('Psalm 23:2')).toBeOnTheScreen();
});

test('applies the preset text color to the verse', () => {
  const light = BACKGROUNDS.find((b) => b.name === 'Morning Mist')!;
  render(<WallpaperCanvas verseText="Test verse" reference="Ref 1:1" background={light} />);
  const verse = screen.getByText(/Test verse/);
  const flat = Array.isArray(verse.props.style)
    ? Object.assign({}, ...verse.props.style.flat())
    : verse.props.style;
  expect(flat.color).toBe(light.textColor);
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd mobile && npx jest src/features/wallpaper/__tests__/WallpaperCanvas.test.tsx`
Expected: FAIL — cannot find module `WallpaperCanvas`.

- [ ] **Step 3: Write the implementation**

`mobile/src/features/wallpaper/WallpaperCanvas.tsx`:

```tsx
import { Image, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { ThemedText } from '@/components/ThemedText';
import { spacing } from '@/theme';
import type { WallpaperBackground } from './backgrounds';

interface Props {
  verseText: string;
  reference: string;
  background: WallpaperBackground;
}

export function WallpaperCanvas({ verseText, reference, background }: Props) {
  return (
    <LinearGradient
      colors={background.colors}
      style={{ flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: spacing.xl }}
    >
      <Image
        source={require('../../../assets/images/symbol-white.png')}
        style={{
          width: 22,
          height: 22,
          resizeMode: 'contain',
          tintColor: background.textColor,
          marginBottom: spacing.lg,
        }}
      />
      <View style={{ flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'center' }}>
        <ThemedText variant="quote" align="center" color={background.textColor} style={{ fontSize: 30, lineHeight: 40 }}>
          “{verseText}”
        </ThemedText>
      </View>
      <ThemedText variant="eyebrow" color={background.mutedColor} style={{ marginTop: spacing.lg }}>
        {reference}
      </ThemedText>
    </LinearGradient>
  );
}
```

Note: the white `symbol-white.png` is recolored per background via `tintColor`, so no separate dark-cross asset is needed.

- [ ] **Step 4: Run test to verify it passes**

Run: `cd mobile && npx jest src/features/wallpaper/__tests__/WallpaperCanvas.test.tsx`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add mobile/src/features/wallpaper/WallpaperCanvas.tsx mobile/src/features/wallpaper/__tests__/WallpaperCanvas.test.tsx
git commit -m "feat(wallpaper): add WallpaperCanvas preview/capture component"
```

---

### Task 5: Toast component

**Files:**
- Create: `mobile/src/components/Toast.tsx`
- Modify: `mobile/src/components/index.ts` (add export)
- Test: `mobile/src/components/__tests__/Toast.test.tsx`

**Interfaces:**
- Produces: `Toast(props: { message: string; visible: boolean; onHide: () => void })` — renders a dark pill with a green check when `visible`, auto-calls `onHide` after 2600ms, renders nothing when not visible.

- [ ] **Step 1: Write the failing test**

`mobile/src/components/__tests__/Toast.test.tsx`:

```tsx
import { render, screen, act } from '@testing-library/react-native';
import { Toast } from '@/components';

test('renders the message when visible', () => {
  render(<Toast message="Wallpaper saved" visible onHide={() => {}} />);
  expect(screen.getByText('Wallpaper saved')).toBeOnTheScreen();
});

test('renders nothing when not visible', () => {
  render(<Toast message="Wallpaper saved" visible={false} onHide={() => {}} />);
  expect(screen.queryByText('Wallpaper saved')).toBeNull();
});

test('calls onHide after the timeout', () => {
  jest.useFakeTimers();
  const onHide = jest.fn();
  render(<Toast message="Wallpaper saved" visible onHide={onHide} />);
  act(() => { jest.advanceTimersByTime(2600); });
  expect(onHide).toHaveBeenCalledTimes(1);
  jest.useRealTimers();
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd mobile && npx jest src/components/__tests__/Toast.test.tsx`
Expected: FAIL — `Toast` is not exported from `@/components`.

- [ ] **Step 3: Write the implementation**

`mobile/src/components/Toast.tsx`:

```tsx
import { useEffect } from 'react';
import { View } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { ThemedText } from './ThemedText';
import { colors, spacing } from '@/theme';

interface Props {
  message: string;
  visible: boolean;
  onHide: () => void;
}

export function Toast({ message, visible, onHide }: Props) {
  useEffect(() => {
    if (!visible) return;
    const timer = setTimeout(onHide, 2600);
    return () => clearTimeout(timer);
  }, [visible, onHide]);

  if (!visible) return null;

  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.sm,
        backgroundColor: colors.primary,
        borderRadius: 999,
        paddingVertical: spacing.md,
        paddingHorizontal: spacing.lg,
      }}
    >
      <View
        style={{
          width: 22,
          height: 22,
          borderRadius: 11,
          backgroundColor: colors.success,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Svg width={12} height={12} viewBox="0 0 24 24" fill="none">
          <Path d="M5 13l4 4L19 7" stroke="#fff" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" />
        </Svg>
      </View>
      <ThemedText variant="body" color={colors.white}>{message}</ThemedText>
    </View>
  );
}
```

Add to `mobile/src/components/index.ts` (append):

```ts
export { Toast } from './Toast';
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cd mobile && npx jest src/components/__tests__/Toast.test.tsx`
Expected: PASS (all three tests).

- [ ] **Step 5: Commit**

```bash
git add mobile/src/components/Toast.tsx mobile/src/components/index.ts mobile/src/components/__tests__/Toast.test.tsx
git commit -m "feat(wallpaper): add Toast component"
```

---

### Task 6: Export (capture + save to Photos)

**Files:**
- Create: `mobile/src/features/wallpaper/export.ts`
- Test: `mobile/src/features/wallpaper/__tests__/export.test.ts`

**Interfaces:**
- Consumes: `captureRef` from `react-native-view-shot`; `requestPermissionsAsync`, `saveToLibraryAsync` from `expo-media-library`.
- Produces: `type SaveResult = 'saved' | 'denied' | 'error'`; `saveWallpaperToPhotos(ref: RefObject<View | null>): Promise<SaveResult>`.

- [ ] **Step 1: Write the failing test**

`mobile/src/features/wallpaper/__tests__/export.test.ts`:

```ts
import { createRef } from 'react';
import type { View } from 'react-native';
import { saveWallpaperToPhotos } from '@/features/wallpaper/export';

jest.mock('react-native-view-shot', () => ({ captureRef: jest.fn() }));
jest.mock('expo-media-library', () => ({
  requestPermissionsAsync: jest.fn(),
  saveToLibraryAsync: jest.fn(),
}));

import { captureRef } from 'react-native-view-shot';
import { requestPermissionsAsync, saveToLibraryAsync } from 'expo-media-library';

const mockCapture = captureRef as jest.Mock;
const mockPerm = requestPermissionsAsync as jest.Mock;
const mockSave = saveToLibraryAsync as jest.Mock;

beforeEach(() => {
  mockCapture.mockReset();
  mockPerm.mockReset();
  mockSave.mockReset();
});

test('captures then saves when permission granted', async () => {
  mockPerm.mockResolvedValue({ status: 'granted' });
  mockCapture.mockResolvedValue('file:///tmp/wall.png');
  mockSave.mockResolvedValue(undefined);

  const ref = createRef<View>();
  const result = await saveWallpaperToPhotos(ref);

  expect(result).toBe('saved');
  expect(mockPerm).toHaveBeenCalledWith(true); // write-only
  expect(mockCapture).toHaveBeenCalledWith(ref, { format: 'png' });
  expect(mockSave).toHaveBeenCalledWith('file:///tmp/wall.png');
});

test('returns denied and never captures when permission refused', async () => {
  mockPerm.mockResolvedValue({ status: 'denied' });

  const result = await saveWallpaperToPhotos(createRef<View>());

  expect(result).toBe('denied');
  expect(mockCapture).not.toHaveBeenCalled();
  expect(mockSave).not.toHaveBeenCalled();
});

test('returns error when capture throws', async () => {
  mockPerm.mockResolvedValue({ status: 'granted' });
  mockCapture.mockRejectedValue(new Error('boom'));

  const result = await saveWallpaperToPhotos(createRef<View>());

  expect(result).toBe('error');
  expect(mockSave).not.toHaveBeenCalled();
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd mobile && npx jest src/features/wallpaper/__tests__/export.test.ts`
Expected: FAIL — cannot find module `export`.

- [ ] **Step 3: Write the implementation**

`mobile/src/features/wallpaper/export.ts`:

```ts
import type { RefObject } from 'react';
import type { View } from 'react-native';
import { captureRef } from 'react-native-view-shot';
import { requestPermissionsAsync, saveToLibraryAsync } from 'expo-media-library';

export type SaveResult = 'saved' | 'denied' | 'error';

/**
 * Capture the referenced view to a retina PNG and save it to the Photos library.
 * Uses write-only permission (requestPermissionsAsync(true)).
 */
export async function saveWallpaperToPhotos(ref: RefObject<View | null>): Promise<SaveResult> {
  try {
    const { status } = await requestPermissionsAsync(true);
    if (status !== 'granted') return 'denied';
    const uri = await captureRef(ref, { format: 'png' });
    await saveToLibraryAsync(uri);
    return 'saved';
  } catch {
    return 'error';
  }
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cd mobile && npx jest src/features/wallpaper/__tests__/export.test.ts`
Expected: PASS (all three tests).

- [ ] **Step 5: Commit**

```bash
git add mobile/src/features/wallpaper/export.ts mobile/src/features/wallpaper/__tests__/export.test.ts
git commit -m "feat(wallpaper): add capture + save-to-Photos export"
```

---

### Task 7: Background picker sheet route

**Files:**
- Create: `mobile/src/app/wallpaper-backgrounds.tsx`
- Test: `mobile/src/app/__tests__/wallpaper-backgrounds.test.tsx`

**Interfaces:**
- Consumes: `BACKGROUNDS` (Task 2), `useWallpaperDraft` (Task 2b), `useRouter` from `expo-router`, `LinearGradient`.
- Produces: default-exported screen component. Tapping a swatch calls `setBackground(bg)`; tapping close calls `router.back()`.

- [ ] **Step 1: Write the failing test**

`mobile/src/app/__tests__/wallpaper-backgrounds.test.tsx`:

```tsx
import { render, screen, fireEvent } from '@testing-library/react-native';
import BackgroundsSheet from '@/app/wallpaper-backgrounds';
import { useWallpaperDraft } from '@/features/wallpaper/wallpaperDraft';

const back = jest.fn();
jest.mock('expo-router', () => ({ useRouter: () => ({ back }) }));

beforeEach(() => {
  back.mockReset();
  useWallpaperDraft.getState().setBackground(useWallpaperDraft.getState().background); // reset to current
});

test('lists all preset names', () => {
  render(<BackgroundsSheet />);
  expect(screen.getByText('Deep Night')).toBeOnTheScreen();
  expect(screen.getByText('Horizon')).toBeOnTheScreen();
});

test('tapping a swatch updates the draft background', () => {
  render(<BackgroundsSheet />);
  fireEvent.press(screen.getByText('Horizon'));
  expect(useWallpaperDraft.getState().background.name).toBe('Horizon');
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd mobile && npx jest src/app/__tests__/wallpaper-backgrounds.test.tsx`
Expected: FAIL — cannot find module `@/app/wallpaper-backgrounds`.

- [ ] **Step 3: Write the implementation**

`mobile/src/app/wallpaper-backgrounds.tsx`:

```tsx
import { Pressable, ScrollView, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { ThemedText } from '@/components';
import { colors, spacing } from '@/theme';
import { BACKGROUNDS } from '@/features/wallpaper/backgrounds';
import { useWallpaperDraft } from '@/features/wallpaper/wallpaperDraft';

export default function BackgroundsSheet() {
  const router = useRouter();
  const { background, setBackground } = useWallpaperDraft();

  return (
    <View style={{ flex: 1, backgroundColor: colors.surface, padding: spacing.lg }}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.lg }}>
        <ThemedText variant="title">Backgrounds</ThemedText>
        <Pressable
          onPress={() => router.back()}
          accessibilityLabel="Close"
          style={{ width: 32, height: 32, borderRadius: 16, backgroundColor: colors.paleAlt, alignItems: 'center', justifyContent: 'center' }}
        >
          <ThemedText variant="body" color={colors.textMuted}>×</ThemedText>
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.md }}>
        {BACKGROUNDS.map((bg) => {
          const selected = bg.id === background.id;
          return (
            <Pressable key={bg.id} onPress={() => setBackground(bg)} style={{ width: '30%' }}>
              <LinearGradient
                colors={bg.colors}
                style={{
                  height: 140,
                  borderRadius: 16,
                  borderWidth: selected ? 3 : 0,
                  borderColor: colors.primary,
                }}
              />
              <ThemedText variant="caption" color={selected ? colors.primary : colors.textFaint} style={{ marginTop: spacing.xs }}>
                {bg.name}
              </ThemedText>
            </Pressable>
          );
        })}
      </ScrollView>
    </View>
  );
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cd mobile && npx jest src/app/__tests__/wallpaper-backgrounds.test.tsx`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add mobile/src/app/wallpaper-backgrounds.tsx mobile/src/app/__tests__/wallpaper-backgrounds.test.tsx
git commit -m "feat(wallpaper): add background picker sheet"
```

---

### Task 8: Verse picker sheet route

**Files:**
- Create: `mobile/src/app/wallpaper-verse-picker.tsx`
- Test: `mobile/src/app/__tests__/wallpaper-verse-picker.test.tsx`

**Interfaces:**
- Consumes: `getBooks`, `getChapter`, `getVerse`, `getVerseByRef`, `listTranslations` from `@/bible`; `pickRandomVerse` (Task 3); `useWallpaperDraft` (Task 2b); `useRouter`.
- Produces: default-exported screen with internal step state `book | chapter | verse`; on any selection writes to the draft store via `setVerse` and calls `router.back()`.

- [ ] **Step 1: Write the failing test**

`mobile/src/app/__tests__/wallpaper-verse-picker.test.tsx`:

```tsx
import { render, screen, fireEvent } from '@testing-library/react-native';
import VersePicker from '@/app/wallpaper-verse-picker';
import { useWallpaperDraft } from '@/features/wallpaper/wallpaperDraft';

const back = jest.fn();
jest.mock('expo-router', () => ({ useRouter: () => ({ back }) }));

jest.mock('@/features/wallpaper/randomVerse', () => ({
  pickRandomVerse: () => ({ text: 'Surprise verse', reference: 'Acts 1:8' }),
}));

beforeEach(() => back.mockReset());

test('Surprise me sets a random verse and closes', () => {
  render(<VersePicker />);
  fireEvent.press(screen.getByText('Surprise me'));
  expect(useWallpaperDraft.getState().verse.reference).toBe('Acts 1:8');
  expect(back).toHaveBeenCalled();
});

test('OT/NT toggle filters the book grid', () => {
  render(<VersePicker />);
  // Default NT shows Matthew; switch to OT shows Genesis.
  expect(screen.getByText('Matthew')).toBeOnTheScreen();
  fireEvent.press(screen.getByText('Old Testament'));
  expect(screen.getByText('Genesis')).toBeOnTheScreen();
});

test('drilling book -> chapter -> verse commits a real verse', () => {
  render(<VersePicker />);
  fireEvent.press(screen.getByText('Matthew'));   // step: book -> chapter
  fireEvent.press(screen.getByText('1'));          // chapter 1 -> step: verse
  fireEvent.press(screen.getByText('1'));          // verse 1 -> commit
  expect(useWallpaperDraft.getState().verse.reference).toBe('Matthew 1:1');
  expect(back).toHaveBeenCalled();
});

test('search commits a verse by reference', () => {
  render(<VersePicker />);
  fireEvent.changeText(screen.getByPlaceholderText('Search a verse'), 'John 3:16');
  fireEvent(screen.getByPlaceholderText('Search a verse'), 'submitEditing');
  expect(useWallpaperDraft.getState().verse.reference).toBe('John 3:16');
});

test('invalid search shows not-found feedback and does not close', () => {
  render(<VersePicker />);
  fireEvent.changeText(screen.getByPlaceholderText('Search a verse'), 'Nowhere 9:9');
  fireEvent(screen.getByPlaceholderText('Search a verse'), 'submitEditing');
  expect(screen.getByText('Verse not found')).toBeOnTheScreen();
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd mobile && npx jest src/app/__tests__/wallpaper-verse-picker.test.tsx`
Expected: FAIL — cannot find module `@/app/wallpaper-verse-picker`.

- [ ] **Step 3: Write the implementation**

`mobile/src/app/wallpaper-verse-picker.tsx`:

```tsx
import { useState } from 'react';
import { Pressable, ScrollView, TextInput, View } from 'react-native';
import { useRouter } from 'expo-router';
import { ThemedText } from '@/components';
import { colors, spacing } from '@/theme';
import {
  getBooks, getChapter, getVerse, getVerseByRef, listTranslations,
  type BookMeta, type TranslationId, type Verse,
} from '@/bible';
import { useWallpaperDraft } from '@/features/wallpaper/wallpaperDraft';
import { pickRandomVerse } from '@/features/wallpaper/randomVerse';

type Step = 'book' | 'chapter' | 'verse';

export default function VersePicker() {
  const router = useRouter();
  const { translation, setTranslation, setVerse } = useWallpaperDraft();
  const [testament, setTestament] = useState<'OT' | 'NT'>('NT');
  const [step, setStep] = useState<Step>('book');
  const [book, setBook] = useState<BookMeta | null>(null);
  const [chapter, setChapter] = useState<number | null>(null);
  const [query, setQuery] = useState('');
  const [notFound, setNotFound] = useState(false);

  function commit(v: Verse) {
    setVerse(v.text, v.reference);
    router.back();
  }

  function onSearch() {
    const v = getVerseByRef(translation, query.trim());
    if (!v) { setNotFound(true); return; }
    commit(v);
  }

  const books = getBooks().filter((b) => b.testament === testament);

  return (
    <View style={{ flex: 1, backgroundColor: colors.surface, padding: spacing.lg, gap: spacing.md }}>
      {/* Search + Surprise + translation */}
      <View style={{ flexDirection: 'row', gap: spacing.sm, alignItems: 'center' }}>
        <Pressable
          onPress={() => commit(pickRandomVerse(translation))}
          style={{ backgroundColor: colors.primary, borderRadius: 999, paddingVertical: spacing.sm, paddingHorizontal: spacing.md }}
        >
          <ThemedText variant="caption" color={colors.white}>✦ Surprise me</ThemedText>
        </Pressable>
        <Pressable
          onPress={() => setTranslation(nextTranslation(translation))}
          style={{ marginLeft: 'auto', backgroundColor: colors.white, borderRadius: 999, paddingVertical: spacing.sm, paddingHorizontal: spacing.md }}
        >
          <ThemedText variant="caption" color={colors.primary}>{translation} ⌄</ThemedText>
        </Pressable>
      </View>

      <TextInput
        placeholder="Search a verse"
        placeholderTextColor={colors.textFaint}
        value={query}
        onChangeText={(t) => { setQuery(t); setNotFound(false); }}
        onSubmitEditing={onSearch}
        returnKeyType="search"
        style={{ backgroundColor: colors.white, borderRadius: 999, paddingVertical: spacing.md, paddingHorizontal: spacing.lg, color: colors.primary }}
      />
      {notFound && <ThemedText variant="caption" color={colors.textMuted}>Verse not found</ThemedText>}

      {/* OT/NT toggle */}
      <View style={{ flexDirection: 'row', backgroundColor: colors.paleAlt, borderRadius: 999, padding: 4 }}>
        {(['OT', 'NT'] as const).map((t) => (
          <Pressable
            key={t}
            onPress={() => { setTestament(t); setStep('book'); setBook(null); }}
            style={{ flex: 1, alignItems: 'center', paddingVertical: spacing.sm, borderRadius: 999, backgroundColor: testament === t ? colors.white : 'transparent' }}
          >
            <ThemedText variant="caption" color={testament === t ? colors.primary : colors.textFaint}>
              {t === 'OT' ? 'Old Testament' : 'New Testament'}
            </ThemedText>
          </Pressable>
        ))}
      </View>

      <ScrollView contentContainerStyle={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm }}>
        {step === 'book' && books.map((b) => (
          <Cell key={b.code} label={b.name} onPress={() => { setBook(b); setStep('chapter'); }} />
        ))}

        {step === 'chapter' && book && Array.from({ length: book.chapterCount }, (_, i) => i + 1).map((c) => (
          <Cell key={c} label={String(c)} onPress={() => { setChapter(c); setStep('verse'); }} />
        ))}

        {step === 'verse' && book && chapter && verseNumbers(translation, book.code, chapter).map((v) => (
          <Cell
            key={v}
            label={String(v)}
            onPress={() => {
              const verse = getVerse(translation, book.code, chapter, v);
              if (verse) commit(verse);
            }}
          />
        ))}
      </ScrollView>
    </View>
  );
}

function Cell({ label, onPress }: { label: string; onPress: () => void }) {
  return (
    <Pressable
      onPress={onPress}
      style={{ minWidth: '30%', flexGrow: 1, alignItems: 'center', paddingVertical: spacing.md, borderRadius: 12, borderWidth: 1, borderColor: colors.paleAlt }}
    >
      <ThemedText variant="body" color={colors.primary}>{label}</ThemedText>
    </Pressable>
  );
}

function verseNumbers(translation: TranslationId, code: string, chapter: number): number[] {
  return getChapter(translation, code, chapter)
    .map((text, i) => ({ text, n: i + 1 }))
    .filter((x) => x.text !== '')
    .map((x) => x.n);
}

function nextTranslation(current: TranslationId): TranslationId {
  const ids = listTranslations().map((t) => t.id);
  return ids[(ids.indexOf(current) + 1) % ids.length];
}
```

Note: the translation control is a compact pill that cycles through available translations (KJV ↔ BSB) rather than a popover dropdown — same functionality, simpler and testable. This is an intentional simplification of the mockup's dropdown.

- [ ] **Step 4: Run test to verify it passes**

Run: `cd mobile && npx jest src/app/__tests__/wallpaper-verse-picker.test.tsx`
Expected: PASS (all five tests). Note: the "1" chapter and "1" verse both render "1"; `getByText('1')` after pressing Matthew resolves to the chapter grid (step === 'chapter'), then after selecting chapter the verse grid renders and `getByText('1')` resolves to verse 1 — each assertion runs while only one grid is mounted.

- [ ] **Step 5: Commit**

```bash
git add mobile/src/app/wallpaper-verse-picker.tsx mobile/src/app/__tests__/wallpaper-verse-picker.test.tsx
git commit -m "feat(wallpaper): add verse picker sheet (browse/search/surprise)"
```

---

### Task 9: Wire the Create screen + register form-sheet routes

**Files:**
- Modify: `mobile/src/app/(tabs)/create.tsx` (replace placeholder)
- Modify: `mobile/src/app/_layout.tsx` (register the two routes as form-sheets)
- Test: `mobile/src/app/__tests__/create.test.tsx`

**Interfaces:**
- Consumes: `WallpaperCanvas` (Task 4), `useWallpaperDraft` (Task 2b), `saveWallpaperToPhotos` (Task 6), `Toast` (Task 5), `successFeedback` from `@/lib/haptics`, `useRouter`.

- [ ] **Step 1: Write the failing test**

`mobile/src/app/__tests__/create.test.tsx`:

```tsx
import { render, screen, fireEvent, waitFor } from '@testing-library/react-native';
import Create from '@/app/(tabs)/create';

const push = jest.fn();
jest.mock('expo-router', () => ({ useRouter: () => ({ push }) }));
jest.mock('@/lib/haptics', () => ({ successFeedback: jest.fn() }));

const saveMock = jest.fn();
jest.mock('@/features/wallpaper/export', () => ({
  saveWallpaperToPhotos: (...args: unknown[]) => saveMock(...args),
}));

beforeEach(() => { push.mockReset(); saveMock.mockReset(); });

test('renders the default verse in the preview', () => {
  render(<Create />);
  expect(screen.getByText(/He leads me beside quiet waters\./)).toBeOnTheScreen();
});

test('search pill opens the verse picker route', () => {
  render(<Create />);
  fireEvent.press(screen.getByText('Search a verse'));
  expect(push).toHaveBeenCalledWith('/wallpaper-verse-picker');
});

test('Set as wallpaper saves and shows the toast on success', async () => {
  saveMock.mockResolvedValue('saved');
  render(<Create />);
  fireEvent.press(screen.getByText('Set as wallpaper'));
  await waitFor(() => expect(screen.getByText('Wallpaper saved')).toBeOnTheScreen());
});

test('denied permission shows a hint, not the toast', async () => {
  saveMock.mockResolvedValue('denied');
  render(<Create />);
  fireEvent.press(screen.getByText('Set as wallpaper'));
  await waitFor(() => expect(screen.getByText(/Enable Photos access/)).toBeOnTheScreen());
  expect(screen.queryByText('Wallpaper saved')).toBeNull();
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd mobile && npx jest src/app/__tests__/create.test.tsx`
Expected: FAIL — current `create.tsx` renders the placeholder, not these elements.

- [ ] **Step 3: Rewrite `create.tsx`**

Replace the entire contents of `mobile/src/app/(tabs)/create.tsx`:

```tsx
import { useRef, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Path, Rect } from 'react-native-svg';
import { useRouter } from 'expo-router';
import { ThemedText, Toast } from '@/components';
import { colors, spacing } from '@/theme';
import { successFeedback } from '@/lib/haptics';
import { WallpaperCanvas } from '@/features/wallpaper/WallpaperCanvas';
import { useWallpaperDraft } from '@/features/wallpaper/wallpaperDraft';
import { saveWallpaperToPhotos } from '@/features/wallpaper/export';

export default function Create() {
  const router = useRouter();
  const { verse, background } = useWallpaperDraft();
  const canvasRef = useRef<View>(null);
  const [toast, setToast] = useState(false);
  const [hint, setHint] = useState<string | null>(null);

  async function onSave() {
    const result = await saveWallpaperToPhotos(canvasRef);
    if (result === 'saved') {
      successFeedback();
      setHint('Set it via Settings › Wallpaper.');
      setToast(true);
    } else if (result === 'denied') {
      setHint('Enable Photos access in Settings to save.');
    } else {
      setHint("Couldn't save wallpaper. Please try again.");
    }
  }

  return (
    <View style={{ flex: 1 }}>
      {/* Capture target: full-bleed canvas. collapsable={false} keeps a native view for view-shot. */}
      <View ref={canvasRef} collapsable={false} style={StyleSheet.absoluteFill}>
        <WallpaperCanvas verseText={verse.text} reference={verse.reference} background={background} />
      </View>

      <SafeAreaView style={{ flex: 1, justifyContent: 'flex-end' }}>
        <View style={{ padding: spacing.lg, gap: spacing.sm }}>
          {hint && <ThemedText variant="caption" color={colors.white} align="center">{hint}</ThemedText>}
          {toast && <Toast message="Wallpaper saved" visible={toast} onHide={() => setToast(false)} />}

          <View style={{ flexDirection: 'row', gap: spacing.sm }}>
            <Pressable
              onPress={() => router.push('/wallpaper-verse-picker')}
              style={{ flex: 1, backgroundColor: colors.white, borderRadius: 999, paddingVertical: spacing.md, paddingHorizontal: spacing.lg }}
            >
              <ThemedText variant="body" color={colors.textFaint}>Search a verse</ThemedText>
            </Pressable>
            <Pressable
              onPress={() => router.push('/wallpaper-backgrounds')}
              accessibilityLabel="Backgrounds"
              style={{ width: 52, backgroundColor: colors.white, borderRadius: 999, alignItems: 'center', justifyContent: 'center' }}
            >
              <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
                <Rect x={3} y={3} width={7} height={7} rx={1.5} stroke={colors.primary} strokeWidth={1.8} />
                <Rect x={14} y={3} width={7} height={7} rx={1.5} stroke={colors.primary} strokeWidth={1.8} />
                <Rect x={3} y={14} width={7} height={7} rx={1.5} stroke={colors.primary} strokeWidth={1.8} />
                <Rect x={14} y={14} width={7} height={7} rx={1.5} stroke={colors.primary} strokeWidth={1.8} />
              </Svg>
            </Pressable>
          </View>

          <Pressable
            onPress={onSave}
            style={({ pressed }) => ({ backgroundColor: colors.white, opacity: pressed ? 0.9 : 1, borderRadius: 999, paddingVertical: spacing.md + 2, alignItems: 'center' })}
          >
            <ThemedText variant="button" color={colors.primary}>Set as wallpaper</ThemedText>
          </Pressable>
        </View>
      </SafeAreaView>
    </View>
  );
}
```

- [ ] **Step 4: Register the two routes as form-sheets in `_layout.tsx`**

In `mobile/src/app/_layout.tsx`, replace the self-closing `<Stack screenOptions={{ headerShown: false }} />` with an explicit Stack that declares the two sheet routes (all other routes remain auto-registered):

```tsx
<Stack screenOptions={{ headerShown: false }}>
  <Stack.Screen
    name="wallpaper-verse-picker"
    options={{ presentation: 'formSheet', sheetGrabberVisible: true, sheetAllowedDetents: [0.6, 0.95] }}
  />
  <Stack.Screen
    name="wallpaper-backgrounds"
    options={{ presentation: 'formSheet', sheetGrabberVisible: true, sheetAllowedDetents: [0.6, 0.95] }}
  />
</Stack>
```

- [ ] **Step 5: Run tests to verify they pass**

Run: `cd mobile && npx jest src/app/__tests__/create.test.tsx`
Expected: PASS (all four tests).

- [ ] **Step 6: Full suite + type check**

Run: `cd mobile && npx tsc --noEmit && npx jest`
Expected: type check clean; entire suite green.

- [ ] **Step 7: Commit**

```bash
git add mobile/src/app/(tabs)/create.tsx mobile/src/app/_layout.tsx mobile/src/app/__tests__/create.test.tsx
git commit -m "feat(wallpaper): wire Create screen + register picker sheets"
```

---

### Task 10: Manual device verification

No automated test — this validates the native capture/save path that Jest mocks out.

- [ ] **Step 1: Run on an iOS simulator/device**

```bash
cd mobile
npx expo run:ios
```

- [ ] **Step 2: Walk the flow**

1. Open the **Create** tab → preview shows Psalm 23:2 on Deep Night.
2. Tap **Search a verse** → sheet slides up with grabber; try **Surprise me**, a book→chapter→verse drill-down, and a search ("John 3:16"). Each updates the preview.
3. Tap the **grid** button → backgrounds sheet; pick each preset and confirm text stays legible (light presets show dark text).
4. Tap **Set as wallpaper** → grant Photos permission → "Wallpaper saved" toast + Settings hint. Confirm a crisp full-screen image exists in Photos.
5. Re-run and **deny** permission → hint appears, no crash.

- [ ] **Step 3: Note any issues**

If capture is blank or low-res, verify `collapsable={false}` on the capture wrapper and that `captureRef` targets the full-screen view. Fix and re-verify before closing the task.

---

## Self-Review

**Spec coverage:**
- Full-bleed live preview → Task 4 (`WallpaperCanvas`) + Task 9 (Create screen). ✓
- Verse selection: book→chapter→verse, search, Surprise me → Task 8 + Task 3. ✓
- Six gradient backgrounds with auto-adapted legible text → Task 2 (+ contrast test). ✓
- Export to Photos + toast + Settings hint → Task 6 + Task 5 + Task 9. ✓
- Defaults (KJV / Psalm 23:2 / Deep Night) → Task 2b. ✓
- No wordmark, cross+verse+reference only → Task 4. ✓
- Native config (view-shot v4, media-library write-only permission) → Task 1. ✓
- Error handling (denied, capture failure, invalid search, empty verse) → Task 6 + Task 8 + Task 3 + Task 9. ✓
- Out-of-scope items (images, wordmark, gallery, persistence) → not implemented. ✓

**Placeholder scan:** No TBD/TODO; every code step contains full code; every test step contains real assertions.

**Type consistency:** `WallpaperBackground` shape identical across Tasks 2/2b/4/7. `SaveResult` values (`'saved' | 'denied' | 'error'`) consistent between Task 6 and Task 9. `useWallpaperDraft` setters (`setVerse`, `setTranslation`, `setBackground`) consistent across 2b/7/8/9. Route names (`/wallpaper-verse-picker`, `/wallpaper-backgrounds`) consistent between Task 9 pushes and Tasks 7/8 file names and the `_layout.tsx` registration.
