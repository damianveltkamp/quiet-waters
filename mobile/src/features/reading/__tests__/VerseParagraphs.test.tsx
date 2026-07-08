import { render, fireEvent, screen } from '@testing-library/react-native';
import VerseParagraphs, { topVisibleVerse } from '@/features/reading/VerseParagraphs';

const verses = [
  { number: 27, text: 'All things are delivered unto me of my Father.' },
  { number: 28, text: 'Come unto me, all ye that labour and are heavy laden.' },
  { number: 29, text: 'Take my yoke upon you, and learn of me.' },
];

test('topVisibleVerse picks the last verse at or above the scroll offset', () => {
  const offsets = [
    { number: 27, y: 0 },
    { number: 28, y: 120 },
    { number: 29, y: 260 },
  ];
  expect(topVisibleVerse(offsets, 0)).toBe(27);
  expect(topVisibleVerse(offsets, 130)).toBe(28);
  expect(topVisibleVerse(offsets, 400)).toBe(29);
});

test('topVisibleVerse defaults to the first verse when scrolled above content', () => {
  expect(topVisibleVerse([{ number: 5, y: 0 }], -50)).toBe(5);
  expect(topVisibleVerse([], 100)).toBe(1);
});

test('renders every verse number and text', async () => {
  await render(
    <VerseParagraphs
      verses={verses}
      liftedVerse={28}
      fontFace="serif"
      fontScale={1}
      onLongPressVerse={() => {}}
      onVerseLayout={() => {}}
    />,
  );
  expect(screen.getByText(/Come unto me/)).toBeTruthy();
  expect(screen.getByText('28')).toBeTruthy();
});

test('lifted and non-lifted verses share the same box geometry (no layout shift)', async () => {
  await render(
    <VerseParagraphs
      verses={verses}
      liftedVerse={28}
      fontFace="serif"
      fontScale={1}
      onLongPressVerse={() => {}}
      onVerseLayout={() => {}}
    />,
  );
  const flat = (id: string) => {
    const style = screen.getByTestId(id).props.style;
    return Array.isArray(style) ? Object.assign({}, ...style) : style;
  };
  const lifted = flat('verse-28'); // the lifted verse
  const plain = flat('verse-27'); // a normal verse
  // Layout-affecting props are identical, so toggling the lift causes no reflow.
  expect(lifted.paddingVertical).toBe(plain.paddingVertical);
  expect(lifted.paddingHorizontal).toBe(plain.paddingHorizontal);
  expect(lifted.marginBottom).toBe(plain.marginBottom);
  // The lift differs only in visual (non-layout) properties.
  expect(lifted.borderRadius).toBe(16);
  expect(plain.borderRadius).toBeUndefined();
  expect(lifted.backgroundColor).toBeTruthy();
  expect(plain.backgroundColor).toBeUndefined();
});

test('long-pressing a verse fires onLongPressVerse with its number', async () => {
  const onLongPress = jest.fn();
  await render(
    <VerseParagraphs
      verses={verses}
      liftedVerse={null}
      fontFace="serif"
      fontScale={1}
      onLongPressVerse={onLongPress}
      onVerseLayout={() => {}}
    />,
  );
  fireEvent(screen.getByTestId('verse-28'), 'longPress', { nativeEvent: { pageY: 300 } });
  expect(onLongPress).toHaveBeenCalledWith(28, 300);
});
