import { render, screen, fireEvent, act } from '@testing-library/react-native';
import { PrayerButton } from '@/components';
import { pulseFeedback, successFeedback } from '@/lib/haptics';

jest.mock('@/lib/haptics', () => ({ pulseFeedback: jest.fn(), successFeedback: jest.fn() }));
jest.useFakeTimers();

test('pulses every second and completes after hold duration', async () => {
  const onComplete = jest.fn();
  await render(<PrayerButton onComplete={onComplete} holdDurationMs={3000} />);
  const btn = screen.getByTestId('prayer-button');

  await act(() => { fireEvent(btn, 'pressIn'); });
  expect(pulseFeedback).toHaveBeenCalledTimes(1); // immediate pulse

  await act(() => { jest.advanceTimersByTime(1000); });
  await act(() => { jest.advanceTimersByTime(1000); });
  expect(pulseFeedback).toHaveBeenCalledTimes(3); // t0 + 1s + 2s

  await act(() => { jest.advanceTimersByTime(1000); });
  expect(successFeedback).toHaveBeenCalledTimes(1);
  expect(onComplete).toHaveBeenCalledTimes(1);
});
