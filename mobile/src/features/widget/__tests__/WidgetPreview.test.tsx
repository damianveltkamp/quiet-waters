import { render, screen } from '@testing-library/react-native';
import { WidgetPreview } from '../WidgetPreview';
import { BACKGROUNDS } from '@/features/wallpaper/backgrounds';

const bg = BACKGROUNDS[0];

test('renders the verse and uppercased reference', async () => {
  await render(
    <WidgetPreview family="medium" background={bg} verseText="He leads me beside quiet waters." reference="Psalm 23:2" />,
  );
  expect(screen.getByText('He leads me beside quiet waters.')).toBeOnTheScreen();
  expect(screen.getByText('PSALM 23:2')).toBeOnTheScreen();
});

test('small family limits the verse to fewer lines than medium', async () => {
  const { rerender } = await render(
    <WidgetPreview family="small" background={bg} verseText="v" reference="r" />,
  );
  expect(screen.getByText('v').props.numberOfLines).toBe(7);
  await rerender(<WidgetPreview family="medium" background={bg} verseText="v" reference="r" />);
  expect(screen.getByText('v').props.numberOfLines).toBe(10);
});
