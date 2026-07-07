import { getBooks, getChapter, getVerse, listTranslations } from '@/bible';

test('listTranslations returns BSB and KJV', () => {
  expect(listTranslations().map((t) => t.id)).toEqual(['BSB', 'KJV']);
});

test('getBooks returns the 66-book metadata', () => {
  expect(getBooks()).toHaveLength(66);
  expect(getBooks()[0].code).toBe('GEN');
});

test('getVerse returns known verses in both translations', () => {
  expect(getVerse('BSB', 'JHN', 3, 16)?.text).toContain('For God so loved the world');
  expect(getVerse('KJV', 'JHN', 3, 16)?.text).toContain('For God so loved the world');
  expect(getVerse('BSB', 'PSA', 118, 24)?.text).toContain('This is the day');
});

test('getVerse builds a human reference from the book name', () => {
  expect(getVerse('KJV', 'JHN', 3, 16)?.reference).toBe('John 3:16');
});

test('getChapter length matches the known verse count', () => {
  // Psalm 119 has 176 verses.
  expect(getChapter('BSB', 'PSA', 119)).toHaveLength(176);
});

test('out-of-range lookups return undefined / empty array', () => {
  expect(getVerse('BSB', 'JHN', 99, 1)).toBeUndefined();
  expect(getVerse('BSB', 'JHN', 3, 999)).toBeUndefined();
  expect(getVerse('BSB', 'ZZZ', 1, 1)).toBeUndefined();
  expect(getChapter('BSB', 'JHN', 99)).toEqual([]);
  expect(getChapter('BSB', 'ZZZ', 1)).toEqual([]);
});

test('empty-string verse (BSB textual variant) returns undefined', () => {
  // BSB omits this textual-variant verse (empty string in data) -> undefined.
  expect(getVerse('BSB', 'MAT', 17, 21)).toBeUndefined();
  // KJV retains it, as a contrast.
  expect(getVerse('KJV', 'MAT', 17, 21)?.text.length).toBeGreaterThan(0);
});
