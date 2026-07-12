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
