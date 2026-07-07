import { render, screen, fireEvent } from '@testing-library/react-native';
import { VerseCard } from '@/components';
import { tapFeedback } from '@/lib/haptics';

jest.mock('@/lib/haptics', () => ({ tapFeedback: jest.fn() }));

test('renders the verse and reference', async () => {
  await render(
    <VerseCard verse="This is the day the Lord has made." reference="Psalm 118:24" onShare={() => {}} />,
  );
  expect(screen.getByText(/This is the day the Lord has made\./)).toBeOnTheScreen();
  expect(screen.getByText('Psalm 118:24')).toBeOnTheScreen();
});

test('fires haptic and onShare when Share is pressed', async () => {
  const onShare = jest.fn();
  await render(<VerseCard verse="x" reference="y" onShare={onShare} />);
  fireEvent.press(screen.getByText('Share'));
  expect(tapFeedback).toHaveBeenCalledTimes(1);
  expect(onShare).toHaveBeenCalledTimes(1);
});
