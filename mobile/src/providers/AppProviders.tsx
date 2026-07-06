import { PostHog, PostHogProvider } from 'posthog-react-native';
import { useMemo, type ReactNode } from 'react';
import { POSTHOG_KEY, POSTHOG_HOST } from '@/lib/config';
import { bootstrapFlags } from '@/lib/experiments';

export function AppProviders({ children }: { children: ReactNode }) {
  const client = useMemo(
    () =>
      new PostHog(POSTHOG_KEY, {
        host: POSTHOG_HOST,
        bootstrap: { featureFlags: bootstrapFlags },
      }),
    [],
  );

  return (
    <PostHogProvider client={client} autocapture debug={__DEV__}>
      {children}
    </PostHogProvider>
  );
}
