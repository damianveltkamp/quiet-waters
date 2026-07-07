import { BOOKS, matchBook } from '@/bible/books';

test('BOOKS has all 66 canonical books in order', () => {
  expect(BOOKS).toHaveLength(66);
  expect(BOOKS[0]).toMatchObject({ code: 'GEN', name: 'Genesis', order: 1, chapterCount: 50 });
  expect(BOOKS[65]).toMatchObject({ code: 'REV', name: 'Revelation', order: 66, chapterCount: 22 });
  expect(BOOKS.map((b) => b.order)).toEqual(Array.from({ length: 66 }, (_, i) => i + 1));
});

test('BOOKS splits 39 OT / 27 NT and has unique codes', () => {
  expect(BOOKS.filter((b) => b.testament === 'OT')).toHaveLength(39);
  expect(BOOKS.filter((b) => b.testament === 'NT')).toHaveLength(27);
  expect(new Set(BOOKS.map((b) => b.code)).size).toBe(66);
});

test('matchBook resolves full names, case-insensitively', () => {
  expect(matchBook('Genesis')?.code).toBe('GEN');
  expect(matchBook('genesis')?.code).toBe('GEN');
  expect(matchBook('Song of Solomon')?.code).toBe('SNG');
});

test('matchBook resolves numbered books with/without spaces', () => {
  expect(matchBook('1 John')?.code).toBe('1JN');
  expect(matchBook('1john')?.code).toBe('1JN');
  expect(matchBook('1 Jn')?.code).toBe('1JN');
});

test('matchBook tolerates Psalm/Psalms and common abbreviations', () => {
  expect(matchBook('Psalm')?.code).toBe('PSA');
  expect(matchBook('Psalms')?.code).toBe('PSA');
  expect(matchBook('Gen')?.code).toBe('GEN');
});

test('matchBook returns undefined for junk', () => {
  expect(matchBook('Nope')).toBeUndefined();
  expect(matchBook('')).toBeUndefined();
});
