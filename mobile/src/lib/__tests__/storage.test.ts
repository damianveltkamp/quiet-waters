import AsyncStorage from '@react-native-async-storage/async-storage';
import { setOnboardingComplete, isOnboardingComplete } from '@/lib/storage';

jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock'));

beforeEach(async () => { await AsyncStorage.clear(); });

test('defaults to not complete', async () => {
  expect(await isOnboardingComplete()).toBe(false);
});
test('persists completion', async () => {
  await setOnboardingComplete();
  expect(await isOnboardingComplete()).toBe(true);
});
test('read failure fails safe to false', async () => {
  (AsyncStorage.getItem as jest.Mock).mockRejectedValueOnce(new Error('boom'));
  expect(await isOnboardingComplete()).toBe(false);
});
