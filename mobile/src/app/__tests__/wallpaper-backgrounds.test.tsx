import { render, screen, fireEvent } from '@testing-library/react-native';
import BackgroundsSheet from '@/app/wallpaper-backgrounds';
import { useWallpaperDraft } from '@/features/wallpaper/wallpaperDraft';
import { BACKGROUNDS } from '@/features/wallpaper/backgrounds';

const mockBack = jest.fn();
jest.mock('expo-router', () => ({ useRouter: () => ({ back: mockBack }) }));

beforeEach(() => {
  mockBack.mockReset();
  useWallpaperDraft.getState().setBackground(useWallpaperDraft.getState().background); // reset to current
});

test('lists all preset names', async () => {
  await render(<BackgroundsSheet />);
  expect(screen.getByText('Deep Night')).toBeOnTheScreen();
  expect(screen.getByText('Horizon')).toBeOnTheScreen();
});

test('tapping a swatch updates the draft background', async () => {
  await render(<BackgroundsSheet />);
  fireEvent.press(screen.getByText('Horizon'));
  expect(useWallpaperDraft.getState().background.name).toBe('Horizon');
});

test('shows the Colors and Images section headers', async () => {
  await render(<BackgroundsSheet />);
  expect(screen.getByText('Colors')).toBeOnTheScreen();
  expect(screen.getByText('Images')).toBeOnTheScreen();
});

test('tapping an image thumbnail updates the draft background', async () => {
  const image = BACKGROUNDS.find((b) => b.kind === 'image')!;
  await render(<BackgroundsSheet />);
  fireEvent.press(screen.getByLabelText(`Background ${image.name}`));
  expect(useWallpaperDraft.getState().background.id).toBe(image.id);
});
