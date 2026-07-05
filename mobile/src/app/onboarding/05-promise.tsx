import { View } from 'react-native';
import { useRouter } from 'expo-router';
import { Screen, Eyebrow, ThemedText, CTAButton, LockScreenPreview } from '@/components';
import { spacing, colors } from '@/theme';

export default function Promise() {
  const router = useRouter();
  return (
    <Screen variant="light">
      <View style={{ flex: 1, paddingTop: spacing.xl, gap: spacing.md }}>
        <Eyebrow>The Promise</Eyebrow>
        <ThemedText variant="title">Meet His Word in the time you're already here.</ThemedText>
        <ThemedText variant="body" color={colors.textMuted}>
          Quiet Waters places Scripture right where you already look — no new habit to squeeze in.
        </ThemedText>
        <View style={{ alignItems: 'center', marginTop: spacing.md }}>
          <LockScreenPreview verse="He leads me beside quiet waters." reference="Psalm 23:2" showTodayWidget />
        </View>
        <View style={{ flexDirection: 'row', justifyContent: 'space-around', marginTop: spacing.md }}>
          <Eyebrow color={colors.textFaint}>Wallpapers</Eyebrow>
          <Eyebrow color={colors.textFaint}>Widgets</Eyebrow>
          <Eyebrow color={colors.textFaint}>Live Activities</Eyebrow>
        </View>
      </View>
      <View style={{ paddingBottom: spacing.lg }}>
        <CTAButton label="See how it works" onPress={() => router.push('/onboarding/06-vow')} />
      </View>
    </Screen>
  );
}
