import { render, screen } from '@testing-library/react-native';
import { WallpaperCanvas } from '@/features/wallpaper/WallpaperCanvas';
import { BACKGROUNDS } from '@/features/wallpaper/backgrounds';

test('renders the verse and reference', async () => {
  await render(
    <WallpaperCanvas
      verseText="He leads me beside quiet waters."
      reference="Psalm 23:2"
      background={BACKGROUNDS[0]}
    />,
  );
  expect(screen.getByText(/He leads me beside quiet waters\./)).toBeOnTheScreen();
  expect(screen.getByText('Psalm 23:2')).toBeOnTheScreen();
});

test('applies the preset text color to the verse', async () => {
  const light = BACKGROUNDS.find((b) => b.name === 'Morning Mist')!;
  await render(<WallpaperCanvas verseText="Test verse" reference="Ref 1:1" background={light} />);
  const verse = screen.getByText(/Test verse/);
  const flat = Array.isArray(verse.props.style)
    ? Object.assign({}, ...verse.props.style.flat())
    : verse.props.style;
  expect(flat.color).toBe(light.textColor);
});
