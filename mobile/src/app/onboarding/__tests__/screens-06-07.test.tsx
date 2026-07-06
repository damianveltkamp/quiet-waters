import { render, screen, fireEvent, act } from '@testing-library/react-native';

const mockPush = jest.fn();
jest.mock('expo-router', () => ({ useRouter: () => ({ push: mockPush }) }));
jest.mock('@/lib/haptics', () => ({ pulseFeedback: jest.fn(), successFeedback: jest.fn() }));
jest.useFakeTimers();

import { useOnboardingStore } from '@/store/onboarding';
import Vow from '@/app/onboarding/06-vow';

test('vow shows calculated hours and advances after full hold', async () => {
  useOnboardingStore.getState().setBucket('4-5');
  await render(<Vow />);
  expect(screen.getByText(/164 hours/i)).toBeOnTheScreen();

  await act(async () => {
    fireEvent(screen.getByTestId('prayer-button'), 'pressIn');
  });
  await act(async () => {
    jest.advanceTimersByTime(3000);
  });

  expect(mockPush).toHaveBeenCalledWith('/onboarding/07-wow');
});
