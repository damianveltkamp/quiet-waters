import { BOOKS } from './books';
import { BIBLE_DATA } from './data';
import { TRANSLATIONS } from './translations';
import type { BookMeta, TranslationId, TranslationMeta, Verse } from './types';

export type { BookMeta, Reference, TranslationId, TranslationMeta, Verse } from './types';

const BOOK_BY_CODE = new Map(BOOKS.map((b) => [b.code, b]));

export function listTranslations(): TranslationMeta[] {
  return TRANSLATIONS;
}

export function getBooks(): BookMeta[] {
  return BOOKS;
}

export function getChapter(
  translation: TranslationId,
  bookCode: string,
  chapter: number,
): string[] {
  const loader = BIBLE_DATA[translation]?.[bookCode];
  if (!loader) return [];
  const book = loader();
  return book.chapters[chapter - 1] ?? [];
}

export function getVerse(
  translation: TranslationId,
  bookCode: string,
  chapter: number,
  verse: number,
): Verse | undefined {
  const meta = BOOK_BY_CODE.get(bookCode);
  if (!meta) return undefined;
  const text = getChapter(translation, bookCode, chapter)[verse - 1];
  if (text === undefined || text === '') return undefined;
  return { text, reference: `${meta.name} ${chapter}:${verse}` };
}
