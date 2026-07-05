import { View } from 'react-native';
import { useRouter } from 'expo-router';
import * as Notifications from 'expo-notifications';
import { Screen, Eyebrow, ThemedText, CTAButton, NotificationPreview } from '@/components';
import { spacing, colors } from '@/theme';

export default function Permissions() {
  const router = useRouter();
  const handle = async () => {
    try { await Notifications.requestPermissionsAsync(); } catch { /* ignore */ }
    router.push('/onboarding/10-paywall-intro'); // advance regardless of outcome
  };
  return (
    <Screen variant="light">
      <View style={{ flex: 1, paddingTop: spacing.xl, gap: spacing.md }}>
        <Eyebrow>One Last Step</Eyebrow>
        <ThemedText variant="title">Let the Word reach you.</ThemedText>
        <ThemedText variant="body" color={colors.textMuted}>
          Allow notifications so Quiet Waters can bring Scripture to you each day.
        </ThemedText>
        <View style={{ marginTop: spacing.lg }}>
          <NotificationPreview title="Your verse for today" body="Be still, and know that I am God." />
        </View>
      </View>
      <View style={{ paddingBottom: spacing.lg }}>
        <CTAButton label="Get daily scriptures" onPress={handle} />
      </View>
    </Screen>
  );
}
