import { render, screen, fireEvent } from '@testing-library/react-native';
import Promise_ from '@/app/onboarding/05-promise';

const mockPush = jest.fn();
jest.mock('expo-router', () => ({ useRouter: () => ({ push: mockPush }) }));

test('promise screen renders and CTA navigates to vow screen', async () => {
  await render(<Promise_ />);
  expect(screen.getByText(/Meet His Word/i)).toBeOnTheScreen();
  fireEvent.press(screen.getByText('See how it works'));
  expect(mockPush).toHaveBeenCalledWith('/onboarding/06-vow');
});
