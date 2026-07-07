import { TRANSLATIONS } from '@/bible/translations';

test('exposes exactly BSB and KJV with license info', () => {
  expect(TRANSLATIONS.map((t) => t.id)).toEqual(['BSB', 'KJV']);
  for (const t of TRANSLATIONS) {
    expect(t.name.length).toBeGreaterThan(0);
    expect(t.license).toBe('Public Domain');
    expect(t.licenseUrl).toMatch(/^https?:\/\//);
  }
});
