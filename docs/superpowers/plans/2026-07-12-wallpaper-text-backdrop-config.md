# Wallpaper Text Color + Backdrop Opacity Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Let the user pick a verse text color from a 4-swatch palette and adjust a full-screen backdrop (scrim) opacity, from a new partial-height sheet that keeps the live wallpaper visible.

**Architecture:** Two new global settings (`textColor`, `backdropOpacity`) live in the Zustand `wallpaperDraft` store, independent of the background. `WallpaperCanvas` reads them as props: the verse/cross use `textColor`, the reference is that color at 75% opacity, and a full-screen dark scrim (driven by `backdropOpacity`) is now drawn over **all** backgrounds. A new `wallpaper-style` route presents these controls as an undimmed form sheet, opened by a new "Aa" button on the create screen.

**Tech Stack:** Expo SDK 57, expo-router, React Native 0.86, Zustand 5, `@expo/ui` (universal `Slider`), expo-linear-gradient, Jest + `@testing-library/react-native`.

## Global Constraints

- Expo SDK v57 — verify any RN-screens sheet option / `@expo/ui` API against `https://docs.expo.dev/versions/v57.0.0/` before use (per `mobile/AGENTS.md`).
- All work is under `mobile/`. Run all commands from `mobile/`.
- iPhone-only app; universal/iOS behavior is sufficient.
- Test runner: `npx jest <path>`. Typecheck: `npx tsc --noEmit`. Lint: `npm run lint`.
- Defaults: `textColor = '#FFFFFF'`, `backdropOpacity = 0.45`.
- `textColor` / `backdropOpacity` persist across background changes (they are not reset when the background changes).

---

### Task 1: Draft state — textColor + backdropOpacity

**Files:**
- Modify: `mobile/src/features/wallpaper/wallpaperDraft.ts`
- Test: `mobile/src/features/wallpaper/__tests__/wallpaperDraft.test.ts`

**Interfaces:**
- Consumes: nothing new.
- Produces: `useWallpaperDraft` state gains `textColor: string`, `backdropOpacity: number`, `setTextColor(c: string): void`, `setBackdropOpacity(o: number): void`.

- [ ] **Step 1: Write the failing tests**

Append to `mobile/src/features/wallpaper/__tests__/wallpaperDraft.test.ts`:

```ts
test('defaults textColor to white and backdropOpacity to 0.45', () => {
  const s = useWallpaperDraft.getState();
  expect(s.textColor).toBe('#FFFFFF');
  expect(s.backdropOpacity).toBe(0.45);
});

test('setTextColor and setBackdropOpacity update state', () => {
  useWallpaperDraft.getState().setTextColor('#1C3344');
  useWallpaperDraft.getState().setBackdropOpacity(0.7);
  expect(useWallpaperDraft.getState().textColor).toBe('#1C3344');
  expect(useWallpaperDraft.getState().backdropOpacity).toBe(0.7);
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx jest src/features/wallpaper/__tests__/wallpaperDraft.test.ts -t "textColor"`
Expected: FAIL — `textColor`/`backdropOpacity` are `undefined`.

- [ ] **Step 3: Add the fields and setters**

In `mobile/src/features/wallpaper/wallpaperDraft.ts`, extend the interface and store. Final file:

```ts
import { create } from 'zustand';
import { DEFAULT_BACKGROUND, type WallpaperBackground } from './backgrounds';
import type { TranslationId } from '@/bible';

const DEFAULT_VERSE = { text: 'He leads me beside quiet waters.', reference: 'Psalm 23:2' };

export interface WallpaperDraftState {
  verse: { text: string; reference: string };
  translation: TranslationId;
  background: WallpaperBackground;
  textColor: string;
  backdropOpacity: number;
  setVerse: (text: string, reference: string) => void;
  setTranslation: (id: TranslationId) => void;
  setBackground: (bg: WallpaperBackground) => void;
  setTextColor: (c: string) => void;
  setBackdropOpacity: (o: number) => void;
}

export const useWallpaperDraft = create<WallpaperDraftState>((set) => ({
  verse: DEFAULT_VERSE,
  translation: 'KJV',
  background: DEFAULT_BACKGROUND,
  textColor: '#FFFFFF',
  backdropOpacity: 0.45,
  setVerse: (text, reference) => set({ verse: { text, reference } }),
  setTranslation: (translation) => set({ translation }),
  setBackground: (background) => set({ background }),
  setTextColor: (textColor) => set({ textColor }),
  setBackdropOpacity: (backdropOpacity) => set({ backdropOpacity }),
}));
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx jest src/features/wallpaper/__tests__/wallpaperDraft.test.ts`
Expected: PASS (all tests).

- [ ] **Step 5: Commit**

```bash
git add mobile/src/features/wallpaper/wallpaperDraft.ts mobile/src/features/wallpaper/__tests__/wallpaperDraft.test.ts
git commit -m "feat(wallpaper): add textColor + backdropOpacity to draft state"
```

---

### Task 2: WallpaperCanvas — text color prop + universal scrim

**Files:**
- Modify: `mobile/src/features/wallpaper/WallpaperCanvas.tsx`
- Modify: `mobile/src/features/wallpaper/backgrounds.ts` (remove unused `scrim?` field)
- Test: `mobile/src/features/wallpaper/__tests__/WallpaperCanvas.test.tsx`

**Interfaces:**
- Consumes: `textColor: string`, `backdropOpacity: number` (from Task 1's draft, passed by the create screen in Task 5).
- Produces: `WallpaperCanvas` now requires props `verseText`, `reference`, `background`, `textColor`, `backdropOpacity`. It always renders a `testID="wallpaper-scrim"` overlay (both gradient and image backgrounds).

- [ ] **Step 1: Update existing tests + add new ones (they will fail)**

Replace the full contents of `mobile/src/features/wallpaper/__tests__/WallpaperCanvas.test.tsx`:

```tsx
import { render, screen } from '@testing-library/react-native';
import { WallpaperCanvas } from '@/features/wallpaper/WallpaperCanvas';
import { BACKGROUNDS } from '@/features/wallpaper/backgrounds';

function flatStyle(node: { props: { style: unknown } }) {
  const style = node.props.style;
  return Array.isArray(style) ? Object.assign({}, ...(style as object[]).flat()) : (style as Record<string, unknown>);
}

test('renders the verse and reference', async () => {
  await render(
    <WallpaperCanvas verseText="He leads me beside quiet waters." reference="Psalm 23:2" background={BACKGROUNDS[0]} textColor="#FFFFFF" backdropOpacity={0.45} />,
  );
  expect(screen.getByText(/He leads me beside quiet waters\./)).toBeOnTheScreen();
  expect(screen.getByText('Psalm 23:2')).toBeOnTheScreen();
});

test('applies the chosen text color to the verse', async () => {
  await render(<WallpaperCanvas verseText="Test verse" reference="Ref 1:1" background={BACKGROUNDS[0]} textColor="#C9A96A" backdropOpacity={0.45} />);
  expect(flatStyle(screen.getByText(/Test verse/)).color).toBe('#C9A96A');
});

test('renders a scrim over a gradient background', async () => {
  await render(<WallpaperCanvas verseText="Test verse" reference="Ref 1:1" background={BACKGROUNDS[0]} textColor="#FFFFFF" backdropOpacity={0.45} />);
  expect(screen.getByTestId('wallpaper-scrim')).toBeOnTheScreen();
});

test('scrim is fully transparent at backdropOpacity 0', async () => {
  await render(<WallpaperCanvas verseText="Test verse" reference="Ref 1:1" background={BACKGROUNDS[0]} textColor="#FFFFFF" backdropOpacity={0} />);
  const scrim = screen.getByTestId('wallpaper-scrim');
  expect(scrim.props.colors).toEqual(['rgba(0,0,0,0)', 'rgba(0,0,0,0)', 'rgba(0,0,0,0)']);
});

test('renders an image background with a scrim', async () => {
  const image = BACKGROUNDS.find((b) => b.kind === 'image')!;
  await render(<WallpaperCanvas verseText="Test verse" reference="Ref 1:1" background={image} textColor="#FFFFFF" backdropOpacity={0.45} />);
  expect(screen.getByTestId('wallpaper-image')).toBeOnTheScreen();
  expect(screen.getByTestId('wallpaper-scrim')).toBeOnTheScreen();
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx jest src/features/wallpaper/__tests__/WallpaperCanvas.test.tsx`
Expected: FAIL — component does not yet accept `textColor`/`backdropOpacity`; gradient has no `wallpaper-scrim`.

- [ ] **Step 3: Rewrite the component**

Replace the full contents of `mobile/src/features/wallpaper/WallpaperCanvas.tsx`:

```tsx
import { Image, ImageBackground, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { ThemedText } from '@/components/ThemedText';
import { spacing } from '@/theme';
import type { Background } from './backgrounds';

interface Props {
  verseText: string;
  reference: string;
  background: Background;
  textColor: string;
  backdropOpacity: number; // 0..1
}

function hexToRgba(hex: string, alpha: number): string {
  const h = hex.replace('#', '');
  const r = parseInt(h.slice(0, 2), 16);
  const g = parseInt(h.slice(2, 4), 16);
  const b = parseInt(h.slice(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

export function WallpaperCanvas({ verseText, reference, background, textColor, backdropOpacity }: Props) {
  const referenceColor = hexToRgba(textColor, 0.75);

  const content = (
    <>
      <Image
        source={require('../../../assets/images/symbol-white.png')}
        style={{ width: 22, height: 22, resizeMode: 'contain', tintColor: textColor, marginBottom: spacing.lg }}
      />
      <View style={{ flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'center' }}>
        <ThemedText variant="quote" align="center" color={textColor} style={{ fontSize: 30, lineHeight: 40 }}>
          "{verseText}"
        </ThemedText>
      </View>
      <ThemedText variant="eyebrow" color={referenceColor} style={{ marginTop: spacing.lg }}>
        {reference}
      </ThemedText>
    </>
  );

  const centered = {
    flex: 1,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    paddingHorizontal: spacing.xl,
  };

  // Full-screen vignette scrim over every background. `s = 0` is fully
  // transparent; darker at the edges keeps centered text legible.
  const s = backdropOpacity;
  const scrim = [`rgba(0,0,0,${s})`, `rgba(0,0,0,${s * 0.35})`, `rgba(0,0,0,${s})`] as const;

  if (background.kind === 'image') {
    return (
      <ImageBackground testID="wallpaper-image" source={background.source} resizeMode="cover" style={{ flex: 1 }}>
        <LinearGradient testID="wallpaper-scrim" colors={scrim} style={centered}>
          {content}
        </LinearGradient>
      </ImageBackground>
    );
  }

  return (
    <LinearGradient colors={background.colors} style={{ flex: 1 }}>
      <LinearGradient testID="wallpaper-scrim" colors={scrim} style={centered}>
        {content}
      </LinearGradient>
    </LinearGradient>
  );
}
```

- [ ] **Step 4: Remove the now-unused `scrim?` field**

In `mobile/src/features/wallpaper/backgrounds.ts`, delete this line from the `ImageBackground` interface:

```ts
  scrim?: number; // dark-overlay strength 0..1, default 0.4
```

- [ ] **Step 5: Run tests + typecheck**

Run: `npx jest src/features/wallpaper/__tests__/WallpaperCanvas.test.tsx && npx tsc --noEmit`
Expected: PASS; tsc reports no errors. (If tsc flags the create screen not passing the new required props, that is fixed in Task 5 — re-run tsc after Task 5.)

- [ ] **Step 6: Commit**

```bash
git add mobile/src/features/wallpaper/WallpaperCanvas.tsx mobile/src/features/wallpaper/backgrounds.ts mobile/src/features/wallpaper/__tests__/WallpaperCanvas.test.tsx
git commit -m "feat(wallpaper): drive text color from prop and draw a universal backdrop scrim"
```

---

### Task 3: Add the gold theme token

**Files:**
- Modify: `mobile/src/theme/colors.ts`
- Test: `mobile/src/theme/__tests__/theme.test.ts`

**Interfaces:**
- Produces: `colors.gold === '#C9A96A'`.

- [ ] **Step 1: Write the failing test**

Append to `mobile/src/theme/__tests__/theme.test.ts`:

```ts
test('exposes the gold text-color token', () => {
  expect(colors.gold).toBe('#C9A96A');
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx jest src/theme/__tests__/theme.test.ts -t "gold"`
Expected: FAIL — `colors.gold` is `undefined`.

- [ ] **Step 3: Add the token**

In `mobile/src/theme/colors.ts`, add `gold` to the `colors` object (after `accent`):

```ts
  gold: '#C9A96A',
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx jest src/theme/__tests__/theme.test.ts -t "gold"`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add mobile/src/theme/colors.ts mobile/src/theme/__tests__/theme.test.ts
git commit -m "feat(theme): add gold text-color token"
```

---

### Task 4: Text & Backdrop form sheet

**Files:**
- Create: `mobile/src/app/wallpaper-style.tsx`
- Modify: `mobile/src/app/_layout.tsx` (register the route)
- Test: `mobile/src/app/__tests__/wallpaper-style.test.tsx`

**Interfaces:**
- Consumes: `useWallpaperDraft` (`textColor`, `backdropOpacity`, `setTextColor`, `setBackdropOpacity` from Task 1), `colors.gold` (Task 3), `Slider` from `@expo/ui`.
- Produces: a default-exported `StyleSheet` screen component and a `/wallpaper-style` route.

- [ ] **Step 1: Write the failing test**

Create `mobile/src/app/__tests__/wallpaper-style.test.tsx`:

```tsx
import { render, screen, fireEvent } from '@testing-library/react-native';
import StyleSheetScreen from '@/app/wallpaper-style';
import { useWallpaperDraft } from '@/features/wallpaper/wallpaperDraft';

const mockBack = jest.fn();
jest.mock('expo-router', () => ({ useRouter: () => ({ back: mockBack }) }));

// @expo/ui Slider is a native component — render a stand-in that exposes its
// value and lets the test drive onValueChange.
jest.mock('@expo/ui', () => {
  const { Pressable } = require('react-native');
  return {
    Slider: ({ value, onValueChange, testID }: { value: number; onValueChange: (v: number) => void; testID?: string }) => (
      <Pressable testID={testID ?? 'slider'} accessibilityValue={{ now: value }} onPress={() => onValueChange(0.8)} />
    ),
  };
});

beforeEach(() => {
  mockBack.mockReset();
  useWallpaperDraft.getState().setTextColor('#FFFFFF');
  useWallpaperDraft.getState().setBackdropOpacity(0.45);
});

test('shows the two section headers and the live percentage', async () => {
  await render(<StyleSheetScreen />);
  expect(screen.getByText('Text Color')).toBeOnTheScreen();
  expect(screen.getByText('Backdrop Opacity')).toBeOnTheScreen();
  expect(screen.getByText('45%')).toBeOnTheScreen();
});

test('tapping a color swatch sets textColor and does not dismiss', async () => {
  await render(<StyleSheetScreen />);
  fireEvent.press(screen.getByLabelText('Text color #1C3344'));
  expect(useWallpaperDraft.getState().textColor).toBe('#1C3344');
  expect(mockBack).not.toHaveBeenCalled();
});

test('changing the slider sets backdropOpacity and updates the percentage', async () => {
  await render(<StyleSheetScreen />);
  fireEvent.press(screen.getByTestId('backdrop-opacity-slider'));
  expect(useWallpaperDraft.getState().backdropOpacity).toBe(0.8);
  expect(screen.getByText('80%')).toBeOnTheScreen();
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx jest src/app/__tests__/wallpaper-style.test.tsx`
Expected: FAIL — `@/app/wallpaper-style` does not exist.

- [ ] **Step 3: Create the sheet**

Create `mobile/src/app/wallpaper-style.tsx`:

```tsx
import { Pressable, ScrollView, View } from 'react-native';
import { Slider } from '@expo/ui';
import { ThemedText } from '@/components';
import { colors, spacing } from '@/theme';
import { useWallpaperDraft } from '@/features/wallpaper/wallpaperDraft';

const TEXT_COLORS: readonly { label: string; value: string }[] = [
  { label: 'White', value: '#FFFFFF' },
  { label: 'Navy', value: colors.primary },
  { label: 'Gold', value: colors.gold },
  { label: 'Light Blue', value: colors.accent },
];

function ColorSwatch({ value, selected, onSelect }: { value: string; selected: boolean; onSelect: (v: string) => void }) {
  return (
    <Pressable
      accessibilityLabel={`Text color ${value}`}
      onPress={() => onSelect(value)}
      style={{
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: value,
        borderWidth: selected ? 3 : 1,
        borderColor: selected ? colors.primary : colors.paleAlt,
      }}
    />
  );
}

export default function WallpaperStyleSheet() {
  const textColor = useWallpaperDraft((s) => s.textColor);
  const backdropOpacity = useWallpaperDraft((s) => s.backdropOpacity);
  const setTextColor = useWallpaperDraft((s) => s.setTextColor);
  const setBackdropOpacity = useWallpaperDraft((s) => s.setBackdropOpacity);

  return (
    <View style={{ flex: 1, backgroundColor: colors.surface, padding: spacing.lg }}>
      <ScrollView contentContainerStyle={{ paddingBottom: spacing.xl }}>
        <ThemedText variant="eyebrow" color={colors.textMuted} style={{ marginBottom: spacing.md }}>
          Text Color
        </ThemedText>
        <View style={{ flexDirection: 'row', gap: spacing.md }}>
          {TEXT_COLORS.map((c) => (
            <ColorSwatch key={c.value} value={c.value} selected={c.value === textColor} onSelect={setTextColor} />
          ))}
        </View>

        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: spacing.xl, marginBottom: spacing.sm }}>
          <ThemedText variant="eyebrow" color={colors.textMuted}>Backdrop Opacity</ThemedText>
          <ThemedText variant="eyebrow" color={colors.primary}>{Math.round(backdropOpacity * 100)}%</ThemedText>
        </View>
        <Slider
          testID="backdrop-opacity-slider"
          value={backdropOpacity}
          min={0}
          max={1}
          onValueChange={setBackdropOpacity}
        />
      </ScrollView>
    </View>
  );
}
```

- [ ] **Step 4: Register the route as an undimmed form sheet**

In `mobile/src/app/_layout.tsx`, add a `Stack.Screen` after the `wallpaper-backgrounds` screen:

```tsx
          <Stack.Screen
            name="wallpaper-style"
            options={{
              presentation: 'formSheet',
              sheetGrabberVisible: true,
              sheetAllowedDetents: [0.4],
              sheetLargestUndimmedDetent: 0,
            }}
          />
```

Note: verify `sheetAllowedDetents` / `sheetLargestUndimmedDetent` naming against the SDK v57 native-stack docs; if `sheetLargestUndimmedDetent: 0` does not leave the wallpaper bright, try `'all'`.

- [ ] **Step 5: Run test + typecheck**

Run: `npx jest src/app/__tests__/wallpaper-style.test.tsx && npx tsc --noEmit`
Expected: PASS; no tsc errors from the sheet or `_layout`.

- [ ] **Step 6: Commit**

```bash
git add mobile/src/app/wallpaper-style.tsx mobile/src/app/_layout.tsx mobile/src/app/__tests__/wallpaper-style.test.tsx
git commit -m "feat(wallpaper): add text color + backdrop opacity form sheet"
```

---

### Task 5: Wire the create screen

**Files:**
- Modify: `mobile/src/app/(tabs)/create.tsx`

**Interfaces:**
- Consumes: `textColor`, `backdropOpacity` from the draft (Task 1); the `/wallpaper-style` route (Task 4); `WallpaperCanvas`'s new required props (Task 2).
- Produces: no new exports; adds an "Aa" button and passes the two props into the canvas.

- [ ] **Step 1: Pass the new props into the canvas**

In `mobile/src/app/(tabs)/create.tsx`, update the draft destructure (line ~15):

```tsx
  const { verse, background, textColor, backdropOpacity } = useWallpaperDraft();
```

And update the `WallpaperCanvas` usage (line ~55):

```tsx
        <WallpaperCanvas
          verseText={verse.text}
          reference={verse.reference}
          background={background}
          textColor={textColor}
          backdropOpacity={backdropOpacity}
        />
```

- [ ] **Step 2: Add the "Aa" button to the action row**

In the same file, add a button between the "Search a verse" `Pressable` and the Backgrounds `Pressable` (inside the `flexDirection: 'row'` view, after the Search pressable closes):

```tsx
            <Pressable
              onPress={() => router.push('/wallpaper-style')}
              accessibilityLabel="Text and backdrop"
              style={{ width: 52, backgroundColor: colors.white, borderRadius: 999, alignItems: 'center', justifyContent: 'center' }}
            >
              <ThemedText variant="button" color={colors.primary}>Aa</ThemedText>
            </Pressable>
```

- [ ] **Step 3: Typecheck + lint + full test suite**

Run: `npx tsc --noEmit && npm run lint && npx jest`
Expected: no tsc errors, lint clean, all tests pass. (This is the verification for this wiring task — the create screen has no unit-test harness; its logic is covered by Tasks 1, 2, and 4, and correctness of the wiring is confirmed by tsc + the passing suite.)

- [ ] **Step 4: Manual device check**

Launch the app (`/run` skill or `npm run ios`), open the Create tab:
- Tap the new **Aa** button → the form sheet slides up partway and the wallpaper stays visible and bright above it.
- Tap each of the 4 text-color swatches → verse, cross, and reference color update live on the wallpaper.
- Drag the slider → the wallpaper darkens/lightens live; the percentage label tracks; at 0% no darkening; slide back and the value persists after closing.
- Switch background from the Backgrounds sheet → the chosen text color and opacity are retained.
- Tap **Set as wallpaper** → the exported image reflects the chosen text color and backdrop.

- [ ] **Step 5: Commit**

```bash
git add "mobile/src/app/(tabs)/create.tsx"
git commit -m "feat(wallpaper): open style sheet from create screen and apply text/backdrop settings"
```

---

## Self-Review

**Spec coverage:**
- Text color picker (4 swatches, White/Navy/Gold/Light Blue) → Tasks 3 + 4. ✅
- Backdrop opacity slider (0–100%, default 45%) → Tasks 1 + 4. ✅
- Global, persistent settings independent of background → Task 1 (store) + Task 5 manual check. ✅
- Universal scrim driven by slider, 0 = off → Task 2. ✅
- Reference derived from text color at 75% → Task 2 (`hexToRgba`). ✅
- New undimmed form sheet + "Aa" entry point → Tasks 4 + 5. ✅
- Gold token added → Task 3. ✅
- Retire `background.scrim` → Task 2 Step 4. ✅
- Backgrounds sheet unchanged → not modified by any task. ✅

**Placeholder scan:** No TBD/TODO; every code step shows complete code. ✅

**Type consistency:** `textColor: string` and `backdropOpacity: number` used identically across Tasks 1, 2, 4, 5. Setter names `setTextColor`/`setBackdropOpacity` consistent. `WallpaperCanvas` required props match between Task 2 definition and Task 5 usage. `Slider` imported from `@expo/ui` in both the sheet (Task 4 Step 3) and its mock (Task 4 Step 1). ✅
