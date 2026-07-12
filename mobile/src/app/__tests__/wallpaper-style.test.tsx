import { render, screen, fireEvent } from '@testing-library/react-native';
import StyleSheetScreen from '@/app/wallpaper-style';
import { useWallpaperDraft } from '@/features/wallpaper/wallpaperDraft';

const mockBack = jest.fn();
jest.mock('expo-router', () => ({ useRouter: () => ({ back: mockBack }) }));

// @expo/ui Slider is a native component — render a stand-in that exposes its
// value and lets the test drive onValueChange.
jest.mock('@expo/ui', () => {
  const { Pressable } = require('react-native');
  return {
    Slider: ({ value, onValueChange, testID }: { value: number; onValueChange: (v: number) => void; testID?: string }) => (
      <Pressable testID={testID ?? 'slider'} accessibilityValue={{ now: value }} onPress={() => onValueChange(0.8)} />
    ),
  };
});

beforeEach(() => {
  mockBack.mockReset();
  useWallpaperDraft.getState().setTextColor('#FFFFFF');
  useWallpaperDraft.getState().setBackdropOpacity(0.45);
});

test('shows the two section headers and the live percentage', async () => {
  await render(<StyleSheetScreen />);
  expect(screen.getByText('Text Color')).toBeOnTheScreen();
  expect(screen.getByText('Backdrop Opacity')).toBeOnTheScreen();
  expect(screen.getByText('45%')).toBeOnTheScreen();
});

test('tapping a color swatch sets textColor and does not dismiss', async () => {
  await render(<StyleSheetScreen />);
  fireEvent.press(screen.getByLabelText('Text color #1C3344'));
  expect(useWallpaperDraft.getState().textColor).toBe('#1C3344');
  expect(mockBack).not.toHaveBeenCalled();
});

test('changing the slider sets backdropOpacity and updates the percentage', async () => {
  await render(<StyleSheetScreen />);
  await fireEvent.press(screen.getByTestId('backdrop-opacity-slider'));
  expect(useWallpaperDraft.getState().backdropOpacity).toBe(0.8);
  expect(screen.getByText('80%')).toBeOnTheScreen();
});
