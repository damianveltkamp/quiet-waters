export const ONBOARDING_ROUTES = [
  '/onboarding/01-aspiration', '/onboarding/02-problem', '/onboarding/03-question',
  '/onboarding/04-stakes', '/onboarding/05-promise', '/onboarding/06-vow',
  '/onboarding/07-wow', '/onboarding/08-land', '/onboarding/09-permissions',
  '/onboarding/10-paywall-intro', '/onboarding/11-paywall-reminder', '/onboarding/12-paywall-plans',
] as const;

export function nextRoute(current: string): string | null {
  const i = ONBOARDING_ROUTES.indexOf(current as (typeof ONBOARDING_ROUTES)[number]);
  if (i === -1 || i === ONBOARDING_ROUTES.length - 1) return null;
  return ONBOARDING_ROUTES[i + 1];
}
