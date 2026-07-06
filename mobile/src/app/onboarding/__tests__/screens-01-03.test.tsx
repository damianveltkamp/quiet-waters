import { render, screen, fireEvent } from '@testing-library/react-native';

import Aspiration from '@/app/onboarding/01-aspiration';
import Reflection from '@/app/onboarding/02-reflection';
import Problem from '@/app/onboarding/03-problem';
import { useVariant } from '@/hooks/useVariant';

jest.mock('expo-router', () => ({
  router: { push: jest.fn() },
  useRouter: () => ({ push: jest.fn() }),
}));

jest.mock('@/hooks/useVariant', () => ({ useVariant: jest.fn(() => 'control') }));

describe('screen 1: Aspiration', () => {
  it('shows headline and advances', async () => {
    await render(<Aspiration />);
    expect(screen.getAllByText(/closer to God/i).length).toBeGreaterThan(0);
    fireEvent.press(screen.getByText('Begin your journey'));
  });
});

describe('screen 2: Reflection', () => {
  it('shows the reflection prompt and advances', async () => {
    await render(<Reflection />);
    expect(screen.getByText(/attention than God/i)).toBeOnTheScreen();
    fireEvent.press(screen.getByText('Yes, I feel that'));
  });
});

describe('screen 3: Problem', () => {
  it('shows the screen time figures and advances', async () => {
    await render(<Problem />);
    expect(screen.getByText('4')).toBeOnTheScreen();
    expect(screen.getByText('61')).toBeOnTheScreen();
    fireEvent.press(screen.getByText('I want that'));
  });
});

describe('screen 1: Aspiration headline A/B variant', () => {
  test('aspiration shows the control headline by default', async () => {
    (useVariant as jest.Mock).mockReturnValue('control');
    await render(<Aspiration />);
    expect(screen.getByText('You want to feel\ncloser to God.')).toBeTruthy();
  });

  test('aspiration shows the v2 headline when assigned', async () => {
    (useVariant as jest.Mock).mockReturnValue('v2');
    await render(<Aspiration />);
    expect(screen.getByText(/Draw nearer to God/)).toBeTruthy();
  });
});
