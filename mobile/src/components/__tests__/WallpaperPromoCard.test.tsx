import { render, screen, fireEvent } from '@testing-library/react-native';
import { WallpaperPromoCard } from '@/components';
import { tapFeedback } from '@/lib/haptics';

jest.mock('@/lib/haptics', () => ({ tapFeedback: jest.fn() }));

test('renders the promo title', async () => {
  await render(<WallpaperPromoCard onPress={() => {}} />);
  expect(screen.getByText('Create a wallpaper')).toBeOnTheScreen();
});

test('fires haptic and onPress when tapped', async () => {
  const onPress = jest.fn();
  await render(<WallpaperPromoCard onPress={onPress} />);
  fireEvent.press(screen.getByText('Create a wallpaper'));
  expect(tapFeedback).toHaveBeenCalledTimes(1);
  expect(onPress).toHaveBeenCalledTimes(1);
});
