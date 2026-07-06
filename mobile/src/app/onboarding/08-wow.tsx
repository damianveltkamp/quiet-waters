import { View } from 'react-native';
import { useRouter } from 'expo-router';
import { Screen, Eyebrow, ThemedText, CTAButton, PlaceholderBox } from '@/components';
import { spacing, colors } from '@/theme';

export default function Wow() {
  const router = useRouter();
  return (
    <Screen variant="light">
      <View style={{ flex: 1, paddingTop: spacing.xl, gap: spacing.sm }}>
        <Eyebrow>Let's Make Your First</Eyebrow>
        <ThemedText variant="title">Create a background that meets you every day.</ThemedText>
        <ThemedText variant="body" color={colors.textFaint}>Pick a verse and a scene — see it come to life.</ThemedText>
        <View style={{ flex: 1, marginVertical: spacing.lg }}>
          <PlaceholderBox label="Wallpaper Creator" sublabel="feature UI to be placed here" />
        </View>
      </View>
      <View style={{ paddingBottom: spacing.lg }}>
        <CTAButton label="Make it mine" onPress={() => router.push('/onboarding/08-land')} />
      </View>
    </Screen>
  );
}
