import { render, screen, fireEvent } from '@testing-library/react-native';

import Aspiration from '@/app/onboarding/01-aspiration';
import Problem from '@/app/onboarding/02-problem';

jest.mock('expo-router', () => ({
  router: { push: jest.fn() },
  useRouter: () => ({ push: jest.fn() }),
}));

describe('screen 1: Aspiration', () => {
  it('shows headline and advances', async () => {
    await render(<Aspiration />);
    expect(screen.getAllByText(/closer to God/i).length).toBeGreaterThan(0);
    fireEvent.press(screen.getByText('Begin your journey'));
  });
});

describe('screen 2: Problem', () => {
  it('shows the screen time card and advances', async () => {
    await render(<Problem />);
    expect(screen.getByText('4h+')).toBeOnTheScreen();
    fireEvent.press(screen.getByText('I want that'));
  });
});
