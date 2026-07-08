import { useWallpaperDraft } from '@/features/wallpaper/wallpaperDraft';
import type { TranslationId } from '@/bible';

export function startWallpaperFromVerse(
  text: string,
  reference: string,
  translation: TranslationId,
): void {
  const draft = useWallpaperDraft.getState();
  draft.setVerse(text, reference);
  draft.setTranslation(translation);
}
