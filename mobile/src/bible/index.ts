import { BOOKS, matchBook } from './books';
import { BIBLE_DATA } from './data';
import { TRANSLATIONS } from './translations';
import type { BookMeta, Reference, TranslationId, TranslationMeta, Verse } from './types';

export type { BookMeta, Reference, TranslationId, TranslationMeta, Verse } from './types';

const BOOK_BY_CODE = new Map(BOOKS.map((b) => [b.code, b]));

export function listTranslations(): TranslationMeta[] {
  return TRANSLATIONS;
}

export function getBooks(): BookMeta[] {
  return BOOKS;
}

/** Returns the cached chapter array (no copy) — internal hot-path use only. */
function loadChapter(
  translation: TranslationId,
  bookCode: string,
  chapter: number,
): string[] {
  const loader = BIBLE_DATA[translation]?.[bookCode];
  if (!loader) return [];
  const book = loader();
  return book.chapters[chapter - 1] ?? [];
}

export function getChapter(
  translation: TranslationId,
  bookCode: string,
  chapter: number,
): string[] {
  // Return a shallow copy so callers can't mutate the shared cached book.
  return loadChapter(translation, bookCode, chapter).slice();
}

export function getVerse(
  translation: TranslationId,
  bookCode: string,
  chapter: number,
  verse: number,
): Verse | undefined {
  const meta = BOOK_BY_CODE.get(bookCode);
  if (!meta) return undefined;
  const text = loadChapter(translation, bookCode, chapter)[verse - 1];
  if (text === undefined || text === '') return undefined;
  return { text, reference: `${meta.name} ${chapter}:${verse}` };
}

/** Parse a reference like "Psalm 118:24", "1 John 3:16", "Gen 1:1". */
export function resolveReference(ref: string): Reference | undefined {
  // Split into "<book part> <chapter>:<verse>" — book part may contain spaces/digits.
  const match = ref.trim().match(/^(.+?)\s+(\d+):(\d+)$/);
  if (!match) return undefined;
  const [, bookToken, chapterStr, verseStr] = match;
  const meta = matchBook(bookToken);
  if (!meta) return undefined;
  return { bookCode: meta.code, chapter: Number(chapterStr), verse: Number(verseStr) };
}

export function getVerseByRef(translation: TranslationId, ref: string): Verse | undefined {
  const resolved = resolveReference(ref);
  if (!resolved) return undefined;
  return getVerse(translation, resolved.bookCode, resolved.chapter, resolved.verse);
}
