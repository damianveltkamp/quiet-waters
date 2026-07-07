import { getVerseByRef, resolveReference } from '@/bible';

test('resolveReference parses common formats', () => {
  expect(resolveReference('Psalm 118:24')).toEqual({ bookCode: 'PSA', chapter: 118, verse: 24 });
  expect(resolveReference('1 John 3:16')).toEqual({ bookCode: '1JN', chapter: 3, verse: 16 });
  expect(resolveReference('Gen 1:1')).toEqual({ bookCode: 'GEN', chapter: 1, verse: 1 });
  expect(resolveReference('Song of Solomon 2:1')).toEqual({ bookCode: 'SNG', chapter: 2, verse: 1 });
});

test('resolveReference returns undefined for junk / unknown books / bad shape', () => {
  expect(resolveReference('not a reference')).toBeUndefined();
  expect(resolveReference('Nope 1:1')).toBeUndefined();
  expect(resolveReference('John 3')).toBeUndefined();
  expect(resolveReference('')).toBeUndefined();
});

test('getVerseByRef resolves and loads the verse', () => {
  const v = getVerseByRef('KJV', 'Psalm 118:24');
  expect(v?.text).toContain('This is the day');
  expect(v?.reference).toBe('Psalms 118:24');
});

test('getVerseByRef returns undefined for an unresolvable ref', () => {
  expect(getVerseByRef('BSB', 'Nope 1:1')).toBeUndefined();
});
