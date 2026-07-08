import { render, fireEvent, screen } from '@testing-library/react-native';
import TranslationSheet from '@/features/reading/TranslationSheet';
import TypePanel from '@/features/reading/TypePanel';

test('translation sheet lists KJV and BSB and selects one', async () => {
  const onSelect = jest.fn();
  await render(<TranslationSheet current="KJV" onSelect={onSelect} />);
  expect(screen.getByText('King James Version')).toBeTruthy();
  expect(screen.getByText('Berean Standard Bible')).toBeTruthy();
  await fireEvent.press(screen.getByText('Berean Standard Bible'));
  expect(onSelect).toHaveBeenCalledWith('BSB');
});

test('type panel switches face and steps size within bounds', async () => {
  const onFace = jest.fn();
  const onScale = jest.fn();
  await render(<TypePanel fontFace="serif" fontScale={1} onSelectFace={onFace} onScaleChange={onScale} />);
  await fireEvent.press(screen.getByText('Sans'));
  expect(onFace).toHaveBeenCalledWith('sans');
  await fireEvent.press(screen.getByTestId('type-larger'));
  expect(onScale).toHaveBeenCalledWith(1.1);
});

test('type panel clamps size at the maximum', async () => {
  const onScale = jest.fn();
  await render(<TypePanel fontFace="serif" fontScale={1.5} onSelectFace={() => {}} onScaleChange={onScale} />);
  await fireEvent.press(screen.getByTestId('type-larger'));
  expect(onScale).toHaveBeenCalledWith(1.5);
});
