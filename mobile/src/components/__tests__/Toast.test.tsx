import { render, screen, act } from '@testing-library/react-native';
import { Toast } from '@/components';

test('renders the message when visible', async () => {
  await render(<Toast message="Wallpaper saved" visible onHide={() => {}} />);
  expect(screen.getByText('Wallpaper saved')).toBeOnTheScreen();
});

test('renders nothing when not visible', async () => {
  await render(<Toast message="Wallpaper saved" visible={false} onHide={() => {}} />);
  expect(screen.queryByText('Wallpaper saved')).toBeNull();
});

test('calls onHide after the timeout', async () => {
  jest.useFakeTimers();
  const onHide = jest.fn();
  await render(<Toast message="Wallpaper saved" visible onHide={onHide} />);
  act(() => { jest.advanceTimersByTime(2600); });
  expect(onHide).toHaveBeenCalledTimes(1);
  jest.useRealTimers();
});
