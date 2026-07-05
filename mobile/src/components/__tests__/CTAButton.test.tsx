import { render, screen, fireEvent } from '@testing-library/react-native';
import { CTAButton } from '@/components';
import { tapFeedback } from '@/lib/haptics';

jest.mock('@/lib/haptics', () => ({ tapFeedback: jest.fn() }));

test('fires haptic and onPress when pressed', async () => {
  const onPress = jest.fn();
  await render(<CTAButton label="Continue" onPress={onPress} />);
  fireEvent.press(screen.getByText('Continue'));
  expect(tapFeedback).toHaveBeenCalledTimes(1);
  expect(onPress).toHaveBeenCalledTimes(1);
});
