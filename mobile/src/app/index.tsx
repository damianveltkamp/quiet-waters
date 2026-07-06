import { Redirect } from 'expo-router';
import { useEffect, useState } from 'react';
import { usePostHog } from 'posthog-react-native';
import { isOnboardingComplete } from '@/lib/storage';
import { getAppUserId, getCustomerInfo, hasPro, initPurchases } from '@/lib/revenuecat';

type Target = '/home' | '/onboarding/10-paywall-intro' | '/onboarding/01-aspiration';

export default function Index() {
  const posthog = usePostHog();
  const [target, setTarget] = useState<Target | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      let next: Target = '/onboarding/01-aspiration';
      try {
        initPurchases(null);
        const appUserId = await getAppUserId();
        posthog?.identify(appUserId);
        const info = await getCustomerInfo();
        if (hasPro(info)) {
          next = '/home';
        } else if (await isOnboardingComplete()) {
          next = '/onboarding/10-paywall-intro';
        }
      } catch {
        // fail open into the onboarding funnel; /home stays entitlement-gated
        let complete = false;
        try {
          complete = await isOnboardingComplete();
        } catch {
          complete = false;
        }
        next = complete ? '/onboarding/10-paywall-intro' : '/onboarding/01-aspiration';
      }
      if (!cancelled) setTarget(next);
    })();
    return () => {
      cancelled = true;
    };
  }, [posthog]);

  if (target === null) return null;
  return <Redirect href={target} />;
}
