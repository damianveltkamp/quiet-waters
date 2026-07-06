import { render, screen, fireEvent, waitFor } from '@testing-library/react-native';

const mockReplace = jest.fn();
jest.mock('expo-router', () => ({ useRouter: () => ({ push: jest.fn(), replace: mockReplace }) }));
jest.mock('@/lib/storage', () => ({ setOnboardingComplete: jest.fn().mockResolvedValue(undefined) }));
jest.mock('expo-web-browser', () => ({ openBrowserAsync: jest.fn() }));
jest.mock('@/hooks/usePaywallContent', () => ({ usePaywallContent: jest.fn() }));

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
import { usePaywallContent } from '@/hooks/usePaywallContent';
import { DEFAULT_PAYWALL_CONTENT } from '@/lib/experiments';
import Plans from '@/app/onboarding/13-paywall-plans';

const contentWith = (overrides = {}) => ({
  variant: 'a',
  content: { ...DEFAULT_PAYWALL_CONTENT, ...overrides },
});

beforeEach(() => {
  jest.clearAllMocks();
  (getCurrentOffering as jest.Mock).mockResolvedValue({ annual, weekly });
  (usePaywallContent as jest.Mock).mockReturnValue(contentWith());
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

test('renders title, CTA, and yearly badge from the payload content', async () => {
  (usePaywallContent as jest.Mock).mockReturnValue(
    contentWith({ title: 'Variant B title', cta: 'Start my free trial', yearlyBadge: 'SAVE 90%' }),
  );
  render(<Plans />);
  await waitFor(() => expect(screen.getByText('Start my free trial')).toBeTruthy());
  expect(screen.getByText('Variant B title')).toBeTruthy();
  expect(screen.getByText('SAVE 90%')).toBeTruthy();
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
