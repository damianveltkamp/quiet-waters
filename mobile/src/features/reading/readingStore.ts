import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { mmkvStorage } from '@/lib/mmkvStorage';
import type { TranslationId } from '@/bible';

export type FontFace = 'serif' | 'sans';
export interface ReadingPosition {
  bookCode: string;
  chapter: number;
  verse: number;
}

export interface ReadingState {
  position: ReadingPosition;
  translation: TranslationId;
  fontScale: number;
  fontFace: FontFace;
  setPosition: (p: ReadingPosition) => void;
  openChapter: (bookCode: string, chapter: number) => void;
  setVerse: (verse: number) => void;
  setTranslation: (t: TranslationId) => void;
  setFontScale: (n: number) => void;
  setFontFace: (f: FontFace) => void;
}

export const useReadingStore = create<ReadingState>()(
  persist(
    (set) => ({
      position: { bookCode: 'JHN', chapter: 1, verse: 1 },
      translation: 'KJV',
      fontScale: 1,
      fontFace: 'serif',
      setPosition: (position) => set({ position }),
      openChapter: (bookCode, chapter) => set({ position: { bookCode, chapter, verse: 1 } }),
      setVerse: (verse) => set((s) => ({ position: { ...s.position, verse } })),
      setTranslation: (translation) => set({ translation }),
      setFontScale: (fontScale) => set({ fontScale }),
      setFontFace: (fontFace) => set({ fontFace }),
    }),
    { name: 'reading', storage: createJSONStorage(() => mmkvStorage) },
  ),
);
