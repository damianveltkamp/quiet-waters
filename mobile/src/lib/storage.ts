import AsyncStorage from '@react-native-async-storage/async-storage';

const KEY = 'quietwaters.onboardingComplete';

export async function setOnboardingComplete(): Promise<void> {
  await AsyncStorage.setItem(KEY, 'true');
}

export async function isOnboardingComplete(): Promise<boolean> {
  try {
    return (await AsyncStorage.getItem(KEY)) === 'true';
  } catch {
    return false; // fail safe: show onboarding
  }
}
