# Widget Size Preview Toggle Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a Small / Medium / Large size toggle to the widget config screen so users preview the Daily Verse widget at each Apple size, and switch the widget's background from solid to gradient.

**Architecture:** A shared layout module (`widgetLayout.ts`) holds the per-family type/spacing/aspect-ratio constants as the single source of truth. A presentational `WidgetPreview` renders a gradient card at the selected family's proportions, driven by a local segmented control in the config screen. The native widget is refactored to consume the same constants and gains a gradient background via a `ZStack` + `foregroundStyle` linear gradient.

**Tech Stack:** Expo SDK 57, React Native, TypeScript, `expo-linear-gradient`, `@expo/ui/swift-ui` + `expo-widgets` (native widget), Jest + `@testing-library/react-native`.

## Global Constraints

- Expo SDK **57** — read versioned docs at https://docs.expo.dev/versions/v57.0.0/ before writing native/Expo code.
- iPhone-only app.
- Toggle is **preview-only**: no changes to `WidgetConfig`, `widgetStore`, or persistence.
- Preview must mirror the real widget: two layout branches only — `small` vs. `medium`/`large` (medium & large share styling, differ only in aspect ratio).
- Default selected size is **medium** (matches the mockup).
- Preview keeps the current static sample verse (Matthew 11:28) — no live/random verse.
- Widget gradient colors come from the existing `WallpaperBackground.colors` `[top, bottom]`; `timeline.ts` already supplies `bgTop`/`bgBottom` — do not change the data model.
- Interactive controls use `tapFeedback` from `@/lib/haptics` (established pattern).
- Test files live in a `__tests__/` folder beside the code; tests use `@testing-library/react-native` (`render`, `screen`, `fireEvent`).

---

## Phase A — Config screen preview (pure JS, low risk)

### Task 1: Shared layout module `widgetLayout.ts`

**Files:**
- Create: `mobile/src/features/widget/widgetLayout.ts`
- Test: `mobile/src/features/widget/__tests__/widgetLayout.test.ts`

**Interfaces:**
- Consumes: nothing.
- Produces:
  - `type WidgetFamily = 'small' | 'medium' | 'large'`
  - `interface FamilyLayout { verseFontSize: number; verseLineLimit: number; crossSize: number; refFontSize: number; padding: number; spacing: number; aspectRatio: number }`
  - `const FAMILY_LAYOUT: Record<WidgetFamily, FamilyLayout>`
  - `function familyLayout(family: WidgetFamily): FamilyLayout`
  - `const WIDGET_FAMILIES: readonly WidgetFamily[]` (= `['small','medium','large']`)

- [ ] **Step 1: Write the failing test**

```ts
// mobile/src/features/widget/__tests__/widgetLayout.test.ts
import { familyLayout, FAMILY_LAYOUT, WIDGET_FAMILIES } from '../widgetLayout';

test('families are ordered small, medium, large', () => {
  expect(WIDGET_FAMILIES).toEqual(['small', 'medium', 'large']);
});

test('small uses the compact branch values (match the widget)', () => {
  expect(familyLayout('small')).toEqual({
    verseFontSize: 14,
    verseLineLimit: 7,
    crossSize: 12,
    refFontSize: 9,
    padding: 12,
    spacing: 8,
    aspectRatio: 1,
  });
});

test('medium and large share styling, differ only in aspect ratio', () => {
  const m = familyLayout('medium');
  const l = familyLayout('large');
  const { aspectRatio: mAR, ...mStyle } = m;
  const { aspectRatio: lAR, ...lStyle } = l;
  expect(mStyle).toEqual(lStyle);
  expect(mStyle).toEqual({
    verseFontSize: 18,
    verseLineLimit: 10,
    crossSize: 16,
    refFontSize: 11,
    padding: 16,
    spacing: 12,
  });
  expect(mAR).toBeCloseTo(2.14, 2); // wide
  expect(lAR).toBeCloseTo(0.95, 2); // tall
});

test('familyLayout reads from FAMILY_LAYOUT', () => {
  expect(familyLayout('medium')).toBe(FAMILY_LAYOUT.medium);
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd mobile && npx jest src/features/widget/__tests__/widgetLayout.test.ts`
Expected: FAIL — cannot find module `../widgetLayout`.

- [ ] **Step 3: Write minimal implementation**

```ts
// mobile/src/features/widget/widgetLayout.ts

/** Apple home-screen widget size families. */
export type WidgetFamily = 'small' | 'medium' | 'large';

export interface FamilyLayout {
  /** Verse serif font size (pt). */
  verseFontSize: number;
  /** Max verse lines before truncation. */
  verseLineLimit: number;
  /** Cross glyph size (pt). */
  crossSize: number;
  /** Reference caption font size (pt). */
  refFontSize: number;
  /** Card inner padding (pt). */
  padding: number;
  /** Vertical spacing between cross / verse / reference (pt). */
  spacing: number;
  /** width / height of the card. Small square, medium wide, large tall. */
  aspectRatio: number;
}

// The real widget (widgets/QuietWatersWidget.tsx) has two branches: `small`
// vs. everything else. medium/large share styling and differ only in shape.
// Aspect ratios are representative of the iPhone 15 size class
// (small 158x158, medium 338x158, large 338x354).
const NON_SMALL = {
  verseFontSize: 18,
  verseLineLimit: 10,
  crossSize: 16,
  refFontSize: 11,
  padding: 16,
  spacing: 12,
} as const;

export const FAMILY_LAYOUT: Record<WidgetFamily, FamilyLayout> = {
  small: {
    verseFontSize: 14,
    verseLineLimit: 7,
    crossSize: 12,
    refFontSize: 9,
    padding: 12,
    spacing: 8,
    aspectRatio: 1,
  },
  medium: { ...NON_SMALL, aspectRatio: 338 / 158 },
  large: { ...NON_SMALL, aspectRatio: 338 / 354 },
};

export const WIDGET_FAMILIES: readonly WidgetFamily[] = ['small', 'medium', 'large'];

export function familyLayout(family: WidgetFamily): FamilyLayout {
  return FAMILY_LAYOUT[family];
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cd mobile && npx jest src/features/widget/__tests__/widgetLayout.test.ts`
Expected: PASS (4 tests).

- [ ] **Step 5: Commit**

```bash
git add mobile/src/features/widget/widgetLayout.ts mobile/src/features/widget/__tests__/widgetLayout.test.ts
git commit -m "feat(widgets): shared per-family widget layout constants"
```

---

### Task 2: `WidgetPreview` component

**Files:**
- Create: `mobile/src/features/widget/WidgetPreview.tsx`
- Test: `mobile/src/features/widget/__tests__/WidgetPreview.test.tsx`

**Interfaces:**
- Consumes: `WidgetFamily`, `familyLayout` from `./widgetLayout`; `WallpaperBackground` from `@/features/wallpaper/backgrounds`; `LinearGradient` from `expo-linear-gradient`; `ThemedText` from `@/components`.
- Produces:
  - `interface WidgetPreviewProps { family: WidgetFamily; background: WallpaperBackground; verseText: string; reference: string }`
  - `function WidgetPreview(props: WidgetPreviewProps): JSX.Element` (default export **not** used; named export `WidgetPreview`)

- [ ] **Step 1: Write the failing test**

```tsx
// mobile/src/features/widget/__tests__/WidgetPreview.test.tsx
import { render, screen } from '@testing-library/react-native';
import { WidgetPreview } from '../WidgetPreview';
import { BACKGROUNDS } from '@/features/wallpaper/backgrounds';

const bg = BACKGROUNDS[0];

test('renders the verse and uppercased reference', async () => {
  await render(
    <WidgetPreview family="medium" background={bg} verseText="He leads me beside quiet waters." reference="Psalm 23:2" />,
  );
  expect(screen.getByText('He leads me beside quiet waters.')).toBeOnTheScreen();
  expect(screen.getByText('PSALM 23:2')).toBeOnTheScreen();
});

test('small family limits the verse to fewer lines than medium', async () => {
  const { rerender } = render(
    <WidgetPreview family="small" background={bg} verseText="v" reference="r" />,
  );
  expect(screen.getByText('v').props.numberOfLines).toBe(7);
  rerender(<WidgetPreview family="medium" background={bg} verseText="v" reference="r" />);
  expect(screen.getByText('v').props.numberOfLines).toBe(10);
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd mobile && npx jest src/features/widget/__tests__/WidgetPreview.test.tsx`
Expected: FAIL — cannot find module `../WidgetPreview`.

- [ ] **Step 3: Write minimal implementation**

```tsx
// mobile/src/features/widget/WidgetPreview.tsx
import { View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { ThemedText } from '@/components';
import { colors, spacing } from '@/theme';
import type { WallpaperBackground } from '@/features/wallpaper/backgrounds';
import { familyLayout, type WidgetFamily } from './widgetLayout';

export interface WidgetPreviewProps {
  family: WidgetFamily;
  background: WallpaperBackground;
  verseText: string;
  reference: string;
}

/**
 * A faithful, non-interactive preview of the Daily Verse widget at one of the
 * three Apple size families. Mirrors widgets/QuietWatersWidget.tsx: gradient
 * background, centered cross + serif verse (auto-shrink/truncate) + uppercase
 * reference. Family controls proportions and type scale only.
 */
export function WidgetPreview({ family, background, verseText, reference }: WidgetPreviewProps) {
  const l = familyLayout(family);
  return (
    <LinearGradient
      colors={background.colors}
      style={{
        // Medium is wide (>1), large is tall (<1); cap width so tall large fits.
        width: l.aspectRatio >= 1 ? '80%' : undefined,
        height: l.aspectRatio < 1 ? '72%' : undefined,
        aspectRatio: l.aspectRatio,
        maxWidth: '92%',
        borderRadius: 24,
        padding: l.padding,
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: colors.primary,
        shadowOpacity: 0.28,
        shadowRadius: 24,
        shadowOffset: { width: 0, height: 16 },
        elevation: 8,
      }}
    >
      <ThemedText
        variant="body"
        color={background.mutedColor}
        style={{ fontSize: l.crossSize, marginBottom: l.spacing }}
      >
        ✝
      </ThemedText>
      <ThemedText
        variant="title"
        color={background.textColor}
        align="center"
        numberOfLines={l.verseLineLimit}
        adjustsFontSizeToFit
        minimumFontScale={0.5}
        style={{ fontSize: l.verseFontSize, lineHeight: l.verseFontSize * 1.3 }}
      >
        {verseText}
      </ThemedText>
      <ThemedText
        variant="caption"
        color={background.mutedColor}
        align="center"
        style={{ fontSize: l.refFontSize, marginTop: l.spacing, letterSpacing: 1.5 }}
      >
        {reference.toUpperCase()}
      </ThemedText>
    </LinearGradient>
  );
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cd mobile && npx jest src/features/widget/__tests__/WidgetPreview.test.tsx`
Expected: PASS (2 tests).

- [ ] **Step 5: Commit**

```bash
git add mobile/src/features/widget/WidgetPreview.tsx mobile/src/features/widget/__tests__/WidgetPreview.test.tsx
git commit -m "feat(widgets): faithful per-size WidgetPreview component"
```

---

### Task 3: `SizeSegmentedControl` component

**Files:**
- Create: `mobile/src/features/widget/SizeSegmentedControl.tsx`
- Test: `mobile/src/features/widget/__tests__/SizeSegmentedControl.test.tsx`

**Interfaces:**
- Consumes: `WidgetFamily`, `WIDGET_FAMILIES` from `./widgetLayout`; `tapFeedback` from `@/lib/haptics`; `colors`, `spacing` from `@/theme`; `ThemedText` from `@/components`.
- Produces:
  - `interface SizeSegmentedControlProps { value: WidgetFamily; onChange: (family: WidgetFamily) => void }`
  - `function SizeSegmentedControl(props): JSX.Element` (named export)
  - Labels shown: `Small`, `Medium`, `Large` (capitalized family names).

- [ ] **Step 1: Write the failing test**

```tsx
// mobile/src/features/widget/__tests__/SizeSegmentedControl.test.tsx
import { render, screen, fireEvent } from '@testing-library/react-native';
import { SizeSegmentedControl } from '../SizeSegmentedControl';
import { tapFeedback } from '@/lib/haptics';

jest.mock('@/lib/haptics', () => ({ tapFeedback: jest.fn() }));

test('renders the three size labels', async () => {
  await render(<SizeSegmentedControl value="medium" onChange={() => {}} />);
  expect(screen.getByText('Small')).toBeOnTheScreen();
  expect(screen.getByText('Medium')).toBeOnTheScreen();
  expect(screen.getByText('Large')).toBeOnTheScreen();
});

test('tapping a segment fires haptic and onChange with that family', async () => {
  const onChange = jest.fn();
  await render(<SizeSegmentedControl value="medium" onChange={onChange} />);
  fireEvent.press(screen.getByText('Large'));
  expect(tapFeedback).toHaveBeenCalledTimes(1);
  expect(onChange).toHaveBeenCalledWith('large');
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd mobile && npx jest src/features/widget/__tests__/SizeSegmentedControl.test.tsx`
Expected: FAIL — cannot find module `../SizeSegmentedControl`.

- [ ] **Step 3: Write minimal implementation**

```tsx
// mobile/src/features/widget/SizeSegmentedControl.tsx
import { Pressable, View } from 'react-native';
import { ThemedText } from '@/components';
import { colors, spacing } from '@/theme';
import { tapFeedback } from '@/lib/haptics';
import { WIDGET_FAMILIES, type WidgetFamily } from './widgetLayout';

export interface SizeSegmentedControlProps {
  value: WidgetFamily;
  onChange: (family: WidgetFamily) => void;
}

const label = (f: WidgetFamily) => f.charAt(0).toUpperCase() + f.slice(1);

/** Pill segmented control for choosing which widget size the preview shows. */
export function SizeSegmentedControl({ value, onChange }: SizeSegmentedControlProps) {
  return (
    <View
      style={{
        flexDirection: 'row',
        alignSelf: 'center',
        backgroundColor: colors.white,
        borderRadius: 999,
        padding: spacing.xs,
      }}
    >
      {WIDGET_FAMILIES.map((family) => {
        const selected = family === value;
        return (
          <Pressable
            key={family}
            accessibilityRole="button"
            accessibilityState={{ selected }}
            onPress={() => {
              tapFeedback();
              onChange(family);
            }}
            style={{
              paddingVertical: spacing.sm,
              paddingHorizontal: spacing.lg,
              borderRadius: 999,
              backgroundColor: selected ? colors.primary : 'transparent',
            }}
          >
            <ThemedText variant="body" color={selected ? colors.white : colors.textMuted}>
              {label(family)}
            </ThemedText>
          </Pressable>
        );
      })}
    </View>
  );
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cd mobile && npx jest src/features/widget/__tests__/SizeSegmentedControl.test.tsx`
Expected: PASS (2 tests).

- [ ] **Step 5: Commit**

```bash
git add mobile/src/features/widget/SizeSegmentedControl.tsx mobile/src/features/widget/__tests__/SizeSegmentedControl.test.tsx
git commit -m "feat(widgets): size segmented control for preview"
```

---

### Task 4: Wire preview + control into the config screen

**Files:**
- Modify: `mobile/src/app/(tabs)/widget-config.tsx`

**Interfaces:**
- Consumes: `WidgetPreview` (`./WidgetPreview` → import via relative `@/features/widget/WidgetPreview`), `SizeSegmentedControl`, `WidgetFamily` from `@/features/widget/...`; existing `useState` from `react`.
- Produces: no new exports.

- [ ] **Step 1: Replace the inline preview and add the control**

Replace the current `import` line for `react-native` to include nothing new, and add imports near the top (after existing imports):

```tsx
import { useState } from 'react';
import { WidgetPreview } from '@/features/widget/WidgetPreview';
import { SizeSegmentedControl } from '@/features/widget/SizeSegmentedControl';
import type { WidgetFamily } from '@/features/widget/widgetLayout';
```

Inside `WidgetConfigScreen`, add state after `const bg = ...`:

```tsx
const [family, setFamily] = useState<WidgetFamily>('medium');
```

Replace the entire preview block (the `<View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>` wrapping the `<LinearGradient>…</LinearGradient>`, lines ~57-95) with:

```tsx
{/* Preview floats with breathing room in the upper-middle of the screen */}
<View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
  <WidgetPreview
    family={family}
    background={bg}
    verseText="“Come to me, all who labor and are heavy laden, and I will give you rest.”"
    reference="Matthew 11:28"
  />
</View>

{/* Size toggle sits directly above the settings card */}
<View style={{ marginBottom: spacing.md }}>
  <SizeSegmentedControl value={family} onChange={setFamily} />
</View>
```

Remove the now-unused `LinearGradient` import **only if** it is no longer referenced elsewhere in the file (the `Row` swatch still uses `LinearGradient`, so keep the import). Verify with:

Run: `cd mobile && npx tsc --noEmit`
Expected: no type errors.

- [ ] **Step 2: Run the app and verify all three sizes**

Run: `cd mobile && npx expo start` (or use the project's run skill), open on iOS simulator, navigate to the Widget tab.
Expected:
- Segmented control shows Small / Medium / Large with **Medium** selected by default.
- Small → square card, smaller type. Medium → wide card. Large → tall card. Content styling matches per the table in the spec.
- Long verse auto-shrinks/truncates within the card.

- [ ] **Step 3: Commit**

```bash
git add "mobile/src/app/(tabs)/widget-config.tsx"
git commit -m "feat(widgets): add size preview toggle to widget config screen"
```

---

## Phase B — Native widget gradient (requires native rebuild, higher risk)

### Task 5: Widget consumes shared layout + gradient background

**Files:**
- Modify: `mobile/widgets/QuietWatersWidget.tsx`

**Interfaces:**
- Consumes: `familyLayout` / `FAMILY_LAYOUT` from `../src/features/widget/widgetLayout`; `ZStack`, `Rectangle` (or equivalent fillable shape) and `foregroundStyle` from `@expo/ui/swift-ui`.
- Produces: no new exports (widget default export unchanged).

- [ ] **Step 1: Refactor to consume shared layout values (no visual change yet)**

Replace the inline `verseSize` / `verseLimit` / ternaries with values from the shared module so the widget and preview cannot drift. Note the `'widget'` worklet directive: import the plain `FAMILY_LAYOUT` constant (data, not behavior).

```tsx
import { FAMILY_LAYOUT } from '../src/features/widget/widgetLayout';
// ...
const isSmall = environment.widgetFamily === 'systemSmall';
const l = FAMILY_LAYOUT[isSmall ? 'small' : 'medium'];
// use l.verseFontSize, l.verseLineLimit, l.crossSize, l.refFontSize, l.padding, l.spacing
```

> **Worklet fallback:** If the expo-widgets bundler cannot resolve the imported
> constant inside the `'widget'` worklet (build error or blank widget), inline
> the literal values in the widget with the comment
> `// keep in sync with FAMILY_LAYOUT in widgetLayout.ts`. The Task 1 test still
> guards the canonical values.

- [ ] **Step 2: Add the gradient background via ZStack + foregroundStyle**

`containerBackground(color)` accepts only a solid color, so keep it as the required fallback and layer a gradient-filled shape behind the content. Wrap the existing `VStack` in a `ZStack`:

```tsx
import { Image, Text, VStack, ZStack, Rectangle } from '@expo/ui/swift-ui';
import {
  allowsTightening, containerBackground, font, foregroundColor, foregroundStyle,
  lineLimit, minimumScaleFactor, multilineTextAlignment, padding, ignoreSafeArea,
} from '@expo/ui/swift-ui/modifiers';

// inside the component return:
return (
  <ZStack modifiers={[containerBackground(props.bgBottom ?? bg, 'widget')]}>
    <Rectangle
      modifiers={[
        foregroundStyle({
          type: 'linearGradient',
          colors: [props.bgTop ?? bg, props.bgBottom ?? bg],
          startPoint: { x: 0.5, y: 0 },
          endPoint: { x: 0.5, y: 1 },
        }),
        ignoreSafeArea(),
      ]}
    />
    <VStack alignment="center" spacing={l.spacing} modifiers={[padding({ all: l.padding })]}>
      {/* cross / verse / reference exactly as before, using l.* sizes */}
    </VStack>
  </ZStack>
);
```

> **API-availability fallback:** If `Rectangle`/`ZStack`/`ignoreSafeArea` are not
> exported by the installed `@expo/ui/swift-ui` (verify by grepping
> `mobile/node_modules/@expo/ui/build/swift-ui/`), use the available equivalents:
> a `Host`/`Shape` from `modifiers/shapes`, or fall back to keeping the solid
> `containerBackground(props.bgTop)` and report that a gradient background is not
> currently expressible in this widget toolkit (do NOT invent an API). Confirm
> exports first:
> `ls mobile/node_modules/@expo/ui/build/swift-ui/` and
> `grep -rn "ignoreSafeArea\|export.*Rectangle\|export.*ZStack" mobile/node_modules/@expo/ui/build/swift-ui/`.

- [ ] **Step 3: Type-check**

Run: `cd mobile && npx tsc --noEmit`
Expected: no type errors (imports resolve, modifier args typed).

- [ ] **Step 4: Rebuild the native widget and verify on the simulator**

Run: `cd mobile && npx expo prebuild -p ios && npx expo run:ios` (or the project's native-build flow).
Expected:
- App builds without errors.
- Add the Daily Verse widget at Small, Medium, and Large to the simulator home screen.
- Each renders a **vertical gradient** (top → bottom) background; cross + verse + reference unchanged; Small still uses the compact type scale.

- [ ] **Step 5: Commit**

```bash
git add mobile/widgets/QuietWatersWidget.tsx
git commit -m "feat(widgets): gradient background + shared layout in native widget"
```

---

## Self-Review

**Spec coverage:**
- Preview-only toggle → Task 4 (local `useState`, no store changes). ✓
- Faithful per-size behavior / two-branch table → Task 1 constants + Task 2 rendering. ✓
- Single source of truth + regression guard → Task 1 (`FAMILY_LAYOUT` + test), Task 5 (widget consumes it). ✓
- `WidgetPreview` component → Task 2. ✓
- Segmented control (reuse-or-create; none exists → create) → Task 3. ✓
- Config-screen wiring, default medium, static verse → Task 4. ✓
- Native widget gradient via ZStack + `foregroundStyle` → Task 5. ✓
- Out of scope (persist size, lock widget, new backgrounds, live verse) → not touched. ✓

**Placeholder scan:** No TBD/TODO; all code shown in full; fallbacks give concrete verification commands rather than vague guidance. ✓

**Type consistency:** `WidgetFamily`, `FamilyLayout`, `FAMILY_LAYOUT`, `familyLayout`, `WIDGET_FAMILIES` used identically across Tasks 1–5. `WidgetPreviewProps` / `SizeSegmentedControlProps` field names match their consumers in Task 4. `background.colors`/`textColor`/`mutedColor` match `WallpaperBackground`. ✓
