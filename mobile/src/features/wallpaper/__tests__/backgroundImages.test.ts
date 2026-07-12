import { IMAGE_ASSETS } from '@/features/wallpaper/backgroundImages.generated';

test('generates twenty image assets', () => {
  expect(IMAGE_ASSETS).toHaveLength(20);
});

test('each asset has a source and a valid hex fallback color', () => {
  for (const a of IMAGE_ASSETS) {
    expect(a.source).toBeTruthy();
    expect(a.id).toMatch(/^scene-\d{2}$/);
    expect(a.fallbackColor).toMatch(/^#[0-9a-f]{6}$/i);
  }
});

test('asset ids are unique', () => {
  const ids = IMAGE_ASSETS.map((a) => a.id);
  expect(new Set(ids).size).toBe(ids.length);
});
