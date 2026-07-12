import { BACKGROUNDS, DEFAULT_BACKGROUND } from '@/features/wallpaper/backgrounds';

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

const gradients = () => BACKGROUNDS.filter((b) => b.kind === 'gradient');
const images = () => BACKGROUNDS.filter((b) => b.kind === 'image');

test('ships the six named gradient presets in mockup order', () => {
  expect(gradients().map((b) => b.name)).toEqual([
    'Deep Night', 'Still Water', 'First Light', 'Open Sky', 'Morning Mist', 'Horizon',
  ]);
});

test('ships twenty image backgrounds after the gradients', () => {
  expect(images()).toHaveLength(20);
});

test('every background has a unique id', () => {
  const ids = BACKGROUNDS.map((b) => b.id);
  expect(new Set(ids).size).toBe(ids.length);
});

test('gradient text is legible against both stops (contrast >= 3)', () => {
  for (const bg of gradients()) {
    if (bg.kind !== 'gradient') continue;
    expect(contrast(bg.textColor, bg.colors[0])).toBeGreaterThanOrEqual(3);
    expect(contrast(bg.textColor, bg.colors[1])).toBeGreaterThanOrEqual(3);
  }
});

test('image backgrounds use white text and carry a hex fallback color', () => {
  for (const bg of images()) {
    if (bg.kind !== 'image') continue;
    expect(bg.textColor).toBe('#FFFFFF');
    expect(bg.fallbackColor).toMatch(/^#[0-9a-f]{6}$/i);
    expect(bg.widgetAsset).toBe(bg.id);
  }
});

test('default background is Deep Night', () => {
  expect(DEFAULT_BACKGROUND.name).toBe('Deep Night');
});
