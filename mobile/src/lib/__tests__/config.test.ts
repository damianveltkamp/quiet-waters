import { REVENUECAT_IOS_KEY, POSTHOG_KEY, POSTHOG_HOST } from '@/lib/config';

test('config exposes non-empty publishable values with EU host default', () => {
  expect(REVENUECAT_IOS_KEY).toMatch(/^appl_/);
  expect(POSTHOG_KEY).toMatch(/^phc_/);
  expect(POSTHOG_HOST).toBe('https://eu.i.posthog.com');
});
