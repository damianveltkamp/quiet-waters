import {
  useFonts,
  CormorantGaramond_500Medium,
  CormorantGaramond_600SemiBold,
  CormorantGaramond_500Medium_Italic,
} from '@expo-google-fonts/cormorant-garamond';
import {
  HankenGrotesk_400Regular,
  HankenGrotesk_500Medium,
  HankenGrotesk_600SemiBold,
} from '@expo-google-fonts/hanken-grotesk';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { pushWidgetTimeline } from '@/features/widget/pushTimeline';
import { AppProviders } from '@/providers/AppProviders';

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [loaded, error] = useFonts({
    CormorantGaramond_500Medium,
    CormorantGaramond_600SemiBold,
    CormorantGaramond_500Medium_Italic,
    HankenGrotesk_400Regular,
    HankenGrotesk_500Medium,
    HankenGrotesk_600SemiBold,
  });
  useEffect(() => {
    if (loaded || error) SplashScreen.hideAsync();
  }, [loaded, error]);
  useEffect(() => {
    pushWidgetTimeline();
  }, []);
  if (!loaded && !error) return null;
  return (
    <SafeAreaProvider>
      <AppProviders>
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen
            name="wallpaper-verse-picker"
            options={{ presentation: 'modal' }}
          />
          <Stack.Screen
            name="wallpaper-backgrounds"
            options={{ presentation: 'modal' }}
          />
        </Stack>
      </AppProviders>
    </SafeAreaProvider>
  );
}
