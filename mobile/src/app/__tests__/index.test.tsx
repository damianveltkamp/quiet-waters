import { render } from '@testing-library/react-native';

import Index from '@/app/index';
import { isOnboardingComplete } from '@/lib/storage';

jest.mock('@/lib/storage', () => ({
  isOnboardingComplete: jest.fn(),
}));

jest.mock('expo-router', () => ({
  Redirect: ({ href }: { href: string }) => {
    const { Text } = require('react-native');
    return <Text>{`redirect:${href}`}</Text>;
  },
}));

describe('Index', () => {
  it('redirects to onboarding when not complete', async () => {
    (isOnboardingComplete as jest.Mock).mockResolvedValue(false);
    const { findByText } = await render(<Index />);
    expect(await findByText('redirect:/onboarding/01-aspiration')).toBeTruthy();
  });

  it('redirects to home when complete', async () => {
    (isOnboardingComplete as jest.Mock).mockResolvedValue(true);
    const { findByText } = await render(<Index />);
    expect(await findByText('redirect:/home')).toBeTruthy();
  });
});
