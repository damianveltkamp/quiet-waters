import { render, screen, fireEvent } from '@testing-library/react-native';
import VersePicker from '@/app/wallpaper-verse-picker';
import { useWallpaperDraft } from '@/features/wallpaper/wallpaperDraft';

const mockBack = jest.fn();
jest.mock('expo-router', () => ({ useRouter: () => ({ back: mockBack }) }));

jest.mock('@/features/wallpaper/randomVerse', () => ({
  pickRandomVerse: () => ({ text: 'Surprise verse', reference: 'Acts 1:8' }),
}));

beforeEach(() => mockBack.mockReset());

test('Surprise me sets a random verse and closes', async () => {
  await render(<VersePicker />);
  await fireEvent.press(screen.getByText(/Surprise me/));
  expect(useWallpaperDraft.getState().verse.reference).toBe('Acts 1:8');
  expect(mockBack).toHaveBeenCalled();
});

test('OT/NT toggle filters the book grid', async () => {
  await render(<VersePicker />);
  // Default NT shows Matthew; switch to OT shows Genesis.
  expect(screen.getByText('Matthew')).toBeOnTheScreen();
  await fireEvent.press(screen.getByText('Old Testament'));
  expect(screen.getByText('Genesis')).toBeOnTheScreen();
});

test('drilling book -> chapter -> verse commits a real verse', async () => {
  await render(<VersePicker />);
  await fireEvent.press(screen.getByText('Matthew'));   // step: book -> chapter
  await fireEvent.press(screen.getByText('1'));          // chapter 1 -> step: verse
  await fireEvent.press(screen.getByText('1'));          // verse 1 -> commit
  expect(useWallpaperDraft.getState().verse.reference).toBe('Matthew 1:1');
  expect(mockBack).toHaveBeenCalled();
});

test('search commits a verse by reference', async () => {
  await render(<VersePicker />);
  await fireEvent.changeText(screen.getByPlaceholderText('Search a verse'), 'John 3:16');
  await fireEvent(screen.getByPlaceholderText('Search a verse'), 'submitEditing');
  expect(useWallpaperDraft.getState().verse.reference).toBe('John 3:16');
});

test('invalid search shows not-found feedback and does not close', async () => {
  await render(<VersePicker />);
  await fireEvent.changeText(screen.getByPlaceholderText('Search a verse'), 'Nowhere 9:9');
  await fireEvent(screen.getByPlaceholderText('Search a verse'), 'submitEditing');
  expect(screen.getByText('Verse not found')).toBeOnTheScreen();
  expect(mockBack).not.toHaveBeenCalled();
});

test('Back affordance pops one drill-down step to the book grid', async () => {
  await render(<VersePicker />);
  await fireEvent.press(screen.getByText('Matthew')); // enters chapter step
  await fireEvent.press(screen.getByLabelText('Back'));
  expect(screen.getByText('Matthew')).toBeOnTheScreen(); // book grid is back
});
