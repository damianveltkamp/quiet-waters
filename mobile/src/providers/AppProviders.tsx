import { PostHog, PostHogProvider } from 'posthog-react-native';
import { useMemo, type ReactNode } from 'react';
import { POSTHOG_KEY, POSTHOG_HOST } from '@/lib/config';
import { bootstrapFlags, bootstrapPayloads } from '@/lib/experiments';

export function AppProviders({ children }: { children: ReactNode }) {
  const client = useMemo(() => {
    const posthog = new PostHog(POSTHOG_KEY, {
      host: POSTHOG_HOST,
      bootstrap: { featureFlags: bootstrapFlags, featureFlagPayloads: bootstrapPayloads },
    });
    // Stamp every event so production dashboards can exclude non-production data.
    // __DEV__ is true only for local Metro dev builds; release/TestFlight/App Store are 'production'.
    posthog.register({ environment: __DEV__ ? 'development' : 'production' });
    return posthog;
  }, []);

  return (
    <PostHogProvider client={client} autocapture>
      {children}
    </PostHogProvider>
  );
}
