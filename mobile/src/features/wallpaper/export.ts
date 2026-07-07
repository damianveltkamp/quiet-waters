import type { RefObject } from 'react';
import type { View } from 'react-native';
import { captureRef } from 'react-native-view-shot';
import { requestPermissionsAsync, saveToLibraryAsync } from 'expo-media-library';

export type SaveResult = 'saved' | 'denied' | 'error';

/**
 * Capture the referenced view to a retina PNG and save it to the Photos library.
 * Uses write-only permission (requestPermissionsAsync(true)).
 */
export async function saveWallpaperToPhotos(ref: RefObject<View | null>): Promise<SaveResult> {
  try {
    const { status } = await requestPermissionsAsync(true);
    if (status !== 'granted') return 'denied';
    const uri = await captureRef(ref, { format: 'png' });
    await saveToLibraryAsync(uri);
    return 'saved';
  } catch {
    return 'error';
  }
}
