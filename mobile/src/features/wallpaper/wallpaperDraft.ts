import { create } from 'zustand';
import { DEFAULT_BACKGROUND, type WallpaperBackground } from './backgrounds';
import type { TranslationId } from '@/bible';

const DEFAULT_VERSE = { text: 'He leads me beside quiet waters.', reference: 'Psalm 23:2' };

export interface WallpaperDraftState {
  verse: { text: string; reference: string };
  translation: TranslationId;
  background: WallpaperBackground;
  textColor: string;
  backdropOpacity: number;
  setVerse: (text: string, reference: string) => void;
  setTranslation: (id: TranslationId) => void;
  setBackground: (bg: WallpaperBackground) => void;
  setTextColor: (c: string) => void;
  setBackdropOpacity: (o: number) => void;
}

export const useWallpaperDraft = create<WallpaperDraftState>((set) => ({
  verse: DEFAULT_VERSE,
  translation: 'KJV',
  background: DEFAULT_BACKGROUND,
  textColor: '#FFFFFF',
  backdropOpacity: 0.45,
  setVerse: (text, reference) => set({ verse: { text, reference } }),
  setTranslation: (translation) => set({ translation }),
  setBackground: (background) => set({ background }),
  setTextColor: (textColor) => set({ textColor }),
  setBackdropOpacity: (backdropOpacity) => set({ backdropOpacity }),
}));
