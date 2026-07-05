import { render, screen, fireEvent, waitFor } from '@testing-library/react-native';

const mockReplace = jest.fn();
jest.mock('expo-router', () => ({ useRouter: () => ({ push: jest.fn(), replace: mockReplace }) }));
jest.mock('@/lib/storage', () => ({ setOnboardingComplete: jest.fn().mockResolvedValue(undefined) }));

import { setOnboardingComplete } from '@/lib/storage';
import Plans from '@/app/onboarding/12-paywall-plans';

test('completing paywall persists flag and routes home', async () => {
  await render(<Plans />);
  fireEvent.press(screen.getByText('Try for FREE'));
  await waitFor(() => {
    expect(setOnboardingComplete).toHaveBeenCalled();
    expect(mockReplace).toHaveBeenCalledWith('/home');
  });
});

test('yearly plan is selected by default', async () => {
  await render(<Plans />);
  expect(screen.getByTestId('plan-card-yearly').props.accessibilityState.selected).toBe(true);
  expect(screen.getByTestId('plan-card-weekly').props.accessibilityState.selected).toBe(false);
});

test('pressing weekly plan toggles selection to weekly', async () => {
  await render(<Plans />);
  fireEvent.press(screen.getByTestId('plan-card-weekly'));
  await waitFor(() => {
    expect(screen.getByTestId('plan-card-weekly').props.accessibilityState.selected).toBe(true);
    expect(screen.getByTestId('plan-card-yearly').props.accessibilityState.selected).toBe(false);
  });
});
