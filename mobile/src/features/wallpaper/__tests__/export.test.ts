import { createRef } from 'react';
import type { View } from 'react-native';
import { saveWallpaperToPhotos } from '@/features/wallpaper/export';

jest.mock('react-native-view-shot', () => ({ captureRef: jest.fn() }));
jest.mock('expo-media-library', () => ({
  requestPermissionsAsync: jest.fn(),
  Asset: { create: jest.fn() },
}));

import { captureRef } from 'react-native-view-shot';
import { requestPermissionsAsync, Asset } from 'expo-media-library';

const mockCapture = captureRef as jest.Mock;
const mockPerm = requestPermissionsAsync as jest.Mock;
const mockCreate = Asset.create as jest.Mock;

beforeEach(() => {
  mockCapture.mockReset();
  mockPerm.mockReset();
  mockCreate.mockReset();
});

test('captures then creates an asset when permission granted', async () => {
  mockPerm.mockResolvedValue({ status: 'granted' });
  mockCapture.mockResolvedValue('file:///tmp/wall.png');
  mockCreate.mockResolvedValue({ id: 'asset-1' });

  const ref = createRef<View>();
  const result = await saveWallpaperToPhotos(ref);

  expect(result).toBe('saved');
  expect(mockPerm).toHaveBeenCalledWith(true); // write-only
  expect(mockCapture).toHaveBeenCalledWith(ref, { format: 'png' });
  expect(mockCreate).toHaveBeenCalledWith('file:///tmp/wall.png');
});

test('returns denied and never captures when permission refused', async () => {
  mockPerm.mockResolvedValue({ status: 'denied' });

  const result = await saveWallpaperToPhotos(createRef<View>());

  expect(result).toBe('denied');
  expect(mockCapture).not.toHaveBeenCalled();
  expect(mockCreate).not.toHaveBeenCalled();
});

test('returns error when capture throws', async () => {
  mockPerm.mockResolvedValue({ status: 'granted' });
  mockCapture.mockRejectedValue(new Error('boom'));

  const result = await saveWallpaperToPhotos(createRef<View>());

  expect(result).toBe('error');
  expect(mockCreate).not.toHaveBeenCalled();
});
