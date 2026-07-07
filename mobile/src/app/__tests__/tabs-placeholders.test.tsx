import { render, screen } from '@testing-library/react-native';

const mockBack = jest.fn();
jest.mock('expo-router', () => ({ useRouter: () => ({ back: mockBack }) }));

import Create from '@/app/(tabs)/create';
import You from '@/app/(tabs)/you';
import Prayer from '@/app/prayer';

test('Create screen renders its placeholder', async () => {
  await render(<Create />);
  expect(screen.getByText('Create a wallpaper')).toBeOnTheScreen();
});

test('You screen renders its heading', async () => {
  await render(<You />);
  expect(screen.getByText('Your space')).toBeOnTheScreen();
});

test('Prayer screen renders a close affordance', async () => {
  await render(<Prayer />);
  expect(screen.getByText('Close')).toBeOnTheScreen();
});
