import { useWallpaperDraft } from '@/features/wallpaper/wallpaperDraft';
import { startWallpaperFromVerse } from '@/features/reading/startWallpaper';

test('startWallpaperFromVerse loads the verse and translation into the wallpaper draft', () => {
  startWallpaperFromVerse('Come unto me', 'Matthew 11:28', 'BSB');
  const s = useWallpaperDraft.getState();
  expect(s.verse).toEqual({ text: 'Come unto me', reference: 'Matthew 11:28' });
  expect(s.translation).toBe('BSB');
});
