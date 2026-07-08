# Bible Reading Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a calm, book-like Bible reading experience as a new "Read" tab, with an auto-saved reading position and hooks into share + wallpaper creation.

**Architecture:** A new `src/features/reading/` module holds a persisted Zustand store (MMKV-backed) for reading position + preferences, pure helpers for chapter navigation and share formatting, and presentational components (verse renderer, four in-screen overlays, verse action menu) assembled by a single `ReadingScreen`. All scripture comes through the existing `@/bible` API unchanged. A thin `(tabs)/read.tsx` route mounts the screen.

**Tech Stack:** Expo SDK 57, expo-router, React Native (core `Pressable`/`Animated`/`ScrollView`), Zustand 5 + `persist`, react-native-mmkv, expo-haptics, Jest + @testing-library/react-native.

## Global Constraints

- Expo SDK version: `~57.0.2`. Read https://docs.expo.dev/versions/v57.0.0/ before writing native/Expo code.
- Translations available: **KJV and BSB only**. Never reference NIV/ESV/NLT/MSG in code or UI.
- Reading position is **verse-anchored**, never a pixel scroll offset.
- Typefaces: **Serif** = `CormorantGaramond_500Medium`, **Sans** = `HankenGrotesk_400Regular`. No third face.
- Share attribution app name is exactly **"Quiet Waters"**.
- Use theme tokens from `@/theme` (`colors`, `spacing`, `typography`) — no hardcoded hex/sizes in components.
- Long-press uses core `Pressable`'s `onLongPress` — do NOT add `react-native-gesture-handler` wiring.
- Follow existing conventions: functional components, inline styles with theme tokens, tests under a sibling `__tests__/` folder, run with `npm test`.
- All work happens in `mobile/` (the Expo project root). Paths below are relative to `mobile/`.

---

### Task 1: MMKV storage adapter + jest mock

Adds the native dependency, a Zustand-compatible storage adapter, and an in-memory jest mock so persisted stores are testable. This also moves the project to a custom dev build (react-native-mmkv is a native module); document that in the commit.

**Files:**
- Modify: `package.json` (add deps)
- Create: `src/lib/mmkvStorage.ts`
- Modify: `jest.setup.js` (append mock)
- Test: `src/lib/__tests__/mmkvStorage.test.ts`

**Interfaces:**
- Produces: `storage` (an `MMKV` instance) and `mmkvStorage: StateStorage` from `@/lib/mmkvStorage`. `StateStorage` has `getItem(name) => string | null`, `setItem(name, value) => void`, `removeItem(name) => void`.

- [ ] **Step 1: Install dependencies**

Run:
```bash
cd mobile && npx expo install react-native-mmkv expo-dev-client
```
Expected: both added to `package.json` dependencies. (react-native-mmkv is native → future `npx expo run:ios` builds a dev client; the project no longer runs in Expo Go.)

- [ ] **Step 2: Append the MMKV mock to `jest.setup.js`**

Add to the end of `jest.setup.js`:
```js
jest.mock('react-native-mmkv', () => {
  const store = new Map();
  return {
    MMKV: jest.fn().mockImplementation(() => ({
      getString: (k) => (store.has(k) ? store.get(k) : undefined),
      set: (k, v) => store.set(k, String(v)),
      delete: (k) => store.delete(k),
      clearAll: () => store.clear(),
    })),
  };
});
```

- [ ] **Step 3: Write the failing test**

Create `src/lib/__tests__/mmkvStorage.test.ts`:
```ts
import { mmkvStorage } from '@/lib/mmkvStorage';

test('setItem then getItem round-trips a value', () => {
  mmkvStorage.setItem('k', 'v');
  expect(mmkvStorage.getItem('k')).toBe('v');
});

test('getItem returns null for a missing key', () => {
  expect(mmkvStorage.getItem('missing')).toBeNull();
});

test('removeItem deletes the value', () => {
  mmkvStorage.setItem('k2', 'v2');
  mmkvStorage.removeItem('k2');
  expect(mmkvStorage.getItem('k2')).toBeNull();
});
```

- [ ] **Step 4: Run test to verify it fails**

Run: `npm test -- mmkvStorage`
Expected: FAIL — cannot find module `@/lib/mmkvStorage`.

- [ ] **Step 5: Write the adapter**

Create `src/lib/mmkvStorage.ts`:
```ts
import { MMKV } from 'react-native-mmkv';
import type { StateStorage } from 'zustand/middleware';

export const storage = new MMKV({ id: 'quiet-waters' });

export const mmkvStorage: StateStorage = {
  getItem: (name) => storage.getString(name) ?? null,
  setItem: (name, value) => storage.set(name, value),
  removeItem: (name) => storage.delete(name),
};
```

- [ ] **Step 6: Run test to verify it passes**

Run: `npm test -- mmkvStorage`
Expected: PASS (3 tests).

- [ ] **Step 7: Commit**

```bash
git add package.json package-lock.json jest.setup.js src/lib/mmkvStorage.ts src/lib/__tests__/mmkvStorage.test.ts
git commit -m "feat(reading): add MMKV storage adapter + jest mock

Adds react-native-mmkv and expo-dev-client; project now requires a custom dev build (no longer runs in Expo Go)."
```

---

### Task 2: Reading store (persisted preferences + position)

**Files:**
- Create: `src/features/reading/readingStore.ts`
- Test: `src/features/reading/__tests__/readingStore.test.ts`

**Interfaces:**
- Consumes: `mmkvStorage` from `@/lib/mmkvStorage`; `TranslationId` from `@/bible`.
- Produces: `useReadingStore` (Zustand hook). State + actions:
  - `position: { bookCode: string; chapter: number; verse: number }`
  - `translation: TranslationId`
  - `fontScale: number`
  - `fontFace: 'serif' | 'sans'`
  - `setPosition(p: { bookCode: string; chapter: number; verse: number }): void`
  - `openChapter(bookCode: string, chapter: number): void` — sets position to that chapter, verse 1
  - `setVerse(verse: number): void` — updates only the verse of the current position
  - `setTranslation(t: TranslationId): void`
  - `setFontScale(n: number): void`
  - `setFontFace(f: 'serif' | 'sans'): void`
- Defaults: `position = { bookCode: 'JHN', chapter: 1, verse: 1 }`, `translation = 'KJV'`, `fontScale = 1`, `fontFace = 'serif'`.

- [ ] **Step 1: Write the failing test**

Create `src/features/reading/__tests__/readingStore.test.ts`:
```ts
import { useReadingStore } from '@/features/reading/readingStore';

const reset = () =>
  useReadingStore.setState({
    position: { bookCode: 'JHN', chapter: 1, verse: 1 },
    translation: 'KJV',
    fontScale: 1,
    fontFace: 'serif',
  });

beforeEach(reset);

test('defaults to John 1:1 / KJV / serif / scale 1', () => {
  const s = useReadingStore.getState();
  expect(s.position).toEqual({ bookCode: 'JHN', chapter: 1, verse: 1 });
  expect(s.translation).toBe('KJV');
  expect(s.fontFace).toBe('serif');
  expect(s.fontScale).toBe(1);
});

test('openChapter sets the chapter and resets verse to 1', () => {
  useReadingStore.getState().setVerse(9);
  useReadingStore.getState().openChapter('PSA', 23);
  expect(useReadingStore.getState().position).toEqual({ bookCode: 'PSA', chapter: 23, verse: 1 });
});

test('setVerse updates only the verse', () => {
  useReadingStore.getState().setVerse(14);
  expect(useReadingStore.getState().position).toEqual({ bookCode: 'JHN', chapter: 1, verse: 14 });
});

test('setTranslation, setFontFace, setFontScale update state', () => {
  useReadingStore.getState().setTranslation('BSB');
  useReadingStore.getState().setFontFace('sans');
  useReadingStore.getState().setFontScale(1.25);
  const s = useReadingStore.getState();
  expect(s.translation).toBe('BSB');
  expect(s.fontFace).toBe('sans');
  expect(s.fontScale).toBe(1.25);
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- readingStore`
Expected: FAIL — cannot find module `readingStore`.

- [ ] **Step 3: Write the store**

Create `src/features/reading/readingStore.ts`:
```ts
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { mmkvStorage } from '@/lib/mmkvStorage';
import type { TranslationId } from '@/bible';

export type FontFace = 'serif' | 'sans';
export interface ReadingPosition {
  bookCode: string;
  chapter: number;
  verse: number;
}

export interface ReadingState {
  position: ReadingPosition;
  translation: TranslationId;
  fontScale: number;
  fontFace: FontFace;
  setPosition: (p: ReadingPosition) => void;
  openChapter: (bookCode: string, chapter: number) => void;
  setVerse: (verse: number) => void;
  setTranslation: (t: TranslationId) => void;
  setFontScale: (n: number) => void;
  setFontFace: (f: FontFace) => void;
}

export const useReadingStore = create<ReadingState>()(
  persist(
    (set) => ({
      position: { bookCode: 'JHN', chapter: 1, verse: 1 },
      translation: 'KJV',
      fontScale: 1,
      fontFace: 'serif',
      setPosition: (position) => set({ position }),
      openChapter: (bookCode, chapter) => set({ position: { bookCode, chapter, verse: 1 } }),
      setVerse: (verse) => set((s) => ({ position: { ...s.position, verse } })),
      setTranslation: (translation) => set({ translation }),
      setFontScale: (fontScale) => set({ fontScale }),
      setFontFace: (fontFace) => set({ fontFace }),
    }),
    { name: 'reading', storage: createJSONStorage(() => mmkvStorage) },
  ),
);
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- readingStore`
Expected: PASS (4 tests).

- [ ] **Step 5: Commit**

```bash
git add src/features/reading/readingStore.ts src/features/reading/__tests__/readingStore.test.ts
git commit -m "feat(reading): add persisted reading store"
```

---

### Task 3: Chapter navigation helper

Pure functions for prev/next chapter that flow continuously across book boundaries and stop at the ends of the canon.

**Files:**
- Create: `src/features/reading/chapterNavigation.ts`
- Test: `src/features/reading/__tests__/chapterNavigation.test.ts`

**Interfaces:**
- Consumes: `getBooks()` from `@/bible` (returns `BookMeta[]` with `code`, `order`, `chapterCount`, ordered by `order`).
- Produces:
  - `interface ChapterRef { bookCode: string; chapter: number }`
  - `nextChapter(ref: ChapterRef): ChapterRef | null` — null at the last chapter of the last book.
  - `prevChapter(ref: ChapterRef): ChapterRef | null` — null at chapter 1 of the first book.

- [ ] **Step 1: Write the failing test**

Create `src/features/reading/__tests__/chapterNavigation.test.ts`:
```ts
import { nextChapter, prevChapter } from '@/features/reading/chapterNavigation';

test('nextChapter advances within a book', () => {
  expect(nextChapter({ bookCode: 'JHN', chapter: 1 })).toEqual({ bookCode: 'JHN', chapter: 2 });
});

test('nextChapter flows into the next book at the boundary', () => {
  // Matthew has 28 chapters; next book is Mark.
  expect(nextChapter({ bookCode: 'MAT', chapter: 28 })).toEqual({ bookCode: 'MRK', chapter: 1 });
});

test('nextChapter returns null at the end of the canon (Revelation 22)', () => {
  expect(nextChapter({ bookCode: 'REV', chapter: 22 })).toBeNull();
});

test('prevChapter steps back within a book', () => {
  expect(prevChapter({ bookCode: 'JHN', chapter: 2 })).toEqual({ bookCode: 'JHN', chapter: 1 });
});

test('prevChapter flows into the previous book at the boundary', () => {
  // Mark 1 -> Matthew 28.
  expect(prevChapter({ bookCode: 'MRK', chapter: 1 })).toEqual({ bookCode: 'MAT', chapter: 28 });
});

test('prevChapter returns null at Genesis 1', () => {
  expect(prevChapter({ bookCode: 'GEN', chapter: 1 })).toBeNull();
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- chapterNavigation`
Expected: FAIL — cannot find module `chapterNavigation`.

- [ ] **Step 3: Write the helper**

Create `src/features/reading/chapterNavigation.ts`:
```ts
import { getBooks } from '@/bible';

export interface ChapterRef {
  bookCode: string;
  chapter: number;
}

// getBooks() is already ordered by canonical `order`.
const BOOKS = getBooks();
const INDEX = new Map(BOOKS.map((b, i) => [b.code, i]));

export function nextChapter(ref: ChapterRef): ChapterRef | null {
  const i = INDEX.get(ref.bookCode);
  if (i === undefined) return null;
  const book = BOOKS[i];
  if (ref.chapter < book.chapterCount) return { bookCode: book.code, chapter: ref.chapter + 1 };
  const next = BOOKS[i + 1];
  if (!next) return null;
  return { bookCode: next.code, chapter: 1 };
}

export function prevChapter(ref: ChapterRef): ChapterRef | null {
  const i = INDEX.get(ref.bookCode);
  if (i === undefined) return null;
  if (ref.chapter > 1) return { bookCode: ref.bookCode, chapter: ref.chapter - 1 };
  const prev = BOOKS[i - 1];
  if (!prev) return null;
  return { bookCode: prev.code, chapter: prev.chapterCount };
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- chapterNavigation`
Expected: PASS (6 tests).

- [ ] **Step 5: Commit**

```bash
git add src/features/reading/chapterNavigation.ts src/features/reading/__tests__/chapterNavigation.test.ts
git commit -m "feat(reading): add continuous chapter navigation helper"
```

---

### Task 4: Share verse (text formatting + OS share)

**Files:**
- Modify: `src/lib/config.ts` (add `APP_STORE_URL`)
- Create: `src/features/reading/shareVerse.ts`
- Test: `src/features/reading/__tests__/shareVerse.test.ts`

**Interfaces:**
- Consumes: `TranslationId` from `@/bible`; `APP_STORE_URL` from `@/lib/config`; `Share` from `react-native`.
- Produces:
  - `formatShareText(text: string, reference: string, translation: TranslationId): string`
  - `shareVerse(text: string, reference: string, translation: TranslationId): Promise<void>`

- [ ] **Step 1: Add the config constant**

In `src/lib/config.ts`, add after the existing exports:
```ts
export const APP_STORE_URL = extra.appStoreUrl ?? 'https://apps.apple.com/app/quiet-waters';
```

- [ ] **Step 2: Write the failing test**

Create `src/features/reading/__tests__/shareVerse.test.ts`:
```ts
import { Share } from 'react-native';
import { formatShareText, shareVerse } from '@/features/reading/shareVerse';

test('formatShareText includes verse, reference, translation and Quiet Waters attribution', () => {
  const out = formatShareText('Come unto me, all ye that labour.', 'Matthew 11:28', 'KJV');
  expect(out).toContain('“Come unto me, all ye that labour.”');
  expect(out).toContain('— Matthew 11:28 (KJV)');
  expect(out).toContain('Shared from Quiet Waters');
  expect(out).toContain('https://apps.apple.com/app/quiet-waters');
});

test('shareVerse calls the OS share sheet with the formatted message', async () => {
  const spy = jest.spyOn(Share, 'share').mockResolvedValue({ action: 'sharedAction' } as never);
  await shareVerse('For God so loved the world', 'John 3:16', 'BSB');
  expect(spy).toHaveBeenCalledWith({ message: formatShareText('For God so loved the world', 'John 3:16', 'BSB') });
  spy.mockRestore();
});
```

- [ ] **Step 3: Run test to verify it fails**

Run: `npm test -- shareVerse`
Expected: FAIL — cannot find module `shareVerse`.

- [ ] **Step 4: Write the implementation**

Create `src/features/reading/shareVerse.ts`:
```ts
import { Share } from 'react-native';
import { APP_STORE_URL } from '@/lib/config';
import type { TranslationId } from '@/bible';

export function formatShareText(text: string, reference: string, translation: TranslationId): string {
  return `“${text}”\n— ${reference} (${translation})\n\nShared from Quiet Waters — ${APP_STORE_URL}`;
}

export async function shareVerse(text: string, reference: string, translation: TranslationId): Promise<void> {
  await Share.share({ message: formatShareText(text, reference, translation) });
}
```

- [ ] **Step 5: Run test to verify it passes**

Run: `npm test -- shareVerse`
Expected: PASS (2 tests).

- [ ] **Step 6: Commit**

```bash
git add src/lib/config.ts src/features/reading/shareVerse.ts src/features/reading/__tests__/shareVerse.test.ts
git commit -m "feat(reading): add share-verse text + OS share sheet"
```

---

### Task 5: Wallpaper handoff helper

Populates the existing wallpaper draft from a verse so "Create wallpaper" lands on the canvas pre-loaded. Navigation stays in the component (Task 9); this helper only mutates the draft, which keeps it testable.

**Files:**
- Create: `src/features/reading/startWallpaper.ts`
- Test: `src/features/reading/__tests__/startWallpaper.test.ts`

**Interfaces:**
- Consumes: `useWallpaperDraft` from `@/features/wallpaper/wallpaperDraft` (`setVerse(text, reference)`, `setTranslation(id)`); `TranslationId` from `@/bible`.
- Produces: `startWallpaperFromVerse(text: string, reference: string, translation: TranslationId): void`

- [ ] **Step 1: Write the failing test**

Create `src/features/reading/__tests__/startWallpaper.test.ts`:
```ts
import { useWallpaperDraft } from '@/features/wallpaper/wallpaperDraft';
import { startWallpaperFromVerse } from '@/features/reading/startWallpaper';

test('startWallpaperFromVerse loads the verse and translation into the wallpaper draft', () => {
  startWallpaperFromVerse('Come unto me', 'Matthew 11:28', 'BSB');
  const s = useWallpaperDraft.getState();
  expect(s.verse).toEqual({ text: 'Come unto me', reference: 'Matthew 11:28' });
  expect(s.translation).toBe('BSB');
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- startWallpaper`
Expected: FAIL — cannot find module `startWallpaper`.

- [ ] **Step 3: Write the helper**

Create `src/features/reading/startWallpaper.ts`:
```ts
import { useWallpaperDraft } from '@/features/wallpaper/wallpaperDraft';
import type { TranslationId } from '@/bible';

export function startWallpaperFromVerse(
  text: string,
  reference: string,
  translation: TranslationId,
): void {
  const draft = useWallpaperDraft.getState();
  draft.setVerse(text, reference);
  draft.setTranslation(translation);
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- startWallpaper`
Expected: PASS (1 test).

- [ ] **Step 5: Commit**

```bash
git add src/features/reading/startWallpaper.ts src/features/reading/__tests__/startWallpaper.test.ts
git commit -m "feat(reading): add wallpaper-draft handoff helper"
```

---

### Task 6: Verse renderer (`VerseParagraphs`) + top-visible helper

Renders a chapter as tight, book-like verse blocks with superscript verse numbers. Each verse block reports its vertical offset via `onLayout` (for verse-anchored scroll tracking and scroll-to-verse), styles the lifted verse as a white card, and fires a callback on long-press. Includes a pure `topVisibleVerse` helper.

> **Implementation note (deliberate):** verses render as individual tightly-leaded blocks (not one continuous inline `<Text>`). This makes per-verse layout measurement — required for the spec's verse-anchored auto-save and scroll-to-verse — robust, and makes the lifted-card and long-press targets trivial. It still reads densely like a printed Bible.

**Files:**
- Create: `src/features/reading/VerseParagraphs.tsx`
- Test: `src/features/reading/__tests__/VerseParagraphs.test.tsx`

**Interfaces:**
- Consumes: `typography`, `colors`, `spacing` from `@/theme`; `FontFace` from `@/features/reading/readingStore`.
- Produces:
  - `interface VerseItem { number: number; text: string }`
  - `topVisibleVerse(offsets: { number: number; y: number }[], scrollY: number): number` — returns the number of the last verse whose `y <= scrollY + 1`; defaults to the first verse's number (or 1 when empty).
  - Default export `VerseParagraphs` with props:
    ```ts
    interface VerseParagraphsProps {
      verses: VerseItem[];
      liftedVerse: number | null;
      fontFace: FontFace;
      fontScale: number;
      onLongPressVerse: (verseNumber: number) => void;
      onVerseLayout: (verseNumber: number, y: number) => void;
    }
    ```

- [ ] **Step 1: Write the failing test**

Create `src/features/reading/__tests__/VerseParagraphs.test.tsx`:
```tsx
import { render, fireEvent, screen } from '@testing-library/react-native';
import VerseParagraphs, { topVisibleVerse } from '@/features/reading/VerseParagraphs';

const verses = [
  { number: 27, text: 'All things are delivered unto me of my Father.' },
  { number: 28, text: 'Come unto me, all ye that labour and are heavy laden.' },
  { number: 29, text: 'Take my yoke upon you, and learn of me.' },
];

test('topVisibleVerse picks the last verse at or above the scroll offset', () => {
  const offsets = [
    { number: 27, y: 0 },
    { number: 28, y: 120 },
    { number: 29, y: 260 },
  ];
  expect(topVisibleVerse(offsets, 0)).toBe(27);
  expect(topVisibleVerse(offsets, 130)).toBe(28);
  expect(topVisibleVerse(offsets, 400)).toBe(29);
});

test('topVisibleVerse defaults to the first verse when scrolled above content', () => {
  expect(topVisibleVerse([{ number: 5, y: 0 }], -50)).toBe(5);
  expect(topVisibleVerse([], 100)).toBe(1);
});

test('renders every verse number and text', () => {
  render(
    <VerseParagraphs
      verses={verses}
      liftedVerse={28}
      fontFace="serif"
      fontScale={1}
      onLongPressVerse={() => {}}
      onVerseLayout={() => {}}
    />,
  );
  expect(screen.getByText(/Come unto me/)).toBeTruthy();
  expect(screen.getByText('28')).toBeTruthy();
});

test('long-pressing a verse fires onLongPressVerse with its number', () => {
  const onLongPress = jest.fn();
  render(
    <VerseParagraphs
      verses={verses}
      liftedVerse={null}
      fontFace="serif"
      fontScale={1}
      onLongPressVerse={onLongPress}
      onVerseLayout={() => {}}
    />,
  );
  fireEvent(screen.getByTestId('verse-28'), 'longPress');
  expect(onLongPress).toHaveBeenCalledWith(28);
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- VerseParagraphs`
Expected: FAIL — cannot find module `VerseParagraphs`.

- [ ] **Step 3: Write the component**

Create `src/features/reading/VerseParagraphs.tsx`:
```tsx
import { Pressable, Text, View, type LayoutChangeEvent } from 'react-native';
import { colors, spacing, typography } from '@/theme';
import type { FontFace } from '@/features/reading/readingStore';

export interface VerseItem {
  number: number;
  text: string;
}

export function topVisibleVerse(
  offsets: { number: number; y: number }[],
  scrollY: number,
): number {
  if (offsets.length === 0) return 1;
  let current = offsets[0].number;
  for (const o of offsets) {
    if (o.y <= scrollY + 1) current = o.number;
    else break;
  }
  return current;
}

interface VerseParagraphsProps {
  verses: VerseItem[];
  liftedVerse: number | null;
  fontFace: FontFace;
  fontScale: number;
  onLongPressVerse: (verseNumber: number) => void;
  onVerseLayout: (verseNumber: number, y: number) => void;
}

const FONT_FAMILY: Record<FontFace, string> = {
  serif: typography.families.serif,
  sans: typography.families.sans,
};

export default function VerseParagraphs({
  verses,
  liftedVerse,
  fontFace,
  fontScale,
  onLongPressVerse,
  onVerseLayout,
}: VerseParagraphsProps) {
  const fontSize = 20 * fontScale;
  const lineHeight = 32 * fontScale;
  const fontFamily = FONT_FAMILY[fontFace];

  return (
    <View>
      {verses.map((v) => {
        const lifted = v.number === liftedVerse;
        return (
          <Pressable
            key={v.number}
            testID={`verse-${v.number}`}
            onLongPress={() => onLongPressVerse(v.number)}
            onLayout={(e: LayoutChangeEvent) => onVerseLayout(v.number, e.nativeEvent.layout.y)}
            style={
              lifted
                ? {
                    backgroundColor: colors.white,
                    borderRadius: 16,
                    padding: spacing.md,
                    marginVertical: spacing.sm,
                    shadowColor: colors.primary,
                    shadowOpacity: 0.12,
                    shadowRadius: 16,
                    shadowOffset: { width: 0, height: 6 },
                  }
                : { marginBottom: spacing.xs }
            }
          >
            <Text style={{ fontFamily, fontSize, lineHeight, color: colors.primary }}>
              <Text style={{ fontFamily: typography.families.sansMedium, fontSize: fontSize * 0.6, color: colors.soft }}>
                {v.number}{' '}
              </Text>
              {v.text}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- VerseParagraphs`
Expected: PASS (4 tests).

- [ ] **Step 5: Commit**

```bash
git add src/features/reading/VerseParagraphs.tsx src/features/reading/__tests__/VerseParagraphs.test.tsx
git commit -m "feat(reading): add verse renderer with lifted card + long-press"
```

---

### Task 7: Book & chapter picker overlays

Two in-screen overlays. Book picker has an OT/NT segmented toggle + book grid; selecting a book calls back with the code. Chapter picker shows a numbered grid for a book; selecting a chapter calls back.

**Files:**
- Create: `src/features/reading/BookPickerOverlay.tsx`
- Create: `src/features/reading/ChapterPickerOverlay.tsx`
- Test: `src/features/reading/__tests__/pickers.test.tsx`

**Interfaces:**
- Consumes: `getBooks()` from `@/bible`; `colors`, `spacing`, `typography` from `@/theme`.
- Produces:
  - `BookPickerOverlay` props: `{ onSelectBook: (bookCode: string) => void }`
  - `ChapterPickerOverlay` props: `{ bookCode: string; bookName: string; chapterCount: number; currentChapter: number; onSelectChapter: (chapter: number) => void }`

- [ ] **Step 1: Write the failing test**

Create `src/features/reading/__tests__/pickers.test.tsx`:
```tsx
import { render, fireEvent, screen } from '@testing-library/react-native';
import BookPickerOverlay from '@/features/reading/BookPickerOverlay';
import ChapterPickerOverlay from '@/features/reading/ChapterPickerOverlay';

test('book picker defaults to New Testament and selects a book', () => {
  const onSelect = jest.fn();
  render(<BookPickerOverlay onSelectBook={onSelect} />);
  fireEvent.press(screen.getByText('Matthew'));
  expect(onSelect).toHaveBeenCalledWith('MAT');
});

test('book picker Old Testament toggle reveals OT books', () => {
  const onSelect = jest.fn();
  render(<BookPickerOverlay onSelectBook={onSelect} />);
  fireEvent.press(screen.getByText('Old Testament'));
  fireEvent.press(screen.getByText('Genesis'));
  expect(onSelect).toHaveBeenCalledWith('GEN');
});

test('chapter picker renders chapters and selects one', () => {
  const onSelect = jest.fn();
  render(
    <ChapterPickerOverlay
      bookCode="MAT"
      bookName="Matthew"
      chapterCount={28}
      currentChapter={11}
      onSelectChapter={onSelect}
    />,
  );
  fireEvent.press(screen.getByText('12'));
  expect(onSelect).toHaveBeenCalledWith(12);
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- pickers`
Expected: FAIL — cannot find the picker modules.

- [ ] **Step 3: Write `BookPickerOverlay`**

Create `src/features/reading/BookPickerOverlay.tsx`:
```tsx
import { useState } from 'react';
import { Pressable, ScrollView, View } from 'react-native';
import { getBooks } from '@/bible';
import { ThemedText } from '@/components';
import { colors, spacing } from '@/theme';

interface Props {
  onSelectBook: (bookCode: string) => void;
}

export default function BookPickerOverlay({ onSelectBook }: Props) {
  const [testament, setTestament] = useState<'OT' | 'NT'>('NT');
  const books = getBooks().filter((b) => b.testament === testament);

  return (
    <View style={{ backgroundColor: colors.white, borderRadius: 20, padding: spacing.md, gap: spacing.md }}>
      <View style={{ flexDirection: 'row', backgroundColor: colors.paleAlt, borderRadius: 999, padding: 4 }}>
        {(['OT', 'NT'] as const).map((t) => (
          <Pressable
            key={t}
            onPress={() => setTestament(t)}
            style={{ flex: 1, alignItems: 'center', paddingVertical: spacing.sm, borderRadius: 999, backgroundColor: testament === t ? colors.white : 'transparent' }}
          >
            <ThemedText variant="caption" color={testament === t ? colors.primary : colors.textFaint}>
              {t === 'OT' ? 'Old Testament' : 'New Testament'}
            </ThemedText>
          </Pressable>
        ))}
      </View>

      <ScrollView contentContainerStyle={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm }}>
        {books.map((b) => (
          <Pressable
            key={b.code}
            onPress={() => onSelectBook(b.code)}
            style={{ minWidth: '30%', flexGrow: 1, alignItems: 'center', paddingVertical: spacing.md, borderRadius: 12, borderWidth: 1, borderColor: colors.paleAlt }}
          >
            <ThemedText variant="body" color={colors.primary}>{b.name}</ThemedText>
          </Pressable>
        ))}
      </ScrollView>
    </View>
  );
}
```

- [ ] **Step 4: Write `ChapterPickerOverlay`**

Create `src/features/reading/ChapterPickerOverlay.tsx`:
```tsx
import { Pressable, ScrollView, View } from 'react-native';
import { ThemedText } from '@/components';
import { colors, spacing } from '@/theme';

interface Props {
  bookCode: string;
  bookName: string;
  chapterCount: number;
  currentChapter: number;
  onSelectChapter: (chapter: number) => void;
}

export default function ChapterPickerOverlay({
  bookName,
  chapterCount,
  currentChapter,
  onSelectChapter,
}: Props) {
  const chapters = Array.from({ length: chapterCount }, (_, i) => i + 1);
  return (
    <View style={{ backgroundColor: colors.white, borderRadius: 20, padding: spacing.md, gap: spacing.md }}>
      <ThemedText variant="eyebrow" color={colors.soft} align="center">{`${bookName} · Chapter`}</ThemedText>
      <ScrollView contentContainerStyle={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, justifyContent: 'center' }}>
        {chapters.map((c) => {
          const active = c === currentChapter;
          return (
            <Pressable
              key={c}
              onPress={() => onSelectChapter(c)}
              style={{ width: 56, alignItems: 'center', paddingVertical: spacing.md, borderRadius: 12, borderWidth: 1, borderColor: active ? colors.accent : colors.paleAlt, backgroundColor: active ? colors.pale : colors.white }}
            >
              <ThemedText variant="body" color={colors.primary}>{String(c)}</ThemedText>
            </Pressable>
          );
        })}
      </ScrollView>
    </View>
  );
}
```

- [ ] **Step 5: Run test to verify it passes**

Run: `npm test -- pickers`
Expected: PASS (3 tests).

- [ ] **Step 6: Commit**

```bash
git add src/features/reading/BookPickerOverlay.tsx src/features/reading/ChapterPickerOverlay.tsx src/features/reading/__tests__/pickers.test.tsx
git commit -m "feat(reading): add book + chapter picker overlays"
```

---

### Task 8: Translation sheet & type panel overlays

**Files:**
- Create: `src/features/reading/TranslationSheet.tsx`
- Create: `src/features/reading/TypePanel.tsx`
- Test: `src/features/reading/__tests__/translationAndType.test.tsx`

**Interfaces:**
- Consumes: `listTranslations()` + `TranslationId` from `@/bible`; `FontFace` from `@/features/reading/readingStore`; theme tokens; `@react-native-community/slider` is **not** used — a simple stepped control is used instead (see below).
- Produces:
  - `TranslationSheet` props: `{ current: TranslationId; onSelect: (id: TranslationId) => void }`
  - `TypePanel` props: `{ fontFace: FontFace; fontScale: number; onSelectFace: (f: FontFace) => void; onScaleChange: (n: number) => void }`
    - `onScaleChange` receives a clamped value in `[0.85, 1.5]`.

- [ ] **Step 1: Write the failing test**

Create `src/features/reading/__tests__/translationAndType.test.tsx`:
```tsx
import { render, fireEvent, screen } from '@testing-library/react-native';
import TranslationSheet from '@/features/reading/TranslationSheet';
import TypePanel from '@/features/reading/TypePanel';

test('translation sheet lists KJV and BSB and selects one', () => {
  const onSelect = jest.fn();
  render(<TranslationSheet current="KJV" onSelect={onSelect} />);
  expect(screen.getByText('King James Version')).toBeTruthy();
  expect(screen.getByText('Berean Standard Bible')).toBeTruthy();
  fireEvent.press(screen.getByText('Berean Standard Bible'));
  expect(onSelect).toHaveBeenCalledWith('BSB');
});

test('type panel switches face and steps size within bounds', () => {
  const onFace = jest.fn();
  const onScale = jest.fn();
  render(<TypePanel fontFace="serif" fontScale={1} onSelectFace={onFace} onScaleChange={onScale} />);
  fireEvent.press(screen.getByText('Sans'));
  expect(onFace).toHaveBeenCalledWith('sans');
  fireEvent.press(screen.getByTestId('type-larger'));
  expect(onScale).toHaveBeenCalledWith(1.1);
});

test('type panel clamps size at the maximum', () => {
  const onScale = jest.fn();
  render(<TypePanel fontFace="serif" fontScale={1.5} onSelectFace={() => {}} onScaleChange={onScale} />);
  fireEvent.press(screen.getByTestId('type-larger'));
  expect(onScale).toHaveBeenCalledWith(1.5);
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- translationAndType`
Expected: FAIL — cannot find the modules.

- [ ] **Step 3: Write `TranslationSheet`**

Create `src/features/reading/TranslationSheet.tsx`:
```tsx
import { Pressable, View } from 'react-native';
import { listTranslations, type TranslationId } from '@/bible';
import { ThemedText } from '@/components';
import { colors, spacing } from '@/theme';

interface Props {
  current: TranslationId;
  onSelect: (id: TranslationId) => void;
}

export default function TranslationSheet({ current, onSelect }: Props) {
  return (
    <View style={{ backgroundColor: colors.white, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: spacing.lg, gap: spacing.md }}>
      <ThemedText variant="eyebrow" color={colors.soft}>Translation</ThemedText>
      {listTranslations().map((t) => {
        const active = t.id === current;
        return (
          <Pressable
            key={t.id}
            onPress={() => onSelect(t.id)}
            style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: spacing.sm, borderRadius: 12, paddingHorizontal: spacing.sm, backgroundColor: active ? colors.paleAlt : 'transparent' }}
          >
            <View style={{ flex: 1 }}>
              <ThemedText variant="button" color={colors.primary}>{t.id}</ThemedText>
              <ThemedText variant="caption" color={colors.textFaint}>{t.name}</ThemedText>
            </View>
            {active && <ThemedText variant="body" color={colors.mid}>✓</ThemedText>}
          </Pressable>
        );
      })}
    </View>
  );
}
```

- [ ] **Step 4: Write `TypePanel`**

Create `src/features/reading/TypePanel.tsx`:
```tsx
import { Pressable, View } from 'react-native';
import { ThemedText } from '@/components';
import { colors, spacing, typography } from '@/theme';
import type { FontFace } from '@/features/reading/readingStore';

const MIN = 0.85;
const MAX = 1.5;
const STEP = 0.1;
const clamp = (n: number) => Math.min(MAX, Math.max(MIN, Math.round(n * 100) / 100));

interface Props {
  fontFace: FontFace;
  fontScale: number;
  onSelectFace: (f: FontFace) => void;
  onScaleChange: (n: number) => void;
}

const FACES: { key: FontFace; label: string; family: string }[] = [
  { key: 'serif', label: 'Serif', family: typography.families.serif },
  { key: 'sans', label: 'Sans', family: typography.families.sans },
];

export default function TypePanel({ fontFace, fontScale, onSelectFace, onScaleChange }: Props) {
  return (
    <View style={{ backgroundColor: colors.white, borderRadius: 20, padding: spacing.md, gap: spacing.md }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
        <Pressable testID="type-smaller" hitSlop={12} onPress={() => onScaleChange(clamp(fontScale - STEP))}>
          <ThemedText variant="body" color={colors.soft}>A</ThemedText>
        </Pressable>
        <ThemedText variant="caption" color={colors.textFaint}>{`${Math.round(fontScale * 100)}%`}</ThemedText>
        <Pressable testID="type-larger" hitSlop={12} onPress={() => onScaleChange(clamp(fontScale + STEP))}>
          <ThemedText variant="title" color={colors.primary}>A</ThemedText>
        </Pressable>
      </View>
      <View style={{ flexDirection: 'row', gap: spacing.sm }}>
        {FACES.map((f) => {
          const active = f.key === fontFace;
          return (
            <Pressable
              key={f.key}
              onPress={() => onSelectFace(f.key)}
              style={{ flex: 1, alignItems: 'center', paddingVertical: spacing.md, borderRadius: 12, borderWidth: 1, borderColor: active ? colors.accent : colors.paleAlt, backgroundColor: active ? colors.pale : colors.white }}
            >
              <ThemedText variant="body" color={colors.primary} style={{ fontFamily: f.family }}>Aa</ThemedText>
              <ThemedText variant="eyebrow" color={active ? colors.mid : colors.textFaint}>{f.label}</ThemedText>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}
```

> Note: size uses stepped `A`/`A` buttons (not a draggable slider) to avoid adding a slider dependency and to keep the control testable via `fireEvent.press`. `clamp` keeps values in `[0.85, 1.5]`. `1.4 + 0.1` rounds to `1.5`; `1.5 + 0.1` clamps to `1.5`.

- [ ] **Step 5: Run test to verify it passes**

Run: `npm test -- translationAndType`
Expected: PASS (3 tests).

- [ ] **Step 6: Commit**

```bash
git add src/features/reading/TranslationSheet.tsx src/features/reading/TypePanel.tsx src/features/reading/__tests__/translationAndType.test.tsx
git commit -m "feat(reading): add translation sheet + type panel overlays"
```

---

### Task 9: Verse action menu

Sheet shown on long-press: the lifted verse card on top, then Share verse / Create wallpaper rows. Share and wallpaper handoff are wired here.

**Files:**
- Create: `src/features/reading/VerseActionMenu.tsx`
- Test: `src/features/reading/__tests__/VerseActionMenu.test.tsx`

**Interfaces:**
- Consumes: `shareVerse` from `@/features/reading/shareVerse`; `startWallpaperFromVerse` from `@/features/reading/startWallpaper`; `TranslationId` from `@/bible`; theme tokens; `ThemedText` from `@/components`.
- Produces: `VerseActionMenu` props:
  ```ts
  interface VerseActionMenuProps {
    verseText: string;
    reference: string;
    translation: TranslationId;
    onCreateWallpaper: () => void; // caller navigates to the Create tab
    onClose: () => void;
  }
  ```
  "Share verse" calls `shareVerse(...)` then `onClose()`. "Create wallpaper" calls `startWallpaperFromVerse(...)` then `onCreateWallpaper()`.

- [ ] **Step 1: Write the failing test**

Create `src/features/reading/__tests__/VerseActionMenu.test.tsx`:
```tsx
import { render, fireEvent, screen, waitFor } from '@testing-library/react-native';
import VerseActionMenu from '@/features/reading/VerseActionMenu';
import * as share from '@/features/reading/shareVerse';
import * as wallpaper from '@/features/reading/startWallpaper';

test('Share verse invokes shareVerse then closes', async () => {
  const shareSpy = jest.spyOn(share, 'shareVerse').mockResolvedValue();
  const onClose = jest.fn();
  render(
    <VerseActionMenu verseText="Come unto me" reference="Matthew 11:28" translation="KJV" onCreateWallpaper={() => {}} onClose={onClose} />,
  );
  fireEvent.press(screen.getByText('Share verse'));
  expect(shareSpy).toHaveBeenCalledWith('Come unto me', 'Matthew 11:28', 'KJV');
  await waitFor(() => expect(onClose).toHaveBeenCalled());
  shareSpy.mockRestore();
});

test('Create wallpaper loads the draft then calls onCreateWallpaper', () => {
  const wallpaperSpy = jest.spyOn(wallpaper, 'startWallpaperFromVerse').mockImplementation(() => {});
  const onCreate = jest.fn();
  render(
    <VerseActionMenu verseText="Come unto me" reference="Matthew 11:28" translation="BSB" onCreateWallpaper={onCreate} onClose={() => {}} />,
  );
  fireEvent.press(screen.getByText('Create wallpaper'));
  expect(wallpaperSpy).toHaveBeenCalledWith('Come unto me', 'Matthew 11:28', 'BSB');
  expect(onCreate).toHaveBeenCalled();
  wallpaperSpy.mockRestore();
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- VerseActionMenu`
Expected: FAIL — cannot find module `VerseActionMenu`.

- [ ] **Step 3: Write the component**

Create `src/features/reading/VerseActionMenu.tsx`:
```tsx
import { Pressable, View } from 'react-native';
import Svg, { Path, Rect } from 'react-native-svg';
import { ThemedText } from '@/components';
import { colors, spacing, typography } from '@/theme';
import { shareVerse } from '@/features/reading/shareVerse';
import { startWallpaperFromVerse } from '@/features/reading/startWallpaper';
import type { TranslationId } from '@/bible';

interface VerseActionMenuProps {
  verseText: string;
  reference: string;
  translation: TranslationId;
  onCreateWallpaper: () => void;
  onClose: () => void;
}

export default function VerseActionMenu({
  verseText,
  reference,
  translation,
  onCreateWallpaper,
  onClose,
}: VerseActionMenuProps) {
  async function onShare() {
    await shareVerse(verseText, reference, translation);
    onClose();
  }

  function onWallpaper() {
    startWallpaperFromVerse(verseText, reference, translation);
    onCreateWallpaper();
  }

  return (
    <View style={{ gap: spacing.md }}>
      <View style={{ backgroundColor: colors.white, borderRadius: 16, padding: spacing.md, shadowColor: colors.primary, shadowOpacity: 0.12, shadowRadius: 16, shadowOffset: { width: 0, height: 6 } }}>
        <ThemedText variant="body" color={colors.primary} style={{ fontFamily: typography.families.serif, fontSize: 20, lineHeight: 30 }}>
          {verseText}
        </ThemedText>
      </View>

      <View style={{ backgroundColor: colors.white, borderRadius: 16, overflow: 'hidden' }}>
        <Pressable onPress={onShare} style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md, padding: spacing.md }}>
          <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
            <Path d="M22 2 11 13M22 2l-7 20-4-9-9-4 20-7Z" stroke={colors.primary} strokeWidth={1.8} strokeLinejoin="round" />
          </Svg>
          <ThemedText variant="body" color={colors.primary}>Share verse</ThemedText>
        </Pressable>
        <View style={{ height: 1, backgroundColor: colors.paleAlt, marginHorizontal: spacing.md }} />
        <Pressable onPress={onWallpaper} style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md, padding: spacing.md }}>
          <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
            <Rect x={3} y={4} width={18} height={16} rx={2} stroke={colors.primary} strokeWidth={1.8} />
            <Path d="m3 16 5-5 4 4 3-3 6 6" stroke={colors.primary} strokeWidth={1.8} strokeLinejoin="round" />
          </Svg>
          <ThemedText variant="body" color={colors.primary}>Create wallpaper</ThemedText>
        </Pressable>
      </View>
    </View>
  );
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- VerseActionMenu`
Expected: PASS (2 tests).

- [ ] **Step 5: Commit**

```bash
git add src/features/reading/VerseActionMenu.tsx src/features/reading/__tests__/VerseActionMenu.test.tsx
git commit -m "feat(reading): add verse action menu (share + wallpaper)"
```

---

### Task 10: ReadingScreen (assembly)

Assembles the chapter view: loads the current chapter from the store, renders top chrome pills + floating nav arrows, toggles the four overlays and the action menu, lifts the saved verse on entry then clears it on first scroll, auto-saves the top-visible verse (debounced), and scrolls to the saved verse on entry.

**Files:**
- Create: `src/features/reading/ReadingScreen.tsx`
- Test: `src/features/reading/__tests__/ReadingScreen.test.tsx`

**Interfaces:**
- Consumes: `useReadingStore`; `getChapter`, `getBooks` from `@/bible`; `nextChapter`/`prevChapter` from `@/features/reading/chapterNavigation`; `VerseParagraphs` + `topVisibleVerse`; the four overlays; `VerseActionMenu`; `useRouter` from `expo-router`; theme tokens; `ThemedText` from `@/components`.
- Produces: default export `ReadingScreen` (no props).

- [ ] **Step 1: Write the failing test**

Create `src/features/reading/__tests__/ReadingScreen.test.tsx`:
```tsx
import { render, fireEvent, screen, waitFor } from '@testing-library/react-native';
import ReadingScreen from '@/features/reading/ReadingScreen';
import { useReadingStore } from '@/features/reading/readingStore';

const pushMock = jest.fn();
jest.mock('expo-router', () => ({ useRouter: () => ({ push: pushMock }) }));

beforeEach(() => {
  pushMock.mockClear();
  useReadingStore.setState({
    position: { bookCode: 'JHN', chapter: 3, verse: 16 },
    translation: 'KJV',
    fontScale: 1,
    fontFace: 'serif',
  });
});

test('renders the current book, chapter and translation in the chrome', () => {
  render(<ReadingScreen />);
  expect(screen.getByText('John')).toBeTruthy();
  expect(screen.getByText('3')).toBeTruthy();
  expect(screen.getByText('KJV')).toBeTruthy();
});

test('tapping the book pill opens the book picker; choosing a book opens its chapter picker', () => {
  render(<ReadingScreen />);
  fireEvent.press(screen.getByText('John'));
  fireEvent.press(screen.getByText('Old Testament'));
  fireEvent.press(screen.getByText('Genesis'));
  // Chapter picker heading now shows Genesis.
  expect(screen.getByText('Genesis · Chapter')).toBeTruthy();
});

test('long-pressing a verse opens the action menu; Create wallpaper navigates to Create tab', () => {
  render(<ReadingScreen />);
  fireEvent(screen.getByTestId('verse-16'), 'longPress');
  fireEvent.press(screen.getByText('Create wallpaper'));
  expect(pushMock).toHaveBeenCalledWith('/(tabs)/create');
});

test('next arrow advances to the following chapter in the store', () => {
  render(<ReadingScreen />);
  fireEvent.press(screen.getByTestId('reading-next'));
  expect(useReadingStore.getState().position).toEqual({ bookCode: 'JHN', chapter: 4, verse: 1 });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- ReadingScreen`
Expected: FAIL — cannot find module `ReadingScreen`.

- [ ] **Step 3: Write the screen**

Create `src/features/reading/ReadingScreen.tsx`:
```tsx
import { useEffect, useMemo, useRef, useState } from 'react';
import { Pressable, ScrollView, View, type NativeScrollEvent, type NativeSyntheticEvent } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Path } from 'react-native-svg';
import { useRouter } from 'expo-router';
import { ThemedText } from '@/components';
import { colors, spacing } from '@/theme';
import { getBooks, getChapter } from '@/bible';
import { useReadingStore } from '@/features/reading/readingStore';
import { nextChapter, prevChapter } from '@/features/reading/chapterNavigation';
import VerseParagraphs, { topVisibleVerse, type VerseItem } from '@/features/reading/VerseParagraphs';
import BookPickerOverlay from '@/features/reading/BookPickerOverlay';
import ChapterPickerOverlay from '@/features/reading/ChapterPickerOverlay';
import TranslationSheet from '@/features/reading/TranslationSheet';
import TypePanel from '@/features/reading/TypePanel';
import VerseActionMenu from '@/features/reading/VerseActionMenu';

type Overlay = 'book' | 'chapter' | 'translation' | 'type' | 'actions' | null;

function Pill({ label, onPress }: { label: string; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} style={{ backgroundColor: colors.white, borderRadius: 999, paddingVertical: spacing.sm, paddingHorizontal: spacing.md }}>
      <ThemedText variant="button" color={colors.primary}>{label}</ThemedText>
    </Pressable>
  );
}

export default function ReadingScreen() {
  const router = useRouter();
  const { position, translation, fontScale, fontFace,
    openChapter, setVerse, setPosition, setTranslation, setFontScale, setFontFace } = useReadingStore();

  const books = getBooks();
  const book = useMemo(() => books.find((b) => b.code === position.bookCode) ?? books[0], [books, position.bookCode]);

  const verses: VerseItem[] = useMemo(() =>
    getChapter(translation, position.bookCode, position.chapter)
      .map((text, i) => ({ number: i + 1, text }))
      .filter((v) => v.text !== ''),
    [translation, position.bookCode, position.chapter]);

  const [overlay, setOverlay] = useState<Overlay>(null);
  const [lifted, setLifted] = useState<number | null>(position.verse);
  const [actionVerse, setActionVerse] = useState<number | null>(null);

  const scrollRef = useRef<ScrollView>(null);
  const offsets = useRef(new Map<number, number>());
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // On chapter change, lift the saved verse again and scroll to it once laid out.
  useEffect(() => {
    setLifted(position.verse);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [position.bookCode, position.chapter]);

  function onVerseLayout(n: number, y: number) {
    offsets.current.set(n, y);
    if (n === position.verse && lifted === position.verse) {
      scrollRef.current?.scrollTo({ y: Math.max(0, y - 24), animated: false });
    }
  }

  function onScroll(e: NativeSyntheticEvent<NativeScrollEvent>) {
    const y = e.nativeEvent.contentOffset.y;
    if (lifted !== null && y > 8) setLifted(null); // "floats, then fades"
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => {
      const sorted = [...offsets.current.entries()].map(([number, oy]) => ({ number, y: oy })).sort((a, b) => a.y - b.y);
      setVerse(topVisibleVerse(sorted, y));
    }, 400);
  }

  function go(ref: { bookCode: string; chapter: number } | null) {
    if (!ref) return;
    offsets.current.clear();
    openChapter(ref.bookCode, ref.chapter);
    scrollRef.current?.scrollTo({ y: 0, animated: false });
  }

  const actionVerseItem = verses.find((v) => v.number === actionVerse);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.surface }}>
      {/* Top chrome */}
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm, padding: spacing.md }}>
        <Pill label={book.name} onPress={() => setOverlay('book')} />
        <Pill label={String(position.chapter)} onPress={() => setOverlay('chapter')} />
        <View style={{ flex: 1 }} />
        <Pill label={translation} onPress={() => setOverlay('translation')} />
        <Pill label="Aa" onPress={() => setOverlay('type')} />
      </View>

      <ScrollView ref={scrollRef} onScroll={onScroll} scrollEventThrottle={16} contentContainerStyle={{ padding: spacing.lg, paddingBottom: 120 }}>
        <ThemedText variant="eyebrow" color={colors.soft} style={{ marginBottom: spacing.md }}>
          {translation === 'KJV' ? 'King James Version' : 'Berean Standard Bible'}
        </ThemedText>
        <VerseParagraphs
          verses={verses}
          liftedVerse={lifted}
          fontFace={fontFace}
          fontScale={fontScale}
          onLongPressVerse={(n) => { setLifted(n); setActionVerse(n); setOverlay('actions'); }}
          onVerseLayout={onVerseLayout}
        />
      </ScrollView>

      {/* Floating chapter arrows */}
      <View style={{ position: 'absolute', right: spacing.lg, bottom: spacing.xl, flexDirection: 'row', gap: spacing.sm }}>
        <Pressable
          testID="reading-prev"
          onPress={() => go(prevChapter({ bookCode: position.bookCode, chapter: position.chapter }))}
          style={{ width: 48, height: 48, borderRadius: 24, backgroundColor: colors.white, alignItems: 'center', justifyContent: 'center' }}
        >
          <Svg width={20} height={20} viewBox="0 0 24 24" fill="none"><Path d="m15 18-6-6 6-6" stroke={colors.primary} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" /></Svg>
        </Pressable>
        <Pressable
          testID="reading-next"
          onPress={() => go(nextChapter({ bookCode: position.bookCode, chapter: position.chapter }))}
          style={{ width: 48, height: 48, borderRadius: 24, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center' }}
        >
          <Svg width={20} height={20} viewBox="0 0 24 24" fill="none"><Path d="m9 18 6-6-6-6" stroke={colors.white} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" /></Svg>
        </Pressable>
      </View>

      {/* Overlays */}
      {overlay !== null && (
        <Pressable onPress={() => setOverlay(null)} style={{ position: 'absolute', inset: 0, backgroundColor: 'rgba(28,51,68,0.15)' }} />
      )}
      {overlay === 'book' && (
        <View style={{ position: 'absolute', left: spacing.md, right: spacing.md, top: 72 }}>
          <BookPickerOverlay onSelectBook={(code) => { openChapter(code, 1); setOverlay('chapter'); }} />
        </View>
      )}
      {overlay === 'chapter' && (
        <View style={{ position: 'absolute', left: spacing.md, right: spacing.md, top: 72 }}>
          <ChapterPickerOverlay
            bookCode={book.code}
            bookName={book.name}
            chapterCount={book.chapterCount}
            currentChapter={position.chapter}
            onSelectChapter={(c) => { go({ bookCode: book.code, chapter: c }); setOverlay(null); }}
          />
        </View>
      )}
      {overlay === 'type' && (
        <View style={{ position: 'absolute', left: spacing.md, right: spacing.md, top: 72 }}>
          <TypePanel fontFace={fontFace} fontScale={fontScale} onSelectFace={setFontFace} onScaleChange={setFontScale} />
        </View>
      )}
      {overlay === 'translation' && (
        <View style={{ position: 'absolute', left: 0, right: 0, bottom: 0 }}>
          <TranslationSheet current={translation} onSelect={(id) => { setTranslation(id); setOverlay(null); }} />
        </View>
      )}
      {overlay === 'actions' && actionVerseItem && (
        <View style={{ position: 'absolute', left: spacing.md, right: spacing.md, top: 72 }}>
          <VerseActionMenu
            verseText={actionVerseItem.text}
            reference={`${book.name} ${position.chapter}:${actionVerseItem.number}`}
            translation={translation}
            onCreateWallpaper={() => { setOverlay(null); router.push('/(tabs)/create'); }}
            onClose={() => setOverlay(null)}
          />
        </View>
      )}
    </SafeAreaView>
  );
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- ReadingScreen`
Expected: PASS (4 tests).

- [ ] **Step 5: Commit**

```bash
git add src/features/reading/ReadingScreen.tsx src/features/reading/__tests__/ReadingScreen.test.tsx
git commit -m "feat(reading): assemble reading screen with chrome, overlays, nav"
```

---

### Task 11: Read tab route + tab bar entry

**Files:**
- Create: `src/app/(tabs)/read.tsx`
- Modify: `src/app/(tabs)/_layout.tsx`
- Test: `src/app/(tabs)/__tests__/read.test.tsx`

**Interfaces:**
- Consumes: `ReadingScreen` from `@/features/reading/ReadingScreen`; `colors` from `@/theme`.
- Produces: default export screen for the `read` route; a new `<Tabs.Screen name="read">` in the tab layout.

- [ ] **Step 1: Write the failing test**

Create `src/app/(tabs)/__tests__/read.test.tsx`:
```tsx
import { render, screen } from '@testing-library/react-native';
import Read from '@/app/(tabs)/read';
import { useReadingStore } from '@/features/reading/readingStore';

jest.mock('expo-router', () => ({ useRouter: () => ({ push: jest.fn() }) }));

test('Read route renders the reading screen with the current book', () => {
  useReadingStore.setState({
    position: { bookCode: 'PSA', chapter: 23, verse: 1 },
    translation: 'KJV',
    fontScale: 1,
    fontFace: 'serif',
  });
  render(<Read />);
  expect(screen.getByText('Psalms')).toBeTruthy();
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- read`
Expected: FAIL — cannot find module `@/app/(tabs)/read`.

- [ ] **Step 3: Write the route**

Create `src/app/(tabs)/read.tsx`:
```tsx
import ReadingScreen from '@/features/reading/ReadingScreen';

export default function Read() {
  return <ReadingScreen />;
}
```

- [ ] **Step 4: Add the tab entry**

In `src/app/(tabs)/_layout.tsx`, add a `ReadIcon` beside the other icon components:
```tsx
function ReadIcon({ color }: { color: ColorValue }) {
  return (
    <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
      <Path d="M12 6c-1.8-1.2-4.2-2-6.5-2H3v14h2.5c2.3 0 4.7.8 6.5 2 1.8-1.2 4.2-2 6.5-2H21V4h-2.5C16.2 4 13.8 4.8 12 6Z" stroke={color} strokeWidth={1.8} strokeLinejoin="round" />
      <Path d="M12 6v14" stroke={color} strokeWidth={1.8} />
    </Svg>
  );
}
```
Then add the screen inside `<Tabs>` after the `you` screen:
```tsx
<Tabs.Screen name="read" options={{ title: 'Read', tabBarIcon: ({ color }) => <ReadIcon color={color} /> }} />
```

- [ ] **Step 5: Run test to verify it passes**

Run: `npm test -- read`
Expected: PASS (1 test).

- [ ] **Step 6: Run the full suite + typecheck**

Run: `npm test && npx tsc --noEmit`
Expected: all tests pass; no type errors.

- [ ] **Step 7: Commit**

```bash
git add src/app/(tabs)/read.tsx "src/app/(tabs)/_layout.tsx" "src/app/(tabs)/__tests__/read.test.tsx"
git commit -m "feat(reading): add Read tab route + tab bar entry"
```

---

### Task 12: Manual verification on a dev build

Native module (MMKV) means this must run on a custom dev build, not Expo Go.

- [ ] **Step 1: Prebuild + run iOS**

Run:
```bash
cd mobile && npx expo run:ios
```
Expected: app builds and launches in the dev client.

- [ ] **Step 2: Verify the flow manually**

Confirm each:
- Read tab appears (4th tab) and opens to the last-read position (John 1:1 on a fresh install).
- Book pill → book picker (OT/NT toggle) → chapter picker → chapter loads.
- Chapter pill → chapter grid; current chapter highlighted.
- KJV pill → translation sheet lists **KJV + BSB only**; switching re-renders text.
- Aa pill → type panel; size steps and Serif/Sans switch live.
- On entering a chapter, the saved verse lifts into a card, then settles as you scroll.
- Long-press a verse → action menu. Share opens the OS sheet with the "Shared from Quiet Waters" attribution. Create wallpaper lands on the Create tab with the verse pre-loaded.
- Prev/next arrows flow across book boundaries; kill and relaunch the app — it reopens to where you left off.

- [ ] **Step 3: No commit** (manual verification only). Note any defects as follow-up tasks.

---

## Self-Review

**Spec coverage:**
- Translations BSB+KJV only → Task 8 (`listTranslations()` returns exactly those two; hardcoded KJV/BSB label in Task 10).
- Read as 4th tab → Task 11.
- Long-press opens action menu → Tasks 6, 10.
- Verse-anchored auto-save (no pixel offset) → Task 6 (`topVisibleVerse`), Task 10 (debounced save of verse number).
- Lift on entry then fade → Task 10 (`lifted` state set on chapter change, cleared on first scroll).
- Type panel Serif/Sans + size → Task 8.
- MMKV persistence + dev build → Tasks 1, 2, 12.
- Share plain text + Quiet Waters attribution + APP_STORE_URL → Task 4.
- Create wallpaper handoff → Tasks 5, 9, 10.
- In-screen overlays → Tasks 7, 8, 10.
- First-launch default John 1:1 → Task 2.
- Continuous cross-book chapter flow, disabled at canon ends → Task 3.
- Font size range 0.85–1.5 → Task 8 (`clamp`).

**Deliberate deviation from spec:** the spec says "continuous serif paragraphs"; Task 6 renders verses as tightly-leaded per-verse blocks rather than one inline `<Text>`, to make verse-anchored measurement/scroll-to-verse robust. Documented in Task 6's implementation note. Also, the type-size control is stepped `A`/`A` buttons rather than a draggable slider (Task 8 note) to avoid a slider dependency and stay testable — visually close to the mockup.

**Placeholder scan:** none — every code step has complete code; `APP_STORE_URL` is a real placeholder value by design.

**Type consistency:** `ReadingPosition`/`FontFace` (Task 2) reused in Tasks 6/8/10; `VerseItem` (Task 6) reused in Task 10; picker/overlay/action-menu prop names match their consumers in Task 10; `openChapter`/`setVerse`/`setPosition`/`setTranslation`/`setFontScale`/`setFontFace` names consistent across Tasks 2 and 10.
