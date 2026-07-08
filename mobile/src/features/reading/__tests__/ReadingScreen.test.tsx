import { render, fireEvent, screen, waitFor, within } from '@testing-library/react-native';
import ReadingScreen from '@/features/reading/ReadingScreen';
import { useReadingStore } from '@/features/reading/readingStore';

const mockPush = jest.fn();
jest.mock('expo-router', () => ({ useRouter: () => ({ push: mockPush }) }));

beforeEach(() => {
  mockPush.mockClear();
  useReadingStore.setState({
    position: { bookCode: 'JHN', chapter: 3, verse: 16 },
    translation: 'KJV',
    fontScale: 1,
    fontFace: 'serif',
  });
});

test('renders the current book, chapter and translation in the chrome', async () => {
  await render(<ReadingScreen />);
  expect(screen.getByText('John')).toBeTruthy();
  // Scoped to the chapter pill: John 3 has a verse 3, whose number renders as its
  // own "3" text node too, so an unscoped getByText('3') is ambiguous against real data.
  expect(within(screen.getByTestId('chrome-chapter')).getByText('3')).toBeTruthy();
  expect(screen.getByText('KJV')).toBeTruthy();
});

test('tapping the book pill opens the book picker; choosing a book opens its chapter picker', async () => {
  await render(<ReadingScreen />);
  await fireEvent.press(screen.getByText('John'));
  await fireEvent.press(screen.getByText('Old Testament'));
  await fireEvent.press(screen.getByText('Genesis'));
  // Chapter picker heading now shows Genesis.
  expect(screen.getByText('Genesis · Chapter')).toBeTruthy();
});

test('long-pressing a verse opens the action menu; Create wallpaper navigates to Create tab', async () => {
  await render(<ReadingScreen />);
  await fireEvent(screen.getByTestId('verse-16'), 'longPress');
  await fireEvent.press(screen.getByText('Create wallpaper'));
  expect(mockPush).toHaveBeenCalledWith('/(tabs)/create');
});

test('next arrow advances to the following chapter in the store', async () => {
  await render(<ReadingScreen />);
  await fireEvent.press(screen.getByTestId('reading-next'));
  expect(useReadingStore.getState().position).toEqual({ bookCode: 'JHN', chapter: 4, verse: 1 });
});
