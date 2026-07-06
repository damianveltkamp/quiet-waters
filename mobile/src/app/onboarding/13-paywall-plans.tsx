import { useEffect, useState } from 'react';
import { Pressable, View } from 'react-native';
import { useRouter } from 'expo-router';
import { usePostHog } from 'posthog-react-native';
import { openBrowserAsync } from 'expo-web-browser';
import type { PurchasesOffering, PurchasesPackage } from 'react-native-purchases';
import { Screen, ThemedText, CTAButton, TimelineStep, PlanCard } from '@/components';
import { setOnboardingComplete } from '@/lib/storage';
import { getCurrentOffering, purchasePackage, restore, hasPro } from '@/lib/revenuecat';
import { usePaywallContent } from '@/hooks/usePaywallContent';
import { spacing, colors } from '@/theme';

const TERMS_URL = 'https://quietwaters.app/terms';
const PRIVACY_URL = 'https://quietwaters.app/privacy';

export default function PaywallPlans() {
  const router = useRouter();
  const posthog = usePostHog();
  const { variant, content } = usePaywallContent();
  const [offering, setOffering] = useState<PurchasesOffering | null>(null);
  const [plan, setPlan] = useState<'yearly' | 'weekly'>('yearly');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    getCurrentOffering().then(setOffering).catch(() => setOffering(null));
    posthog?.capture('paywall_viewed');
  }, [posthog]);

  const annual = offering?.annual ?? null;
  const weekly = offering?.weekly ?? null;
  const selectedPkg: PurchasesPackage | null = plan === 'yearly' ? annual : weekly;

  const goHome = async () => {
    await setOnboardingComplete();
    router.replace('/home');
  };

  const onPurchase = async () => {
    if (!selectedPkg || busy) return;
    setBusy(true);
    posthog?.capture('paywall_cta_pressed', { plan, variant });
    try {
      const info = await purchasePackage(selectedPkg);
      if (hasPro(info)) await goHome();
    } catch (e: any) {
      if (!e?.userCancelled) posthog?.capture('paywall_purchase_error');
    } finally {
      setBusy(false);
    }
  };

  const onRestore = async () => {
    if (busy) return;
    setBusy(true);
    try {
      const info = await restore();
      if (hasPro(info)) await goHome();
    } catch {
      // no-op: nothing to restore
    } finally {
      setBusy(false);
    }
  };

  return (
    <Screen variant="light">
      <View style={{ flex: 1, paddingTop: spacing.lg, gap: spacing.md }}>
        <ThemedText variant="title" align="center">{content.title}</ThemedText>
        <View style={{ marginVertical: spacing.md }}>
          {content.timeline.map((step, i) => (
            <TimelineStep
              key={i}
              icon={step.icon}
              title={step.title}
              body={step.body}
              isLast={i === content.timeline.length - 1}
            />
          ))}
        </View>
        <PlanCard title="Yearly" priceLabel={annual?.product.priceString ?? '—'} subLabel="Best value" periodLabel="/ year"
          selected={plan === 'yearly'} badge={content.yearlyBadge} onPress={() => setPlan('yearly')} />
        <PlanCard title="Weekly" priceLabel={weekly?.product.priceString ?? '—'} subLabel="Billed weekly" periodLabel="/ week"
          selected={plan === 'weekly'} onPress={() => setPlan('weekly')} />
      </View>
      <View style={{ paddingBottom: spacing.lg, gap: spacing.sm }}>
        <CTAButton label={content.cta} onPress={onPurchase} />
        <View style={{ flexDirection: 'row', justifyContent: 'center', gap: spacing.md }}>
          <Pressable onPress={onRestore}><ThemedText variant="caption" color={colors.textFaint}>Restore Purchases</ThemedText></Pressable>
          <Pressable onPress={() => openBrowserAsync(TERMS_URL)}><ThemedText variant="caption" color={colors.textFaint}>Terms</ThemedText></Pressable>
          <Pressable onPress={() => openBrowserAsync(PRIVACY_URL)}><ThemedText variant="caption" color={colors.textFaint}>Privacy</ThemedText></Pressable>
        </View>
      </View>
    </Screen>
  );
}
