import { View } from 'react-native';
import { useRouter } from 'expo-router';
import { Screen, Eyebrow, ThemedText, Divider, CTAButton } from '@/components';
import { useOnboardingStore } from '@/store/onboarding';
import { hoursPerYear, fullDays, formatNumber } from '@/lib/calculations';
import { spacing, colors } from '@/theme';

export default function Stakes() {
  const router = useRouter();
  const bucket = useOnboardingStore((s) => s.bucket);
  return (
    <Screen variant="light">
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', gap: spacing.sm }}>
        <Eyebrow>At this rate, this year you'll spend</Eyebrow>
        <ThemedText variant="display">{formatNumber(hoursPerYear(bucket))}</ThemedText>
        <ThemedText variant="eyebrow" color={colors.mid}>Hours on your phone</ThemedText>
        <Divider />
        <ThemedText variant="title" align="center">
          That's {fullDays(bucket)} full days you could spend getting closer to God.
        </ThemedText>
        <ThemedText variant="quote" color={colors.textFaint} align="center">Imagine giving even a tenth of it back to Him.</ThemedText>
      </View>
      <View style={{ paddingBottom: spacing.lg }}>
        <CTAButton label="Show me how" onPress={() => router.push('/onboarding/05-promise')} />
      </View>
    </Screen>
  );
}
