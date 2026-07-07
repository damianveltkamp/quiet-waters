import { useWallpaperDraft } from '@/features/wallpaper/wallpaperDraft';
import { BACKGROUNDS } from '@/features/wallpaper/backgrounds';

test('defaults to Psalm 23:2 / KJV / Deep Night', () => {
  const s = useWallpaperDraft.getState();
  expect(s.verse).toEqual({ text: 'He leads me beside quiet waters.', reference: 'Psalm 23:2' });
  expect(s.translation).toBe('KJV');
  expect(s.background.name).toBe('Deep Night');
});

test('setVerse replaces the verse', () => {
  useWallpaperDraft.getState().setVerse('For God so loved the world', 'John 3:16');
  expect(useWallpaperDraft.getState().verse).toEqual({
    text: 'For God so loved the world', reference: 'John 3:16',
  });
});

test('setTranslation and setBackground update state', () => {
  useWallpaperDraft.getState().setTranslation('BSB');
  useWallpaperDraft.getState().setBackground(BACKGROUNDS[5]);
  expect(useWallpaperDraft.getState().translation).toBe('BSB');
  expect(useWallpaperDraft.getState().background.name).toBe('Horizon');
});
