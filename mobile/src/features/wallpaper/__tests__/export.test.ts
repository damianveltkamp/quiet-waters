import { createRef } from 'react';
import type { View } from 'react-native';
import { saveWallpaperToPhotos } from '@/features/wallpaper/export';

jest.mock('react-native-view-shot', () => ({ captureRef: jest.fn() }));
jest.mock('expo-media-library', () => ({
  requestPermissionsAsync: jest.fn(),
  saveToLibraryAsync: jest.fn(),
}));

import { captureRef } from 'react-native-view-shot';
import { requestPermissionsAsync, saveToLibraryAsync } from 'expo-media-library';

const mockCapture = captureRef as jest.Mock;
const mockPerm = requestPermissionsAsync as jest.Mock;
const mockSave = saveToLibraryAsync as jest.Mock;

beforeEach(() => {
  mockCapture.mockReset();
  mockPerm.mockReset();
  mockSave.mockReset();
});

test('captures then saves when permission granted', async () => {
  mockPerm.mockResolvedValue({ status: 'granted' });
  mockCapture.mockResolvedValue('file:///tmp/wall.png');
  mockSave.mockResolvedValue(undefined);

  const ref = createRef<View>();
  const result = await saveWallpaperToPhotos(ref);

  expect(result).toBe('saved');
  expect(mockPerm).toHaveBeenCalledWith(true); // write-only
  expect(mockCapture).toHaveBeenCalledWith(ref, { format: 'png' });
  expect(mockSave).toHaveBeenCalledWith('file:///tmp/wall.png');
});

test('returns denied and never captures when permission refused', async () => {
  mockPerm.mockResolvedValue({ status: 'denied' });

  const result = await saveWallpaperToPhotos(createRef<View>());

  expect(result).toBe('denied');
  expect(mockCapture).not.toHaveBeenCalled();
  expect(mockSave).not.toHaveBeenCalled();
});

test('returns error when capture throws', async () => {
  mockPerm.mockResolvedValue({ status: 'granted' });
  mockCapture.mockRejectedValue(new Error('boom'));

  const result = await saveWallpaperToPhotos(createRef<View>());

  expect(result).toBe('error');
  expect(mockSave).not.toHaveBeenCalled();
});
