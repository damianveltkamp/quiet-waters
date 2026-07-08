import { useReadingStore } from '@/features/reading/readingStore';

const reset = () =>
  useReadingStore.setState({
    position: { bookCode: 'JHN', chapter: 1, verse: 1 },
    translation: 'KJV',
    fontScale: 1,
    fontFace: 'serif',
  });

beforeEach(reset);

test('defaults to John 1:1 / KJV / serif / scale 1', () => {
  const s = useReadingStore.getState();
  expect(s.position).toEqual({ bookCode: 'JHN', chapter: 1, verse: 1 });
  expect(s.translation).toBe('KJV');
  expect(s.fontFace).toBe('serif');
  expect(s.fontScale).toBe(1);
});

test('openChapter sets the chapter and resets verse to 1', () => {
  useReadingStore.getState().setVerse(9);
  useReadingStore.getState().openChapter('PSA', 23);
  expect(useReadingStore.getState().position).toEqual({ bookCode: 'PSA', chapter: 23, verse: 1 });
});

test('setVerse updates only the verse', () => {
  useReadingStore.getState().setVerse(14);
  expect(useReadingStore.getState().position).toEqual({ bookCode: 'JHN', chapter: 1, verse: 14 });
});

test('setTranslation, setFontFace, setFontScale update state', () => {
  useReadingStore.getState().setTranslation('BSB');
  useReadingStore.getState().setFontFace('sans');
  useReadingStore.getState().setFontScale(1.25);
  const s = useReadingStore.getState();
  expect(s.translation).toBe('BSB');
  expect(s.fontFace).toBe('sans');
  expect(s.fontScale).toBe(1.25);
});
