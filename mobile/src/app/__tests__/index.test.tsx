import { render, waitFor } from '@testing-library/react-native';

const mockRedirect = jest.fn((_props: unknown) => null);
jest.mock('expo-router', () => ({ Redirect: (props: any) => mockRedirect(props) }));
jest.mock('@/lib/storage', () => ({ isOnboardingComplete: jest.fn() }));
jest.mock('@/lib/revenuecat', () => ({
  initPurchases: jest.fn(),
  getAppUserId: jest.fn().mockResolvedValue('anon-1'),
  getCustomerInfo: jest.fn(),
  hasPro: jest.fn(),
}));

import { isOnboardingComplete } from '@/lib/storage';
import { getCustomerInfo, hasPro, initPurchases } from '@/lib/revenuecat';
import Index from '@/app/index';

beforeEach(() => {
  jest.clearAllMocks();
  (getCustomerInfo as jest.Mock).mockResolvedValue({ entitlements: { active: {} } });
});

test('routes to /home when the pro entitlement is active', async () => {
  (hasPro as jest.Mock).mockReturnValue(true);
  render(<Index />);
  await waitFor(() => expect(mockRedirect).toHaveBeenCalledWith({ href: '/home' }));
  expect(initPurchases).toHaveBeenCalled();
});

test('routes to the paywall intro when onboarding is done but no entitlement', async () => {
  (hasPro as jest.Mock).mockReturnValue(false);
  (isOnboardingComplete as jest.Mock).mockResolvedValue(true);
  render(<Index />);
  await waitFor(() =>
    expect(mockRedirect).toHaveBeenCalledWith({ href: '/onboarding/11-paywall-intro' }),
  );
});

test('routes to onboarding start for a fresh user', async () => {
  (hasPro as jest.Mock).mockReturnValue(false);
  (isOnboardingComplete as jest.Mock).mockResolvedValue(false);
  render(<Index />);
  await waitFor(() =>
    expect(mockRedirect).toHaveBeenCalledWith({ href: '/onboarding/01-aspiration' }),
  );
});

test('fails open to onboarding start when getCustomerInfo rejects and onboarding is incomplete', async () => {
  (getCustomerInfo as jest.Mock).mockRejectedValue(new Error('network error'));
  (isOnboardingComplete as jest.Mock).mockResolvedValue(false);
  render(<Index />);
  await waitFor(() =>
    expect(mockRedirect).toHaveBeenCalledWith({ href: '/onboarding/01-aspiration' }),
  );
  expect(mockRedirect).not.toHaveBeenCalledWith({ href: '/home' });
});

test('fails open to paywall intro when getCustomerInfo rejects and onboarding is complete', async () => {
  (getCustomerInfo as jest.Mock).mockRejectedValue(new Error('network error'));
  (isOnboardingComplete as jest.Mock).mockResolvedValue(true);
  render(<Index />);
  await waitFor(() =>
    expect(mockRedirect).toHaveBeenCalledWith({ href: '/onboarding/11-paywall-intro' }),
  );
  expect(mockRedirect).not.toHaveBeenCalledWith({ href: '/home' });
});
