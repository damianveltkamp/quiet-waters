import { getVerseOfTheDay, verses } from '@/content/verses';

test('returns a verse that exists in the list', () => {
  expect(verses).toContain(getVerseOfTheDay(new Date(2026, 6, 7)));
});

test('is deterministic for the same calendar day', () => {
  expect(getVerseOfTheDay(new Date(2026, 6, 7))).toEqual(getVerseOfTheDay(new Date(2026, 6, 7)));
});

test('returns the seeded Psalm while only one verse exists', () => {
  expect(getVerseOfTheDay(new Date(2026, 0, 1)).reference).toBe('Psalm 118:24');
});
