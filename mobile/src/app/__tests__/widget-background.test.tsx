import { render, screen } from '@testing-library/react-native';
import WidgetBackgroundScreen from '@/app/widget-background';
import { BACKGROUNDS } from '@/features/wallpaper/backgrounds';

jest.mock('expo-router', () => ({ useRouter: () => ({ back: jest.fn() }) }));

test('shows only gradient backgrounds, no image scenes', async () => {
  await render(<WidgetBackgroundScreen />);
  expect(screen.getByText('Still Water')).toBeOnTheScreen();
  const firstImage = BACKGROUNDS.find((b) => b.kind === 'image')!;
  expect(screen.queryByText(firstImage.name)).toBeNull();
});
