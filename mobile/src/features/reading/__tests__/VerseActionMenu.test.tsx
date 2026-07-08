import { render, fireEvent, screen, waitFor } from '@testing-library/react-native';
import VerseActionMenu from '@/features/reading/VerseActionMenu';
import * as share from '@/features/reading/shareVerse';
import * as wallpaper from '@/features/reading/startWallpaper';

test('Share verse invokes shareVerse then closes', async () => {
  const shareSpy = jest.spyOn(share, 'shareVerse').mockResolvedValue();
  const onClose = jest.fn();
  await render(
    <VerseActionMenu verseText="Come unto me" reference="Matthew 11:28" translation="KJV" onCreateWallpaper={() => {}} onClose={onClose} />,
  );
  fireEvent.press(screen.getByText('Share verse'));
  expect(shareSpy).toHaveBeenCalledWith('Come unto me', 'Matthew 11:28', 'KJV');
  await waitFor(() => expect(onClose).toHaveBeenCalled());
  shareSpy.mockRestore();
});

test('Create wallpaper loads the draft then calls onCreateWallpaper', async () => {
  const wallpaperSpy = jest.spyOn(wallpaper, 'startWallpaperFromVerse').mockImplementation(() => {});
  const onCreate = jest.fn();
  await render(
    <VerseActionMenu verseText="Come unto me" reference="Matthew 11:28" translation="BSB" onCreateWallpaper={onCreate} onClose={() => {}} />,
  );
  fireEvent.press(screen.getByText('Create wallpaper'));
  expect(wallpaperSpy).toHaveBeenCalledWith('Come unto me', 'Matthew 11:28', 'BSB');
  expect(onCreate).toHaveBeenCalled();
  wallpaperSpy.mockRestore();
});
