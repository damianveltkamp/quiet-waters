import { render, screen } from '@testing-library/react-native';

const mockPush = jest.fn();
jest.mock('expo-router', () => ({ useRouter: () => ({ push: mockPush }) }));

import Home from '@/app/(tabs)/home';

test('shows a time-based greeting', async () => {
  await render(<Home />);
  expect(screen.getByText(/Good (morning|afternoon|evening)/)).toBeOnTheScreen();
});

test('shows the verse of the day reference', async () => {
  await render(<Home />);
  expect(screen.getByText('Psalm 118:24')).toBeOnTheScreen();
});
