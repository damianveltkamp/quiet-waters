import { nextChapter, prevChapter } from '@/features/reading/chapterNavigation';

test('nextChapter advances within a book', () => {
  expect(nextChapter({ bookCode: 'JHN', chapter: 1 })).toEqual({ bookCode: 'JHN', chapter: 2 });
});

test('nextChapter flows into the next book at the boundary', () => {
  // Matthew has 28 chapters; next book is Mark.
  expect(nextChapter({ bookCode: 'MAT', chapter: 28 })).toEqual({ bookCode: 'MRK', chapter: 1 });
});

test('nextChapter returns null at the end of the canon (Revelation 22)', () => {
  expect(nextChapter({ bookCode: 'REV', chapter: 22 })).toBeNull();
});

test('prevChapter steps back within a book', () => {
  expect(prevChapter({ bookCode: 'JHN', chapter: 2 })).toEqual({ bookCode: 'JHN', chapter: 1 });
});

test('prevChapter flows into the previous book at the boundary', () => {
  // Mark 1 -> Matthew 28.
  expect(prevChapter({ bookCode: 'MRK', chapter: 1 })).toEqual({ bookCode: 'MAT', chapter: 28 });
});

test('prevChapter returns null at Genesis 1', () => {
  expect(prevChapter({ bookCode: 'GEN', chapter: 1 })).toBeNull();
});
