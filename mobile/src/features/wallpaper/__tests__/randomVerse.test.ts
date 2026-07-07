import { pickRandomVerse } from '@/features/wallpaper/randomVerse';

jest.mock('@/bible', () => ({
  getBooks: () => [{ code: 'GEN', name: 'Genesis', testament: 'OT', order: 1, chapterCount: 2 }],
  getChapter: jest.fn(),
  getVerse: jest.fn(),
}));

import { getChapter, getVerse } from '@/bible';

const mockChapter = getChapter as jest.Mock;
const mockVerse = getVerse as jest.Mock;

beforeEach(() => {
  mockChapter.mockReset();
  mockVerse.mockReset();
});

test('returns a defined verse, retrying past an undefined one', () => {
  // Deterministic rand sequence drives the two attempts.
  const seq = [0, 0, 0, 0, 0, 0]; // always book 0, chapter 1, verse 1
  let i = 0;
  const rand = () => seq[i++ % seq.length];

  mockChapter.mockReturnValue(['', 'In the beginning...']); // verse 1 is a gap
  // First attempt asks for verse 1 -> undefined; second attempt verse 1 again but
  // we make getVerse return undefined once, then a real verse.
  mockVerse
    .mockReturnValueOnce(undefined)
    .mockReturnValue({ text: 'In the beginning...', reference: 'Genesis 1:1' });

  const v = pickRandomVerse('KJV', rand);
  expect(v).toEqual({ text: 'In the beginning...', reference: 'Genesis 1:1' });
  expect(mockVerse).toHaveBeenCalledTimes(2); // retried once
});

test('skips empty chapters without calling getVerse', () => {
  const rand = () => 0;
  mockChapter.mockReturnValueOnce([]).mockReturnValue(['Verse text']);
  mockVerse.mockReturnValue({ text: 'Verse text', reference: 'Genesis 1:1' });

  const v = pickRandomVerse('KJV', rand);
  expect(v.text).toBe('Verse text');
});
