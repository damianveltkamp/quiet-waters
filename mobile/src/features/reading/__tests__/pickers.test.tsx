import { render, fireEvent, screen } from '@testing-library/react-native';
import BookPickerOverlay from '@/features/reading/BookPickerOverlay';
import ChapterPickerOverlay from '@/features/reading/ChapterPickerOverlay';

test('book picker defaults to New Testament and selects a book', async () => {
  const onSelect = jest.fn();
  await render(<BookPickerOverlay onSelectBook={onSelect} />);
  fireEvent.press(screen.getByText('Matthew'));
  expect(onSelect).toHaveBeenCalledWith('MAT');
});

test('book picker Old Testament toggle reveals OT books', async () => {
  const onSelect = jest.fn();
  await render(<BookPickerOverlay onSelectBook={onSelect} />);
  await fireEvent.press(screen.getByText('Old Testament'));
  fireEvent.press(screen.getByText('Genesis'));
  expect(onSelect).toHaveBeenCalledWith('GEN');
});

test('chapter picker renders chapters and selects one', async () => {
  const onSelect = jest.fn();
  await render(
    <ChapterPickerOverlay
      bookCode="MAT"
      bookName="Matthew"
      chapterCount={28}
      currentChapter={11}
      onSelectChapter={onSelect}
    />,
  );
  fireEvent.press(screen.getByText('12'));
  expect(onSelect).toHaveBeenCalledWith(12);
});
