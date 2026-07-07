import { render, screen, fireEvent, waitFor } from '@testing-library/react-native';
import Create from '@/app/(tabs)/create';

const mockPush = jest.fn();
jest.mock('expo-router', () => ({ useRouter: () => ({ push: mockPush }) }));
jest.mock('@/lib/haptics', () => ({ successFeedback: jest.fn() }));

const mockSave = jest.fn();
jest.mock('@/features/wallpaper/export', () => ({
  saveWallpaperToPhotos: (...args: unknown[]) => mockSave(...args),
}));

beforeEach(() => { mockPush.mockReset(); mockSave.mockReset(); });

test('renders the default verse in the preview', async () => {
  await render(<Create />);
  expect(screen.getByText(/He leads me beside quiet waters\./)).toBeOnTheScreen();
});

test('search pill opens the verse picker route', async () => {
  await render(<Create />);
  await fireEvent.press(screen.getByText('Search a verse'));
  expect(mockPush).toHaveBeenCalledWith('/wallpaper-verse-picker');
});

test('Set as wallpaper saves and shows the toast on success', async () => {
  mockSave.mockResolvedValue('saved');
  await render(<Create />);
  await fireEvent.press(screen.getByText('Set as wallpaper'));
  await waitFor(() => expect(screen.getByText('Wallpaper saved')).toBeOnTheScreen());
});

test('denied permission shows a hint, not the toast', async () => {
  mockSave.mockResolvedValue('denied');
  await render(<Create />);
  await fireEvent.press(screen.getByText('Set as wallpaper'));
  await waitFor(() => expect(screen.getByText(/Enable Photos access/)).toBeOnTheScreen());
  expect(screen.queryByText('Wallpaper saved')).toBeNull();
});

test('save error shows a hint, not the toast', async () => {
  mockSave.mockResolvedValue('error');
  await render(<Create />);
  await fireEvent.press(screen.getByText('Set as wallpaper'));
  await waitFor(() => expect(screen.getByText(/Couldn't save wallpaper/)).toBeOnTheScreen());
  expect(screen.queryByText('Wallpaper saved')).toBeNull();
});
