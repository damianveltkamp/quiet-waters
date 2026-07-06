import { render, screen } from '@testing-library/react-native';

const mockPush = jest.fn();
jest.mock('expo-router', () => ({ useRouter: () => ({ push: mockPush }) }));

import Wow from '@/app/onboarding/08-wow';
import Land from '@/app/onboarding/09-land';

test('wow shows creator placeholder', async () => {
  await render(<Wow />);
  expect(screen.getByText('Wallpaper Creator')).toBeOnTheScreen();
});
test('land shows ready pill', async () => {
  await render(<Land />);
  expect(screen.getByText(/waiting for you/i)).toBeOnTheScreen();
});
