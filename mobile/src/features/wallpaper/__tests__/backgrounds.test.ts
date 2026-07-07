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
