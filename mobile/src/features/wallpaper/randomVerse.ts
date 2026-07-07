import { getBooks, getChapter, getVerse } from '@/bible';
import type { TranslationId, Verse } from '@/bible';

const FALLBACK: Verse = { text: 'He leads me beside quiet waters.', reference: 'Psalm 23:2' };

/**
 * Pick a random, defined verse from anywhere in the Bible. Retries past empty
 * chapters and textual-variant gaps (where getVerse returns undefined).
 * `rand` is injectable for deterministic tests; defaults to Math.random.
 */
export function pickRandomVerse(
  translation: TranslationId,
  rand: () => number = Math.random,
): Verse {
  const books = getBooks();
  for (let attempt = 0; attempt < 200; attempt++) {
    const book = books[Math.floor(rand() * books.length)];
    const chapter = Math.floor(rand() * book.chapterCount) + 1;
    const verses = getChapter(translation, book.code, chapter);
    if (verses.length === 0) continue;
    const verseNum = Math.floor(rand() * verses.length) + 1;
    const found = getVerse(translation, book.code, chapter, verseNum);
    if (found) return found;
  }
  return FALLBACK;
}
