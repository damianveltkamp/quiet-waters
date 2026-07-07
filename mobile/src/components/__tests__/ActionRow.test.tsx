import { render, screen, fireEvent } from '@testing-library/react-native';
import { ActionRow } from '@/components';
import { tapFeedback } from '@/lib/haptics';

jest.mock('@/lib/haptics', () => ({ tapFeedback: jest.fn() }));

test('renders title and subtitle', async () => {
  await render(<ActionRow icon="cross" title="Prayer" subtitle="A moment to pause and pray" onPress={() => {}} />);
  expect(screen.getByText('Prayer')).toBeOnTheScreen();
  expect(screen.getByText('A moment to pause and pray')).toBeOnTheScreen();
});

test('fires haptic and onPress when tapped', async () => {
  const onPress = jest.fn();
  await render(<ActionRow icon="cross" title="Prayer" subtitle="s" onPress={onPress} />);
  fireEvent.press(screen.getByText('Prayer'));
  expect(tapFeedback).toHaveBeenCalledTimes(1);
  expect(onPress).toHaveBeenCalledTimes(1);
});
