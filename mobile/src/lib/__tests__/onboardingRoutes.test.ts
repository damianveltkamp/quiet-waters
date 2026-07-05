import { ONBOARDING_ROUTES, nextRoute } from '@/lib/onboardingRoutes';

test('has 12 ordered routes', () => {
  expect(ONBOARDING_ROUTES).toHaveLength(12);
  expect(ONBOARDING_ROUTES[0]).toBe('/onboarding/01-aspiration');
});
test('nextRoute returns following route', () => {
  expect(nextRoute('/onboarding/01-aspiration')).toBe('/onboarding/02-problem');
});
test('nextRoute returns null past the end', () => {
  expect(nextRoute('/onboarding/12-paywall-plans')).toBeNull();
});
