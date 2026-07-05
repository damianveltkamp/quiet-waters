import { View } from 'react-native';
import { useRouter } from 'expo-router';
import { Screen, ThemedText, CTAButton, PlaceholderBox } from '@/components';
import { spacing } from '@/theme';

export default function PaywallIntro() {
  const router = useRouter();
  return (
    <Screen variant="light">
      <View style={{ flex: 1, paddingTop: spacing.xl, gap: spacing.lg }}>
        <ThemedText variant="title" align="center">We want you to try Quiet Waters for free.</ThemedText>
        <View style={{ flex: 1 }}>
          <PlaceholderBox label="App Home Screen" sublabel="screenshot to be placed here" />
        </View>
      </View>
      <View style={{ paddingBottom: spacing.lg }}>
        <CTAButton label="Continue" onPress={() => router.push('/onboarding/11-paywall-reminder')} />
      </View>
    </Screen>
  );
}
