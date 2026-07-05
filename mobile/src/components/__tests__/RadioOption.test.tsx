import { render, screen, fireEvent } from '@testing-library/react-native';
import { RadioOption } from '@/components';

test('calls onPress with its label region', async () => {
  const onPress = jest.fn();
  await render(<RadioOption label="4-5 hours" selected={false} onPress={onPress} />);
  fireEvent.press(screen.getByText('4-5 hours'));
  expect(onPress).toHaveBeenCalledTimes(1);
});

test('renders selected state', async () => {
  await render(<RadioOption label="4-5 hours" selected onPress={() => {}} />);
  expect(screen.getByText('4-5 hours')).toBeOnTheScreen();
});
