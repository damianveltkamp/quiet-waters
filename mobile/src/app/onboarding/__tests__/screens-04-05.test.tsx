import { render, screen, fireEvent } from '@testing-library/react-native';
import { useOnboardingStore } from '@/store/onboarding';
import Question from '@/app/onboarding/04-question';
import Stakes from '@/app/onboarding/05-stakes';

jest.mock('expo-router', () => ({ useRouter: () => ({ push: jest.fn() }) }));

test('selecting a bucket updates the store', async () => {
  await render(<Question />);
  fireEvent.press(screen.getByText('7+ hours'));
  expect(useOnboardingStore.getState().bucket).toBe('7+');
});
test('stakes screen shows calculated hours for current bucket', async () => {
  useOnboardingStore.getState().setBucket('4-5');
  await render(<Stakes />);
  expect(screen.getByText('1,642')).toBeOnTheScreen();
  expect(screen.getByText(/68 full days/i)).toBeOnTheScreen();
});
