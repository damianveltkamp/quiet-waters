import { useState } from 'react';
import { View } from 'react-native';
import { useRouter } from 'expo-router';
import { Screen, ThemedText, CTAButton, TimelineStep, PlanCard } from '@/components';
import { setOnboardingComplete } from '@/lib/storage';
import { spacing } from '@/theme';

export default function PaywallPlans() {
  const router = useRouter();
  const [plan, setPlan] = useState<'yearly' | 'weekly'>('yearly');
  const finish = async () => { await setOnboardingComplete(); router.replace('/home'); };
  return (
    <Screen variant="light">
      <View style={{ flex: 1, paddingTop: spacing.lg, gap: spacing.md }}>
        <ThemedText variant="title" align="center">We'll remind you before your trial ends.</ThemedText>
        <View style={{ marginVertical: spacing.md }}>
          <TimelineStep icon="lock" title="Today" body="Unlock full access to Quiet Waters and start getting closer to God." />
          <TimelineStep icon="bell" title="In 2 days" body="We'll send a reminder before your trial ends." />
          <TimelineStep icon="sparkle" title="In 3 days" body="Your subscription begins unless you cancel before." isLast />
        </View>
        <PlanCard title="Yearly" priceLabel="$59.99" subLabel="Only $1.15 / week" periodLabel="/ year"
          selected={plan === 'yearly'} badge="SAVE 92%" onPress={() => setPlan('yearly')} />
        <PlanCard title="Weekly" priceLabel="$4.99" subLabel="Billed every week" periodLabel="/ week"
          selected={plan === 'weekly'} onPress={() => setPlan('weekly')} />
      </View>
      <View style={{ paddingBottom: spacing.lg }}>
        <CTAButton label="Try for FREE" onPress={finish} />
      </View>
    </Screen>
  );
}
