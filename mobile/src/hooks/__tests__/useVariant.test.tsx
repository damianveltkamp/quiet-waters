import { Text } from 'react-native';
import { render, screen } from '@testing-library/react-native';
import { useFeatureFlag } from 'posthog-react-native';
import { useVariant } from '@/hooks/useVariant';

jest.mock('posthog-react-native', () => ({
  useFeatureFlag: jest.fn(),
}));

const Probe = () => <Text>{useVariant('aspiration-headline')}</Text>;

beforeEach(() => {
  jest.clearAllMocks();
});

test('returns the default when the flag is undefined', async () => {
  (useFeatureFlag as jest.Mock).mockReturnValue(undefined);
  await render(<Probe />);
  expect(screen.getByText('control')).toBeOnTheScreen();
});

test('returns the flag value when it is a declared variant', async () => {
  (useFeatureFlag as jest.Mock).mockReturnValue('v2');
  await render(<Probe />);
  expect(screen.getByText('v2')).toBeOnTheScreen();
});

test('falls back to default when the flag value is not a declared variant', async () => {
  (useFeatureFlag as jest.Mock).mockReturnValue('garbage');
  await render(<Probe />);
  expect(screen.getByText('control')).toBeOnTheScreen();
});
