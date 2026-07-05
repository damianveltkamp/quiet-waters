import { render, screen, fireEvent, act } from '@testing-library/react-native';
import { PrayerButton } from '@/components';

jest.mock('@/lib/haptics', () => ({ pulseFeedback: jest.fn(), successFeedback: jest.fn() }));
jest.useFakeTimers();

test('early release cancels without completing', async () => {
  const onComplete = jest.fn();
  await render(<PrayerButton onComplete={onComplete} holdDurationMs={3000} />);
  const btn = screen.getByTestId('prayer-button');
  await act(() => { fireEvent(btn, 'pressIn'); });
  await act(() => { jest.advanceTimersByTime(1000); });
  await act(() => { fireEvent(btn, 'pressOut'); });
  await act(() => { jest.advanceTimersByTime(5000); });
  expect(onComplete).not.toHaveBeenCalled();
});
