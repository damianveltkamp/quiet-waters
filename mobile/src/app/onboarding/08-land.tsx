import { View } from 'react-native';
import { useRouter } from 'expo-router';
import { Screen, ThemedText, CTAButton, LockScreenPreview } from '@/components';
import { spacing, colors } from '@/theme';

export default function Land() {
  const router = useRouter();
  return (
    <Screen variant="light">
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', gap: spacing.md }}>
        <View style={{ backgroundColor: '#E4F0E9', borderRadius: 999, paddingVertical: spacing.xs, paddingHorizontal: spacing.md }}>
          <ThemedText variant="eyebrow" color={colors.success}>✓ Your first background is ready</ThemedText>
        </View>
        <ThemedText variant="title" align="center">It's waiting for you.</ThemedText>
        <LockScreenPreview verse="He leads me beside quiet waters." reference="Psalm 23:2" showBranding />
        <ThemedText variant="quote" color={colors.textFaint} align="center">
          Now imagine this every time you reach for your phone — a new verse, every day.
        </ThemedText>
      </View>
      <View style={{ paddingBottom: spacing.lg }}>
        <CTAButton label="Continue" onPress={() => router.push('/onboarding/09-permissions')} />
      </View>
    </Screen>
  );
}
