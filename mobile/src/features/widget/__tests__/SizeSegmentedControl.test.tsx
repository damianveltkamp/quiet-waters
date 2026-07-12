import { render, screen, fireEvent } from '@testing-library/react-native';
import { SizeSegmentedControl } from '../SizeSegmentedControl';
import { tapFeedback } from '@/lib/haptics';

jest.mock('@/lib/haptics', () => ({ tapFeedback: jest.fn() }));

test('renders the three size labels', async () => {
  await render(<SizeSegmentedControl value="medium" onChange={() => {}} />);
  expect(screen.getByText('Small')).toBeOnTheScreen();
  expect(screen.getByText('Medium')).toBeOnTheScreen();
  expect(screen.getByText('Large')).toBeOnTheScreen();
});

test('tapping a segment fires haptic and onChange with that family', async () => {
  const onChange = jest.fn();
  await render(<SizeSegmentedControl value="medium" onChange={onChange} />);
  fireEvent.press(screen.getByText('Large'));
  expect(tapFeedback).toHaveBeenCalledTimes(1);
  expect(onChange).toHaveBeenCalledWith('large');
});
