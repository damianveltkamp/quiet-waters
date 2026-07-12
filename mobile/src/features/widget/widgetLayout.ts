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
