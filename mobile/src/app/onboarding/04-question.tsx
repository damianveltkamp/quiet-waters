import { View } from 'react-native';
import { useRouter } from 'expo-router';
import { Screen, ThemedText, CTAButton, RadioOption } from '@/components';
import { useOnboardingStore } from '@/store/onboarding';
import { HOURS_BUCKETS } from '@/lib/calculations';
import { spacing, colors } from '@/theme';

const LABEL: Record<string, string> = {
  '1-3': '1-3 hours', '3-4': '3-4 hours', '4-5': '4-5 hours',
  '5-6': '5-6 hours', '6-7': '6-7 hours', '7+': '7+ hours',
};

export default function Question() {
  const router = useRouter();
  const { bucket, setBucket } = useOnboardingStore();
  return (
    <Screen variant="light">
      <View style={{ flex: 1, paddingTop: spacing.xl, gap: spacing.sm }}>
        <ThemedText variant="title">How much time do you spend on your phone each day?</ThemedText>
        <ThemedText variant="body" color={colors.textFaint} style={{ marginBottom: spacing.md }}>An honest guess is perfect.</ThemedText>
        {HOURS_BUCKETS.map((b) => (
          <RadioOption key={b} label={LABEL[b]} selected={bucket === b} onPress={() => setBucket(b)} />
        ))}
      </View>
      <View style={{ paddingBottom: spacing.lg }}>
        <CTAButton label="Continue" onPress={() => router.push('/onboarding/05-stakes')} />
      </View>
    </Screen>
  );
}
