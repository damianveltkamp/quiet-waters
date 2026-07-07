export type TranslationId = 'BSB' | 'KJV';

/** A fully-loaded book: chapters[c-1][v-1] = verse text. */
export interface Book {
  code: string;
  name: string;
  chapters: string[][];
}

export interface BookMeta {
  code: string;
  name: string;
  testament: 'OT' | 'NT';
  order: number;
  chapterCount: number;
}

export interface TranslationMeta {
  id: TranslationId;
  name: string;
  license: string;
  licenseUrl: string;
}

export interface Verse {
  text: string;
  reference: string;
}

export interface Reference {
  bookCode: string;
  chapter: number;
  verse: number;
}
