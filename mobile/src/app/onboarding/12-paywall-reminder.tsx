import { View } from 'react-native';
import { useRouter } from 'expo-router';
import Svg, { Path } from 'react-native-svg';
import { Screen, ThemedText, CTAButton } from '@/components';
import { spacing, colors } from '@/theme';

export default function PaywallReminder() {
  const router = useRouter();
  return (
    <Screen variant="light">
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', gap: spacing.lg }}>
        <View style={{ width: 84, height: 84, borderRadius: 42, backgroundColor: colors.paleAlt, alignItems: 'center', justifyContent: 'center' }}>
          <Svg width={32} height={32} viewBox="0 0 24 24">
            <Path d="M12 2a6 6 0 00-6 6c0 5-2 6-2 6h16s-2-1-2-6a6 6 0 00-6-6zm0 20a2.5 2.5 0 002.45-2h-4.9A2.5 2.5 0 0012 22z" fill={colors.mid} />
          </Svg>
        </View>
        <ThemedText variant="title" align="center">We'll remind you before your trial ends.</ThemedText>
      </View>
      <View style={{ paddingBottom: spacing.lg }}>
        <CTAButton label="Try for $0.00" onPress={() => router.push('/onboarding/12-paywall-plans')} />
      </View>
    </Screen>
  );
}
