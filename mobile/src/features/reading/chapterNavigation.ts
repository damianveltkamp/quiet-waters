import { getBooks } from '@/bible';

export interface ChapterRef {
  bookCode: string;
  chapter: number;
}

// getBooks() is already ordered by canonical `order`.
const BOOKS = getBooks();
const INDEX = new Map(BOOKS.map((b, i) => [b.code, i]));

export function nextChapter(ref: ChapterRef): ChapterRef | null {
  const i = INDEX.get(ref.bookCode);
  if (i === undefined) return null;
  const book = BOOKS[i];
  if (ref.chapter < book.chapterCount) return { bookCode: book.code, chapter: ref.chapter + 1 };
  const next = BOOKS[i + 1];
  if (!next) return null;
  return { bookCode: next.code, chapter: 1 };
}

export function prevChapter(ref: ChapterRef): ChapterRef | null {
  const i = INDEX.get(ref.bookCode);
  if (i === undefined) return null;
  if (ref.chapter > 1) return { bookCode: ref.bookCode, chapter: ref.chapter - 1 };
  const prev = BOOKS[i - 1];
  if (!prev) return null;
  return { bookCode: prev.code, chapter: prev.chapterCount };
}
