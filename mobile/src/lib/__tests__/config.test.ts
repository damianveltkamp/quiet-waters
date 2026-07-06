import { REVENUECAT_IOS_KEY, POSTHOG_KEY, POSTHOG_HOST } from '@/lib/config';

// Note: in the Jest env, Constants.expoConfig.extra is not populated from app.json,
// so config.ts resolves to its code fallbacks. The real keys live in app.json extra
// and are exercised at runtime, not here. This test pins the module contract + US host default.
test('config exposes publishable values with the US PostHog host default', () => {
  expect(REVENUECAT_IOS_KEY).toBeTruthy();
  expect(POSTHOG_KEY).toMatch(/^phc_/);
  expect(POSTHOG_HOST).toBe('https://us.i.posthog.com');
});
