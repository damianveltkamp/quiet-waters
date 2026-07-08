import { render, screen } from '@testing-library/react-native';
import Read from '@/app/(tabs)/read';
import { useReadingStore } from '@/features/reading/readingStore';

jest.mock('expo-router', () => ({ useRouter: () => ({ push: jest.fn() }) }));

test('Read route renders the reading screen with the current book', async () => {
  useReadingStore.setState({
    position: { bookCode: 'PSA', chapter: 23, verse: 1 },
    translation: 'KJV',
    fontScale: 1,
    fontFace: 'serif',
  });
  await render(<Read />);
  expect(screen.getByText('Psalms')).toBeTruthy();
});
