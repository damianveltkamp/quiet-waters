import { render, screen, fireEvent, waitFor } from '@testing-library/react-native';

const mockReplace = jest.fn();
jest.mock('expo-router', () => ({ useRouter: () => ({ push: jest.fn(), replace: mockReplace }) }));
jest.mock('@/lib/storage', () => ({ setOnboardingComplete: jest.fn().mockResolvedValue(undefined) }));
jest.mock('expo-web-browser', () => ({ openBrowserAsync: jest.fn() }));
jest.mock('@/hooks/useVariant', () => ({ useVariant: jest.fn(() => 'try_free') }));

const annual = { product: { priceString: '$59.99' } };
const weekly = { product: { priceString: '$4.99' } };
jest.mock('@/lib/revenuecat', () => ({
  getCurrentOffering: jest.fn().mockResolvedValue({ annual, weekly }),
  purchasePackage: jest.fn(),
  restore: jest.fn(),
  hasPro: jest.fn(),
}));

import { setOnboardingComplete } from '@/lib/storage';
import { getCurrentOffering, purchasePackage, restore, hasPro } from '@/lib/revenuecat';
import { useVariant } from '@/hooks/useVariant';
import Plans from '@/app/onboarding/12-paywall-plans';

beforeEach(() => {
  jest.clearAllMocks();
  (getCurrentOffering as jest.Mock).mockResolvedValue({ annual, weekly });
  (useVariant as jest.Mock).mockReturnValue('try_free');
});

test('renders localized prices from the current offering', async () => {
  render(<Plans />);
  await waitFor(() => expect(screen.getByText('$59.99')).toBeTruthy());
  expect(screen.getByText('$4.99')).toBeTruthy();
});

test('yearly plan is selected by default', async () => {
  render(<Plans />);
  await waitFor(() => expect(screen.getByTestId('plan-card-yearly')).toBeTruthy());
  expect(screen.getByTestId('plan-card-yearly').props.accessibilityState.selected).toBe(true);
});

test('CTA copy follows the paywall-cta variant', async () => {
  (useVariant as jest.Mock).mockReturnValue('start_trial');
  render(<Plans />);
  await waitFor(() => expect(screen.getByText('Start my free trial')).toBeTruthy());
});

test('successful purchase persists flag and routes home', async () => {
  (purchasePackage as jest.Mock).mockResolvedValue({ entitlements: { active: { pro: {} } } });
  (hasPro as jest.Mock).mockReturnValue(true);
  render(<Plans />);
  await waitFor(() => expect(screen.getByText('Try for FREE')).toBeTruthy());
  fireEvent.press(screen.getByText('Try for FREE'));
  await waitFor(() => {
    expect(purchasePackage).toHaveBeenCalledWith(annual);
    expect(setOnboardingComplete).toHaveBeenCalled();
    expect(mockReplace).toHaveBeenCalledWith('/home');
  });
});

test('cancelled purchase does not route home', async () => {
  (purchasePackage as jest.Mock).mockRejectedValue({ userCancelled: true });
  render(<Plans />);
  await waitFor(() => expect(screen.getByText('Try for FREE')).toBeTruthy());
  fireEvent.press(screen.getByText('Try for FREE'));
  await waitFor(() => expect(purchasePackage).toHaveBeenCalled());
  expect(mockReplace).not.toHaveBeenCalled();
  expect(setOnboardingComplete).not.toHaveBeenCalled();
});

test('restore routes home when it yields the pro entitlement', async () => {
  (restore as jest.Mock).mockResolvedValue({ entitlements: { active: { pro: {} } } });
  (hasPro as jest.Mock).mockReturnValue(true);
  render(<Plans />);
  await waitFor(() => expect(screen.getByText('Restore Purchases')).toBeTruthy());
  fireEvent.press(screen.getByText('Restore Purchases'));
  await waitFor(() => expect(mockReplace).toHaveBeenCalledWith('/home'));
});
