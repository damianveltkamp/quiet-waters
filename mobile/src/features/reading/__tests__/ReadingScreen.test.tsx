import { act, render, fireEvent, screen, waitFor, within } from '@testing-library/react-native';
import ReadingScreen from '@/features/reading/ReadingScreen';
import { useReadingStore } from '@/features/reading/readingStore';

const mockPush = jest.fn();
jest.mock('expo-router', () => {
  const React = require('react');
  return {
    useRouter: () => ({ push: mockPush }),
    // Simulate the screen gaining focus on mount, so lift-on-entry runs in tests.
    useFocusEffect: (cb: () => void) => React.useEffect(cb, []),
  };
});

beforeEach(() => {
  mockPush.mockClear();
  useReadingStore.setState({
    position: { bookCode: 'JHN', chapter: 3, verse: 16 },
    translation: 'KJV',
    fontScale: 1,
    fontFace: 'serif',
  });
});

afterEach(() => {
  jest.useRealTimers();
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

test('debounced scroll save resolves to the topmost visible verse after layout', async () => {
  // Capture the debounce timer instead of globally faking timers: full fake-timer mode
  // interferes with React Native's scheduler across subsequent tests in this file.
  const timeoutSpy = jest.spyOn(globalThis, 'setTimeout');
  await render(<ReadingScreen />);

  // Lay out several verses at distinct y offsets.
  await fireEvent(screen.getByTestId('verse-14'), 'layout', { nativeEvent: { layout: { y: 0 } } });
  await fireEvent(screen.getByTestId('verse-15'), 'layout', { nativeEvent: { layout: { y: 100 } } });
  await fireEvent(screen.getByTestId('verse-16'), 'layout', { nativeEvent: { layout: { y: 200 } } });
  await fireEvent(screen.getByTestId('verse-17'), 'layout', { nativeEvent: { layout: { y: 300 } } });

  // Scroll so verse-16 (y=200) is the topmost visible verse.
  await fireEvent(screen.getByTestId('reading-scroll'), 'scroll', {
    nativeEvent: { contentOffset: { y: 210 } },
  });

  const debounceCall = timeoutSpy.mock.calls.find((call) => call[1] === 400);
  expect(debounceCall).toBeTruthy();
  await act(async () => { (debounceCall![0] as () => void)(); });

  expect(useReadingStore.getState().position.verse).toBe(16);
  timeoutSpy.mockRestore();
});

const isLifted = (n: number) =>
  screen.getByTestId(`verse-${n}`).props.accessibilityState?.selected === true;

test('does not re-lift a verse when turning to a new chapter', async () => {
  await render(<ReadingScreen />);

  // Entered at JHN 3:16 — the saved verse is lifted to help find the place.
  expect(isLifted(16)).toBe(true);

  // Turning to the next chapter is not "landing on the screen": nothing lifts.
  await fireEvent.press(screen.getByTestId('reading-next')); // -> John 4
  expect(isLifted(1)).toBe(false);
  expect(isLifted(16)).toBe(false);
});

test('lift on entry survives a programmatic scroll but clears once the user starts dragging', async () => {
  await render(<ReadingScreen />);

  // Entered at verse 16 (the saved position) — it should render lifted.
  expect(isLifted(16)).toBe(true);

  // A programmatic scroll event (e.g. the entry scroll-to-verse) must not clear the lift.
  await fireEvent(screen.getByTestId('reading-scroll'), 'scroll', {
    nativeEvent: { contentOffset: { y: 50 } },
  });
  expect(isLifted(16)).toBe(true);

  // A genuine user drag clears the lift.
  await fireEvent(screen.getByTestId('reading-scroll'), 'scrollBeginDrag', {
    nativeEvent: { contentOffset: { y: 50 } },
  });
  expect(isLifted(16)).toBe(false);
});
